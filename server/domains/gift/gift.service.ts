import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import { CreditsService } from '../credits/credits.service.js';

export interface CreateGiftDTO {
  serial: string;
  purchaser_shopify_customer_id: string;
  recipient_email: string;
  recipient_name?: string;
  gift_message?: string;
}

export interface ClaimGiftDTO {
  claim_code: string;
  recipient_shopify_customer_id: string;
  recipient_email: string;
  recipient_name?: string;
}

export class GiftService {
  /**
   * Create a luxury digital gift card with private claim code
   */
  static async createGift(shop_id: string, dto: CreateGiftDTO) {
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: { shop_id, serial: dto.serial },
      },
      include: {
        product_ref: true,
        ownerships: { where: { is_active: true } },
      },
    });

    if (!piece) {
      throw new NotFoundError('Physical piece for serial', dto.serial);
    }

    const purchaser = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: {
          shop_id,
          shopify_customer_id: dto.purchaser_shopify_customer_id,
        },
      },
    });

    if (!purchaser) {
      throw new NotFoundError('Purchaser customer');
    }

    const claim_code = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const gift = await prisma.giftRegistration.create({
      data: {
        shop_id,
        physical_piece_id: piece.id,
        purchaser_customer_id: purchaser.id,
        recipient_email: dto.recipient_email.toLowerCase(),
        recipient_name: dto.recipient_name,
        claim_code,
        status: 'PENDING',
      },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
        purchaser: true,
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'CUSTOMER',
      actor_id: purchaser.id,
      action: 'GIFT_CARD_CREATED',
      resource_type: 'GIFT',
      resource_id: gift.id,
      metadata: { serial: piece.serial, recipient_email: dto.recipient_email },
    });

    return {
      id: gift.id,
      claim_code: gift.claim_code,
      serial: piece.serial,
      recipient_email: gift.recipient_email,
      created_at: gift.created_at,
    };
  }

  /**
   * Resolve gift card preview by claim code for unboxing experience
   */
  static async getGiftByClaimCode(shop_id: string, claim_code: string) {
    const gift = await prisma.giftRegistration.findUnique({
      where: { claim_code },
      include: {
        physical_piece: {
          include: {
            product_ref: true,
            passport: true,
          },
        },
        purchaser: true,
      },
    });

    if (!gift || gift.shop_id !== shop_id) {
      throw new NotFoundError('Gift card claim code');
    }

    return {
      claim_code: gift.claim_code,
      status: gift.status,
      purchaser_name: gift.purchaser.first_name ? `${gift.purchaser.first_name} ${gift.purchaser.last_name || ''}`.trim() : 'A generous patron',
      recipient_name: gift.recipient_name,
      piece: {
        serial: gift.physical_piece.serial,
        title: gift.physical_piece.product_ref.title,
        hero_image: gift.physical_piece.passport?.hero_image_url || gift.physical_piece.product_ref.image_url,
        color: gift.physical_piece.color,
        edition: gift.physical_piece.edition_number && gift.physical_piece.edition_total
          ? `${gift.physical_piece.edition_number} of ${gift.physical_piece.edition_total}`
          : null,
      },
    };
  }

  /**
   * Recipient unboxes gift and activates primary ownership in their digital vault
   */
  static async claimGift(shop_id: string, dto: ClaimGiftDTO) {
    const gift = await prisma.giftRegistration.findUnique({
      where: { claim_code: dto.claim_code },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
      },
    });

    if (!gift || gift.shop_id !== shop_id) {
      throw new NotFoundError('Gift card claim code');
    }

    if (gift.status === 'CLAIMED') {
      throw new ConflictError('This luxury gift card has already been claimed.');
    }

    // Upsert recipient customer in tenant
    const recipient = await prisma.customer.upsert({
      where: {
        shop_id_shopify_customer_id: {
          shop_id,
          shopify_customer_id: dto.recipient_shopify_customer_id,
        },
      },
      update: {
        email: dto.recipient_email,
        first_name: dto.recipient_name?.split(' ')[0] || undefined,
        last_name: dto.recipient_name?.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        shop_id,
        shopify_customer_id: dto.recipient_shopify_customer_id,
        email: dto.recipient_email,
        first_name: dto.recipient_name?.split(' ')[0] || undefined,
        last_name: dto.recipient_name?.split(' ').slice(1).join(' ') || undefined,
      },
    });

    // Execute atomic claim and ownership transfer
    await prisma.$transaction(async (tx) => {
      // 1. Deactivate any previous ownership
      await tx.ownership.updateMany({
        where: {
          physical_piece_id: gift.physical_piece_id,
          is_active: true,
        },
        data: {
          is_active: false,
          ended_at: new Date(),
        },
      });

      // 2. Create active ownership for recipient
      await tx.ownership.create({
        data: {
          shop_id,
          physical_piece_id: gift.physical_piece_id,
          customer_id: recipient.id,
          is_active: true,
          source: 'GIFT',
        },
      });

      // 3. Mark physical piece as REGISTERED
      await tx.physicalPiece.update({
        where: { id: gift.physical_piece_id },
        data: { status: 'REGISTERED' },
      });

      // 4. Mark gift registration as CLAIMED
      await tx.giftRegistration.update({
        where: { id: gift.id },
        data: {
          status: 'CLAIMED',
          claimed_at: new Date(),
        },
      });
    });

    // Award welcome credits bonus
    await CreditsService.postTransaction(
      shop_id,
      {
        customer_shopify_id: dto.recipient_shopify_customer_id,
        amount: 250,
        type: 'BONUS',
        reason: 'Welcome Gift Patron Registration',
      },
      'SYSTEM'
    );

    await AuditService.log({
      shop_id,
      actor_type: 'CUSTOMER',
      actor_id: recipient.id,
      action: 'GIFT_CLAIMED',
      resource_type: 'GIFT',
      resource_id: gift.id,
      metadata: { serial: gift.physical_piece.serial, recipient_email: dto.recipient_email },
    });

    return {
      status: 'CLAIMED',
      serial: gift.physical_piece.serial,
      recipient_email: recipient.email,
      welcome_credits_awarded: 250,
    };
  }
}
