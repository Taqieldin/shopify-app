import { AppError } from '../shared/errors/index.js';
export function errorHandler(err, req, res, next) {
    console.error('[Error caught in API]', {
        message: err.message,
        code: err.code || 'INTERNAL_SERVER_ERROR',
        path: req.path,
        method: req.method,
    });
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
    }
    // Generic fallback for unhandled internal exceptions
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected internal error occurred. Please try again later.',
        },
    });
}
