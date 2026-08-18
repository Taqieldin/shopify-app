import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const role = req.headers['x-user-role'] as string;

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
