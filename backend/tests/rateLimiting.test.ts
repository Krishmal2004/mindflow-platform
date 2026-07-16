import request from 'supertest';
import { createSupabaseMock } from './helpers/supabaseMock';

// Isolated in its own file so the in-memory rate-limit store (keyed by IP)
// isn't polluted by requests other test files fire against the same app module.
const supabaseMock = createSupabaseMock({
    profiles: { data: { research_id: 'MF-2026-001.ex' }, error: null },
});
jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import app from '../src/app';

describe('Rate limiting', () => {
    it('returns 429 once the auth limiter threshold (20 / 15min) is exceeded', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        });

        const attempts = Array.from({ length: 21 }, () =>
            request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrongpass' }),
        );
        const responses = await Promise.all(attempts);

        const statuses = responses.map((r) => r.status);
        expect(statuses).toContain(429);
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);

        const limited = responses.find((r) => r.status === 429)!;
        expect(limited.body.error).toMatch(/too many/i);
    }, 15_000);

    it('applies the relaxed data-API limiter (300 / 15min) separately from the auth limiter', async () => {
        supabaseMock.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-1', email: 'jane@example.com' } },
            error: null,
        });

        // A handful of authenticated requests should never be rejected by the
        // stricter auth limiter — confirms the two limiters are scoped to
        // different route prefixes rather than sharing one global bucket.
        const attempts = Array.from({ length: 5 }, () =>
            request(app).get('/api/dashboard/summary').set('Authorization', 'Bearer good-token'),
        );
        const responses = await Promise.all(attempts);
        expect(responses.every((r) => r.status !== 429)).toBe(true);
    });
});
