import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!serviceRoleKey) {
    console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to ANON key. RLS policies may fail.');
}

const supabaseKey = serviceRoleKey || anonKey || '';

import dashboardRoutes from './routes/dashboardRoutes';
import roadmapRoutes from './routes/roadmapRoutes';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roadmap', roadmapRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
