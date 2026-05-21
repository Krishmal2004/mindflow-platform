import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Security & Middleware
app.use(helmet());
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

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/roadmap', apiLimiter, roadmapRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/calendar', apiLimiter, calendarRoutes);
app.use('/api/journey', apiLimiter, journeyRoutes);

// Health Check (no rate limit — used by load balancers)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler — prevents raw stack traces leaking to clients
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Error]', err.stack ?? err.message);
    const isMulter = err.message?.includes('audio files');
    const status = isMulter ? 400 : 500;
    const message = isMulter
        ? err.message
        : 'An unexpected error occurred. Please try again later.';
    res.status(status).json({ error: message });
});

export default app;
