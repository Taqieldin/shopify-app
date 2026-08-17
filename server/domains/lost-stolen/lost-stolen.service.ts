import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface ReportTheftDTO {
  serial: string;
  report_type: 'LOST' | 'STOLEN';
  incident_date?: Date;
  incident_location?: string;
  police_report_number?: string;
  reporter_shopify_customer_id?: string;
  internal_notes?: string;
}

export class LostStolenService {
  /**
   * Report a piece as lost or stolen, locking transfers and flagging public scans
   */
  static async reportPiece(shop_id: string, dto: ReportTheftDTO, actor_id: string) {
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: { shop_id, serial: dto.serial },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', dto.serial);
    }

    let customerId: string | null = null;
    if (dto.reporter_shopify_customer_id) {
      const cust = await prisma.customer.findUnique({
        where: {
          shop_id_shopify_customer_id: { shop_id, shopify_customer_id: dto.reporter_shopify_customer_id },
        },
      });
      if (cust) customerId = cust.id;
    }

    const report = await prisma.$transaction(async (tx) => {
      const r = await tx.lostStolenReport.create({
        data: {
          shop_id,
          physical_piece_id: piece.id,
          reporter_customer_id: customerId,
          report_type: dto.report_type,
          status: 'CONFIRMED',
          incident_date: dto.incident_date || new Date(),
          incident_location: dto.incident_location,
          police_report_number: dto.police_report_number,
          internal_notes: dto.internal_notes,
        },
      });

      await tx.physicalPiece.update({
        where: { id: piece.id },
        data: { status: dto.report_type === 'STOLEN' ? 'STOLEN' : 'LOST' },
      });

      return r;
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: dto.report_type === 'STOLEN' ? 'PRODUCT_MARKED_STOLEN' : 'PRODUCT_MARKED_LOST',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: piece.id,
      metadata: { serial: piece.serial, report_id: report.id },
    });

    return report;
  }

  /**
   * List all lost/stolen reports for security investigation
   */
  static async listReports(shop_id: string) {
    return prisma.lostStolenReport.findMany({
      where: { shop_id },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
        reporter: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
