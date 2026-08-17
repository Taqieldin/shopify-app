import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { prisma } from '../../server/infrastructure/database/client.js';
import { ShopService } from '../../server/domains/shop/shop.service.js';
import { PhysicalPieceService } from '../../server/domains/physical-piece/physical-piece.service.js';
import { PassportService } from '../../server/domains/passport/passport.service.js';
import { AuthenticationService } from '../../server/domains/authentication/authentication.service.js';
import { TransferService } from '../../server/domains/transfer/transfer.service.js';
import { CreditsService } from '../../server/domains/credits/credits.service.js';
import { GiftService } from '../../server/domains/gift/gift.service.js';
import { EarlyAccessService } from '../../server/domains/early-access/early-access.service.js';
import { CareService } from '../../server/domains/care/care.service.js';
import { LostStolenService } from '../../server/domains/lost-stolen/lost-stolen.service.js';
import { NotificationService } from '../../server/domains/notifications/notification.service.js';
import { BillingService } from '../../server/domains/billing/billing.service.js';
import { CSVEngine } from '../../server/infrastructure/csv/csv-engine.js';
import { QRGenerator } from '../../server/infrastructure/qr/qr-generator.js';
import { verifyShopifyWebhook } from '../../server/infrastructure/shopify/webhook-verifier.js';
import { AuditService } from '../../server/domains/audit/audit.service.js';

