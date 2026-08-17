import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface ProvenanceEvent {
  type: 'MANUFACTURED' | 'AUTHENTICATED' | 'SOLD' | 'REGISTERED' | 'OWNED' | 'SERVICE' | 'TRANSFERRED' | 'CARE' | 'WARRANTY' | 'STATUS_CHANGE';
  date: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceTimeline {
  serial: string;
  product_title: string;
  current_status: string;
  events: ProvenanceEvent[];
}

/**
 * Provenance Timeline Service
 * Generates comprehensive product journey history
 */
export class ProvenanceService {
  /**
   * Get complete provenance timeline for a physical piece
   */
  static async getTimeline(shopId: string, serial: string, includePrivate = false): Promise<ProvenanceTimeline> {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial } },
      include: {
        product_ref: true,
        passport: true,
        ownerships: {
          orderBy: { started_at: 'asc' },
          include: { customer: true },
        },
        transfers: {
          where: { status: { in: ['COMPLETED', 'ACCEPTED'] } },
          orderBy: { created_at: 'asc' },
        },
        services: {
          orderBy: { created_at: 'asc' },
        },
        warranties: {
          orderBy: { start_date: 'asc' },
        },
        care_rules: true,
        auth_events: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        lost_reports: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', serial);
    }

    const events: ProvenanceEvent[] = [];

    // 1. Manufacturing event
    if (piece.manufacturing_date) {
      events.push({
        type: 'MANUFACTURED',
        date: piece.manufacturing_date.toISOString(),
        title: 'Crafted',
        description: `Handcrafted in ${piece.manufacturing_location || 'Master Atelier'}`,
      });
    } else if (piece.created_at) {
      events.push({
        type: 'MANUFACTURED',
        date: piece.created_at.toISOString(),
        title: 'Registered',
        description: 'Digital identity created',
      });
    }

    // 2. Authentication events (first authentication)
    if (piece.auth_events && piece.auth_events.length > 0) {
      const firstAuth = piece.auth_events[piece.auth_events.length - 1];
      if (firstAuth.result === 'AUTHENTICATED') {
        events.push({
          type: 'AUTHENTICATED',
          date: firstAuth.created_at.toISOString(),
          title: 'Authenticated',
          description: `Verified via ${firstAuth.method}`,
          metadata: { method: firstAuth.method },
        });
      }
    }

    // 3. Ownership history
    for (const ownership of piece.ownerships) {
      const ownerName = includePrivate
        ? `${ownership.customer.first_name || ''} ${ownership.customer.last_name || ''}`.trim()
        : 'Verified Owner';

      events.push({
        type: 'OWNED',
        date: ownership.started_at.toISOString(),
        title: 'Ownership',
        description: includePrivate
          ? `Owned by ${ownerName} (${ownership.customer.email})`
          : `Registered to ${ownerName}`,
        metadata: {
          source: ownership.source,
          is_active: ownership.is_active,
        },
      });
    }

    // 4. Transfer events
    for (const transfer of piece.transfers) {
      if (transfer.status === 'COMPLETED' && transfer.created_at) {
        events.push({
          type: 'TRANSFERRED',
          date: transfer.created_at.toISOString(),
          title: 'Transferred',
          description: 'Ownership transferred to new collector',
          metadata: { transfer_id: transfer.id },
        });
      }
    }

    // 5. Service events
    for (const service of piece.services) {
      if (service.status === 'COMPLETED' && service.completed_date) {
        events.push({
          type: 'SERVICE',
          date: service.completed_date.toISOString(),
          title: 'Service Completed',
          description: service.customer_notes || service.service_type,
          metadata: {
            service_type: service.service_type,
            status: service.status,
          },
        });
      } else if (service.received_date) {
        events.push({
          type: 'SERVICE',
          date: service.received_date.toISOString(),
          title: 'Service Requested',
          description: `${service.service_type} - ${service.status}`,
          metadata: {
            service_type: service.service_type,
            status: service.status,
          },
        });
      }
    }

    // 6. Warranty events
    for (const warranty of piece.warranties) {
      if (warranty.start_date) {
        events.push({
          type: 'WARRANTY',
          date: warranty.start_date.toISOString(),
          title: 'Warranty Active',
          description: `${warranty.coverage_summary || warranty.warranty_type} coverage`,
          metadata: {
            warranty_type: warranty.warranty_type,
            end_date: warranty.end_date?.toISOString(),
          },
        });
      }
    }

    // 7. Lost/Stolen events
    for (const report of piece.lost_reports) {
      events.push({
        type: 'STATUS_CHANGE',
        date: report.created_at.toISOString(),
        title: report.status === 'CONFIRMED' 
          ? (report.report_type === 'LOST' ? 'Reported Lost' : 'Reported Stolen')
          : 'Under Review',
        description: report.internal_notes || 'Security report filed',
        metadata: { report_type: report.report_type, status: report.status },
      });
    }

    // 8. Current status
    let currentStatus = piece.status;
    if (piece.lost_reports.some((r: any) => r.status === 'CONFIRMED')) {
      currentStatus = piece.lost_reports[0].report_type === 'LOST' ? 'LOST' : 'STOLEN';
    }

    // Sort events by date descending (newest first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      serial: piece.serial,
      product_title: piece.product_ref.title,
      current_status: currentStatus,
      events,
    };
  }

  /**
   * Get public (sanitized) timeline - no private owner info
   */
  static async getPublicTimeline(shopId: string, serial: string): Promise<ProvenanceTimeline> {
    return this.getTimeline(shopId, serial, false);
  }

  /**
   * Get private timeline (for owners/admins)
   */
  static async getPrivateTimeline(shopId: string, serial: string): Promise<ProvenanceTimeline> {
    return this.getTimeline(shopId, serial, true);
  }

  /**
   * Get abbreviated timeline for passport page (public)
   */
  static async getAbbreviatedTimeline(shopId: string, serial: string): Promise<{
    manufactured?: string;
    first_authenticated?: string;
    service_count: number;
    last_service?: string;
  }> {
    const timeline = await this.getPublicTimeline(shopId, serial);

    const manufactured = timeline.events.find(e => e.type === 'MANUFACTURED');
    const authenticated = timeline.events.find(e => e.type === 'AUTHENTICATED');
    const services = timeline.events.filter(e => e.type === 'SERVICE');
    const lastService = services[0];

    return {
      manufactured: manufactured?.date,
      first_authenticated: authenticated?.date,
      service_count: services.length,
      last_service: lastService?.date,
    };
  }
}