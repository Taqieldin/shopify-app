import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface RegisterPieceDTO {
  serial: string;
  customer_shopify_id: string;
  customer_email: string;
  customer_name?: string;
  source?: 'DIRECT_PURCHASE' | 'REGISTRATION' | 'TRANSFER_ACCEPTANCE' | 'GIFT' | 'ADMIN_OVERRIDE';
}

export class OwnershipService {
  /**
   * Register physical piece ownership to a customer
   */
  static async registerPiece(shop_id: string, dto: RegisterPieceDTO, actor_id: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: {
          shop_id,
          serial: dto.serial,
        },
      },
      include: {
        ownerships: {
          where: { is_active: true },
        },
        lost_reports: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', dto.serial);
    }

    if (piece.lost_reports.length > 0) {
      throw new ConflictError('Cannot register piece: Item has an active lost or stolen report.');
    }

    if (piece.ownerships.length > 0) {
      throw new ConflictError('This piece is already registered to an active owner. Ownership must be transferred.');
    }

    // Upsert customer record
    const customer = await prisma.customer.upsert({
      where: {
        shop_id_shopify_customer_id: {
          shop_id,
          shopify_customer_id: dto.customer_shopify_id,
        },
      },
      update: {
        email: dto.customer_email,
        first_name: dto.customer_name?.split(' ')[0] || undefined,
        last_name: dto.customer_name?.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        shop_id,
        shopify_customer_id: dto.customer_shopify_id,
        email: dto.customer_email,
        first_name: dto.customer_name?.split(' ')[0] || undefined,
        last_name: dto.customer_name?.split(' ').slice(1).join(' ') || undefined,
      },
    });

    // Execute atomic transaction for ownership record + piece status update
    const ownership = await prisma.$transaction(async (tx) => {
      const rec = await tx.ownership.create({
        data: {
          shop_id,
          physical_piece_id: piece.id,
          customer_id: customer.id,
          is_active: true,
          source: dto.source || 'REGISTRATION',
        },
      });

      await tx.physicalPiece.update({
        where: { id: piece.id },
        data: { status: 'REGISTERED' },
      });

      return rec;
    });

    await AuditService.log({
      shop_id,
      actor_type: 'CUSTOMER',
      actor_id: customer.id,
      action: 'PIECE_REGISTERED',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: piece.id,
      metadata: { serial: piece.serial, customer_email: customer.email },
    });

    return {
      ownership_id: ownership.id,
      serial: piece.serial,
      registered_at: ownership.started_at,
    };
  }

  /**
   * Get all active owned pieces for a specific customer (Collector's Cabinet / Digital Vault)
   */
  static async getCustomerCollection(shop_id: string, customer_shopify_id: string) {
    const customer = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: {
          shop_id,
          shopify_customer_id: customer_shopify_id,
        },
      },
    });

    if (!customer) {
      return [];
    }

    const activeOwnerships = await prisma.ownership.findMany({
      where: {
        shop_id,
        customer_id: customer.id,
        is_active: true,
      },
      include: {
        physical_piece: {
          include: {
            product_ref: true,
            passport: true,
            care_rules: true,
            warranties: true,
            services: {
              orderBy: { received_date: 'desc' },
              take: 3,
            },
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    return activeOwnerships.map((o) => ({
      ownership_id: o.id,
      started_at: o.started_at,
      serial: o.physical_piece.serial,
      edition: o.physical_piece.edition_number && o.physical_piece.edition_total
        ? `${o.physical_piece.edition_number} / ${o.physical_piece.edition_total}`
        : null,
      status: o.physical_piece.status,
      product: {
        title: o.physical_piece.product_ref.title,
        image_url: o.physical_piece.passport?.hero_image_url || o.physical_piece.product_ref.image_url,
      },
      passport: o.physical_piece.passport,
      services: o.physical_piece.services,
      warranty: o.physical_piece.warranties[0] || null,
      next_care_date: o.physical_piece.care_rules[0]?.next_due_date || null,
    }));
  }

  /**
   * Get provenance history of a piece for authorized Admin or current owner
   */
  static async getPieceProvenance(shop_id: string, serial: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: {
          shop_id,
          serial,
        },
      },
      include: {
        ownerships: {
          include: { customer: true },
          orderBy: { started_at: 'asc' },
        },
        services: {
          orderBy: { received_date: 'asc' },
        },
        transfers: {
          include: { certificate: true },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', serial);
    }

    return piece;
  }
}
