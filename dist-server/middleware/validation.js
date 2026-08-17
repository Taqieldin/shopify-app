import { ZodError } from 'zod';
import { ValidationError } from '../shared/errors/index.js';
export function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                const errorDetails = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return next(new ValidationError('Invalid request payload', errorDetails));
            }
            next(err);
        }
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                const errorDetails = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return next(new ValidationError('Invalid query parameters', errorDetails));
            }
            next(err);
        }
    };
}
