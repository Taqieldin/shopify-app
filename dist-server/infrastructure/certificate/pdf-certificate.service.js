import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
/**
 * PDF Certificate Service
 * Generates downloadable PDF certificates of authenticity
 */
export class PDFCertificateService {
    /**
     * Generate unique certificate number
     */
    static generateCertificateNumber(shopId, serial) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const hash = crypto.createHash('md5').update(`${shopId}:${serial}`).digest('hex').substring(0, 6).toUpperCase();
        return `CERT-${timestamp}-${hash}`;
    }
    /**
     * Generate SHA-256 verification hash
     */
    static generateVerificationHash(data, salt) {
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
    static async getCertificateData(shopId, serial) {
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
        let materials = [];
        if (piece.materials_json) {
            try {
                const parsed = JSON.parse(piece.materials_json);
                materials = parsed.map((m) => m.name);
            }
            catch {
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
    static async getCertificateDataWithCustomOwner(shopId, serial, customOwner) {
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
    static async listForAdmin(shopId, options) {
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
