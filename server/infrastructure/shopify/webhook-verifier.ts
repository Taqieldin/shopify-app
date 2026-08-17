import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../shared/errors/index.js';

export function verifyShopifyWebhook(secretOverride?: string) {
  const secret = secretOverride || process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error('SHOPIFY_API_SECRET environment variable is required for webhook verification.');
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const shop = req.headers['x-shopify-shop-domain'] as string;

    if (!hmac) {
      return next(new UnauthorizedError('Missing Shopify webhook HMAC signature.'));
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    try {
      const match = crypto.timingSafeEqual(
        Buffer.from(generatedHash, 'utf8'),
        Buffer.from(hmac, 'utf8')
      );

      if (!match) {
        return next(new UnauthorizedError('Invalid Shopify webhook HMAC signature.'));
      }

      next();
    } catch {
      return next(new UnauthorizedError('HMAC length or encoding mismatch.'));
    }
  };
}
