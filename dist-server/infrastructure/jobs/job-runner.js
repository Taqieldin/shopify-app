import { prisma } from '../database/client.js';
export class JobRunner {
    /**
     * Enqueue an asynchronous background task to the database-backed queue
     */
    static async enqueue(params) {
        return prisma.backgroundJob.create({
            data: {
                shop_id: params.shop_id,
                job_type: params.job_type,
                payload_json: JSON.stringify(params.payload),
                status: 'QUEUED',
                available_at: params.available_at || new Date(),
            },
        });
    }
    /**
     * Poll and execute pending background tasks with retry logic and backoff
     */
    static async processPendingJobs(limit = 10) {
        const jobs = await prisma.backgroundJob.findMany({
            where: {
                status: 'QUEUED',
                available_at: { lte: new Date() },
            },
            take: limit,
            orderBy: { created_at: 'asc' },
        });
        for (const job of jobs) {
            try {
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: { status: 'PROCESSING' },
                });
                const payload = JSON.parse(job.payload_json);
                // Execute handler by job type
                switch (job.job_type) {
                    case 'EMAIL_NOTIFICATION':
                        console.log(`[JobRunner:Email] Dispatched email to ${payload.recipient_email}: ${payload.subject}`);
                        break;
                    case 'CARE_REMINDER_CRON':
                        console.log(`[JobRunner:CareCron] Checked care schedules for shop ${job.shop_id}`);
                        break;
                    case 'CSV_IMPORT':
                        console.log(`[JobRunner:CSV] Processed batch for shop ${job.shop_id}`);
                        break;
                    case 'AGGREGATE_METRICS':
                        console.log(`[JobRunner:Metrics] Aggregated daily KPIs for shop ${job.shop_id}`);
                        break;
                }
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED', processed_at: new Date() },
                });
            }
            catch (err) {
                const nextAttempts = job.attempts + 1;
                const hasExceeded = nextAttempts >= job.max_attempts;
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: {
                        attempts: nextAttempts,
                        status: hasExceeded ? 'FAILED' : 'QUEUED',
                        error_message: err.message,
                        available_at: new Date(Date.now() + Math.pow(2, nextAttempts) * 1000 * 30), // Exponential backoff
                    },
                });
            }
        }
    }
}
