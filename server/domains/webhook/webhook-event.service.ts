import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * Webhook Event Service
 * Notify external systems of authentication and lifecycle events
 */

export interface WebhookEndpoint {
  id: string;
  shop_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: Date | null;
  success_count: number;
  failure_count: number;
}

export interface CreateWebhookDTO {
  url: string;
  events: string[]; // e.g., ['authentication.verified', 'ownership.transferred']
  description?: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  shop_id: string;
  data: Record<string, unknown>;
}

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = {
  // Authentication events
  AUTHENTICATION_VERIFIED: 'authentication.verified',
  AUTHENTICATION_FAILED: 'authentication.failed',
  AUTHENTICATION_SUSPICIOUS: 'authentication.suspicious',
  
  // Ownership events
  OWNERSHIP_REGISTERED: 'ownership.registered',
  OWNERSHIP_TRANSFERRED: 'ownership.transferred',
  OWNERSHIP_TRANSFER_ACCEPTED: 'ownership.transfer.accepted',
  
  // Product events
  PRODUCT_LOST: 'product.lost',
  PRODUCT_STOLEN: 'product.stolen',
  PRODUCT_RECOVERED: 'product.recovered',
  
  // Service events
  SERVICE_REQUESTED: 'service.requested',
  SERVICE_COMPLETED: 'service.completed',
  
  // Passport events
  PASSPORT_CREATED: 'passport.created',
  PASSPORT_VIEWED: 'passport.viewed',
  PASSPORT_REVOKED: 'passport.revoked',
};

export class WebhookEventService {
  /**
   * Register a new webhook endpoint
   */
  static async createWebhook(
    shopId: string,
    dto: CreateWebhookDTO,
    actorId: string
  ): Promise<WebhookEndpoint> {
    // Generate webhook secret
    const secret = this.generateSecret();

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        shop_id: shopId,
        url: dto.url,
        secret,
        events_json: JSON.stringify(dto.events),
        description: dto.description,
        is_active: true,
      },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'WEBHOOK_CREATED',
      resource_type: 'WEBHOOK',
      resource_id: webhook.id,
      metadata: { url: dto.url, events: dto.events },
    });

    return this.formatWebhook(webhook);
  }

  /**
   * Send a webhook event to subscribed endpoints
   */
  static async sendWebhook(
    shopId: string,
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
      },
    });

    const subscribedWebhooks = webhooks.filter((w) => {
      const events = JSON.parse(w.events_json);
      return events.includes(event) || events.includes('*');
    });

    // Send webhooks in parallel
    await Promise.allSettled(
      subscribedWebhooks.map((webhook) => this.deliverWebhook(webhook, event, data))
    );
  }

  /**
   * Deliver webhook to endpoint
   */
  private static async deliverWebhook(
    webhook: any,
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      shop_id: webhook.shop_id,
      data,
    };

    const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success
        await prisma.webhookEndpoint.update({
          where: { id: webhook.id },
          data: {
            last_triggered_at: new Date(),
            success_count: { increment: 1 },
          },
        });

        // Log delivery
        await prisma.webhookDelivery.create({
          data: {
            webhook_id: webhook.id,
            event,
            payload_json: JSON.stringify(payload),
            status: 'SUCCESS',
            response_status: response.status,
            response_body: await response.text(),
          },
        });
      } else {
        // Failed
        await this.handleWebhookFailure(webhook.id, event, payload, response);
      }
    } catch (error: any) {
      // Network error
      await this.handleWebhookError(webhook.id, event, payload, error);
    }
  }

  /**
   * Handle webhook delivery failure
   */
  private static async handleWebhookFailure(
    webhookId: string,
    event: string,
    payload: WebhookPayload,
    response: Response
  ): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: { failure_count: { increment: 1 } },
    });

    await prisma.webhookDelivery.create({
      data: {
        webhook_id: webhookId,
        event,
        payload_json: JSON.stringify(payload),
        status: 'FAILED',
        response_status: response.status,
        response_body: await response.text(),
        error_message: `HTTP ${response.status}`,
      },
    });
  }

  /**
   * Handle webhook network error
   */
  private static async handleWebhookError(
    webhookId: string,
    event: string,
    payload: WebhookPayload,
    error: Error
  ): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: { failure_count: { increment: 1 } },
    });

    await prisma.webhookDelivery.create({
      data: {
        webhook_id: webhookId,
        event,
        payload_json: JSON.stringify(payload),
        status: 'ERROR',
        error_message: error.message,
      },
    });
  }

  /**
   * List webhooks for a shop
   */
  static async listWebhooks(shopId: string): Promise<WebhookEndpoint[]> {
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
    });

    return webhooks.map((w) => this.formatWebhook(w));
  }

  /**
   * Delete a webhook
   */
  static async deleteWebhook(shopId: string, webhookId: string, actorId: string): Promise<void> {
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: webhookId, shop_id: shopId },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook', webhookId);
    }

    await prisma.webhookEndpoint.delete({
      where: { id: webhookId },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'WEBHOOK_DELETED',
      resource_type: 'WEBHOOK',
      resource_id: webhookId,
      metadata: { url: webhook.url },
    });
  }

  /**
   * Get webhook delivery history
   */
  static async getDeliveryHistory(shopId: string, webhookId: string, limit = 50) {
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: webhookId, shop_id: shopId },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook', webhookId);
    }

    return prisma.webhookDelivery.findMany({
      where: { webhook_id: webhookId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Generate HMAC-SHA256 signature for webhook
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Generate webhook secret
   */
  private static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Format webhook for response
   */
  private static formatWebhook(webhook: any): WebhookEndpoint {
    return {
      id: webhook.id,
      shop_id: webhook.shop_id,
      url: webhook.url,
      secret: webhook.secret,
      events: JSON.parse(webhook.events_json),
      is_active: webhook.is_active,
      last_triggered_at: webhook.last_triggered_at,
      success_count: webhook.success_count,
      failure_count: webhook.failure_count,
    };
  }
}

/**
 * Helper function to trigger webhook events from other services
 */
export async function triggerWebhook(
  shopId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  // Fire and forget - don't block the main flow
  WebhookEventService.sendWebhook(shopId, event, data).catch((error) => {
    console.error(`Failed to send webhook ${event}:`, error);
  });
}
