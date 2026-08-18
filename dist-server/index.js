import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import productsRouter from './routes/products.routes.js';
import tagsRouter from './routes/tags.routes.js';
import servicesRouter from './routes/services.routes.js';
import passportRouter from './routes/passport.routes.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;
app.use(express.json());
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-shopify-shop-domain, x-user-role');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (_req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
});
app.use('/api/admin', authMiddleware, productsRouter);
app.use('/api/admin/tags', authMiddleware, tagsRouter);
app.use('/api/admin/services', authMiddleware, servicesRouter);
app.use('/api/passport', passportRouter);
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`[Gorgerine] Server running on port ${PORT}`);
});
