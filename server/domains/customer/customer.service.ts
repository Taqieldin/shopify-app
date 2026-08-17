import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import { CareService } from '../care/care.service.js';
import { LostStolenService } from '../lost-stolen/lost-stolen.service.js';

export interface UpdatePreferencesDTO {
  email_care_reminders?: boolean;
  email_transfer_alerts?: boolean;
  email_early_access?: boolean;
}

export interface CustomerServiceRequestDTO {
  serial: string;
  service_type: string;
  notes: string;
}

export class CustomerService {
  /**
   * Resolve or initialize customer profile by Shopify Customer ID
   */
  static async getOrCreateProfile(
    shop_id: string,
    shopify_customer_id: string,
    email: string,
    first_name?: string,
    last_name?: string
  ) {
    return prisma.customer.upsert({
      where: {
        shop_id_shopify_customer_id: { shop_id, shopify_customer_id },
      },
      update: {
        email,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
      },
      create: {
        shop_id,
        shopify_customer_id,
        email,
        first_name,
        last_name,
        comm_preferences: {
          create: {
            shop_id,
            care_reminders: true,
            service_reminders: true,
            private_access_invites: true,
          },
        },
      },
      include: {
        comm_preferences: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { tier: true },
        },
      },
    });
  }

  /**
   * Retrieve collector's digital vault pieces (currently active ownerships)
   */
  static async getCollectorVault(shop_id: string, shopify_customer_id: string) {
    const customer = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: { shop_id, shopify_customer_id },
      },
    });

    if (!customer) {
      return [];
    }

    return prisma.ownership.findMany({
      where: {
        shop_id,
        customer_id: customer.id,
        is_active: true,
      },
      include: {
        physical_piece: {
          include: {
            product_ref: true,
            passport: true,
            warranties: {
              where: { status: 'ACTIVE' },
            },
            services: {
              orderBy: { created_at: 'desc' },
              take: 3,
            },
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });
  }

  /**
   * Submit an Atelier service/care request directly as a collector
   */
  static async requestAtelierCare(
    shop_id: string,
    shopify_customer_id: string,
    dto: CustomerServiceRequestDTO
  ) {
    const customer = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: { shop_id, shopify_customer_id },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', shopify_customer_id);
    }

    // Verify customer is active owner of the piece
    const piece = await prisma.physicalPiece.findUnique({
      where: {
        shop_id_serial: { shop_id, serial: dto.serial },
      },
      include: {
        ownerships: {
          where: { is_active: true, customer_id: customer.id },
        },
      },
    });

    if (!piece || piece.ownerships.length === 0) {
      throw new UnauthorizedError('You can only request service for pieces currently registered in your vault.');
    }

    return CareService.createServiceCase(
      shop_id,
      {
        serial: dto.serial,
        service_type: dto.service_type,
        customer_notes: dto.notes,
      },
      customer.id
    );
  }

  /**
   * Update collector communication preferences
   */
  static async updateCommunicationPreferences(
    shop_id: string,
    shopify_customer_id: string,
    dto: UpdatePreferencesDTO
  ) {
    const customer = await prisma.customer.findUnique({
      where: {
        shop_id_shopify_customer_id: { shop_id, shopify_customer_id },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', shopify_customer_id);
    }

    return prisma.communicationPreference.upsert({
      where: {
        customer_id: customer.id,
      },
      update: {
        care_reminders: dto.email_care_reminders,
        service_reminders: dto.email_transfer_alerts,
        private_access_invites: dto.email_early_access,
      },
      create: {
        shop_id,
        customer_id: customer.id,
        care_reminders: dto.email_care_reminders ?? true,
        service_reminders: dto.email_transfer_alerts ?? true,
        private_access_invites: dto.email_early_access ?? true,
      },
    });
  }
}
