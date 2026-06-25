import { supabase } from '../config/supabase';
import { deriveResearchGroup } from '../utils/researchGroup';

export class CalendarService {
    /** Fetch calendar events within a date range (shared events, filtered for the control group). */
    public async getCalendarEvents(userId: string, startDate: string, endDate: string) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('research_id')
            .eq('id', userId)
            .single();

        const group = deriveResearchGroup(profile?.research_id);

        const { data, error } = await supabase
            .from('calendar_events')
            .select('id, title, description, event_date, event_time, is_completed, created_at, updated_at')
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true });

        if (error) throw error;
        const events = data || [];

        // Control group must not see mindfulness-themed sessions — same "Mindfulness Session"
        // title convention mobile/src/screens/CalendarScreen.tsx already uses for highlighting.
        if (group === 'cg') {
            return events.filter((e: { title: string }) => !e.title.startsWith('Mindfulness Session'));
        }

        return events;
    }
}
