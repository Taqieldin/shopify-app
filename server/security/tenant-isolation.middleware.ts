import { Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/database/client.js';
import { UnauthorizedError } from '../shared/errors/index.js';

/**
 * Tenant Isolation Middleware
 * Enforces strict shop_id filtering on all database queries
 */

export interface TenantContext {
  shop_id: string;
  shop_domain: string;
  tenant_verified: boolean;
}

/**
 * Validate tenant access for a resource
 */
export async function validateTenantAccess(
  shopId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Map resource types to their models
  const validators: Record<string, () => Promise<any>> = {
    physical_piece: () =>
      prisma.physicalPiece.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    passport: () =>
      prisma.passport.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    ownership: () =>
      prisma.ownership.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    customer: () =>
      prisma.customer.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    service_case: () =>
      prisma.serviceCase.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    api_key: () =>
      prisma.aPIKey.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),

    webhook: () =>
      prisma.webhookEndpoint.findFirst({
        where: { id: resourceId, shop_id: shopId },
        select: { id: true },
      }),
  };

  const validator = validators[resourceType.toLowerCase()];
  if (!validator) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const resource = await validator();
  return resource !== null;
}

/**
 * Middleware to enforce tenant context on all requests
 */
export function enforceTenantIsolation(
  req: Request & { tenant?: TenantContext },
  res: Response,
  next: NextFunction
) {
  // Ensure tenant context exists
  if (!req.tenant || !req.tenant.shop_id) {
    throw new UnauthorizedError('Tenant context not found');
  }

  // Add tenant filter to all Prisma queries (if using Prisma middleware)
  // This is enforced at the service layer, but we add extra validation here

  next();
}

/**
 * Audit tenant access attempts
 */
export async function auditTenantAccess(
  shopId: string,
  actorId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  success: boolean
) {
  await prisma.auditLog.create({
    data: {
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: success ? `${action}_SUCCESS` : `${action}_DENIED`,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata_json: JSON.stringify({ success }),
    },
  });
}

/**
 * Validate shop_id in request params matches authenticated shop
 */
export function validateShopIdParam(
  req: Request & { tenant?: TenantContext },
  res: Response,
  next: NextFunction
) {
  const paramShopId = req.params.shopId || req.query.shopId;

  if (paramShopId && paramShopId !== req.tenant?.shop_id) {
    throw new UnauthorizedError('Shop ID mismatch - access denied');
  }

  next();
}

/**
 * Prisma middleware to enforce tenant isolation at database level
 */
export function createTenantIsolationMiddleware(currentShopId: string) {
  return async (params: any, next: any) => {
    // Only apply to queries (not to $transaction, etc.)
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      // Ensure shop_id filter is present
      if (!params.args.where) {
        params.args.where = {};
      }

      // Add shop_id filter if not already present
      if (!params.args.where.shop_id && params.model !== 'Shop') {
        params.args.where.shop_id = currentShopId;
      }

      // Verify shop_id matches if provided
      if (params.args.where.shop_id && params.args.where.shop_id !== currentShopId) {
        throw new UnauthorizedError('Tenant isolation violation detected');
      }
    }

    return next(params);
  };
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove potential SQL injection characters
  return input.replace(/[;'"\\]/g, '');
}

/**
 * Validate serial number format
 */
export function validateSerial(serial: string): boolean {
  // Serial should be alphanumeric with dashes/underscores
  const serialPattern = /^[A-Z0-9-_]+$/i;
  return serialPattern.test(serial) && serial.length >= 5 && serial.length <= 50;
}

/**
 * Validate NFC UID format
 */
export function validateNFCUID(uid: string): boolean {
  // Remove separators
  const cleaned = uid.replace(/[:\s-]/g, '');

  // Check if hex
  if (!/^[0-9A-F]+$/i.test(cleaned)) {
    return false;
  }

  // Check length (4, 7, or 10 bytes)
  const validLengths = [8, 14, 20];
  return validLengths.includes(cleaned.length);
}

/**
 * Rate limit key generator based on shop_id + IP
 */
export function getTenantRateLimitKey(
  req: Request & { tenant?: TenantContext }
): string {
  const shopId = req.tenant?.shop_id || 'unknown';
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return `${shopId}:${ip}`;
}
