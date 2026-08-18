export function authMiddleware(req, res, next) {
    const shop = req.headers['x-shopify-shop-domain'];
    const role = req.headers['x-user-role'];
    if (process.env.NODE_ENV === 'production') {
        if (!shop) {
            return res.status(401).json({ success: false, error: 'Missing shop domain' });
        }
        if (role !== 'MERCHANT_OWNER') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }
    }
    next();
}
