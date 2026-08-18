import { prisma } from '../infrastructure/database/client.js';
import { UnauthorizedError } from '../shared/errors/index.js';
async function ensureShopExists(shopDomain) {
    let shop = await prisma.shop.findUnique({
        where: { shop_domain: shopDomain },
    });
    if (!shop) {
        console.log(`[Tenant] Auto-provisioning shop: ${shopDomain}`);
        shop = await prisma.shop.create({
            data: {
                shopify_shop_id: `gid://shopify/Shop/${Date.now()}`,
                shop_domain: shopDomain,
                status: 'ACTIVE',
                plan: 'FREE',
                settings: {
                    create: {
                        brand_name: shopDomain.replace('.myshopify.com', ''),
                        primary_color: '#1c1917',
                        secondary_color: '#78716c',
                        accent_color: '#c2410c',
                        font_family: 'system-ui',
                        passport_term: 'Digital Passport',
                        club_name: 'Private Club',
                        credits_term: 'Credits',
                        public_story_enabled: true,
                    },
                },
                features: {
                    create: {
                        digital_passport_enabled: true,
                        authentication_enabled: true,
                        nfc_enabled: true,
                        qr_enabled: true,
                        ownership_enabled: true,
                        transfer_enabled: true,
                        membership_enabled: true,
                        credits_enabled: true,
                        care_enabled: true,
                        service_enabled: true,
                        warranty_enabled: true,
                    },
                },
                public_field_cfg: {
                    create: {
                        show_serial: true,
                        show_edition: true,
                        show_manufacturing_date: true,
                        show_location: true,
                        show_materials: true,
                        show_craft: true,
                        show_care: true,
                        show_service_history: true,
                        show_ownership_status: true,
                        show_warranty: true,
                    },
                },
            },
            include: { settings: true, features: true },
        });
        console.log(`[Tenant] Auto-provisioned shop ${shopDomain} with id ${shop.id}`);
    }
    return shop;
}
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
        const shop = await ensureShopExists(shopDomain);
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
