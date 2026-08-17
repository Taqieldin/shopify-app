import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface UpdateSettingsDTO {
  brand_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  passport_term?: string;
  club_name?: string;
  credits_term?: string;
  membership_terms_json?: string;
  public_story_enabled?: boolean;
}

export interface UpdateFeaturesDTO {
  digital_passport_enabled?: boolean;
  authentication_enabled?: boolean;
  nfc_enabled?: boolean;
  qr_enabled?: boolean;
  ownership_enabled?: boolean;
  transfer_enabled?: boolean;
  gift_registration_enabled?: boolean;
  membership_enabled?: boolean;
  credits_enabled?: boolean;
  benefits_enabled?: boolean;
  early_access_enabled?: boolean;
  care_enabled?: boolean;
  service_enabled?: boolean;
  warranty_enabled?: boolean;
  lost_stolen_enabled?: boolean;
  notifications_enabled?: boolean;
  analytics_enabled?: boolean;
}

export class ShopService {
  /**
   * Find or initialize a Shopify shop tenant with default settings and feature flags
   */
  static async findOrCreateTenant(shopify_shop_id: string, shop_domain: string) {
    let shop = await prisma.shop.findUnique({
      where: { shopify_shop_id },
      include: {
        settings: true,
        features: true,
        public_field_cfg: true,
      },
    });

    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          shopify_shop_id,
          shop_domain,
          status: 'ACTIVE',
          plan: 'FREE',
          settings: {
            create: {
              brand_name: shop_domain.split('.')[0].replace(/-/g, ' ').toUpperCase(),
              passport_term: 'Digital Passport',
              club_name: 'Private Club',
              credits_term: 'Maison Credits',
            },
          },
          features: {
            create: {},
          },
          public_field_cfg: {
            create: {},
          },
        },
        include: {
          settings: true,
          features: true,
          public_field_cfg: true,
        },
      });

      await AuditService.log({
        shop_id: shop.id,
        actor_type: 'SYSTEM',
        actor_id: 'oauth-installer',
        action: 'TENANT_INSTALLED',
        resource_type: 'SHOP',
        resource_id: shop.id,
        metadata: { shop_domain },
      });
    }

    return shop;
  }

  /**
   * Retrieve tenant configuration by internal shop_id
   */
  static async getTenant(shop_id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shop_id },
      include: {
        settings: true,
        features: true,
        public_field_cfg: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!shop) {
      throw new NotFoundError('Tenant', shop_id);
    }

    return shop;
  }

  /**
   * Update brand styling and custom terminology
   */
  static async updateSettings(shop_id: string, dto: UpdateSettingsDTO, actor_id: string) {
    const updated = await prisma.shopSettings.upsert({
      where: { shop_id },
      update: dto,
      create: {
        shop_id,
        ...dto,
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'BRAND_SETTINGS_UPDATED',
      resource_type: 'SHOP_SETTINGS',
      resource_id: updated.id,
      metadata: dto,
    });

    return updated;
  }

  /**
   * Toggle merchant feature flags
   */
  static async updateFeatures(shop_id: string, dto: UpdateFeaturesDTO, actor_id: string) {
    const updated = await prisma.shopFeatureFlag.upsert({
      where: { shop_id },
      update: dto,
      create: {
        shop_id,
        ...dto,
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'FEATURE_FLAGS_UPDATED',
      resource_type: 'FEATURE_FLAGS',
      resource_id: updated.id,
      metadata: dto,
    });

    return updated;
  }
}
