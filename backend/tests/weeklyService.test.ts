import { createSupabaseMock } from './helpers/supabaseMock';

function mockFor(researchId: string | null, recordings: any[]) {
    return createSupabaseMock({
        profiles: { data: { research_id: researchId }, error: null },
        weekly_recordings: { data: recordings, error: null },
    });
}

describe('WeeklyService.getWeeklyVideo group selection', () => {
    it('returns the experimental-group video when the user is in .ex', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({
            supabase: mockFor('MF-2026-001.ex', [
                { id: 1, week_no: 26, youtube_id: 'ssss7V1_eyA', target_group: 'ex' },
                { id: 2, week_no: 26, youtube_id: 'ZSt9tm3RoUU', target_group: 'cg' },
            ]),
        }));
        const { WeeklyService } = require('../src/services/weeklyService');

        const video = await new WeeklyService().getWeeklyVideo('user-1');

        expect(video.youtube_id).toBe('ssss7V1_eyA');
    });

    it('returns the control-group video when the user is in .cg', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({
            supabase: mockFor('MF-2026-002.cg', [
                { id: 1, week_no: 26, youtube_id: 'ssss7V1_eyA', target_group: 'ex' },
                { id: 2, week_no: 26, youtube_id: 'ZSt9tm3RoUU', target_group: 'cg' },
            ]),
        }));
        const { WeeklyService } = require('../src/services/weeklyService');

        const video = await new WeeklyService().getWeeklyVideo('user-2');

        expect(video.youtube_id).toBe('ZSt9tm3RoUU');
    });

    it('falls back to a group-agnostic video when no group-specific match exists', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({
            supabase: mockFor(null, [
                { id: 1, week_no: 1, youtube_id: 'wAIoe992Qak', target_group: null },
            ]),
        }));
        const { WeeklyService } = require('../src/services/weeklyService');

        const video = await new WeeklyService().getWeeklyVideo('user-3');

        expect(video.youtube_id).toBe('wAIoe992Qak');
    });

    it('returns null when nothing is published for the week', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({
            supabase: mockFor('MF-2026-003.ex', []),
        }));
        const { WeeklyService } = require('../src/services/weeklyService');

        const video = await new WeeklyService().getWeeklyVideo('user-4');

        expect(video).toBeNull();
    });
});
