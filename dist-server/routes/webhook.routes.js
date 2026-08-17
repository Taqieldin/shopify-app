import { Router } from 'express';
import { prisma } from '../infrastructure/database/client.js';
import { verifyShopifyWebhook } from '../infrastructure/shopify/webhook-verifier.js';
import { AuditService } from '../domains/audit/audit.service.js';
export const webhookRouter = Router();
webhookRouter.use(verifyShopifyWebhook());
/**
 * POST /api/webhooks/app-uninstalled
 * Handle merchant app uninstall
 */
webhookRouter.post('/app-uninstalled', async (req, res, next) => {
    try {
        const shopDomain = req.headers['x-shopify-shop-domain'];
        if (shopDomain) {
            const shop = await prisma.shop.findUnique({ where: { shop_domain: shopDomain } });
            if (shop) {
                await prisma.shop.update({
                    where: { id: shop.id },
                    data: { status: 'UNINSTALLED' },
                });
                await AuditService.log({
                    shop_id: shop.id,
                    actor_type: 'SYSTEM',
                    actor_id: 'shopify-webhook',
                    action: 'APP_UNINSTALLED',
                    resource_type: 'SHOP',
                    resource_id: shop.id,
                });
            }
        }
        res.status(200).send('Webhook processed');
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/webhooks/orders
 * Handle order creation & customer purchase link
 */
webhookRouter.post('/orders', async (req, res, next) => {
    try {
        const shopDomain = req.headers['x-shopify-shop-domain'];
        console.log(`[Webhook:Order] Received order event for store: ${shopDomain}`);
        res.status(200).send('Order webhook acknowledged');
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/webhooks/products
 * Handle product update or deletion from Shopify catalog
 */
webhookRouter.post('/products', async (req, res, next) => {
    try {
        const shopDomain = req.headers['x-shopify-shop-domain'];
        console.log(`[Webhook:Product] Received product sync event for store: ${shopDomain}`);
        res.status(200).send('Product webhook acknowledged');
    }
    catch (err) {
        next(err);
    }
});
