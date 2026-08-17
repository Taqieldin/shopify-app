import { prisma } from '../../infrastructure/database/client.js';
import { MembershipService } from '../membership/membership.service.js';
export class EarlyAccessService {
    /**
     * Configure an early access drop for a specific tier
     */
    static async createRule(shop_id, dto) {
        return prisma.earlyAccessRule.create({
            data: {
                shop_id,
                shopify_product_id: dto.shopify_product_id,
                tier_id: dto.tier_id,
                starts_at: dto.starts_at,
                ends_at: dto.ends_at,
                is_active: true,
            },
            include: {
                tier: true,
            },
        });
    }
    /**
     * Check if a customer has access to a gated product drop
     */
    static async evaluateCustomerAccess(shop_id, shopify_product_id, customer_shopify_id) {
        const rules = await prisma.earlyAccessRule.findMany({
            where: {
                shop_id,
                shopify_product_id,
                is_active: true,
            },
            include: { tier: true },
        });
        if (rules.length === 0) {
            return { is_gated: false, has_access: true };
        }
        const customerMembership = await MembershipService.getCustomerMembership(shop_id, customer_shopify_id);
        const customerTierLevel = customerMembership?.tier?.tier_level || 0;
        const now = new Date();
        const activeRule = rules.find((r) => now >= new Date(r.starts_at) && (!r.ends_at || now <= new Date(r.ends_at)));
        if (!activeRule) {
            return { is_gated: true, has_access: false, reason: 'Early access window is not currently open.' };
        }
        if (!activeRule.tier_id) {
            // Open to all registered club members
            return { is_gated: true, has_access: true, tier_name: 'All Members' };
        }
        const requiredTierLevel = activeRule.tier?.tier_level || 1;
        const hasAccess = customerTierLevel >= requiredTierLevel;
        return {
            is_gated: true,
            has_access: hasAccess,
            required_tier: activeRule.tier?.name,
            customer_tier: customerMembership?.tier?.name || 'Unregistered',
            unlock_date: activeRule.starts_at,
        };
    }
}
