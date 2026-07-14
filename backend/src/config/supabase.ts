import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

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
    // supabase-js always constructs a Realtime client internally, which needs a WebSocket
    // implementation. Node < 22 has no native `WebSocket` global, so without this the client
    // throws at import time on any Node 20 runtime (e.g. this repo's CI runners).
    realtime: {
        transport: WebSocket as unknown as WebSocketLikeConstructor,
    },
});
