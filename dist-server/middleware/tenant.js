import { prisma } from '../infrastructure/database/client.js';
import { UnauthorizedError } from '../shared/errors/index.js';
export async function tenantMiddleware(req, res, next) {
    try {
        // 1. Resolve shop from header (Shopify App Bridge Session Token or X-Shop-Domain)
        const shopDomain = req.headers['x-shopify-shop-domain'] ||
            req.headers['x-shop-domain'] ||
            req.query.shop;
        if (!shopDomain) {
            // Default to first active tenant in local dev / fallback (NEVER in production)
            if (process.env.NODE_ENV === 'production') {
                throw new UnauthorizedError('Missing shop domain header.');
            }
            const defaultShop = await prisma.shop.findFirst({
                where: { status: 'ACTIVE' },
            });
            if (!defaultShop) {
                throw new UnauthorizedError('No active Shopify store tenant found.');
            }
            req.tenant = {
                shop_id: defaultShop.id,
                shop_domain: defaultShop.shop_domain,
                plan: defaultShop.plan,
            };
            return next();
        }
        const shop = await prisma.shop.findUnique({
            where: { shop_domain: shopDomain },
        });
        if (!shop) {
            throw new UnauthorizedError(`Tenant for store '${shopDomain}' not recognized or installed.`);
        }
        req.tenant = {
            shop_id: shop.id,
            shop_domain: shop.shop_domain,
            plan: shop.plan,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
