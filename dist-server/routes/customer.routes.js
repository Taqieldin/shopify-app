import { Router } from 'express';
import { OwnershipService } from '../domains/ownership/ownership.service.js';
import { MembershipService } from '../domains/membership/membership.service.js';
import { CreditsService } from '../domains/credits/credits.service.js';
import { BenefitsService } from '../domains/benefits/benefits.service.js';
import { TransferService } from '../domains/transfer/transfer.service.js';
import { ResaleService } from '../domains/resale/resale.service.js';
import { ClubEventService } from '../domains/club-events/club-events.service.js';
import { tenantMiddleware } from '../middleware/tenant.js';
import { UnauthorizedError } from '../shared/errors/index.js';
import { prisma } from '../infrastructure/database/client.js';
export const customerRouter = Router();
customerRouter.use(tenantMiddleware);
// Middleware extracting authenticated customer
function extractCustomer(req, res, next) {
    const headerCustomerId = req.headers['x-shopify-customer-id'];
    if (!headerCustomerId) {
        return next(new UnauthorizedError('Missing customer identity. Authenticate before accessing customer routes.'));
    }
    req.customerId = headerCustomerId;
    next();
}
customerRouter.use(extractCustomer);
/**
 * GET /api/customer/me/collection
 * Fetch customer's owned pieces (Collector's Cabinet)
 */
customerRouter.get('/me/collection', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const collection = await OwnershipService.getCustomerCollection(shopId, customerId);
        res.json({ success: true, data: collection });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/customer/me/membership
 * Fetch customer membership level and tiers
 */
customerRouter.get('/me/membership', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const membership = await MembershipService.getCustomerMembership(shopId, customerId);
        res.json({ success: true, data: membership });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/customer/me/credits
 * Fetch customer credits statement and running balance
 */
customerRouter.get('/me/credits', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const statement = await CreditsService.getStatement(shopId, customerId);
        res.json({ success: true, data: statement });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/transfer
 * Initiate piece ownership transfer
 */
customerRouter.post('/me/transfer', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const transfer = await TransferService.initiateTransfer(shopId, {
            serial: req.body.serial,
            sender_shopify_customer_id: customerId,
            recipient_email: req.body.recipient_email,
            recipient_name: req.body.recipient_name,
        });
        res.json({ success: true, data: transfer });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/benefits/:id/claim
 * Claim private club perk
 */
customerRouter.post('/me/benefits/:id/claim', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const claim = await BenefitsService.redeemBenefit(shopId, req.params.id, customerId);
        res.json({ success: true, data: claim });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/customer/me/resale
 * My marketplace listings
 */
customerRouter.get('/me/resale', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const listings = await prisma.resaleListing.findMany({
            where: {
                shop_id: shopId,
                OR: [
                    { seller: { shopify_customer_id: customerId } },
                    { buyer: { shopify_customer_id: customerId } },
                ],
            },
            include: {
                physical_piece: { include: { product_ref: true, passport: { select: { hero_image_url: true, title: true } } } },
            },
            orderBy: { listed_at: 'desc' },
        });
        res.json({ success: true, data: listings });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/resale/list
 * List a verified piece in the pre-owned marketplace
 */
customerRouter.post('/me/resale/list', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const listing = await ResaleService.listPiece(shopId, {
            serial: req.body.serial,
            seller_shopify_customer_id: customerId,
            price: Number(req.body.price),
            currency: req.body.currency,
            notes: req.body.notes,
        });
        res.json({ success: true, data: listing });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/resale/:listingId/cancel
 * Seller removes a listing
 */
customerRouter.post('/me/resale/:listingId/cancel', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const result = await ResaleService.cancelListing(shopId, req.params.listingId, customerId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/resale/:listingId/buy
 * Buy a listed piece (auto ownership transfer + certificate)
 */
customerRouter.post('/me/resale/:listingId/buy', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const result = await ResaleService.buyListing(shopId, {
            listing_id: req.params.listingId,
            buyer_shopify_customer_id: customerId,
            buyer_email: req.body.buyer_email,
            buyer_name: req.body.buyer_name,
        });
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/customer/me/events
 * Upcoming club events with my check-in status
 */
customerRouter.get('/me/events', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const events = await ClubEventService.getMemberEvents(shopId, customerId);
        res.json({ success: true, data: events });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/customer/me/events/:eventId/check-in
 * Member NFC/QR/manual self check-in
 */
customerRouter.post('/me/events/:eventId/check-in', async (req, res, next) => {
    try {
        const shopId = req.tenant.shop_id;
        const customerId = req.customerId;
        const result = await ClubEventService.checkIn(shopId, {
            event_id: req.params.eventId,
            customer_shopify_customer_id: customerId,
            customer_email: req.body.customer_email,
            customer_name: req.body.customer_name,
            method: req.body.method,
            nfc_uid: req.body.nfc_uid,
        });
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
