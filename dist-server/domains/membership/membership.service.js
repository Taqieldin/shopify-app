import { prisma } from '../../infrastructure/database/client.js';
import { AuditService } from '../audit/audit.service.js';
export class MembershipService {
    /**
     * Get or seed default membership tiers for a tenant (e.g. Maison, Atelier, Privé)
     */
    static async getTiers(shop_id) {
        let tiers = await prisma.membershipTier.findMany({
            where: { shop_id },
            orderBy: { tier_level: 'asc' },
        });
        if (tiers.length === 0) {
            // Seed default tiers
            await prisma.membershipTier.createMany({
                data: [
                    {
                        shop_id,
                        tier_level: 1,
                        name: 'Maison',
                        code: 'MAISON',
                        description: 'Complimentary entry tier for registered collectors.',
                        badge_color: '#52525b',
                        required_spend: 0,
                        required_pieces: 1,
                        required_credits: 0,
                    },
                    {
                        shop_id,
                        tier_level: 2,
                        name: 'Atelier',
                        code: 'ATELIER',
                        description: 'Advanced patron tier with dedicated care benefits.',
                        badge_color: '#b45309',
                        required_spend: 1500,
                        required_pieces: 2,
                        required_credits: 500,
                    },
                    {
                        shop_id,
                        tier_level: 3,
                        name: 'Privé',
                        code: 'PRIVE',
                        description: 'Prestige invitation tier with bespoke releases and concierge.',
                        badge_color: '#09090b',
                        required_spend: 5000,
                        required_pieces: 4,
                        required_credits: 2000,
                    },
                ],
            });
            tiers = await prisma.membershipTier.findMany({
                where: { shop_id },
                orderBy: { tier_level: 'asc' },
            });
        }
        return tiers;
    }
    /**
     * Upsert a membership tier definition
     */
    static async upsertTier(shop_id, dto, actor_id) {
        const tier = dto.id
            ? await prisma.membershipTier.update({
                where: { id: dto.id },
                data: {
                    name: dto.name,
                    code: dto.code,
                    description: dto.description,
                    badge_color: dto.badge_color,
                    required_spend: dto.required_spend,
                    required_pieces: dto.required_pieces,
                    required_credits: dto.required_credits,
                },
            })
            : await prisma.membershipTier.create({
                data: {
                    shop_id,
                    tier_level: dto.tier_level,
                    name: dto.name,
                    code: dto.code,
                    description: dto.description,
                    badge_color: dto.badge_color || '#18181b',
                    required_spend: dto.required_spend || 0,
                    required_pieces: dto.required_pieces || 0,
                    required_credits: dto.required_credits || 0,
                },
            });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id,
            action: 'MEMBERSHIP_TIER_SAVED',
            resource_type: 'MEMBERSHIP_TIER',
            resource_id: tier.id,
            metadata: { name: tier.name, level: tier.tier_level },
        });
        return tier;
    }
    /**
     * Resolve customer membership level based on pieces owned and credits
     */
    static async getCustomerMembership(shop_id, customer_shopify_id) {
        const customer = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: { shop_id, shopify_customer_id: customer_shopify_id },
            },
            include: {
                memberships: {
                    include: { tier: true },
                },
                ownerships: {
                    where: { is_active: true },
                },
            },
        });
        if (!customer) {
            return null;
        }
        // If manual or assigned membership exists, return it
        if (customer.memberships.length > 0) {
            const active = customer.memberships[0];
            return {
                tier: active.tier,
                status: active.status,
                granted_at: active.granted_at,
                pieces_owned: customer.ownerships.length,
            };
        }
        // Otherwise evaluate based on owned pieces
        const tiers = await this.getTiers(shop_id);
        const piecesCount = customer.ownerships.length;
        let matchedTier = tiers[0];
        for (const t of tiers) {
            if (piecesCount >= t.required_pieces) {
                matchedTier = t;
            }
        }
        return {
            tier: matchedTier,
            status: 'ACTIVE',
            granted_at: customer.created_at,
            pieces_owned: piecesCount,
        };
    }
}
