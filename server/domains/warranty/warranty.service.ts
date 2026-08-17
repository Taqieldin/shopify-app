import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface CreateWarrantyDTO {
  serial: string;
  warranty_type?: string;
  coverage_summary?: string;
  duration_years?: number;
  end_date?: Date;
}

export class WarrantyService {
  /**
   * Activate or register a warranty for a physical piece
   */
  static async createWarranty(shop_id: string, dto: CreateWarrantyDTO, actor_id: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id, serial: dto.serial } },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', dto.serial);
    }

    const startDate = new Date();
    const endDate = dto.end_date || new Date(startDate.getFullYear() + (dto.duration_years || 2), startDate.getMonth(), startDate.getDate());

    const warranty = await prisma.warrantyRecord.create({
      data: {
        shop_id,
        physical_piece_id: piece.id,
        warranty_type: dto.warranty_type || 'MANUFACTURER_WARRANTY',
        coverage_summary: dto.coverage_summary || 'Full Atelier Warranty Coverage',
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'WARRANTY_ACTIVATED',
      resource_type: 'WARRANTY',
      resource_id: warranty.id,
      metadata: { serial: dto.serial, warranty_type: warranty.warranty_type },
    });

    return warranty;
  }

  /**
   * Get all warranty records for a specific physical piece serial
   */
  static async getWarrantyBySerial(shop_id: string, serial: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id, serial } },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', serial);
    }

    return prisma.warrantyRecord.findMany({
      where: {
        shop_id,
        physical_piece_id: piece.id,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * List all warranty records across the tenant
   */
  static async listWarranties(shop_id: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;
    return prisma.warrantyRecord.findMany({
      where: { shop_id },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }

  /**
   * Extend an existing warranty
   */
  static async extendWarranty(shop_id: string, warranty_id: string, additional_years: number, actor_id: string) {
    const warranty = await prisma.warrantyRecord.findFirst({
      where: { id: warranty_id, shop_id },
    });

    if (!warranty) {
      throw new NotFoundError('WarrantyRecord', warranty_id);
    }

    const newEndDate = new Date(warranty.end_date);
    newEndDate.setFullYear(newEndDate.getFullYear() + additional_years);

    const updated = await prisma.warrantyRecord.update({
      where: { id: warranty_id },
      data: {
        end_date: newEndDate,
        status: 'EXTENDED',
      },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'WARRANTY_EXTENDED',
      resource_type: 'WARRANTY',
      resource_id: warranty.id,
      metadata: { additional_years, new_end_date: newEndDate.toISOString() },
    });

    return updated;
  }
}
