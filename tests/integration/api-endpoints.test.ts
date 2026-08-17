import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../server/infrastructure/database/client.js';
import { PassportService } from '../../server/domains/passport/passport.service.js';
import { AuthenticationService } from '../../server/domains/authentication/authentication.service.js';
import { CreditsService } from '../../server/domains/credits/credits.service.js';

describe('Domain Operations Integration Tests', () => {
  let shopId: string;

  beforeAll(async () => {
    const shop = await prisma.shop.findUnique({
      where: { shop_domain: 'maison-aurelia.myshopify.com' },
    });
    shopId = shop?.id || 't1';
  });

  it('resolves public passport with shielded customer privacy', async () => {
    const passport = await PassportService.getPublicPassport(shopId, 'AUR-2026-000184');

    expect(passport.serial).toBe('AUR-2026-000184');
    expect(passport.brand).toBe('Maison Aurelia');
    expect(passport.verification_badge).toBe('AUTHENTICATED_ORIGINAL');
    expect((passport as any).active_owner_email).toBeUndefined(); // Owner email shielded
  });

  it('records authentication scan event and returns genuine verification', async () => {
    const result = await AuthenticationService.verifyPiece(shopId, {
      serial: 'AUR-2026-000184',
      method: 'NFC',
      country: 'France',
      city: 'Paris',
    });

    expect(result.result).toBe('AUTHENTICATED');
    expect(result.is_genuine).toBe(true);
  });

  it('posts immutable credit transactions and calculates accurate running balance', async () => {
    const customerId = 'gid://shopify/Customer/7182930192';
    const initialBalance = await CreditsService.getBalance(shopId, customerId);

    const transaction = await CreditsService.postTransaction(
      shopId,
      {
        customer_shopify_id: customerId,
        amount: 250,
        type: 'BONUS',
        reason: 'Atelier Event VIP Attendance',
      },
      'admin_test'
    );

    expect(transaction.new_balance).toBe(initialBalance + 250);

    const statement = await CreditsService.getStatement(shopId, customerId);
    expect(statement.statement.some((s) => s.reason === 'Atelier Event VIP Attendance')).toBe(true);
  });
});
