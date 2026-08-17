import { prisma } from '../../infrastructure/database/client.js';
import { AuditService } from '../audit/audit.service.js';

export type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface PlanConfig {
  name: PlanName;
  price: number;
  max_serials: number;
  features: string[];
}

export const PRICING_PLANS: Record<PlanName, PlanConfig> = {
  FREE: {
    name: 'FREE',
    price: 0,
    max_serials: 25,
    features: ['Basic Digital Passports', 'QR Codes', 'Standard Storytelling'],
  },
  STARTER: {
    name: 'STARTER',
    price: 49,
    max_serials: 500,
    features: ['NFC Tag Binding', 'Ownership Registry', 'Basic Care Schedules', 'Custom Domain'],
  },
  PRO: {
    name: 'PRO',
    price: 149,
    max_serials: 5000,
    features: [
      'Layered Risk Engine & Telemetry',
      'Private Club & Credits Ledger',
      'Atelier Care Tickets & Service',
      'VIP Early Access Drops',
      'Bespoke Gift Experience',
    ],
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    price: 499,
    max_serials: 50000,
    features: [
      'Unlimited Serials',
      'Dedicated NXP Cryptographic DNA',
      'Custom ERP/SAP Sync',
      'Concierge Onboarding',
      'SLA 99.99%',
    ],
  },
};

export class BillingService {
  /**
   * Get current subscription and available upgrade plans for merchant
   */
  static async getSubscriptionStatus(shop_id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shop_id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    const activePlanName = (shop?.plan as PlanName) || 'FREE';
    const serialsCount = await prisma.physicalPiece.count({ where: { shop_id } });

    return {
      current_plan: PRICING_PLANS[activePlanName] || PRICING_PLANS.FREE,
      usage: {
        total_serials: serialsCount,
        max_serials: PRICING_PLANS[activePlanName]?.max_serials || 25,
        utilization_percent: Math.min(
          100,
          Math.round((serialsCount / (PRICING_PLANS[activePlanName]?.max_serials || 25)) * 100)
        ),
      },
      available_plans: Object.values(PRICING_PLANS),
    };
  }

  /**
   * Upgrade or change subscription plan
   */
  static async changePlan(shop_id: string, targetPlan: PlanName, actor_id: string) {
    const planConfig = PRICING_PLANS[targetPlan];
    if (!planConfig) {
      throw new Error(`Plan '${targetPlan}' is not recognized.`);
    }

    // Update shop plan
    await prisma.shop.update({
      where: { id: shop_id },
      data: { plan: targetPlan },
    });

    // Record billing subscription entry
    const existingSub = await prisma.billingSubscription.findFirst({
      where: { shop_id, status: 'ACTIVE' },
    });

    let sub;
    if (existingSub) {
      sub = await prisma.billingSubscription.update({
        where: { id: existingSub.id },
        data: {
          plan_name: targetPlan,
          amount: planConfig.price,
        },
      });
    } else {
      sub = await prisma.billingSubscription.create({
        data: {
          shop_id,
          plan_name: targetPlan,
          status: 'ACTIVE',
          amount: planConfig.price,
        },
      });
    }

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id,
      action: 'BILLING_PLAN_CHANGED',
      resource_type: 'BILLING',
      resource_id: sub.id,
      metadata: { new_plan: targetPlan, price: planConfig.price },
    });

    return {
      success: true,
      new_plan: planConfig,
    };
  }
}
