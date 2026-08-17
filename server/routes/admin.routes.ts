import { Router, Response, NextFunction } from 'express';
import { AnalyticsService } from '../domains/analytics/analytics.service.js';
import { PassportService } from '../domains/passport/passport.service.js';
import { PhysicalPieceService } from '../domains/physical-piece/physical-piece.service.js';
import { CreditsService } from '../domains/credits/credits.service.js';
import { CareService } from '../domains/care/care.service.js';
import { LostStolenService } from '../domains/lost-stolen/lost-stolen.service.js';
import { ShopService } from '../domains/shop/shop.service.js';
import { AuditService } from '../domains/audit/audit.service.js';
import { BillingService } from '../domains/billing/billing.service.js';
import { NFCTagService } from '../domains/nfc/nfc-tag.service.js';
import { QRDownloadService } from '../domains/passport/qr-download.service.js';
import { ProvenanceService } from '../domains/passport/provenance.service.js';
import { PDFCertificateService } from '../infrastructure/certificate/pdf-certificate.service.js';
import { LabelGeneratorService } from '../infrastructure/label/label-generator.service.js';
import { CSVEngine } from '../infrastructure/csv/csv-engine.js';
import { prisma } from '../infrastructure/database/client.js';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant.js';
import { requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { ResaleService } from '../domains/resale/resale.service.js';
import { ClubEventService } from '../domains/club-events/club-events.service.js';
import { VerificationOptionsService } from '../domains/verification-options/verification-options.service.js';

export const adminRouter = Router();

adminRouter.use(tenantMiddleware);
adminRouter.use(requireRole('MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'));

/**
 * GET /api/admin/dashboard
 */
adminRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const metrics = await AnalyticsService.getDashboardMetrics(shopId);
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/passports
 */
adminRouter.get('/passports', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const passports = await PassportService.listPassports(shopId);
    res.json({ success: true, data: passports });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/passports
 */
adminRouter.post('/passports', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const passport = await PassportService.upsertPassport(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: passport });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/pieces
 */
adminRouter.get('/pieces', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const pieces = await PhysicalPieceService.listPieces(shopId, {
      status: req.query.status as string,
      search: req.query.search as string,
    });
    res.json({ success: true, data: pieces });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/pieces
 */
adminRouter.post('/pieces', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const piece = await PhysicalPieceService.createPiece(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: piece });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/services
 */
adminRouter.post('/services', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serviceCase = await CareService.createServiceCase(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: serviceCase });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/services
 */
adminRouter.get('/services', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serviceCases = await CareService.listServiceCases(shopId);
    res.json({ success: true, data: serviceCases });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/credits
 */
adminRouter.post('/credits', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const entry = await CreditsService.postTransaction(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/theft
 */
adminRouter.post('/theft', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const report = await LostStolenService.reportPiece(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/settings
 */
adminRouter.get('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const tenant = await ShopService.getTenant(shopId);
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/settings
 */
adminRouter.patch('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const updated = await ShopService.updateSettings(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/audit
 */
adminRouter.get('/audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const logs = await AuditService.getLogs(shopId);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/csv-import
 */
adminRouter.post('/csv-import', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await CSVEngine.importBatch(shopId, req.body.rows || [], req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/billing
 */
adminRouter.get('/billing', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const billingStatus = await BillingService.getSubscriptionStatus(shopId);
    res.json({ success: true, data: billingStatus });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/billing/upgrade
 */
adminRouter.post('/billing/upgrade', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await BillingService.changePlan(shopId, req.body.plan, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// NFC TAG MANAGEMENT
// ===============================================================

/**
 * GET /api/admin/nfc
 * List all pieces with NFC tags
 */
adminRouter.get('/nfc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const pieces = await NFCTagService.listTagged(shopId);
    res.json({ success: true, data: pieces });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/nfc/register
 * Register NFC tag to a physical piece
 */
adminRouter.post('/nfc/register', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await NFCTagService.registerTag(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/nfc/:pieceId
 * Update NFC tag details
 */
adminRouter.patch('/nfc/:pieceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await NFCTagService.updateTag(shopId, req.params.pieceId as string, req.body, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/nfc/:pieceId
 * Unregister NFC tag from a physical piece
 */
adminRouter.delete('/nfc/:pieceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await NFCTagService.unregisterTag(shopId, req.params.pieceId as string, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/nfc/bulk
 * Bulk register NFC tags
 */
adminRouter.post('/nfc/bulk', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await NFCTagService.bulkRegister(shopId, req.body.records || [], req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// QR CODE DOWNLOADS
// ===============================================================

/**
 * GET /api/admin/qr/:serial/png
 * Download QR code as PNG
 */
adminRouter.get('/qr/:serial/png', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const png = await QRDownloadService.generatePNG(shopId, serial);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${serial}.png"`);
    res.send(png);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/qr/:serial/svg
 * Download QR code as SVG
 */
adminRouter.get('/qr/:serial/svg', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const svg = await QRDownloadService.generateSVG(shopId, serial);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${serial}.svg"`);
    res.send(svg);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/qr/:serial
 * Get QR code as base64 data URL
 */
adminRouter.get('/qr/:serial', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const dataUrl = await QRDownloadService.generateDataURL(shopId, serial);
    res.json({ success: true, data: { qr: dataUrl, serial } });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// PHYSICAL TAG LABELS
// ===============================================================

/**
 * GET /api/admin/labels/:serial
 * Generate printable label HTML
 */
adminRouter.get('/labels/:serial', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const data = await LabelGeneratorService.getLabelData(shopId, serial);
    const html = LabelGeneratorService.generateLabelHTML(data);
    res.json({ success: true, data: { html, serial } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/labels/:serial/download
 * Download label as HTML for printing
 */
adminRouter.get('/labels/:serial/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const data = await LabelGeneratorService.getLabelData(shopId, serial);
    const html = LabelGeneratorService.generateLabelHTML(data);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="label-${serial}.html"`);
    res.send(html);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/labels/batch
 * Generate batch labels for multiple serials
 */
adminRouter.get('/labels/batch', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serials = (req.query.serials as string)?.split(',').filter(Boolean) || [];
    if (serials.length === 0) {
      return res.status(400).json({ success: false, error: 'No serials provided' });
    }
    const html = await LabelGeneratorService.generateBatchLabels(shopId, serials);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="batch-labels.html"');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// CERTIFICATES
// ===============================================================

/**
 * GET /api/admin/certificates/:serial
 * Get certificate data (HTML preview)
 */
adminRouter.get('/certificates/:serial', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const certData = await PDFCertificateService.getCertificateData(shopId, serial);
    // Generate verification hash
    const verificationHash = PDFCertificateService.generateVerificationHash(certData);
    res.json({ success: true, data: { ...certData, verification_hash: verificationHash } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/certificates
 * List certificates (pieces with passports)
 */
adminRouter.get('/certificates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const certificates = await PDFCertificateService.listForAdmin(shopId, { limit, offset });
    res.json({ success: true, data: certificates });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// PROVENANCE TIMELINE
// ===============================================================

/**
 * GET /api/admin/provenance/:serial
 * Get full provenance timeline (includes private owner info)
 */
adminRouter.get('/provenance/:serial', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const timeline = await ProvenanceService.getPrivateTimeline(shopId, serial);
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/provenance/:serial/public
 * Get public provenance timeline (sanitized)
 */
adminRouter.get('/provenance/:serial/public', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    const timeline = await ProvenanceService.getPublicTimeline(shopId, serial);
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// PDF CERTIFICATES (Phase 2)
// ===============================================================

/**
 * GET /api/admin/certificates/:serial/pdf
 * Download PDF certificate
 */
adminRouter.get('/certificates/:serial/pdf', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const serial = req.params.serial as string;
    
    // Dynamic import to avoid loading if not installed
    const { PDFGeneratorService } = await import('../infrastructure/certificate/pdf-generator.service.js');
    const pdf = await PDFGeneratorService.generatePDFFromSerial(shopId, serial);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${serial}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    if (err.message?.includes('not installed')) {
      res.status(501).json({ 
        success: false, 
        error: 'PDF generation not available. Install puppeteer or pdfkit.' 
      });
    } else {
      next(err);
    }
  }
});

// ===============================================================
// API KEY MANAGEMENT (Phase 2)
// ===============================================================

/**
 * GET /api/admin/api-keys
 * List all API keys
 */
adminRouter.get('/api-keys', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { APIKeyService } = await import('../domains/api-key/api-key.service.js');
    const keys = await APIKeyService.listAPIKeys(shopId);
    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/api-keys
 * Create new API key
 */
adminRouter.post('/api-keys', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { APIKeyService } = await import('../domains/api-key/api-key.service.js');
    const result = await APIKeyService.createAPIKey(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/api-keys/:keyId
 * Update API key
 */
adminRouter.patch('/api-keys/:keyId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { APIKeyService } = await import('../domains/api-key/api-key.service.js');
    const updated = await APIKeyService.updateAPIKey(
      shopId,
      req.params.keyId as string,
      req.body,
      req.actorId || 'admin'
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/api-keys/:keyId
 * Revoke API key
 */
adminRouter.delete('/api-keys/:keyId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { APIKeyService } = await import('../domains/api-key/api-key.service.js');
    await APIKeyService.revokeAPIKey(shopId, req.params.keyId as string, req.actorId || 'admin');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/api-keys/:keyId/stats
 * Get API key usage statistics
 */
adminRouter.get('/api-keys/:keyId/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { APIKeyService } = await import('../domains/api-key/api-key.service.js');
    const stats = await APIKeyService.getKeyStats(shopId, req.params.keyId as string);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// WEBHOOK MANAGEMENT (Phase 2)
// ===============================================================

/**
 * GET /api/admin/webhooks
 * List all webhooks
 */
adminRouter.get('/webhooks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { WebhookEventService } = await import('../domains/webhook/webhook-event.service.js');
    const webhooks = await WebhookEventService.listWebhooks(shopId);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/webhooks
 * Create new webhook
 */
adminRouter.post('/webhooks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { WebhookEventService } = await import('../domains/webhook/webhook-event.service.js');
    const webhook = await WebhookEventService.createWebhook(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/webhooks/:webhookId
 * Delete webhook
 */
adminRouter.delete('/webhooks/:webhookId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { WebhookEventService } = await import('../domains/webhook/webhook-event.service.js');
    await WebhookEventService.deleteWebhook(shopId, req.params.webhookId as string, req.actorId || 'admin');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/webhooks/:webhookId/deliveries
 * Get webhook delivery history
 */
adminRouter.get('/webhooks/:webhookId/deliveries', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const { WebhookEventService } = await import('../domains/webhook/webhook-event.service.js');
    const deliveries = await WebhookEventService.getDeliveryHistory(
      shopId,
      req.params.webhookId as string,
      limit
    );
    res.json({ success: true, data: deliveries });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// SECURITY MONITORING (Phase 1)
// ===============================================================

/**
 * GET /api/admin/security/alerts
 * List security alerts and suspicious activities
 */
adminRouter.get('/security/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { SecurityMonitorService } = await import('../security/security-monitor.service.js');
    const level = req.query.level as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const alerts = await SecurityMonitorService.getShopAlerts(shopId, { level, limit });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/security/alerts/:eventId/acknowledge
 * Acknowledge and mark security alert as reviewed
 */
adminRouter.post('/security/alerts/:eventId/acknowledge', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { SecurityMonitorService } = await import('../security/security-monitor.service.js');
    await SecurityMonitorService.acknowledgeAlert(
      shopId,
      req.params.eventId as string,
      req.actorId || 'admin',
      req.body.notes
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/security/block-nfc
 * Block a suspicious NFC UID from authentication
 */
adminRouter.post('/security/block-nfc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { SecurityMonitorService } = await import('../security/security-monitor.service.js');
    const { nfc_uid, reason } = req.body;
    
    if (!nfc_uid || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'nfc_uid and reason are required' 
      });
    }
    
    await SecurityMonitorService.blockNFCUID(
      shopId,
      nfc_uid,
      reason,
      req.actorId || 'admin'
    );
    res.json({ success: true, message: 'NFC UID blocked successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/security/scan-patterns/:serial
 * Get scan pattern analysis for a specific serial
 */
adminRouter.get('/security/scan-patterns/:serial', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const { SecurityMonitorService } = await import('../security/security-monitor.service.js');
    const pattern = await SecurityMonitorService.getScanPattern(shopId, req.params.serial as string);
    
    if (!pattern) {
      return res.status(404).json({ 
        success: false, 
        error: 'No scan data found for this serial' 
      });
    }
    
    res.json({ success: true, data: pattern });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/security/blocked-nfc
 * List all blocked NFC UIDs
 */
adminRouter.get('/security/blocked-nfc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const blocklist = await prisma.nFCBlocklist.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { blocked_at: 'desc' },
    });
    res.json({ success: true, data: blocklist });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/security/blocked-nfc/:nfcUid
 * Unblock an NFC UID
 */
adminRouter.delete('/security/blocked-nfc/:nfcUid', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    await prisma.nFCBlocklist.updateMany({
      where: {
        shop_id: shopId,
        nfc_uid: req.params.nfcUid as string,
      },
      data: {
        is_active: false,
        unblocked_at: new Date(),
        unblocked_by: req.actorId || 'admin',
      },
    });
    res.json({ success: true, message: 'NFC UID unblocked successfully' });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// VERIFICATION METHOD OPTIONS (PER PRODUCT)
// ===============================================================

/**
 * GET /api/admin/verification-options
 * List products with their enabled verification methods
 */
adminRouter.get('/verification-options', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const data = await VerificationOptionsService.listProducts(shopId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/verification-options/:productId
 * Set the enabled verification methods for a product reference
 */
adminRouter.patch('/verification-options/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await VerificationOptionsService.setMethods(
      shopId,
      req.params.productId as string,
      req.body.methods || [],
      req.actorId || 'admin'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// PRE-OWNED RESALE MARKETPLACE (ADMIN OVERSIGHT)
// ===============================================================

/**
 * GET /api/admin/resale
 * Admin oversight of all marketplace listings
 */
adminRouter.get('/resale', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const listings = await ResaleService.listAllForAdmin(shopId);
    res.json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/resale/:listingId/cancel
 * Admin governance: remove a marketplace listing
 */
adminRouter.post('/resale/:listingId/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await ResaleService.adminCancelListing(shopId, req.params.listingId as string, req.actorId || 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// PRIVATE CLUB EVENTS
// ===============================================================

/**
 * GET /api/admin/events
 * List club events with check-in counts
 */
adminRouter.get('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const events = await ClubEventService.listEvents(shopId);
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/events
 * Create a club event
 */
adminRouter.post('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const event = await ClubEventService.createEvent(shopId, req.body, req.actorId || 'admin');
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/events/:eventId/status
 * Change event status (SCHEDULED/LIVE/ENDED/CANCELLED)
 */
adminRouter.patch('/events/:eventId/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const event = await ClubEventService.setStatus(
      shopId,
      req.params.eventId as string,
      req.body.status as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
      req.actorId || 'admin'
    );
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/events/:eventId/check-in
 * Manual (desk) check-in for a member
 */
adminRouter.post('/events/:eventId/check-in', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const result = await ClubEventService.checkIn(shopId, {
      event_id: req.params.eventId as string,
      customer_shopify_customer_id: req.body.customer_shopify_customer_id,
      customer_email: req.body.customer_email,
      customer_name: req.body.customer_name,
      method: 'MANUAL',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// NFC OWNER WRITE-BACK LOGS
// ===============================================================

/**
 * GET /api/admin/nfc/writes
 * List NFC owner write-back logs
 */
adminRouter.get('/nfc/writes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const logs = await NFCTagService.listWriteLogs(shopId, req.query.pieceId as string | undefined);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// OWNERSHIP TRANSFERS
// ===============================================================

/**
 * GET /api/admin/transfers
 * List ownership transfers for the shop
 */
adminRouter.get('/transfers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const transfers = await prisma.ownershipTransfer.findMany({
      where: { shop_id: shopId },
      include: {
        physical_piece: { select: { serial: true, product_ref: { select: { title: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// CREDIT TRANSACTIONS
// ===============================================================

/**
 * GET /api/admin/credits
 * List credit transactions for the shop
 */
adminRouter.get('/credits', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const entries = await prisma.creditsLedger.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// ===============================================================
// CUSTOMERS
// ===============================================================

/**
 * GET /api/admin/customers
 * List customers for the shop
 */
adminRouter.get('/customers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = req.tenant!.shop_id;
    const customers = await prisma.customer.findMany({
      where: { shop_id: shopId },
      include: {
        _count: { select: { ownerships: true, memberships: true, credits_entries: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});