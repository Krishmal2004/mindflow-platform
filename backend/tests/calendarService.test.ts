import { createSupabaseMock } from './helpers/supabaseMock';

function mockFor(researchId: string | null, events: any[]) {
    return createSupabaseMock({
        profiles: { data: { research_id: researchId }, error: null },
        calendar_events: { data: events, error: null },
    });
}

const events = [
    { id: 1, title: 'Mindfulness Session', event_date: '2026-06-23' },
    { id: 2, title: 'Study Check-in', event_date: '2026-06-24' },
];

describe('CalendarService.getCalendarEvents control-group filtering', () => {
    it('hides mindfulness-themed sessions for the control group (.cg)', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockFor('MF-2026-002.cg', events) }));
        const { CalendarService } = require('../src/services/calendarService');

        const result = await new CalendarService().getCalendarEvents('user-1', '2026-06-01', '2026-06-30');

        expect(result.map((e: any) => e.id)).toEqual([2]);
    });

    it('shows mindfulness-themed sessions for the experimental group (.ex)', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockFor('MF-2026-001.ex', events) }));
        const { CalendarService } = require('../src/services/calendarService');

        const result = await new CalendarService().getCalendarEvents('user-2', '2026-06-01', '2026-06-30');

        expect(result.map((e: any) => e.id)).toEqual([1, 2]);
    });

    it('shows all events when no research group is assigned', async () => {
        jest.resetModules();
        jest.doMock('../src/config/supabase', () => ({ supabase: mockFor(null, events) }));
        const { CalendarService } = require('../src/services/calendarService');

        const result = await new CalendarService().getCalendarEvents('user-3', '2026-06-01', '2026-06-30');

        expect(result.map((e: any) => e.id)).toEqual([1, 2]);
    });
});
