import { describe, it, expect } from 'vitest';
import { PRICING_PLANS } from '../../server/domains/billing/billing.service.js';

describe('Billing & Subscription Model', () => {
  it('defines structured multi-tenant subscription tiers', () => {
    expect(PRICING_PLANS.FREE.price).toBe(0);
    expect(PRICING_PLANS.STARTER.price).toBe(49);
    expect(PRICING_PLANS.PRO.price).toBe(149);
    expect(PRICING_PLANS.ENTERPRISE.price).toBe(499);
  });

  it('verifies tier serial allocation limits', () => {
    expect(PRICING_PLANS.FREE.max_serials).toBeLessThan(PRICING_PLANS.STARTER.max_serials);
    expect(PRICING_PLANS.STARTER.max_serials).toBeLessThan(PRICING_PLANS.PRO.max_serials);
    expect(PRICING_PLANS.PRO.max_serials).toBeLessThan(PRICING_PLANS.ENTERPRISE.max_serials);
  });
});
