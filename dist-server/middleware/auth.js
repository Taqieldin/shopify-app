import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const headerRole = req.headers['x-user-role'];
        if (process.env.NODE_ENV === 'production') {
            if (!headerRole) {
                return next(new UnauthorizedError('Missing role. Authenticate before accessing admin routes.'));
            }
            req.userRole = headerRole;
            req.actorId = req.headers['x-actor-id'] || 'unknown';
            if (allowedRoles.length > 0 && !allowedRoles.includes(headerRole)) {
                return next(new ForbiddenError(`Operation requires one of roles: ${allowedRoles.join(', ')}`));
            }
            return next();
        }
        // In local dev/demo mode, default to MERCHANT_ADMIN for admin routes
        const role = headerRole || 'MERCHANT_ADMIN';
        const actorId = req.headers['x-actor-id'] || 'merchant_admin_01';
        req.userRole = role;
        req.actorId = actorId;
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            return next(new ForbiddenError(`Operation requires one of roles: ${allowedRoles.join(', ')}`));
        }
        next();
    };
}
