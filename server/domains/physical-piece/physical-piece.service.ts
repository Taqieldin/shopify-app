import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface CreatePieceDTO {
  shopify_product_id: string;
  shopify_variant_id?: string;
  product_title: string;
  product_handle: string;
  product_image_url?: string;
  product_category?: string;
  serial: string;
  edition_number?: number;
  edition_total?: number;
  nfc_uid?: string;
  manufacturing_date?: Date;
  manufacturing_location?: string;
  materials?: Array<{ name: string; percentage?: number; origin?: string; certification?: string }>;
  color?: string;
  dimensions?: string;
}

export class PhysicalPieceService {
  /**
   * Register a new physical piece linked to a Shopify Product reference
   */
  static async createPiece(shop_id: string, dto: CreatePieceDTO, actor_id: string) {
    // 1. Ensure serial uniqueness within this shop tenant
    const existing = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: {
          shop_id,
          serial: dto.serial,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Serial number '${dto.serial}' is already registered in this store.`);
    }

    // 2. Ensure Shopify Product Reference exists or upsert it
    const productRef = await prisma.shopifyProductReference.upsert({
      where: {
        shop_id_shopify_product_id_shopify_variant_id: {
          shop_id,
          shopify_product_id: dto.shopify_product_id,
          shopify_variant_id: dto.shopify_variant_id || '',
        },
      },
      update: {
        title: dto.product_title,
        handle: dto.product_handle,
        image_url: dto.product_image_url,
        category: dto.product_category,
      },
      create: {
        shop_id,
        shopify_product_id: dto.shopify_product_id,
        shopify_variant_id: dto.shopify_variant_id || '',
        title: dto.product_title,
        handle: dto.product_handle,
        image_url: dto.product_image_url,
        category: dto.product_category,
      },
    });

    // 3. Create Physical Piece
    const piece = await prisma.physicalPiece.create({
      data: {
        shop_id,
        product_ref_id: productRef.id,
        serial: dto.serial,
        edition_number: dto.edition_number,
        edition_total: dto.edition_total,
        status: 'MANUFACTURED',
        nfc_uid: dto.nfc_uid,
        qr_code_payload: `PASSPORT:${shop_id}:${dto.serial}`,
        manufacturing_date: dto.manufacturing_date,
        manufacturing_location: dto.manufacturing_location,
        materials_json: dto.materials ? JSON.stringify(dto.materials) : null,
        color: dto.color,
        dimensions: dto.dimensions,
      },
      include: {
        product_ref: true,
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'PHYSICAL_PIECE_CREATED',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: piece.id,
      metadata: { serial: piece.serial, product_title: dto.product_title },
    });

    return piece;
  }

  /**
   * Fetch a physical piece by tenant-scoped serial
   */
  static async getBySerial(shop_id: string, serial: string) {
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
        ownerships: {
          where: { is_active: true },
          include: { customer: true },
        },
        services: {
          orderBy: { received_date: 'desc' },
        },
        care_rules: true,
        warranties: true,
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', serial);
    }

    return piece;
  }

  /**
   * List pieces with search and status filtering
   */
  static async listPieces(
    shop_id: string,
    options: { status?: string; search?: string; limit?: number; offset?: number } = {}
  ) {
    const { status, search, limit = 50, offset = 0 } = options;

    return prisma.physicalPiece.findMany({
      where: {
        shop_id,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { serial: { contains: search } },
                { product_ref: { title: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        product_ref: true,
        passport: true,
        ownerships: {
          where: { is_active: true },
          include: { customer: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }
}
