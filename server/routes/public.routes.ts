import { Router, Response, NextFunction } from 'express';
import { PassportService } from '../domains/passport/passport.service.js';
import { ProvenanceService } from '../domains/passport/provenance.service.js';
import { AuthenticationService } from '../domains/authentication/authentication.service.js';
import { TransferService } from '../domains/transfer/transfer.service.js';
import { GiftService } from '../domains/gift/gift.service.js';
import { VerificationAPIService } from '../domains/verification/verification-api.service.js';
import { ResaleService } from '../domains/resale/resale.service.js';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant.js';
import {
  verificationRateLimiter,
  statusCheckRateLimiter,
  provenanceRateLimiter,
} from '../middleware/rate-limiter.js';
import { piiFilterMiddleware } from '../security/pii-filter.service.js';
import { addSecurityHeaders } from '../security/tenant-isolation.middleware.js';

export const publicRouter = Router();

// Apply security middleware to all public routes
publicRouter.use(addSecurityHeaders);
publicRouter.use(tenantMiddleware);
publicRouter.use(piiFilterMiddleware);

/**
 * GET /api/public/passport/:serial
 * Resolve public passport metadata with strict privacy field shielding
 */
publicRouter.get('/passport/:serial', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const passportData = await PassportService.getPublicPassport(shopId, serial);
    res.json({ success: true, data: passportData });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/passport/:serial/authenticate
 * Verify physical piece authenticity (NFC / QR / Serial) and log scan telemetry
 */
publicRouter.post('/passport/:serial/authenticate', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const verification = await AuthenticationService.verifyPiece(shopId, {
      serial,
      method: req.body.method || 'NFC',
      nfc_uid: req.body.nfc_uid,
      nfc_read_counter: req.body.nfc_read_counter ? Number(req.body.nfc_read_counter) : undefined,
      ip_address: req.ip || (req.headers['x-forwarded-for'] as string),
      user_agent: req.headers['user-agent'] as string,
      country: req.body.country,
      city: req.body.city,
    });

    res.json({ success: true, data: verification });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ownership/transfers/:token
 * Review ownership transfer invitation
 */
publicRouter.get('/ownership/transfers/:token', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const token = req.params.token as string;
    const transfer = await TransferService.getTransferByToken(shopId, token);
    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ownership/transfers/:token/accept
 * Accept ownership transfer and generate digital certificate
 */
publicRouter.post('/ownership/transfers/:token/accept', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const token = req.params.token as string;
    const result = await TransferService.acceptTransfer(shopId, {
      transfer_token: token,
      recipient_shopify_customer_id: req.body.recipient_shopify_customer_id || `cust_${Date.now()}`,
      recipient_email: req.body.recipient_email,
      recipient_name: req.body.recipient_name,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/gifts/:code
 * Resolve luxury gift card preview for unboxing experience
 */
publicRouter.get('/gifts/:code', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const code = req.params.code as string;
    const gift = await GiftService.getGiftByClaimCode(shopId, code);
    res.json({ success: true, data: gift });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/gifts/:code/claim
 * Recipient claims gift and activates primary ownership
 */
publicRouter.post('/gifts/:code/claim', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const code = req.params.code as string;
    const result = await GiftService.claimGift(shopId, {
      claim_code: code,
      recipient_shopify_customer_id: req.body.recipient_shopify_customer_id || `cust_${Date.now()}`,
      recipient_email: req.body.recipient_email,
      recipient_name: req.body.recipient_name,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/verify/:serial
 * Third-party verification endpoint (rate-limited)
 */
publicRouter.get('/verify/:serial', verificationRateLimiter, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await VerificationAPIService.verifyBySerial(shopId, req.params.serial as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/verify/nfc/:nfcUid
 * Third-party verification by NFC UID
 */
publicRouter.get('/verify/nfc/:nfcUid', verificationRateLimiter, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await VerificationAPIService.verifyByNFC(shopId, req.params.nfcUid as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/status/:serial
 * Quick status check (minimal data for high-volume lookups)
 */
publicRouter.get('/status/:serial', statusCheckRateLimiter, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await VerificationAPIService.quickStatus(shopId, req.params.serial as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/provenance/:serial
 * Public provenance timeline (sanitized, no private info)
 */
publicRouter.get('/provenance/:serial', provenanceRateLimiter, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const timeline = await ProvenanceService.getPublicTimeline(shopId, req.params.serial as string);
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/resale/listings
 * Browse the pre-owned marketplace (sanitized, no seller PII)
 */
publicRouter.get('/resale/listings', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const listings = await ResaleService.getListings(shopId);
    res.json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
});