import { describe, it, expect, beforeAll } from 'vitest';
import { AuditService } from '../../server/domains/audit/audit.service.js';
import { prisma } from '../../server/infrastructure/database/client.js';

describe('Audit Logging Domain Engine', () => {
  let shopId: string;

  beforeAll(async () => {
    const shop = await prisma.shop.findUnique({
      where: { shop_domain: 'maison-aurelia.myshopify.com' },
    });
    shopId = shop?.id || '';
  });

  it('creates immutable compliance audit logs', async () => {
    const log = await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: 'staff_01',
      action: 'PASSPORT_CREATED',
      resource_type: 'PASSPORT',
      resource_id: 'pass_test_01',
      metadata: { serial: 'AUR-2026-TEST' },
    });

    expect(log).toBeDefined();
    expect(log.action).toBe('PASSPORT_CREATED');
    expect(log.actor_type).toBe('MERCHANT_ADMIN');
    expect(log.resource_type).toBe('PASSPORT');
  });

  it('retrieves paginated audit trail records for tenant', async () => {
    const logs = await AuditService.getLogs(shopId, { limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });
});
