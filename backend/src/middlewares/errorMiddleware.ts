import { Request, Response, NextFunction } from 'express';

/** Central error handler — avoids leaking stack traces in production */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Unhandled error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
        error: isProd ? 'Internal server error' : err.message || 'Internal server error',
    });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
    res.status(404).json({ error: 'Not found' });
};
