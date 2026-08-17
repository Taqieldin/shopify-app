import { Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';
import { TenantRequest } from './tenant.js';
import { UserRole } from '../shared/types/index.js';

export interface AuthenticatedRequest extends TenantRequest {
  userRole?: UserRole;
  actorId?: string;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const headerRole = req.headers['x-user-role'] as UserRole | undefined;

    if (process.env.NODE_ENV === 'production') {
      if (!headerRole) {
        return next(new UnauthorizedError('Missing role. Authenticate before accessing admin routes.'));
      }
      req.userRole = headerRole;
      req.actorId = (req.headers['x-actor-id'] as string) || 'unknown';
      if (allowedRoles.length > 0 && !allowedRoles.includes(headerRole)) {
        return next(new ForbiddenError(`Operation requires one of roles: ${allowedRoles.join(', ')}`));
      }
      return next();
    }

    // In local dev/demo mode, default to MERCHANT_ADMIN for admin routes
    const role: UserRole = headerRole || 'MERCHANT_ADMIN';
    const actorId = (req.headers['x-actor-id'] as string) || 'merchant_admin_01';

    req.userRole = role;
    req.actorId = actorId;

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return next(new ForbiddenError(`Operation requires one of roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}
