import request from 'supertest';
import { createSupabaseMock } from './helpers/supabaseMock';

const supabaseMock = createSupabaseMock({
    daily_sliders: { data: [], count: 0, error: null },
    voice_recordings: { data: [], error: null },
    weekly_recordings: { data: null, error: null },
    questionnaire_pss10_responses: { data: null, count: 0, error: null },
    questionnaire_ffmq15_responses: { data: null, count: 0, error: null },
    questionnaire_wemwbs14_responses: { data: null, count: 0, error: null },
    calendar_events: { data: [], error: null },
    push_tokens: { data: null, error: null },
    profiles: { data: { research_id: 'MF-2026-001.ex', username: 'jane' }, error: null },
    about_me_profiles: { data: { id: 'user-1', is_completed: true }, error: null },
});

jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import app from '../src/app';

// Every protected route in the app, paired with its HTTP method.
// Kept as an explicit list (rather than introspecting the router) so a route
// added without requireAuth fails this test loudly instead of silently passing.
const PROTECTED_ROUTES: { method: 'get' | 'post'; path: string }[] = [
    { method: 'get', path: '/api/dashboard/summary' },
    { method: 'get', path: '/api/calendar/events' },
    { method: 'post', path: '/api/notifications/register-token' },
    { method: 'post', path: '/api/notifications/unregister-token' },
    { method: 'get', path: '/api/journey/status' },
    { method: 'get', path: '/api/journey' },
    { method: 'get', path: '/api/roadmap/daily/status' },
    { method: 'post', path: '/api/roadmap/daily' },
    { method: 'get', path: '/api/roadmap/weekly/status' },
    { method: 'post', path: '/api/roadmap/weekly' },
    { method: 'get', path: '/api/roadmap/thrive/status' },
    { method: 'post', path: '/api/roadmap/thrive' },
    { method: 'get', path: '/api/roadmap/stress/status' },
    { method: 'post', path: '/api/roadmap/stress' },
    { method: 'get', path: '/api/roadmap/mindful/status' },
    { method: 'post', path: '/api/roadmap/mindful' },
    { method: 'get', path: '/api/profile' },
    { method: 'get', path: '/api/profile/about-me' },
    { method: 'post', path: '/api/profile/about-me' },
];

describe('Authorization: protected routes', () => {
    it.each(PROTECTED_ROUTES)('$method $path rejects a request with no Authorization header', async ({ method, path }) => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
    });

    it.each(PROTECTED_ROUTES)('$method $path rejects a malformed Authorization header', async ({ method, path }) => {
        const res = await request(app)[method](path).set('Authorization', 'not-a-bearer-token');
        expect(res.status).toBe(401);
    });

    it.each(PROTECTED_ROUTES)('$method $path rejects an invalid/expired token', async ({ method, path }) => {
        supabaseMock.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'invalid' } });
        const res = await request(app)[method](path).set('Authorization', 'Bearer garbage');
        expect(res.status).toBe(401);
    });
});

describe('Security headers (helmet)', () => {
    it('sets standard hardening headers and does not leak the framework', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});

describe('Input handling', () => {
    it('rejects a body over the 1mb express.json limit', async () => {
        const oversized = { email: 'a@example.com', password: 'x'.repeat(2 * 1024 * 1024) };
        const res = await request(app).post('/api/auth/login').send(oversized);
        expect(res.status).toBe(413);
    });

    it('rejects malformed JSON instead of crashing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"email": "a@example.com", "password": ');
        expect(res.status).toBe(400);
    });

    it('rejects a login payload missing required fields', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('ignores unexpected extra fields rather than erroring (zod strips unknown keys)', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: { id: 'user-1', email: 'a@example.com' }, session: { access_token: 't' } },
            error: null,
        });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a@example.com', password: 'password123', isAdmin: true, role: 'admin' });
        expect(res.status).toBe(200);
    });
});

describe('404 handling', () => {
    it('returns a clean 404 for unknown routes instead of a stack trace', async () => {
        const res = await request(app).get('/api/does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Route not found' });
    });
});
