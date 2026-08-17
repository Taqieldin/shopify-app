import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface CreatePassportDTO {
  physical_piece_id: string;
  title: string;
  description?: string;
  hero_image_url?: string;
  gallery?: string[];
  craft_info?: string;
  heritage_story?: string;
  materials_summary?: string;
  sustainability_data?: string;
  public_visibility?: boolean;
}

export class PassportService {
  /**
   * Create or update digital product passport for a physical piece
   */
  static async upsertPassport(shop_id: string, dto: CreatePassportDTO, actor_id: string) {
    const piece = await prisma.physicalPiece.findFirst({
      where: { id: dto.physical_piece_id, shop_id },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', dto.physical_piece_id);
    }

    const passport = await prisma.passport.upsert({
      where: { physical_piece_id: dto.physical_piece_id },
      update: {
        title: dto.title,
        description: dto.description,
        hero_image_url: dto.hero_image_url,
        gallery_json: dto.gallery ? JSON.stringify(dto.gallery) : undefined,
        craft_info: dto.craft_info,
        heritage_story: dto.heritage_story,
        materials_summary: dto.materials_summary,
        sustainability_data: dto.sustainability_data,
        public_visibility: dto.public_visibility ?? true,
      },
      create: {
        shop_id,
        physical_piece_id: dto.physical_piece_id,
        status: 'ACTIVE',
        title: dto.title,
        description: dto.description,
        hero_image_url: dto.hero_image_url,
        gallery_json: dto.gallery ? JSON.stringify(dto.gallery) : null,
        craft_info: dto.craft_info,
        heritage_story: dto.heritage_story,
        materials_summary: dto.materials_summary,
        sustainability_data: dto.sustainability_data,
        public_visibility: dto.public_visibility ?? true,
      },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'PASSPORT_UPSERTED',
      resource_type: 'PASSPORT',
      resource_id: passport.id,
      metadata: { title: passport.title, serial: piece.serial },
    });

    return passport;
  }

  /**
   * Resolve public passport by serial with strict privacy field filter
   */
  static async getPublicPassport(shop_id: string, serial: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: {
          shop_id,
          serial,
        },
      },
      include: {
        product_ref: true,
        passport: true,
        care_rules: true,
        warranties: {
          where: { status: 'ACTIVE' },
        },
        services: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            service_type: true,
            completed_date: true,
            customer_notes: true, // Only public/customer notes, internal notes excluded
          },
        },
        ownerships: {
          where: { is_active: true },
          select: {
            started_at: true,
            source: true,
            // Never expose owner name/email publicly
          },
        },
        lost_reports: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    if (!piece || !piece.passport) {
      throw new NotFoundError('Passport for serial', serial);
    }

    // Increment view count asynchronously
    prisma.passport
      .update({
        where: { id: piece.passport.id },
        data: { view_count: { increment: 1 } },
      })
      .catch(() => {});

    // Fetch tenant settings & public field config
    const shop = await prisma.shop.findUnique({
      where: { id: shop_id },
      include: { settings: true, public_field_cfg: true },
    });

    const isStolenOrLost = piece.lost_reports.length > 0;

    return {
      brand: shop?.settings?.brand_name || 'Maison',
      brand_settings: shop?.settings,
      passport_term: shop?.settings?.passport_term || 'Digital Passport',
      serial: piece.serial,
      edition: piece.edition_number && piece.edition_total ? `${piece.edition_number} / ${piece.edition_total}` : null,
      status: isStolenOrLost ? 'UNDER_VERIFICATION' : piece.passport.status,
      title: piece.passport.title,
      description: piece.passport.description,
      hero_image_url: piece.passport.hero_image_url || piece.product_ref.image_url,
      gallery: piece.passport.gallery_json ? JSON.parse(piece.passport.gallery_json) : [],
      manufacturing_date: piece.manufacturing_date,
      manufacturing_location: piece.manufacturing_location,
      materials: piece.materials_json ? JSON.parse(piece.materials_json) : [],
      craft_info: piece.passport.craft_info,
      heritage_story: piece.passport.heritage_story,
      sustainability_data: piece.passport.sustainability_data,
      is_registered: piece.ownerships.length > 0,
      active_since: piece.ownerships[0]?.started_at || null,
      care_schedules: piece.care_rules,
      verified_services: piece.services,
      warranty_active: piece.warranties.length > 0,
      verification_badge: isStolenOrLost ? 'FLAGGED_FOR_REVIEW' : 'AUTHENTICATED_ORIGINAL',
    };
  }

  /**
   * List passports for embedded admin
   */
  static async listPassports(shop_id: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;
    return prisma.passport.findMany({
      where: { shop_id },
      include: {
        physical_piece: {
          include: {
            product_ref: true,
            ownerships: {
              where: { is_active: true },
              include: { customer: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }
}
