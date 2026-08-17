import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface CreateBenefitDTO {
  title: string;
  description?: string;
  tier_id?: string;
  benefit_type: string;
  icon_name?: string;
  max_redemptions_per_user?: number;
  expires_at?: Date;
}

export class BenefitsService {
  /**
   * Create or update a Private Club benefit
   */
  static async createBenefit(shop_id: string, dto: CreateBenefitDTO, actor_id: string) {
    const benefit = await prisma.benefit.create({
      data: {
        shop_id,
        tier_id: dto.tier_id,
        title: dto.title,
        description: dto.description,
        benefit_type: dto.benefit_type,
        icon_name: dto.icon_name || 'Sparkles',
        max_redemptions_per_user: dto.max_redemptions_per_user || 1,
        expires_at: dto.expires_at,
        is_active: true,
      },
      include: { tier: true },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'BENEFIT_CREATED',
      resource_type: 'BENEFIT',
      resource_id: benefit.id,
      metadata: { title: benefit.title },
    });

    return benefit;
  }

  /**
   * List all benefits available for a shop tenant
   */
  static async listBenefits(shop_id: string) {
    return prisma.benefit.findMany({
      where: { shop_id, is_active: true },
      include: { tier: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Customer claims/redeems a benefit
   */
  static async redeemBenefit(shop_id: string, benefit_id: string, customer_shopify_id: string) {
    const customer = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: { shop_id, shopify_customer_id: customer_shopify_id },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customer_shopify_id);
    }

    const benefit = await prisma.benefit.findUnique({
      where: { id: benefit_id },
    });

    if (!benefit || benefit.shop_id !== shop_id || !benefit.is_active) {
      throw new NotFoundError('Benefit', benefit_id);
    }

    // Check existing redemptions count
    const existingCount = await prisma.benefitRedemption.count({
      where: {
        shop_id,
        benefit_id,
        customer_id: customer.id,
      },
    });

    if (existingCount >= benefit.max_redemptions_per_user) {
      throw new ConflictError('You have already claimed this benefit.');
    }

    const redemptionCode = `BEN-${benefit.benefit_type.slice(0, 4)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const redemption = await prisma.benefitRedemption.create({
      data: {
        shop_id,
        benefit_id,
        customer_id: customer.id,
        status: 'CONFIRMED',
        redemption_code: redemptionCode,
      },
      include: { benefit: true },
    });

    return redemption;
  }
}