describe('Comprehensive End-to-End Feature Verification Suite', () => {
  let shopId: string;
  const testSerial = `TEST-PIECE-${Date.now()}`;
  let pieceId: string;

  beforeAll(async () => {
    // 1. Initialize or resolve tenant
    const shop = await ShopService.findOrCreateTenant(
      'gid://shopify/Shop/99887766',
      'e2e-atelier-test.myshopify.com'
    );
    shopId = shop.id;

    // 2. Pre-create customer for credits and gifts
    await prisma.customer.upsert({
      where: {
        shop_id_shopify_customer_id: {
          shop_id: shopId,
          shopify_customer_id: 'gid://shopify/Customer/881122',
        },
      },
      update: { email: 'claire.e2e@example.com' },
      create: {
        shop_id: shopId,
        shopify_customer_id: 'gid://shopify/Customer/881122',
        email: 'claire.e2e@example.com',
        first_name: 'Claire',
        last_name: 'Delacroix',
      },
    });
  });

  it('Feature 1: Multi-Tenant Settings & Feature Flags', async () => {
    const updated = await ShopService.updateSettings(
      shopId,
      {
        brand_name: 'Atelier Test Paris',
        passport_term: 'Digital Vault Card',
        club_name: 'Privé Circle',
        credits_term: 'Patron Gems',
      },
      'admin_e2e'
    );
    expect(updated.brand_name).toBe('Atelier Test Paris');
    expect(updated.passport_term).toBe('Digital Vault Card');
  });

  it('Feature 2: Physical Piece Serial Registration', async () => {
    const piece = await PhysicalPieceService.createPiece(
      shopId,
      {
        shopify_product_id: 'gid://shopify/Product/999111',
        product_title: 'The Haute E2E Tote Bag',
        product_handle: 'haute-e2e-tote',
        serial: testSerial,
        edition_number: 1,
        edition_total: 10,
        nfc_uid: '04:E2:88:AA:BB:CC',
        materials: [{ name: 'Full-Grain Box Calfskin', origin: 'Alsace, France' }],
      },
      'admin_e2e'
    );

    expect(piece).toBeDefined();
    expect(piece.serial).toBe(testSerial);
    pieceId = piece.id;
  });

  it('Feature 3: Digital Product Passport Upsert & Public Storytelling', async () => {
    const passport = await PassportService.upsertPassport(
      shopId,
      {
        physical_piece_id: pieceId,
        title: 'Digital Passport — Haute E2E Tote',
        description: 'Certified authentic handcrafted masterpiece.',
        craft_info: 'Handcrafted by master artisans with saddle stitch.',
        materials_summary: 'Full-Grain Leather with Palladium hardware.',
        heritage_story: 'Rooted in heritage savoir-faire.',
      },
      'admin_e2e'
    );

    expect(passport.title).toBe('Digital Passport — Haute E2E Tote');

    // Retrieve via public resolver
    const publicData = await PassportService.getPublicPassport(shopId, testSerial);
    expect(publicData.serial).toBe(testSerial);
    expect(publicData.title).toBe('Digital Passport — Haute E2E Tote');
    expect(publicData.verification_badge).toBe('AUTHENTICATED_ORIGINAL');
  });

  it('Feature 4: Layered Authentication Telemetry & Risk Engine', async () => {
    // 1. Normal genuine tap
    const scan1 = await AuthenticationService.verifyPiece(shopId, {
      serial: testSerial,
      method: 'NFC',
      nfc_uid: '04:E2:88:AA:BB:CC',
      nfc_read_counter: 1,
      country: 'France',
      city: 'Paris',
    });
    expect(scan1.result).toBe('UNREGISTERED'); // Manufactured, not yet customer-registered
    expect(scan1.is_genuine).toBe(true);

    // 2. Velocity anomaly tap (Tokyo 1 min later)
    const scan2 = await AuthenticationService.verifyPiece(shopId, {
      serial: testSerial,
      method: 'NFC',
      nfc_uid: '04:E2:88:AA:BB:CC',
      nfc_read_counter: 2,
      country: 'Japan',
      city: 'Tokyo',
    });
    expect(scan2).toBeDefined();
  });

  it('Feature 5: Customer Vault & Append-Only Credits Ledger', async () => {
    // Get the balance before the transaction
    const balanceBefore = await CreditsService.getBalance(shopId, 'gid://shopify/Customer/881122');

    const tx = await CreditsService.postTransaction(
      shopId,
      {
        customer_shopify_id: 'gid://shopify/Customer/881122',
        amount: 500,
        type: 'EARN',
        reason: 'Masterpiece Acquisition Points',
      },
      'SYSTEM'
    );
    expect(tx.amount).toBe(500);

    const balanceAfter = await CreditsService.getBalance(shopId, 'gid://shopify/Customer/881122');
    expect(balanceAfter - balanceBefore).toBe(500);
  });

  it('Feature 6: Luxury Gift Presentation & Unboxing Flow', async () => {
    // 1. Create gift
    const gift = await GiftService.createGift(shopId, {
      serial: testSerial,
      purchaser_shopify_customer_id: 'gid://shopify/Customer/881122',
      recipient_email: 'recipient.e2e@example.com',
      recipient_name: 'Elena Rostova',
      gift_message: 'Congratulations on your milestone!',
    });
    expect(gift.claim_code).toMatch(/^GIFT-/);

    // 2. Recipient unboxing preview
    const preview = await GiftService.getGiftByClaimCode(shopId, gift.claim_code);
    expect(preview.piece.serial).toBe(testSerial);

    // 3. Recipient claims gift & activates primary ownership
    const claim = await GiftService.claimGift(shopId, {
      claim_code: gift.claim_code,
      recipient_shopify_customer_id: 'gid://shopify/Customer/992233',
      recipient_email: 'recipient.e2e@example.com',
      recipient_name: 'Elena Rostova',
    });
    expect(claim.status).toBe('CLAIMED');
    expect(claim.welcome_credits_awarded).toBe(250);
  });

  it('Feature 7: Ownership Transfer State Machine & Certificate Generation', async () => {
    // 1. Current owner initiates transfer
    const init = await TransferService.initiateTransfer(shopId, {
      serial: testSerial,
      sender_shopify_customer_id: 'gid://shopify/Customer/992233',
      recipient_email: 'second.owner@example.com',
    });
    expect(init.transfer_token).toMatch(/^TRF_/);

    // 2. Recipient reviews invitation
    const review = await TransferService.getTransferByToken(shopId, init.transfer_token);
    expect(review.piece.serial).toBe(testSerial);
    expect(review.status).toBe('PENDING');

    // 3. Recipient accepts transfer atomically
    const accepted = await TransferService.acceptTransfer(shopId, {
      transfer_token: init.transfer_token,
      recipient_shopify_customer_id: 'gid://shopify/Customer/773344',
      recipient_email: 'second.owner@example.com',
      recipient_name: 'Julien Moreau',
    });
    expect(accepted.status).toBe('COMPLETED');
    expect(accepted.certificate_number).toMatch(/^CERT-/);
  });

  it('Feature 8: VIP Early Access Drop Tier Evaluation', async () => {
    const access = await EarlyAccessService.evaluateCustomerAccess(
      shopId,
      'gid://shopify/Product/999111',
      'gid://shopify/Customer/773344'
    );
    expect(access).toBeDefined();
    expect(typeof access.has_access).toBe('boolean');
  });

  it('Feature 9: Atelier Care & Service Ticket Management', async () => {
    const serviceCase = await CareService.createServiceCase(
      shopId,
      {
        serial: testSerial,
        service_type: 'Leather Spa & Edge Restoration',
        technician_name: 'Master Artisan Jacques',
        internal_notes: 'Inspected under UV lamp. Stitching flawless.',
        customer_notes: 'Your piece has arrived safely at our Paris atelier.',
      },
      'admin_e2e'
    );
    expect(serviceCase.case_number).toMatch(/^SRV-/);
    expect(serviceCase.status).toBe('RECEIVED');
  });

  it('Feature 10: Lost & Stolen Registry Flagging', async () => {
    const theftReport = await LostStolenService.reportPiece(
      shopId,
      {
        serial: testSerial,
        report_type: 'STOLEN',
        incident_location: 'Paris, France',
        internal_notes: 'Reported stolen in transit.',
      },
      'admin_e2e'
    );
    expect(theftReport.status).toBe('CONFIRMED');

    // Public passport should now shield status as flagged
    const publicData = await PassportService.getPublicPassport(shopId, testSerial);
    expect(publicData.verification_badge).toBe('FLAGGED_FOR_REVIEW');
    expect(publicData.status).toBe('UNDER_VERIFICATION');
  });

  it('Feature 11: Transactional Branded Notifications', async () => {
    const notification = await NotificationService.send(shopId, {
      recipient_email: 'second.owner@example.com',
      type: 'CARE_REMINDER_DUE',
      subject: 'Annual Leather Spa Inspection Due',
      data: { serial: testSerial },
    });
    expect(notification.id).toBeDefined();
    expect(notification.status).toBe('SENT');
  });

  it('Feature 12: Shopify App Billing Plan Upgrades', async () => {
    const upgrade = await BillingService.changePlan(shopId, 'ENTERPRISE', 'admin_e2e');
    expect(upgrade.success).toBe(true);
    expect(upgrade.new_plan.name).toBe('ENTERPRISE');

    const status = await BillingService.getSubscriptionStatus(shopId);
    expect(status.current_plan.name).toBe('ENTERPRISE');
  });

  it('Feature 13: Streaming CSV Batch Importer', async () => {
    const batchRows = [
      {
        serial: `CSV-${Date.now()}-1`,
        product_title: 'Batch Imported Product 1',
        edition_number: '1',
        edition_total: '100',
        manufacturing_location: 'Paris Atelier',
        materials: 'Calfskin Leather',
      },
      {
        serial: `CSV-${Date.now()}-2`,
        product_title: 'Batch Imported Product 2',
        edition_number: '2',
        edition_total: '100',
        manufacturing_location: 'Geneva Manufacture',
        materials: 'Titanium & Rose Gold',
      },
    ];

    const result = await CSVEngine.importBatch(shopId, batchRows, 'admin_e2e');
    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('Feature 14: Vector QR Code Generation Engine', async () => {
    const svg = await QRGenerator.generateSVG({ serial: testSerial });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');

    const dataUrl = await QRGenerator.generateDataURL({ serial: testSerial });
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('Feature 15: Shopify Webhooks HMAC Verification Middleware', () => {
    const secret = 'test_webhook_secret_2026';
    const payload = JSON.stringify({ id: 123456, total_price: '450.00' });
    const hmac = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

    const middleware = verifyShopifyWebhook(secret);

    let nextCalled = false;
    let errorPassed: any = null;

    const mockReq = {
      headers: {
        'x-shopify-hmac-sha256': hmac,
        'x-shopify-shop-domain': 'test.myshopify.com',
      },
      rawBody: payload,
      body: JSON.parse(payload),
    } as any;

    const mockRes = {} as any;
    const mockNext = (err?: any) => {
      nextCalled = true;
      errorPassed = err;
    };

    middleware(mockReq, mockRes, mockNext);
    expect(nextCalled).toBe(true);
    expect(errorPassed).toBeUndefined();
  });

  it('Feature 16: Immutable Compliance Audit Logging', async () => {
    const log = await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: 'admin_e2e',
      action: 'PASSPORT_UPSERTED',
      resource_type: 'PASSPORT',
      resource_id: 'pass_e2e_verified',
      metadata: { serial: testSerial },
    });
    expect(log.id).toBeDefined();

    const logs = await AuditService.getLogs(shopId, { limit: 5 });
    expect(logs.length).toBeGreaterThan(0);
  });
});
