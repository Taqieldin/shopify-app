import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface CertificateData {
  brand_name: string;
  logo_url?: string;
  serial: string;
  product_title: string;
  edition?: string;
  edition_number?: number;
  edition_total?: number;
  owner_name?: string;
  owner_email?: string;
  issue_date: string;
  manufacturing_location?: string;
  materials?: string[];
  color?: string;
  warranty_end_date?: string;
  certificate_number?: string;
}

/**
 * PDF Certificate Service
 * Generates downloadable PDF certificates of authenticity
 */
export class PDFCertificateService {
  /**
   * Generate unique certificate number
   */
  static generateCertificateNumber(shopId: string, serial: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const hash = crypto.createHash('md5').update(`${shopId}:${serial}`).digest('hex').substring(0, 6).toUpperCase();
    return `CERT-${timestamp}-${hash}`;
  }

  /**
   * Generate SHA-256 verification hash
   */
  static generateVerificationHash(data: CertificateData, salt?: string): string {
    const raw = [
      data.brand_name,
      data.serial,
      data.certificate_number || '',
      data.owner_email || '',
      data.issue_date,
      salt || 'atelier_provenance_2026',
    ].join(':');

    return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  }

  /**
   * Fetch complete certificate data for a piece
   */
  static async getCertificateData(shopId: string, serial: string): Promise<CertificateData> {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial } },
      include: {
        product_ref: true,
        passport: true,
        ownerships: {
          where: { is_active: true },
          include: { customer: true },
        },
        warranties: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', serial);
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { settings: true },
    });

    const activeOwnership = piece.ownerships[0];
    const owner = activeOwnership?.customer;

    const certificateNumber = this.generateCertificateNumber(shopId, serial);
    const issueDate = new Date().toISOString().split('T')[0];

    let materials: string[] = [];
    if (piece.materials_json) {
      try {
        const parsed = JSON.parse(piece.materials_json);
        materials = parsed.map((m: { name: string }) => m.name);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      brand_name: shop?.settings?.brand_name || 'Luxury Maison',
      logo_url: shop?.settings?.logo_url || undefined,
      serial: piece.serial,
      product_title: piece.product_ref.title,
      edition: piece.edition_number && piece.edition_total
        ? `Edition ${piece.edition_number} of ${piece.edition_total}`
        : undefined,
      edition_number: piece.edition_number ?? undefined,
      edition_total: piece.edition_total ?? undefined,
      owner_name: owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : undefined,
      owner_email: owner?.email,
      issue_date: issueDate,
      manufacturing_location: piece.manufacturing_location || 'Master Atelier',
      materials: materials.length > 0 ? materials : undefined,
      color: piece.color || undefined,
      warranty_end_date: piece.warranties[0]?.end_date?.toISOString().split('T')[0],
      certificate_number: certificateNumber,
    };
  }

  /**
   * Get certificate data with custom owner info (for gifting)
   */
  static async getCertificateDataWithCustomOwner(
    shopId: string,
    serial: string,
    customOwner: { name: string; email?: string }
  ): Promise<CertificateData> {
    const base = await this.getCertificateData(shopId, serial);
    return {
      ...base,
      owner_name: customOwner.name,
      owner_email: customOwner.email,
    };
  }

  /**
   * List certificates for admin (pieces with passports)
   */
  static async listForAdmin(shopId: string, options?: { limit?: number; offset?: number }) {
    const pieces = await prisma.physicalPiece.findMany({
      where: {
        shop_id: shopId,
        passport: { isNot: null },
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
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return pieces.map((piece) => ({
      serial: piece.serial,
      product_title: piece.product_ref.title,
      has_owner: piece.ownerships.length > 0,
      owner_email: piece.ownerships[0]?.customer?.email,
      passport_status: piece.passport?.status,
      created_at: piece.created_at,
    }));
  }
}