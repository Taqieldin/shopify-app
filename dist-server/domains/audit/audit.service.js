import { prisma } from '../../infrastructure/database/client.js';
export class AuditService {
    /**
     * Append-only audit logger for sensitive actions across all domains
     */
    static async log(params) {
        return prisma.auditLog.create({
            data: {
                shop_id: params.shop_id,
                actor_type: params.actor_type,
                actor_id: params.actor_id,
                action: params.action,
                resource_type: params.resource_type,
                resource_id: params.resource_id,
                ip_address: params.ip_address,
                metadata_json: params.metadata ? JSON.stringify(params.metadata) : null,
            },
        });
    }
    /**
     * Fetch tenant-scoped audit logs with pagination
     */
    static async getLogs(shop_id, options = {}) {
        const { limit = 50, offset = 0, resource_type } = options;
        return prisma.auditLog.findMany({
            where: {
                shop_id,
                ...(resource_type ? { resource_type } : {}),
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(limit, 100),
            skip: offset,
        });
    }
}
