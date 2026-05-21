import { supabase } from '../config/supabase';

export class CalendarService {
    /** Fetch calendar events within a date range (shared events, no per-user filter). */
    public async getCalendarEvents(_userId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}
