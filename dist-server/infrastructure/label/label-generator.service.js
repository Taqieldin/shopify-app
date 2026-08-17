import QRCode from 'qrcode';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
/**
 * Physical Tag Label Service
 * Generates printable labels with serial numbers and QR codes
 */
export class LabelGeneratorService {
    /**
     * Get label data for a physical piece
     */
    static async getLabelData(shopId, serial, options) {
        const piece = await prisma.physicalPiece.findUnique({
            where: { shop_id_serial: { shop_id: shopId, serial } },
            include: { product_ref: true },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', serial);
        }
        const qrDataUrl = options?.showQR !== false
            ? await this.generateQRDataURL(serial, shopId, options)
            : undefined;
        return {
            serial: piece.serial,
            productTitle: piece.product_ref.title,
            edition: piece.edition_number && piece.edition_total
                ? `${piece.edition_number}/${piece.edition_total}`
                : undefined,
            qrDataUrl,
        };
    }
    /**
     * Generate QR code as data URL for embedding in labels
     */
    static async generateQRDataURL(serial, shopId, options) {
        const baseUrl = process.env.PUBLIC_APP_URL;
        if (!baseUrl) {
            throw new Error('PUBLIC_APP_URL environment variable is required for QR code generation.');
        }
        const targetUrl = `${baseUrl}/passport/${serial}`;
        return QRCode.toDataURL(targetUrl, {
            width: options?.width || 200,
            margin: 1,
            color: {
                dark: options?.textColor || '#18181b',
                light: options?.backgroundColor || '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });
    }
    /**
     * Generate HTML label for printing (thermal printer compatible)
     */
    static generateLabelHTML(data, options) {
        const width = options?.width || 300;
        const height = options?.height || 150;
        const bgColor = options?.backgroundColor || '#ffffff';
        const textColor = options?.textColor || '#18181b';
        const showSerial = options?.showSerial !== false;
        const showQR = options?.showQR !== false;
        const showQRText = options?.showQRText !== false;
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${width}px ${height}px;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 8px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      width: ${width - 16}px;
      height: ${height - 16}px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-sizing: border-box;
    }
    .label-content {
      flex: 1;
      overflow: hidden;
    }
    .product-title {
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .serial {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }
    .edition {
      font-size: 9px;
      color: #71717a;
      margin-top: 2px;
    }
    .qr-section {
      flex-shrink: 0;
      text-align: center;
    }
    .qr-code {
      width: ${width * 0.35}px;
      height: ${width * 0.35}px;
    }
    .qr-text {
      font-size: 7px;
      color: #71717a;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="label-content">
    ${showSerial ? `<div class="product-title">${data.productTitle}</div>` : ''}
    <div class="serial">${data.serial}</div>
    ${data.edition ? `<div class="edition">${data.edition}</div>` : ''}
  </div>
  ${showQR && data.qrDataUrl ? `
  <div class="qr-section">
    <img class="qr-code" src="${data.qrDataUrl}" alt="QR Code" />
    ${showQRText ? '<div class="qr-text">Scan for Passport</div>' : ''}
  </div>
  ` : ''}
</body>
</html>`.trim();
    }
    /**
     * Generate batch labels HTML for multiple pieces
     */
    static async generateBatchLabels(shopId, serials, options) {
        const labels = [];
        for (const serial of serials) {
            try {
                const data = await this.getLabelData(shopId, serial, options);
                labels.push(this.generateLabelHTML(data, options));
            }
            catch (error) {
                console.error(`Failed to generate label for ${serial}:`, error);
            }
        }
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Batch Labels</title>
  <style>
    @media print {
      .label { page-break-after: always; }
    }
    body { margin: 0; padding: 20px; }
    .label { margin-bottom: 20px; }
  </style>
</head>
<body>
  ${labels.map((label) => `<div class="label">${label}</div>`).join('\n')}
</body>
</html>`;
    }
    /**
     * Generate a simple SVG label (for thermal printers)
     */
    static async generateSVGLabel(shopId, serial, options) {
        const data = await this.getLabelData(shopId, serial, options);
        const width = options?.width || 300;
        const height = options?.height || 150;
        const qrSize = width * 0.35;
        // Generate QR as SVG string
        const baseUrl = process.env.PUBLIC_APP_URL;
        if (!baseUrl) {
            throw new Error('PUBLIC_APP_URL environment variable is required for QR code generation.');
        }
        const targetUrl = `${baseUrl}/passport/${serial}`;
        const qrSvg = await QRCode.toString(targetUrl, {
            type: 'svg',
            width: qrSize,
            margin: 1,
            errorCorrectionLevel: 'M',
        });
        // Extract just the SVG content
        const qrContent = qrSvg.replace(/<svg[^>]*>|<\/svg>/g, '');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${options?.backgroundColor || '#ffffff'}"/>
  <text x="12" y="30" font-family="Arial" font-size="11" font-weight="600" fill="${options?.textColor || '#18181b'}">
    ${data.productTitle.substring(0, 30)}
  </text>
  <text x="12" y="60" font-family="Courier New" font-size="14" font-weight="bold" fill="${options?.textColor || '#18181b'}">
    ${data.serial}
  </text>
  ${data.edition ? `<text x="12" y="80" font-family="Arial" font-size="9" fill="#71717a">${data.edition}</text>` : ''}
  <g transform="translate(${width - qrSize - 12}, ${(height - qrSize) / 2})">
    ${qrContent}
  </g>
</svg>`;
    }
}
