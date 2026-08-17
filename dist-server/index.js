import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicRouter } from './routes/public.routes.js';
import { customerRouter } from './routes/customer.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { errorHandler } from './middleware/error-handler.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'shopify-digital-passport-saas',
    });
});
// Domain API routes
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/customer', customerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhookRouter);
// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('{*splat}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
// Centralized error handling
app.use(errorHandler);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✨ Shopify Digital Passport SaaS Backend running on http://localhost:${PORT}`);
    });
}
export default app;
