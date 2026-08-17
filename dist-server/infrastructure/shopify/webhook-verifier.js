import crypto from 'crypto';
import { UnauthorizedError } from '../../shared/errors/index.js';
export function verifyShopifyWebhook(secretOverride) {
    const secret = secretOverride || process.env.SHOPIFY_API_SECRET;
    if (!secret) {
        throw new Error('SHOPIFY_API_SECRET environment variable is required for webhook verification.');
    }
    return (req, res, next) => {
        const hmac = req.headers['x-shopify-hmac-sha256'];
        const shop = req.headers['x-shopify-shop-domain'];
        if (!hmac) {
            return next(new UnauthorizedError('Missing Shopify webhook HMAC signature.'));
        }
        const rawBody = req.rawBody || JSON.stringify(req.body);
        const generatedHash = crypto
            .createHmac('sha256', secret)
            .update(rawBody, 'utf8')
            .digest('base64');
        try {
            const match = crypto.timingSafeEqual(Buffer.from(generatedHash, 'utf8'), Buffer.from(hmac, 'utf8'));
            if (!match) {
                return next(new UnauthorizedError('Invalid Shopify webhook HMAC signature.'));
            }
            next();
        }
        catch {
            return next(new UnauthorizedError('HMAC length or encoding mismatch.'));
        }
    };
}
