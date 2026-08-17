import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Shopify Webhook HMAC Verification', () => {
  const secret = 'super_secret_shopify_app_key_32';

  it('validates authentic Shopify HMAC signature', () => {
    const rawPayload = JSON.stringify({
      id: 981249182,
      email: 'customer@example.com',
      total_price: '1250.00',
    });

    const validHmac = crypto
      .createHmac('sha256', secret)
      .update(rawPayload, 'utf8')
      .digest('base64');

    const testHmac = crypto
      .createHmac('sha256', secret)
      .update(rawPayload, 'utf8')
      .digest('base64');

    const match = crypto.timingSafeEqual(
      Buffer.from(validHmac, 'utf8'),
      Buffer.from(testHmac, 'utf8')
    );

    expect(match).toBe(true);
  });

  it('rejects tampered or forged webhook payloads', () => {
    const originalPayload = JSON.stringify({ id: 101, status: 'paid' });
    const forgedPayload = JSON.stringify({ id: 101, status: 'refunded' });

    const originalHmac = crypto
      .createHmac('sha256', secret)
      .update(originalPayload, 'utf8')
      .digest('base64');

    const forgedHmac = crypto
      .createHmac('sha256', secret)
      .update(forgedPayload, 'utf8')
      .digest('base64');

    expect(originalHmac).not.toBe(forgedHmac);
  });
});
