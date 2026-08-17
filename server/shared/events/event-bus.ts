import { AuditService } from '../../domains/audit/audit.service.js';
import { NotificationService } from '../../domains/notifications/notification.service.js';

export type DomainEventType =
  | 'PASSPORT_REGISTERED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'WARRANTY_ACTIVATED'
  | 'AUTHENTICATION_FLAGGED'
  | 'SERVICE_COMPLETED'
  | 'CREDITS_AWARDED'
  | 'GIFT_CLAIMED';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  shop_id: string;
  actor_id?: string;
  actor_type?: 'MERCHANT_ADMIN' | 'CUSTOMER' | 'SYSTEM';
  payload: T;
  timestamp: Date;
}

export type DomainEventListener<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class DomainEventBus {
  private static listeners: Map<DomainEventType, Array<DomainEventListener>> = new Map();

  /**
   * Register an event listener for a domain event
   */
  static subscribe<T = any>(type: DomainEventType, listener: DomainEventListener<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  /**
   * Publish a domain event to all registered subscribers and trigger automatic audit/notification handlers
   */
  static async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.listeners.get(event.type) || [];

    // 1. Execute custom subscribers asynchronously
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[DomainEventBus] Error executing subscriber for ${event.type}:`, err);
      }
    }

    // 2. Default event-driven side-effects
    try {
      const payload = event.payload as Record<string, any>;
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
      } else if (event.type === 'GIFT_CLAIMED' && payload.recipient_email) {
        await NotificationService.send(event.shop_id, {
          recipient_email: payload.recipient_email,
          type: 'GIFT_CLAIMED',
          subject: 'Your Luxury Gift Has Been Added to Your Vault',
          data: payload,
        });
      }
    } catch (err) {
      console.error(`[DomainEventBus] Error executing default side-effects for ${event.type}:`, err);
    }
  }
}
