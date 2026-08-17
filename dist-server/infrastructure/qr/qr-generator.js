import QRCode from 'qrcode';
export class QRGenerator {
    /**
     * Generate an SVG string representation of the QR code for a digital passport
     */
    static async generateSVG(options) {
        const baseUrl = options.baseUrl || 'https://passport.atelier.luxury';
        const targetUrl = `${baseUrl}/passport/${options.serial}`;
        return QRCode.toString(targetUrl, {
            type: 'svg',
            width: options.width || 400,
            margin: 2,
            color: {
                dark: options.darkColor || '#18181b',
                light: options.lightColor || '#ffffff',
            },
            errorCorrectionLevel: 'H',
        });
    }
    /**
     * Generate a PNG Data URL representation of the QR code
     */
    static async generateDataURL(options) {
        const baseUrl = options.baseUrl || 'https://passport.atelier.luxury';
        const targetUrl = `${baseUrl}/passport/${options.serial}`;
        return QRCode.toDataURL(targetUrl, {
            width: options.width || 400,
            margin: 2,
            color: {
                dark: options.darkColor || '#18181b',
                light: options.lightColor || '#ffffff',
            },
            errorCorrectionLevel: 'H',
        });
    }
}
