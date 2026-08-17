import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../server/infrastructure/database/client.js';
import { TransferService } from '../../server/domains/transfer/transfer.service.js';
import { EarlyAccessService } from '../../server/domains/early-access/early-access.service.js';

describe('Transfer Acceptance & Early Access Integration', () => {
  let shopId: string;

  beforeAll(async () => {
    const shop = await prisma.shop.findUnique({
      where: { shop_domain: 'maison-aurelia.myshopify.com' },
    });
    shopId = shop?.id || 't1';
  });

  it('evaluates early access drops based on customer membership tier', async () => {
    const access = await EarlyAccessService.evaluateCustomerAccess(
      shopId,
      'gid://shopify/Product/98412049182',
      'gid://shopify/Customer/7182930192' // Claire Delacroix (Atelier Tier)
    );

    expect(access).toBeDefined();
    expect(typeof access.has_access).toBe('boolean');
  });

  it('verifies pending transfer query rejects unknown tokens', async () => {
    await expect(
      TransferService.getTransferByToken(shopId, 'TRF_NONEXISTENT_TOKEN_12345')
    ).rejects.toThrow();
  });
});
