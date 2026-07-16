import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { MulterError } from 'multer';

dotenv.config();

const app = express();

// Trusts one reverse-proxy hop so express-rate-limit reads the real client IP, not the proxy's; adjust TRUST_PROXY_HOPS if that topology changes.
app.set('trust proxy', process.env.TRUST_PROXY_HOPS ? Number(process.env.TRUST_PROXY_HOPS) : 1);

// Security & Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8081'],
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiter: auth endpoints (strict)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: { error: 'Too many attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter: general data API (relaxed but bounded)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

import dashboardRoutes from './routes/dashboardRoutes';
import roadmapRoutes from './routes/roadmapRoutes';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import calendarRoutes from './routes/calendarRoutes';
import journeyRoutes from './routes/journeyRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/roadmap', apiLimiter, roadmapRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/calendar', apiLimiter, calendarRoutes);
app.use('/api/journey', apiLimiter, journeyRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

// Health Check (no rate limit — used by load balancers)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler — prevents raw stack traces leaking to clients
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Error]', err.stack ?? err.message);

    // MulterError and the custom fileFilter rejection are both client mistakes, not server failures.
    const isFileFilterRejection = err.message?.includes('audio files');
    const isMulterError = err instanceof MulterError;
    if (isMulterError || isFileFilterRejection) {
        const message = isMulterError
            ? (err.code === 'LIMIT_FILE_SIZE' ? 'Audio file is too large (max 10MB).' : err.message)
            : err.message;
        res.status(400).json({ error: message });
        return;
    }

    // body-parser (express.json) errors: oversized body or malformed JSON are client mistakes,
    // not server failures — surface their real status instead of a generic 500.
    if (err.type === 'entity.too.large' || err.status === 413) {
        res.status(413).json({ error: 'Request body too large.' });
        return;
    }
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
        res.status(400).json({ error: 'Malformed JSON in request body.' });
        return;
    }

    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

export default app;
