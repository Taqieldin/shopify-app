import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../server/infrastructure/database/client.js';
import { ShopService } from '../../server/domains/shop/shop.service.js';
import { PhysicalPieceService } from '../../server/domains/physical-piece/physical-piece.service.js';
import { AuthenticationService } from '../../server/domains/authentication/authentication.service.js';
import { TransferService } from '../../server/domains/transfer/transfer.service.js';
import { CreditsService } from '../../server/domains/credits/credits.service.js';
import { ResaleService } from '../../server/domains/resale/resale.service.js';
import { ClubEventService } from '../../server/domains/club-events/club-events.service.js';
import { VerificationOptionsService } from '../../server/domains/verification-options/verification-options.service.js';
import { NFCTagService } from '../../server/domains/nfc/nfc-tag.service.js';
import { ConflictError, ForbiddenError } from '../../server/shared/errors/index.js';

describe('New Feature Suite: Verification Options, Scan Alerts, NFC Write-Back, Resale, Club Events', () => {
  let shopId: string;
  const stamp = Date.now();
  const serialA = `NFW-A-${stamp}`;
  const serialB = `NFW-B-${stamp}`;
  const nfcA = `04:AA:${stamp.toString(16).slice(-6).toUpperCase()}`;
  const sellerGid = `gid://shopify/Customer/RSL-SELLER-${stamp}`;
  const buyerGid = `gid://shopify/Customer/RSL-BUYER-${stamp}`;

  beforeAll(async () => {
    const shop = await ShopService.findOrCreateTenant(
      `gid://shopify/Shop/NEWFEAT-${stamp}`,
      `newfeat-${stamp}.myshopify.com`
    );
    shopId = shop.id;

    await prisma.customer.upsert({
      where: { shop_id_shopify_customer_id: { shop_id: shopId, shopify_customer_id: sellerGid } },
      update: { email: `seller-${stamp}@example.com` },
      create: {
        shop_id: shopId,
        shopify_customer_id: sellerGid,
        email: `seller-${stamp}@example.com`,
        first_name: 'Seller',
        last_name: 'One',
      },
    });
  });

  it('Feature 2: per-product verification options are enforced at scan time', async () => {
    const piece = await PhysicalPieceService.createPiece(
      shopId,
      {
        shopify_product_id: `gid://shopify/Product/OPT-${stamp}`,
        product_title: 'Verification Options Tote',
        product_handle: 'verification-options-tote',
        serial: serialA,
        nfc_uid: nfcA,
      },
      'admin_test'
    );

    await VerificationOptionsService.setMethods(shopId, piece.product_ref_id, ['QR'], 'admin_test');

    const product = await VerificationOptionsService.listProducts(shopId);
    const updated = product.find((p) => p.id === piece.product_ref_id);
    expect(updated?.verification_methods).toEqual(['QR']);

    await expect(
      AuthenticationService.verifyPiece(shopId, { serial: serialA, method: 'NFC', nfc_uid: nfcA })
    ).rejects.toThrow(ConflictError);

    await expect(
      AuthenticationService.verifyPiece(shopId, { serial: serialA, method: 'SERIAL_LOOKUP' })
    ).rejects.toThrow(ConflictError);

    const result = await AuthenticationService.verifyPiece(shopId, { serial: serialA, method: 'QR' });
    expect(result.result).toBe('UNREGISTERED');
  });

  it('Feature 3: successful verification alerts the current owner', async () => {
    const customer = await prisma.customer.findUnique({
      where: { shop_id_shopify_customer_id: { shop_id: shopId, shopify_customer_id: sellerGid } },
    });
    if (!customer) throw new Error('seller missing');

    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial: serialA } },
    });
    if (!piece) throw new Error('piece missing');

    await prisma.ownership.create({
      data: {
        shop_id: shopId,
        physical_piece_id: piece.id,
        customer_id: customer.id,
        is_active: true,
        source: 'REGISTRATION',
      },
    });

    const result = await AuthenticationService.verifyPiece(shopId, {
      serial: serialA,
      method: 'QR',
      country: 'France',
      city: 'Paris',
    });
    expect(result.result).toBe('AUTHENTICATED');

    const logs = await prisma.notificationLog.findMany({
      where: { shop_id: shopId, notification_type: 'PIECE_VERIFIED' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].recipient_email).toBe(`seller-${stamp}@example.com`);
  });

  it('Feature 1: ownership transfer writes the new owner into the NFC tag payload', async () => {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial: serialA } },
    });
    if (!piece) throw new Error('piece missing');

    // Re-enable NFC+QR for the product so the flow mirrors production defaults
    const product = await prisma.physicalPiece.findUnique({
      where: { id: piece.id },
      select: { product_ref_id: true },
    });
    if (!product) throw new Error('product missing');
    await VerificationOptionsService.setMethods(shopId, product.product_ref_id, ['NFC', 'QR'], 'admin_test');

    const initiated = await TransferService.initiateTransfer(shopId, {
      serial: serialA,
      sender_shopify_customer_id: sellerGid,
      recipient_email: `receiver-${stamp}@example.com`,
      recipient_name: 'Receiver Two',
    });

    const accepted = await TransferService.acceptTransfer(shopId, {
      transfer_token: initiated.transfer_token,
      recipient_shopify_customer_id: `gid://shopify/Customer/RECEIVER-${stamp}`,
      recipient_email: `receiver-${stamp}@example.com`,
      recipient_name: 'Receiver Two',
    });
    expect(accepted.status).toBe('COMPLETED');

    const writeLogs = await NFCTagService.listWriteLogs(shopId, piece.id);
    expect(writeLogs.length).toBe(1);
    expect(writeLogs[0].physical_piece_id).toBe(piece.id);
    expect(writeLogs[0].transfer_count).toBe(1);
    expect(writeLogs[0].encrypted_payload.length).toBeGreaterThan(50);
  });

  it('Feature 4: pre-owned resale moves ownership, mints a certificate and writes the tag', async () => {
    const pieceB = await PhysicalPieceService.createPiece(
      shopId,
      {
        shopify_product_id: `gid://shopify/Product/RSL-${stamp}`,
        product_title: 'Resale Edition Bag',
        product_handle: 'resale-edition-bag',
        serial: serialB,
        nfc_uid: `04:BB:${stamp.toString(16).slice(-6).toUpperCase()}`,
      },
      'admin_test'
    );

    const seller = await prisma.customer.findUnique({
      where: { shop_id_shopify_customer_id: { shop_id: shopId, shopify_customer_id: sellerGid } },
    });
    if (!seller) throw new Error('seller missing');

    await prisma.ownership.create({
      data: {
        shop_id: shopId,
        physical_piece_id: pieceB.id,
        customer_id: seller.id,
        is_active: true,
        source: 'DIRECT_PURCHASE',
      },
    });

    const listing = await ResaleService.listPiece(shopId, {
      serial: serialB,
      seller_shopify_customer_id: sellerGid,
      price: 4200,
      currency: 'EUR',
      notes: 'Privately owned, full provenance available',
    });
    expect(listing.status).toBe('LISTED');

    const browse = await ResaleService.getListings(shopId);
    expect(browse.some((l) => l.id === listing.id)).toBe(true);
    expect(browse[0]).not.toHaveProperty('seller');

    await expect(
      ResaleService.buyListing(shopId, {
        listing_id: listing.id,
        buyer_shopify_customer_id: sellerGid,
        buyer_email: 'x@example.com',
      })
    ).rejects.toThrow(ConflictError);

    const sale = await ResaleService.buyListing(shopId, {
      listing_id: listing.id,
      buyer_shopify_customer_id: buyerGid,
      buyer_email: `buyer-${stamp}@example.com`,
      buyer_name: 'Buyer Three',
    });
    expect(sale.status).toBe('SOLD');
    expect(sale.certificate_number).toMatch(/^CERT-/);

    const closed = await prisma.resaleListing.findUnique({ where: { id: listing.id } });
    expect(closed?.status).toBe('SOLD');
    expect(closed?.transfer_id).toBeTruthy();

    const activeOwnership = await prisma.ownership.findFirst({
      where: { physical_piece_id: pieceB.id, is_active: true },
      include: { customer: true },
    });
    expect(activeOwnership?.source).toBe('RESALE');
    expect(activeOwnership?.customer.shopify_customer_id).toBe(buyerGid);

    const cert = await prisma.transferCertificate.findFirst({
      where: { physical_piece_id: pieceB.id },
    });
    expect(cert?.certificate_number).toBe(sale.certificate_number);

    const writes = await NFCTagService.listWriteLogs(shopId, pieceB.id);
    expect(writes.length).toBe(1);

    const notifications = await prisma.notificationLog.findMany({
      where: { shop_id: shopId, notification_type: 'RESALE_SOLD' },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(2);
  });

  it('Feature 5: club events award credits on NFC check-in and reject duplicates', async () => {
    const buyer = await prisma.customer.findUnique({
      where: { shop_id_shopify_customer_id: { shop_id: shopId, shopify_customer_id: buyerGid } },
    });
    if (!buyer) throw new Error('buyer missing');

    const pieceB = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial: serialB } },
    });
    if (!pieceB) throw new Error('pieceB missing');

    const event = await ClubEventService.createEvent(
      shopId,
      {
        name: `Soirée ${stamp}`,
        description: 'Test event',
        location: 'Paris',
        starts_at: new Date(Date.now() - 3600_000).toISOString(),
        ends_at: new Date(Date.now() + 3600_000).toISOString(),
        credits_award: 150,
      },
      'admin_test'
    );

    await ClubEventService.setStatus(shopId, event.id, 'LIVE', 'admin_test');

    const balanceBefore = await CreditsService.getBalance(shopId, buyerGid);

    const checkIn = await ClubEventService.checkIn(shopId, {
      event_id: event.id,
      customer_shopify_customer_id: buyerGid,
      customer_email: `buyer-${stamp}@example.com`,
      method: 'NFC',
      nfc_uid: pieceB.nfc_uid || undefined,
    });
    expect(checkIn.credits_awarded).toBe(150);
    expect(checkIn.new_balance).toBe(balanceBefore + 150);

    await expect(
      ClubEventService.checkIn(shopId, {
        event_id: event.id,
        customer_shopify_customer_id: buyerGid,
        method: 'MANUAL',
      })
    ).rejects.toThrow(ConflictError);

    await expect(
      ClubEventService.checkIn(shopId, {
        event_id: event.id,
        customer_shopify_customer_id: sellerGid,
        method: 'NFC',
        nfc_uid: pieceB.nfc_uid || undefined,
      })
    ).rejects.toThrow(ConflictError);

    const memberEvents = await ClubEventService.getMemberEvents(shopId, buyerGid);
    expect(memberEvents[0].checked_in).toBe(true);

    const notifications = await prisma.notificationLog.findMany({
      where: { shop_id: shopId, notification_type: 'EVENT_CHECKED_IN' },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
  });

  it('Feature 4b: non-owner cannot list a piece for resale', async () => {
    await expect(
      ResaleService.listPiece(shopId, {
        serial: serialA,
        seller_shopify_customer_id: buyerGid,
        price: 1000,
      })
    ).rejects.toThrow(ForbiddenError);
  });
});