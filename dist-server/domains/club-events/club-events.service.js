import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import { CreditsService } from '../credits/credits.service.js';
import { NotificationService } from '../notifications/notification.service.js';
export class ClubEventService {
    /**
     * Admin creates a Private Club event
     */
    static async createEvent(shop_id, dto, actorId) {
        const startsAt = new Date(dto.starts_at);
        const endsAt = new Date(dto.ends_at);
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
            throw new ConflictError('starts_at and ends_at must be valid dates.');
        }
        if (endsAt <= startsAt) {
            throw new ConflictError('ends_at must be after starts_at.');
        }
        const event = await prisma.clubEvent.create({
            data: {
                shop_id,
                name: dto.name,
                description: dto.description,
                location: dto.location,
                starts_at: startsAt,
                ends_at: endsAt,
                credits_award: dto.credits_award ?? 100,
                status: 'SCHEDULED',
                created_by: actorId,
            },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'CLUB_EVENT_CREATED',
            resource_type: 'CLUB_EVENT',
            resource_id: event.id,
            metadata: { name: dto.name, credits_award: event.credits_award },
        });
        return event;
    }
    /**
     * Admin lists events with check-in counts
     */
    static async listEvents(shop_id) {
        const events = await prisma.clubEvent.findMany({
            where: { shop_id },
            include: {
                _count: { select: { check_ins: true } },
            },
            orderBy: { starts_at: 'desc' },
            take: 100,
        });
        return events;
    }
    /**
     * Admin changes event status (SCHEDULED -> LIVE -> ENDED, or CANCELLED)
     */
    static async setStatus(shop_id, event_id, status, actorId) {
        const event = await prisma.clubEvent.findFirst({
            where: { id: event_id, shop_id },
        });
        if (!event) {
            throw new NotFoundError('Club event');
        }
        const updated = await prisma.clubEvent.update({
            where: { id: event.id },
            data: { status },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'CLUB_EVENT_STATUS_CHANGED',
            resource_type: 'CLUB_EVENT',
            resource_id: event.id,
            metadata: { from: event.status, to: status },
        });
        return updated;
    }
    /**
     * Member checks in at an event. NFC check-in requires the scanned tag to be
     * attached to a piece the member actively owns. Check-in awards club credits.
     */
    static async checkIn(shop_id, dto) {
        const event = await prisma.clubEvent.findFirst({
            where: { id: dto.event_id, shop_id },
        });
        if (!event) {
            throw new NotFoundError('Club event');
        }
        if (event.status === 'CANCELLED') {
            throw new ConflictError('This event has been cancelled.');
        }
        const now = new Date();
        if (event.status === 'SCHEDULED' && now < event.starts_at) {
            throw new ConflictError('Check-in has not opened for this event yet.');
        }
        if (event.status === 'ENDED' || (event.status === 'SCHEDULED' && now > event.ends_at)) {
            throw new ConflictError('This event has ended.');
        }
        const customer = await prisma.customer.upsert({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: dto.customer_shopify_customer_id,
                },
            },
            update: {
                email: dto.customer_email || undefined,
                first_name: dto.customer_name?.split(' ')[0] || undefined,
                last_name: dto.customer_name?.split(' ').slice(1).join(' ') || undefined,
            },
            create: {
                shop_id,
                shopify_customer_id: dto.customer_shopify_customer_id,
                email: dto.customer_email || `${dto.customer_shopify_customer_id}@unknown.invalid`,
                first_name: dto.customer_name?.split(' ')[0] || undefined,
                last_name: dto.customer_name?.split(' ').slice(1).join(' ') || undefined,
            },
        });
        const existing = await prisma.eventCheckIn.findUnique({
            where: {
                shop_id_event_id_customer_id: {
                    shop_id,
                    event_id: event.id,
                    customer_id: customer.id,
                },
            },
        });
        if (existing) {
            throw new ConflictError('You have already checked in to this event.');
        }
        const method = dto.method || 'MANUAL';
        // NFC check-in proof: the tag must belong to a piece the member owns
        if (method === 'NFC' && dto.nfc_uid) {
            const owned = await prisma.physicalPiece.findFirst({
                where: {
                    shop_id,
                    nfc_uid: dto.nfc_uid,
                    ownerships: {
                        some: { is_active: true, customer_id: customer.id },
                    },
                },
            });
            if (!owned) {
                throw new ConflictError('This NFC tag is not linked to a piece you own.');
            }
        }
        const checkIn = await prisma.$transaction(async (tx) => {
            const record = await tx.eventCheckIn.create({
                data: {
                    shop_id,
                    event_id: event.id,
                    customer_id: customer.id,
                    method,
                    nfc_uid: dto.nfc_uid,
                    credits_awarded: event.credits_award,
                },
            });
            return record;
        });
        // Award credits outside the transaction (append-only ledger + audit)
        const creditEntry = await CreditsService.postTransaction(shop_id, {
            customer_shopify_id: customer.shopify_customer_id,
            amount: event.credits_award,
            type: 'BONUS',
            reason: `Event Check-In: ${event.name}`,
            reference_type: 'EVENT',
            reference_id: event.id,
            created_by: 'SYSTEM',
        }, 'system');
        await AuditService.log({
            shop_id,
            actor_type: 'CUSTOMER',
            actor_id: customer.id,
            action: 'CLUB_EVENT_CHECKED_IN',
            resource_type: 'CLUB_EVENT',
            resource_id: event.id,
            metadata: { method, nfc_uid: dto.nfc_uid, credits_awarded: event.credits_award },
        });
        if (customer.email && !customer.email.endsWith('@unknown.invalid')) {
            try {
                await NotificationService.send(shop_id, {
                    recipient_email: customer.email,
                    type: 'EVENT_CHECKED_IN',
                    subject: `You're in — ${event.name}`,
                    data: {
                        event_name: event.name,
                        location: event.location,
                        credits_awarded: event.credits_award,
                        new_balance: creditEntry.new_balance,
                    },
                });
            }
            catch (notifyErr) {
                // Best-effort
            }
        }
        return {
            check_in_id: checkIn.id,
            event_id: event.id,
            event_name: event.name,
            credits_awarded: event.credits_award,
            new_balance: creditEntry.new_balance,
            checked_in_at: checkIn.checked_in_at,
        };
    }
    /**
     * Upcoming events for a member (with their check-in status)
     */
    static async getMemberEvents(shop_id, customer_shopify_customer_id) {
        const customer = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: customer_shopify_customer_id,
                },
            },
        });
        const events = await prisma.clubEvent.findMany({
            where: { shop_id, status: { not: 'CANCELLED' } },
            include: {
                _count: { select: { check_ins: true } },
                check_ins: customer ? { where: { customer_id: customer.id } } : undefined,
            },
            orderBy: { starts_at: 'asc' },
            take: 50,
        });
        return events.map((e) => ({
            id: e.id,
            name: e.name,
            description: e.description,
            location: e.location,
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            status: e.status,
            credits_award: e.credits_award,
            attendee_count: e._count.check_ins,
            checked_in: e.check_ins.length > 0,
        }));
    }
}
