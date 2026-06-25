import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('FATAL: SUPABASE_URL is not configured.');
}

if (!serviceRoleKey) {
    console.warn('[Supabase] WARNING: Service role key missing — falling back to anon key.');
}

const supabaseKey = serviceRoleKey || anonKey || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
