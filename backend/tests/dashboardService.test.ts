import { createSupabaseMock } from './helpers/supabaseMock';

function mockForResearchId(researchId: string | null) {
    return createSupabaseMock({
        daily_sliders: { data: [], count: 0, error: null },
        voice_recordings: { data: [], error: null },
        questionnaire_pss10_responses: { count: 0, error: null },
        questionnaire_ffmq15_responses: { count: 0, error: null },
        questionnaire_wemwbs14_responses: { count: 0, error: null },
        profiles: { data: { research_id: researchId }, error: null },
    });
}

describe('DashboardService.getUserSummary research group derivation', () => {
    it('returns "ex" for a research_id ending in .ex', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockForResearchId('MF-2026-001.ex') }));
        const { DashboardService } = require('../src/services/dashboardService');

        const summary = await new DashboardService().getUserSummary('user-1');

        expect(summary.group).toBe('ex');
    });

    it('returns "cg" for a research_id ending in .cg', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockForResearchId('MF-2026-002.cg') }));
        const { DashboardService } = require('../src/services/dashboardService');

        const summary = await new DashboardService().getUserSummary('user-2');

        expect(summary.group).toBe('cg');
    });

    it('returns an empty group when research_id has no recognized suffix', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockForResearchId(null) }));
        const { DashboardService } = require('../src/services/dashboardService');

        const summary = await new DashboardService().getUserSummary('user-3');

        expect(summary.group).toBe('');
    });
});
