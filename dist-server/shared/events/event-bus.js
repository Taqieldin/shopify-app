import { AuditService } from '../../domains/audit/audit.service.js';
import { NotificationService } from '../../domains/notifications/notification.service.js';
export class DomainEventBus {
    static listeners = new Map();
    /**
     * Register an event listener for a domain event
     */
    static subscribe(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(listener);
    }
    /**
     * Publish a domain event to all registered subscribers and trigger automatic audit/notification handlers
     */
    static async publish(event) {
        const handlers = this.listeners.get(event.type) || [];
        // 1. Execute custom subscribers asynchronously
        for (const handler of handlers) {
            try {
                await handler(event);
            }
            catch (err) {
                console.error(`[DomainEventBus] Error executing subscriber for ${event.type}:`, err);
            }
        }
        // 2. Default event-driven side-effects
        try {
            const payload = event.payload;
            if (event.type === 'AUTHENTICATION_FLAGGED') {
                await AuditService.log({
                    shop_id: event.shop_id,
                    actor_type: 'SYSTEM',
                    actor_id: event.actor_id || 'RiskEngine',
                    action: 'SECURITY_ALERT_TRIGGERED',
                    resource_type: 'AUTHENTICATION_EVENT',
                    resource_id: payload.serial || 'UNKNOWN',
                    metadata: payload,
                });
            }
            else if (event.type === 'GIFT_CLAIMED' && payload.recipient_email) {
                await NotificationService.send(event.shop_id, {
                    recipient_email: payload.recipient_email,
                    type: 'GIFT_CLAIMED',
                    subject: 'Your Luxury Gift Has Been Added to Your Vault',
                    data: payload,
                });
            }
        }
        catch (err) {
            console.error(`[DomainEventBus] Error executing default side-effects for ${event.type}:`, err);
        }
    }
}
