import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Generic validation middleware using Zod schemas
 * Usage: router.post('/endpoint', validate(mySchema), handler)
 */
export const validate = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
