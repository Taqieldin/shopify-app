import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/index.js';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitBucket>();

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Lightweight per-tenant / per-IP rate limiter
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests || 120; // 120 reqs/min default
  const message = options.message || 'Too many requests. Please slow down.';

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.headers['x-tenant-shop-id'] || req.ip || 'anonymous'}:${req.baseUrl || req.path}`;

    const now = Date.now();
    let bucket = memoryStore.get(key);

    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + windowMs,
      };
      memoryStore.set(key, bucket);
    } else {
      bucket.count++;
    }

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil((bucket.resetTime - now) / 1000),
        },
      });
    }

    next();
  };
}
