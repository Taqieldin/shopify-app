import { prisma } from '../../infrastructure/database/client.js';
import { JobRunner } from '../../infrastructure/jobs/job-runner.js';
export class NotificationService {
    /**
     * Dispatch a branded transactional notification and record immutable log
     */
    static async send(shop_id, dto) {
        const shop = await prisma.shop.findUnique({
            where: { id: shop_id },
            include: { settings: true },
        });
        const brandName = shop?.settings?.brand_name || 'Maison';
        // 1. Create notification log
        const log = await prisma.notificationLog.create({
            data: {
                shop_id,
                recipient_email: dto.recipient_email,
                notification_type: dto.type,
                subject: `[${brandName}] ${dto.subject}`,
                status: 'SENT',
                payload_json: JSON.stringify({
                    ...dto.data,
                    brand_name: brandName,
                    sent_at: new Date().toISOString(),
                }),
            },
        });
        // 2. Enqueue background email worker task
        await JobRunner.enqueue({
            shop_id,
            job_type: 'EMAIL_NOTIFICATION',
            payload: {
                recipient_email: dto.recipient_email,
                subject: log.subject,
                notification_id: log.id,
            },
        });
        return log;
    }
    /**
     * List notification logs for admin inspection
     */
    static async getHistory(shop_id, limit = 50) {
        return prisma.notificationLog.findMany({
            where: { shop_id },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }
}
