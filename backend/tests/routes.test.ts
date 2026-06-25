import request from 'supertest';
import { createSupabaseMock } from './helpers/supabaseMock';

const supabaseMock = createSupabaseMock({
    daily_sliders: { data: [], count: 0, error: null },
    voice_recordings: { data: [], error: null },
    questionnaire_pss10_responses: { count: 0, error: null },
    questionnaire_ffmq15_responses: { count: 0, error: null },
    questionnaire_wemwbs14_responses: { count: 0, error: null },
    profiles: { data: { research_id: 'MF-2026-001.ex' }, error: null },
    about_me_profiles: { data: { id: 'user-1', is_completed: false }, error: null },
});

jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import app from '../src/app';

beforeEach(() => {
    supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'jane@example.com' } },
        error: null,
    });
});

describe('GET /api/dashboard/summary', () => {
    it('requires authentication', async () => {
        const res = await request(app).get('/api/dashboard/summary');
        expect(res.status).toBe(401);
    });

    it('returns the research group for an authenticated user', async () => {
        const res = await request(app)
            .get('/api/dashboard/summary')
            .set('Authorization', 'Bearer good-token');

        expect(res.status).toBe(200);
        expect(res.body.group).toBe('ex');
    });
});

describe('GET /api/profile/about-me', () => {
    it('returns the about-me completion state for an authenticated user', async () => {
        const res = await request(app)
            .get('/api/profile/about-me')
            .set('Authorization', 'Bearer good-token');

        expect(res.status).toBe(200);
        expect(res.body.is_completed).toBe(false);
    });
});
