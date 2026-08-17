import crypto from 'node:crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { NFCTagService } from '../nfc/nfc-tag.service.js';
export class ResaleService {
    /**
     * A verified owner lists a piece in the Private Club pre-owned marketplace
     */
    static async listPiece(shop_id, dto) {
        const seller = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: dto.seller_shopify_customer_id,
                },
            },
        });
        if (!seller) {
            throw new NotFoundError('Customer', dto.seller_shopify_customer_id);
        }
        const piece = await prisma.physicalPiece.findUnique({
            where: {
                shop_id_serial: { shop_id, serial: dto.serial },
            },
            include: {
                ownerships: { where: { is_active: true } },
                lost_reports: { where: { status: 'CONFIRMED' } },
            },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', dto.serial);
        }
        if (piece.ownerships.length === 0 || piece.ownerships[0].customer_id !== seller.id) {
            throw new ForbiddenError('Only the active verified owner can list a piece for resale.');
        }
        if (piece.lost_reports.length > 0) {
            throw new ConflictError('Lost or stolen pieces cannot be listed for resale.');
        }
        if (dto.price <= 0) {
            throw new ConflictError('Listing price must be greater than zero.');
        }
        const existing = await prisma.resaleListing.findFirst({
            where: {
                shop_id,
                physical_piece_id: piece.id,
                status: 'LISTED',
            },
        });
        if (existing) {
            throw new ConflictError('This piece is already listed in the marketplace.');
        }
        const listing = await prisma.resaleListing.create({
            data: {
                shop_id,
                physical_piece_id: piece.id,
                seller_customer_id: seller.id,
                price: dto.price,
                currency: dto.currency || 'EUR',
                notes: dto.notes,
                status: 'LISTED',
            },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: seller.id,
            action: 'RESALE_LISTED',
            resource_type: 'RESALE_LISTING',
            resource_id: listing.id,
            metadata: { serial: piece.serial, price: dto.price },
        });
        return listing;
    }
    /**
     * Browse the marketplace (no seller PII exposed)
     */
    static async getListings(shop_id, status = 'LISTED') {
        const listings = await prisma.resaleListing.findMany({
            where: { shop_id, status },
            include: {
                physical_piece: {
                    include: {
                        product_ref: true,
                        passport: { select: { hero_image_url: true, title: true } },
                        ownerships: {
                            where: { is_active: true },
                            select: { source: true },
                        },
                    },
                },
            },
            orderBy: { listed_at: 'desc' },
            take: 100,
        });
        return listings.map((l) => ({
            id: l.id,
            price: l.price,
            currency: l.currency,
            status: l.status,
            notes: l.notes,
            listed_at: l.listed_at,
            piece: {
                serial: l.physical_piece.serial,
                edition_number: l.physical_piece.edition_number,
                edition_total: l.physical_piece.edition_total,
                title: l.physical_piece.passport?.title || l.physical_piece.product_ref.title,
                image_url: l.physical_piece.passport?.hero_image_url || l.physical_piece.product_ref.image_url,
                ownership_source: l.physical_piece.ownerships[0]?.source,
            },
        }));
    }
    /**
     * Seller removes their listing
     */
    static async cancelListing(shop_id, listing_id, seller_shopify_customer_id) {
        const listing = await prisma.resaleListing.findFirst({
            where: { id: listing_id, shop_id },
            include: { seller: true },
        });
        if (!listing) {
            throw new NotFoundError('Resale listing');
        }
        if (listing.seller.shopify_customer_id !== seller_shopify_customer_id) {
            throw new ForbiddenError('Only the seller can cancel this listing.');
        }
        if (listing.status !== 'LISTED') {
            throw new ConflictError(`Listing cannot be cancelled from status ${listing.status}.`);
        }
        const updated = await prisma.resaleListing.update({
            where: { id: listing.id },
            data: { status: 'CANCELLED', cancelled_at: new Date() },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: listing.seller_customer_id,
            action: 'RESALE_CANCELLED',
            resource_type: 'RESALE_LISTING',
            resource_id: listing.id,
            metadata: { serial: listing.physical_piece_id },
        });
        return updated;
    }
    /**
     * A member buys the listing: ownership moves atomically, a certificate is
     * issued, the listing is closed and both parties are notified.
     */
    static async buyListing(shop_id, dto) {
        const listing = await prisma.resaleListing.findFirst({
            where: { id: dto.listing_id, shop_id },
            include: {
                seller: true,
                physical_piece: {
                    include: {
                        product_ref: true,
                        ownerships: { where: { is_active: true }, include: { customer: true } },
                    },
                },
            },
        });
        if (!listing) {
            throw new NotFoundError('Resale listing');
        }
        if (listing.status !== 'LISTED') {
            throw new ConflictError(`Listing is no longer available (${listing.status}).`);
        }
        if (listing.seller.shopify_customer_id === dto.buyer_shopify_customer_id) {
            throw new ConflictError('You cannot buy your own listing.');
        }
        const buyer = await prisma.customer.upsert({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: dto.buyer_shopify_customer_id,
                },
            },
            update: {
                email: dto.buyer_email,
                first_name: dto.buyer_name?.split(' ')[0] || undefined,
                last_name: dto.buyer_name?.split(' ').slice(1).join(' ') || undefined,
            },
            create: {
                shop_id,
                shopify_customer_id: dto.buyer_shopify_customer_id,
                email: dto.buyer_email,
                first_name: dto.buyer_name?.split(' ')[0] || undefined,
                last_name: dto.buyer_name?.split(' ').slice(1).join(' ') || undefined,
            },
        });
        const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const certHash = crypto
            .createHash('sha256')
            .update(`${listing.physical_piece_id}:${buyer.id}:${Date.now()}`)
            .digest('hex');
        const result = await prisma.$transaction(async (tx) => {
            await tx.ownership.updateMany({
                where: { physical_piece_id: listing.physical_piece_id, is_active: true },
                data: { is_active: false, ended_at: new Date() },
            });
            const newOwnership = await tx.ownership.create({
                data: {
                    shop_id,
                    physical_piece_id: listing.physical_piece_id,
                    customer_id: buyer.id,
                    is_active: true,
                    source: 'RESALE',
                },
            });
            // Backing transfer record (status COMPLETED) so certificates stay immutable
            const transfer = await tx.ownershipTransfer.create({
                data: {
                    shop_id,
                    physical_piece_id: listing.physical_piece_id,
                    sender_customer_id: listing.seller_customer_id,
                    recipient_email: buyer.email,
                    recipient_name: dto.buyer_name,
                    recipient_customer_id: buyer.id,
                    transfer_token: `RSL_${crypto.randomBytes(24).toString('hex')}`,
                    status: 'COMPLETED',
                    expires_at: new Date(),
                    accepted_at: new Date(),
                    security_hash: certHash,
                },
            });
            await tx.physicalPiece.update({
                where: { id: listing.physical_piece_id },
                data: { status: 'TRANSFERRED' },
            });
            const cert = await tx.transferCertificate.create({
                data: {
                    shop_id,
                    transfer_id: transfer.id,
                    physical_piece_id: listing.physical_piece_id,
                    certificate_number: certNumber,
                    verification_hash: certHash,
                    digital_signature: `SIG_ECC_${crypto.randomBytes(32).toString('hex')}`,
                    metadata_json: JSON.stringify({
                        product_title: listing.physical_piece.product_ref.title,
                        serial: listing.physical_piece.serial,
                        issued_to: buyer.email,
                        source: 'RESALE',
                        listing_id: listing.id,
                    }),
                },
            });
            const closed = await tx.resaleListing.update({
                where: { id: listing.id },
                data: {
                    status: 'SOLD',
                    buyer_customer_id: buyer.id,
                    transfer_id: transfer.id,
                    sold_at: new Date(),
                },
            });
            return { newOwnership, transfer, cert, closed };
        });
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: buyer.id,
            action: 'RESALE_COMPLETED',
            resource_type: 'RESALE_LISTING',
            resource_id: listing.id,
            metadata: {
                serial: listing.physical_piece.serial,
                certificate_number: result.cert.certificate_number,
                price: listing.price,
            },
        });
        // Best-effort NFC owner write-back
        try {
            await NFCTagService.writeOwnerMetadata(shop_id, listing.physical_piece_id, {
                serial: listing.physical_piece.serial,
                new_owner_customer_id: buyer.id,
                new_owner_shopify_customer_id: buyer.shopify_customer_id,
                new_owner_name: dto.buyer_name,
                previous_owner_shopify_customer_id: listing.seller.shopify_customer_id,
                transfer_count: 1,
                written_at: new Date().toISOString(),
            });
        }
        catch (writeErr) {
            // Tag write-back is auxiliary
        }
        // Notify both parties (best-effort)
        try {
            await NotificationService.send(shop_id, {
                recipient_email: listing.seller.email,
                type: 'RESALE_SOLD',
                subject: `Your piece ${listing.physical_piece.serial} was sold`,
                data: {
                    serial: listing.physical_piece.serial,
                    product_title: listing.physical_piece.product_ref.title,
                    certificate_number: result.cert.certificate_number,
                    price: listing.price,
                },
            });
            await NotificationService.send(shop_id, {
                recipient_email: buyer.email,
                type: 'RESALE_SOLD',
                subject: `You now own ${listing.physical_piece.serial}`,
                data: {
                    serial: listing.physical_piece.serial,
                    product_title: listing.physical_piece.product_ref.title,
                    certificate_number: result.cert.certificate_number,
                },
            });
        }
        catch (notifyErr) {
            // Notification delivery must not break the sale
        }
        return {
            status: 'SOLD',
            certificate_number: result.cert.certificate_number,
            verification_hash: result.cert.verification_hash,
            serial: listing.physical_piece.serial,
        };
    }
    /**
     * Admin governance: remove a listing (e.g. suspected counterfeit, policy breach)
     */
    static async adminCancelListing(shop_id, listing_id, actorId) {
        const listing = await prisma.resaleListing.findFirst({
            where: { id: listing_id, shop_id },
        });
        if (!listing) {
            throw new NotFoundError('Resale listing');
        }
        if (listing.status !== 'LISTED') {
            throw new ConflictError(`Listing cannot be cancelled from status ${listing.status}.`);
        }
        const updated = await prisma.resaleListing.update({
            where: { id: listing.id },
            data: { status: 'CANCELLED', cancelled_at: new Date() },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'RESALE_CANCELLED_BY_ADMIN',
            resource_type: 'RESALE_LISTING',
            resource_id: listing.id,
            metadata: { reason: 'admin_action' },
        });
        return updated;
    }
    /**
     * Admin oversight: all marketplace activity
     */
    static async listAllForAdmin(shop_id) {
        return prisma.resaleListing.findMany({
            where: { shop_id },
            include: {
                physical_piece: { include: { product_ref: true } },
                seller: { select: { shopify_customer_id: true, email: true } },
                buyer: { select: { shopify_customer_id: true, email: true } },
            },
            orderBy: { listed_at: 'desc' },
            take: 100,
        });
    }
}
