import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
export class CreditsService {
    /**
     * Append an immutable transaction entry to the credit ledger
     */
    static async postTransaction(shop_id, dto, actor_id) {
        const customer = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: dto.customer_shopify_id,
                },
            },
        });
        if (!customer) {
            throw new NotFoundError('Customer', dto.customer_shopify_id);
        }
        // If debit/redemption, check current balance
        if (dto.amount < 0) {
            const currentBalance = await this.getBalance(shop_id, dto.customer_shopify_id);
            if (currentBalance + dto.amount < 0) {
                throw new ConflictError(`Insufficient credits balance. Current: ${currentBalance}, Attempted debit: ${Math.abs(dto.amount)}`);
            }
        }
        const entry = await prisma.creditsLedger.create({
            data: {
                shop_id,
                customer_id: customer.id,
                amount: dto.amount,
                type: dto.type,
                reason: dto.reason,
                reference_type: dto.reference_type,
                reference_id: dto.reference_id,
                created_by: dto.created_by || `ADMIN:${actor_id}`,
            },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id,
            action: dto.amount >= 0 ? 'CREDITS_GRANTED' : 'CREDITS_DEBITED',
            resource_type: 'CREDITS_LEDGER',
            resource_id: entry.id,
            metadata: {
                customer_shopify_id: dto.customer_shopify_id,
                amount: dto.amount,
                reason: dto.reason,
            },
        });
        const newBalance = await this.getBalance(shop_id, dto.customer_shopify_id);
        return {
            entry_id: entry.id,
            amount: entry.amount,
            type: entry.type,
            new_balance: newBalance,
            created_at: entry.created_at,
        };
    }
    /**
     * Calculate exact credit balance from immutable ledger
     */
    static async getBalance(shop_id, customer_shopify_id) {
        const customer = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: customer_shopify_id,
                },
            },
        });
        if (!customer) {
            return 0;
        }
        const aggregate = await prisma.creditsLedger.aggregate({
            where: {
                shop_id,
                customer_id: customer.id,
            },
            _sum: {
                amount: true,
            },
        });
        return aggregate._sum.amount || 0;
    }
    /**
     * Get transaction history for a customer
     */
    static async getStatement(shop_id, customer_shopify_id, limit = 50) {
        const customer = await prisma.customer.findUnique({
            where: {
                shop_id_shopify_customer_id: {
                    shop_id,
                    shopify_customer_id: customer_shopify_id,
                },
            },
        });
        if (!customer) {
            return { balance: 0, statement: [] };
        }
        const statement = await prisma.creditsLedger.findMany({
            where: {
                shop_id,
                customer_id: customer.id,
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        const balance = await this.getBalance(shop_id, customer_shopify_id);
        return { balance, statement };
    }
    /**
     * List all ledger transactions for embedded admin
     */
    static async listAdminTransactions(shop_id, limit = 50, offset = 0) {
        return prisma.creditsLedger.findMany({
            where: { shop_id },
            include: {
                customer: true,
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(limit, 100),
            skip: offset,
        });
    }
}
