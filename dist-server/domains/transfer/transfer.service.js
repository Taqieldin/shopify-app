import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/index.js';
import { TransferStateMachine } from './transfer.state-machine.js';
import { AuditService } from '../audit/audit.service.js';
import { NFCTagService } from '../nfc/nfc-tag.service.js';
export class TransferService {
    /**
     * Current owner initiates an ownership transfer, generating a secure single-use token
     */
    static async initiateTransfer(shop_id, dto) {
        const piece = await prisma.physicalPiece.findUnique({
            where: {
                shop_id_serial: { shop_id, serial: dto.serial },
            },
            include: {
                ownerships: {
                    where: { is_active: true },
                    include: { customer: true },
                },
                lost_reports: {
                    where: { status: 'CONFIRMED' },
                },
            },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', dto.serial);
        }
        if (piece.lost_reports.length > 0) {
            throw new ConflictError('Cannot transfer piece: Item is reported lost or stolen.');
        }
        const activeOwnership = piece.ownerships[0];
        if (!activeOwnership || activeOwnership.customer.shopify_customer_id !== dto.sender_shopify_customer_id) {
            throw new ForbiddenError('Only the active verified owner can initiate an ownership transfer.');
        }
        // Check for existing pending transfers on this piece
        const existingPending = await prisma.ownershipTransfer.findFirst({
            where: {
                shop_id,
                physical_piece_id: piece.id,
                status: 'PENDING',
            },
        });
        if (existingPending) {
            if (new Date() < new Date(existingPending.expires_at)) {
                throw new ConflictError('An active ownership transfer invitation is already pending for this piece.');
            }
            else {
                // Mark previous expired transfer
                await prisma.ownershipTransfer.update({
                    where: { id: existingPending.id },
                    data: { status: 'EXPIRED' },
                });
            }
        }
        const transfer_token = `TRF_${crypto.randomBytes(24).toString('hex')}`;
        const expiresInHours = dto.expires_in_hours || 72;
        const expires_at = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
        const transfer = await prisma.ownershipTransfer.create({
            data: {
                shop_id,
                physical_piece_id: piece.id,
                sender_customer_id: activeOwnership.customer.id,
                recipient_email: dto.recipient_email.toLowerCase(),
                recipient_name: dto.recipient_name,
                transfer_token,
                status: 'PENDING',
                expires_at,
            },
            include: {
                physical_piece: {
                    include: { product_ref: true },
                },
            },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: activeOwnership.customer.id,
            action: 'OWNERSHIP_TRANSFER_INITIATED',
            resource_type: 'OWNERSHIP_TRANSFER',
            resource_id: transfer.id,
            metadata: { serial: piece.serial, recipient_email: dto.recipient_email },
        });
        return {
            transfer_id: transfer.id,
            transfer_token: transfer.transfer_token,
            expires_at: transfer.expires_at,
            recipient_email: transfer.recipient_email,
        };
    }
    /**
     * Recipient reviews transfer invitation details
     */
    static async getTransferByToken(shop_id, transfer_token) {
        const transfer = await prisma.ownershipTransfer.findUnique({
            where: { transfer_token },
            include: {
                physical_piece: {
                    include: {
                        product_ref: true,
                        passport: true,
                    },
                },
                certificate: true,
            },
        });
        if (!transfer || transfer.shop_id !== shop_id) {
            throw new NotFoundError('Transfer invitation');
        }
        if (TransferStateMachine.isExpired(transfer)) {
            if (transfer.status === 'PENDING') {
                await prisma.ownershipTransfer.update({
                    where: { id: transfer.id },
                    data: { status: 'EXPIRED' },
                });
                transfer.status = 'EXPIRED';
            }
        }
        return {
            id: transfer.id,
            status: transfer.status,
            expires_at: transfer.expires_at,
            recipient_email: transfer.recipient_email,
            recipient_name: transfer.recipient_name,
            piece: {
                serial: transfer.physical_piece.serial,
                edition: transfer.physical_piece.edition_number && transfer.physical_piece.edition_total
                    ? `${transfer.physical_piece.edition_number} / ${transfer.physical_piece.edition_total}`
                    : null,
                title: transfer.physical_piece.product_ref.title,
                image_url: transfer.physical_piece.passport?.hero_image_url || transfer.physical_piece.product_ref.image_url,
            },
            certificate: transfer.certificate,
        };
    }
    /**
     * Recipient accepts ownership transfer atomically and receives an immutable Ownership Transfer Certificate
     */
    static async acceptTransfer(shop_id, dto) {
        const transfer = await prisma.ownershipTransfer.findUnique({
            where: { transfer_token: dto.transfer_token },
            include: {
                physical_piece: {
                    include: {
                        product_ref: true,
                        ownerships: { where: { is_active: true } },
                    },
                },
            },
        });
        if (!transfer || transfer.shop_id !== shop_id) {
            throw new NotFoundError('Transfer invitation');
        }
        if (TransferStateMachine.isExpired(transfer)) {
            await prisma.ownershipTransfer.update({
                where: { id: transfer.id },
                data: { status: 'EXPIRED' },
            });
            throw new ConflictError('This ownership transfer invitation has expired.');
        }
        TransferStateMachine.validateTransition(transfer.status, 'ACCEPTED');
        // Upsert recipient customer
        const recipient = await prisma.customer.upsert({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: dto.recipient_shopify_customer_id,
                },
            },
            update: {
                email: dto.recipient_email,
                first_name: dto.recipient_name?.split(' ')[0] || undefined,
                last_name: dto.recipient_name?.split(' ').slice(1).join(' ') || undefined,
            },
            create: {
                shop_id,
                shopify_customer_id: dto.recipient_shopify_customer_id,
                email: dto.recipient_email,
                first_name: dto.recipient_name?.split(' ')[0] || undefined,
                last_name: dto.recipient_name?.split(' ').slice(1).join(' ') || undefined,
            },
        });
        const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const certHash = crypto
            .createHash('sha256')
            .update(`${transfer.physical_piece_id}:${recipient.id}:${Date.now()}`)
            .digest('hex');
        // Execute atomic transaction for closing old ownership, opening new ownership & issuing certificate
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deactivate old ownership
            await tx.ownership.updateMany({
                where: {
                    physical_piece_id: transfer.physical_piece_id,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    ended_at: new Date(),
                },
            });
            // 2. Create new active ownership
            const newOwnership = await tx.ownership.create({
                data: {
                    shop_id,
                    physical_piece_id: transfer.physical_piece_id,
                    customer_id: recipient.id,
                    is_active: true,
                    source: 'TRANSFER_ACCEPTANCE',
                    transfer_id: transfer.id,
                },
            });
            // 3. Mark transfer COMPLETED
            await tx.ownershipTransfer.update({
                where: { id: transfer.id },
                data: {
                    status: 'COMPLETED',
                    recipient_customer_id: recipient.id,
                    accepted_at: new Date(),
                },
            });
            // 4. Update physical piece status
            await tx.physicalPiece.update({
                where: { id: transfer.physical_piece_id },
                data: { status: 'TRANSFERRED' },
            });
            // 5. Generate Transfer Certificate
            const cert = await tx.transferCertificate.create({
                data: {
                    shop_id,
                    transfer_id: transfer.id,
                    physical_piece_id: transfer.physical_piece_id,
                    certificate_number: certNumber,
                    verification_hash: certHash,
                    digital_signature: `SIG_ECC_${crypto.randomBytes(32).toString('hex')}`,
                    metadata_json: JSON.stringify({
                        product_title: transfer.physical_piece.product_ref.title,
                        serial: transfer.physical_piece.serial,
                        issued_to: recipient.email,
                    }),
                },
            });
            return { newOwnership, cert };
        });
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: recipient.id,
            action: 'OWNERSHIP_TRANSFER_COMPLETED',
            resource_type: 'OWNERSHIP_TRANSFER',
            resource_id: transfer.id,
            metadata: {
                serial: transfer.physical_piece.serial,
                certificate_number: result.cert.certificate_number,
            },
        });
        // Best-effort NFC owner write-back: reflect the new owner on the tag payload.
        // Never fails the transfer if the tag write cannot be persisted.
        try {
            const sender = await prisma.customer.findUnique({
                where: { id: transfer.sender_customer_id },
            });
            await NFCTagService.writeOwnerMetadata(shop_id, transfer.physical_piece_id, {
                serial: transfer.physical_piece.serial,
                new_owner_customer_id: recipient.id,
                new_owner_shopify_customer_id: recipient.shopify_customer_id,
                new_owner_name: dto.recipient_name,
                previous_owner_shopify_customer_id: sender?.shopify_customer_id,
                transfer_count: 1,
                written_at: new Date().toISOString(),
            });
        }
        catch (writeErr) {
            // Tag write-back is auxiliary — the ownership transfer itself is authoritative.
        }
        return {
            status: 'COMPLETED',
            certificate_number: result.cert.certificate_number,
            verification_hash: result.cert.verification_hash,
            serial: transfer.physical_piece.serial,
        };
    }
    /**
     * Cancel transfer by sender
     */
    static async cancelTransfer(shop_id, transfer_token, sender_shopify_customer_id) {
        const transfer = await prisma.ownershipTransfer.findUnique({
            where: { transfer_token },
            include: { sender: true },
        });
        if (!transfer || transfer.shop_id !== shop_id) {
            throw new NotFoundError('Transfer invitation');
        }
        if (transfer.sender.shopify_customer_id !== sender_shopify_customer_id) {
            throw new ForbiddenError('Only the sender can cancel this transfer.');
        }
        TransferStateMachine.validateTransition(transfer.status, 'CANCELLED');
        const updated = await prisma.ownershipTransfer.update({
            where: { id: transfer.id },
            data: {
                status: 'CANCELLED',
                cancelled_at: new Date(),
            },
        });
        return updated;
    }
}
