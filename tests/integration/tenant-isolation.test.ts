import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/infrastructure/database/client.js';
import { PhysicalPieceService } from '../../server/domains/physical-piece/physical-piece.service.js';
import { PassportService } from '../../server/domains/passport/passport.service.js';

describe('Tenant Isolation Verification', () => {
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    // Look up seeded shops
    const shop1 = await prisma.shop.findUnique({
      where: { shop_domain: 'maison-aurelia.myshopify.com' },
    });
    const shop2 = await prisma.shop.findUnique({
      where: { shop_domain: 'vanguard-horology.myshopify.com' },
    });

    tenant1Id = shop1?.id || 't1';
    tenant2Id = shop2?.id || 't2';
  });

  it('ensures Tenant 1 piece queries never return Tenant 2 pieces', async () => {
    const tenant1Pieces = await PhysicalPieceService.listPieces(tenant1Id);
    const hasTenant2Piece = tenant1Pieces.some((p) => p.serial.startsWith('VNG'));

    expect(hasTenant2Piece).toBe(false);
    expect(tenant1Pieces.every((p) => p.shop_id === tenant1Id)).toBe(true);
  });

  it('prevents Tenant 1 from accessing Tenant 2 passport by cross-tenant query', async () => {
    const tenant1Passports = await PassportService.listPassports(tenant1Id);
    const hasTenant2Passport = tenant1Passports.some((p) => p.physical_piece.serial.startsWith('VNG'));

    expect(hasTenant2Passport).toBe(false);
  });
});
