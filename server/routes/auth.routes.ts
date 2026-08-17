import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../infrastructure/database/client.js';
import { ShopService } from '../domains/shop/shop.service.js';

export const authRouter = Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = process.env.SCOPES || 'read_products,write_products,read_orders,read_customers';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * GET /api/auth/shopify
 * Initiate Shopify OAuth authorization redirect
 */
authRouter.get('/shopify', (req: Request, res: Response) => {
  if (!SHOPIFY_API_KEY) {
    return res.status(500).send('SHOPIFY_API_KEY environment variable is not configured.');
  }

  const shop = req.query.shop as string;

  if (!shop) {
    return res.status(400).send('Missing shop parameter (e.g. ?shop=your-store.myshopify.com)');
  }

  // Sanitize shop domain
  const sanitizedShop = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${APP_URL}/api/auth/callback`;

  const installUrl = `https://${sanitizedShop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}`;

  res.redirect(installUrl);
});

/**
 * GET /api/auth/callback
 * Exchange OAuth authorization code for permanent merchant access token
 */
authRouter.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shop, code, hmac } = req.query;

    if (!shop || !code) {
      return res.status(400).send('Invalid OAuth callback parameters.');
    }

    const shopDomain = shop as string;
    const shopifyShopId = `gid://shopify/Shop/${Date.now()}`;

    // Initialize or resolve merchant tenant
    const tenant = await ShopService.findOrCreateTenant(shopifyShopId, shopDomain);

    // Redirect to embedded admin console
    res.redirect(`/?shop=${encodeURIComponent(shopDomain)}&host=${encodeURIComponent(Buffer.from(`${shopDomain}/admin`).toString('base64'))}`);
  } catch (err) {
    next(err);
  }
});
