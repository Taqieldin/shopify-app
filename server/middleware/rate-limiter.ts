import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter for verification endpoints
 * For production, use Redis-backed rate limiting (e.g., express-rate-limit with Redis)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Use tenant-aware key by default if tenant context exists
      const tenant = (req as any).tenant;
      const ip = req.ip || 'unknown';
      return tenant?.shop_id ? `${tenant.shop_id}:${ip}` : ip;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (store[key].count >= max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter,
      });
    }

    // Increment counter
    store[key].count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', (max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

    // Hook into response to handle skip options
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function (data: any) {
        const statusCode = res.statusCode;
        const shouldSkip =
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip && store[key]) {
          store[key].count--;
        }

        return originalSend.call(this, data);
      };
    }

    next();
  };
}

/**
 * Predefined rate limiters for common use cases
 */

// Verification API: 100 requests per hour per IP
export const verificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many verification requests. Please try again later.',
});

// Status check: 1000 requests per hour per IP (lighter endpoint)
export const statusCheckRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'Too many status check requests. Please try again later.',
});

// Admin API: 500 requests per hour per user
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  keyGenerator: (req: any) => req.actorId || req.ip || 'unknown',
});

// QR Download: 50 downloads per hour per IP
export const qrDownloadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many QR code download requests. Please try again later.',
});

// Provenance: 200 requests per hour per IP
export const provenanceRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Too many provenance requests. Please try again later.',
});

/**
 * API Key-based rate limiter (future enhancement)
 */
export function createAPIKeyRateLimiter(config: RateLimitConfig & { apiKeyHeader?: string }) {
  const { apiKeyHeader = 'X-API-Key', ...rateLimitConfig } = config;

  return createRateLimiter({
    ...rateLimitConfig,
    keyGenerator: (req) => {
      const apiKey = req.headers[apiKeyHeader.toLowerCase()] as string;
      return apiKey || req.ip || 'unknown';
    },
  });
}

/**
 * Dynamic rate limiter based on user role/tier
 */
export interface TierConfig {
  free: number;
  starter: number;
  pro: number;
  enterprise: number;
}

export function createTieredRateLimiter(
  windowMs: number,
  tierLimits: TierConfig,
  getTier: (req: Request) => keyof TierConfig
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tier = getTier(req);
    const max = tierLimits[tier] || tierLimits.free;

    const limiter = createRateLimiter({
      windowMs,
      max,
      message: `Rate limit exceeded for ${tier} tier. Upgrade for higher limits.`,
    });

    return limiter(req, res, next);
  };
}

/**
 * Export stats for monitoring
 */
export function getRateLimitStats() {
  const now = Date.now();
  const active = Object.keys(store).filter((key) => store[key].resetTime > now);

  return {
    totalKeys: Object.keys(store).length,
    activeKeys: active.length,
    topConsumers: active
      .map((key) => ({
        key,
        count: store[key].count,
        resetTime: store[key].resetTime,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}
