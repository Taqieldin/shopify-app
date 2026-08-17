import QRCode from 'qrcode';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
/**
 * QR Download Service
 * Handles generation of downloadable QR codes for physical pieces
 */
export class QRDownloadService {
    /**
     * Generate QR code as PNG buffer for download
     */
    static async generatePNG(shopId, serial, options) {
        const piece = await prisma.physicalPiece.findUnique({
            where: { shop_id_serial: { shop_id: shopId, serial } },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', serial);
        }
        const baseUrl = options?.baseUrl || process.env.PUBLIC_APP_URL;
        if (!baseUrl) {
            throw new Error('PUBLIC_APP_URL environment variable is required for QR code generation.');
        }
        const targetUrl = `${baseUrl}/passport/${serial}`;
        return QRCode.toBuffer(targetUrl, {
            width: options?.width || 1000,
            margin: 2,
            color: { dark: '#18181b', light: '#ffffff' },
            errorCorrectionLevel: 'H',
            type: 'png',
        });
    }
    /**
     * Generate QR code as SVG string
     */
    static async generateSVG(shopId, serial, options) {
        const piece = await prisma.physicalPiece.findUnique({
            where: { shop_id_serial: { shop_id: shopId, serial } },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', serial);
        }
        const baseUrl = options?.baseUrl || process.env.PUBLIC_APP_URL;
        if (!baseUrl) {
            throw new Error('PUBLIC_APP_URL environment variable is required for QR code generation.');
        }
        const targetUrl = `${baseUrl}/passport/${serial}`;
        return QRCode.toString(targetUrl, {
            type: 'svg',
            width: options?.width || 400,
            margin: 2,
            color: { dark: '#18181b', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        });
    }
    /**
     * Generate QR code as data URL (base64 PNG)
     */
    static async generateDataURL(shopId, serial, options) {
        const piece = await prisma.physicalPiece.findUnique({
            where: { shop_id_serial: { shop_id: shopId, serial } },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', serial);
        }
        const baseUrl = options?.baseUrl || process.env.PUBLIC_APP_URL;
        if (!baseUrl) {
            throw new Error('PUBLIC_APP_URL environment variable is required for QR code generation.');
        }
        const targetUrl = `${baseUrl}/passport/${serial}`;
        return QRCode.toDataURL(targetUrl, {
            width: options?.width || 400,
            margin: 2,
            color: { dark: '#18181b', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        });
    }
    /**
     * Batch generate QR codes for multiple serials
     */
    static async generateBatch(shopId, serials, options) {
        const results = new Map();
        for (const serial of serials) {
            try {
                const dataUrl = await this.generateDataURL(shopId, serial, options);
                results.set(serial, dataUrl);
            }
            catch (error) {
                // Skip failed ones, continue with others
                console.error(`Failed to generate QR for ${serial}:`, error);
            }
        }
        return results;
    }
}
