import { supabase } from '../config/supabase';
import { startOfToday } from '../utils/date';
import { deriveResearchGroup } from '../utils/researchGroup';

export class DailyService {
    // Check if user has submitted today's daily sliders.
    public async getDailyStatus(userId: string) {
        const today = startOfToday();

        // Profile lookup and today's entry check are independent reads, run concurrently.
        const [{ data: profile }, { data, error }] = await Promise.all([
            supabase.from('profiles').select('research_id').eq('id', userId).single(),
            supabase
                .from('daily_sliders')
                .select('stress_level, video_play_seconds')
                .eq('user_id', userId)
                .gte('created_at', today.toISOString())
                .limit(1),
        ]);

        const group = profile ? deriveResearchGroup(profile.research_id) : '';

        if (error) throw error;

        // today is already the UTC instant of Sri Lanka local midnight, so "+1 day" is a
        // plain 24h offset — not UTC calendar-field arithmetic, which would drift since
        // that instant doesn't fall on a UTC day boundary.
        const nextReset = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const hasEntry = data && data.length > 0;
        const completed = hasEntry && data[0].stress_level !== null;
        const videoPlaySeconds = hasEntry ? (data[0].video_play_seconds || 0) : 0;

        return { completed, nextReset, videoPlaySeconds, group };
    }

    // Submit or update today's daily entry.
    public async submitDailyEntry(userId: string, entryData: any) {
        const today = startOfToday();

        // Profile lookup and today's existing-entry check are independent reads, run concurrently.
        const [{ data: profile }, { data: existing, error: existingError }] = await Promise.all([
            supabase.from('profiles').select('research_id').eq('id', userId).single(),
            supabase
                .from('daily_sliders')
                .select('id, stress_level')
                .eq('user_id', userId)
                .gte('created_at', today.toISOString())
                .limit(1)
                .single(),
        ]);

        // PGRST116 ("no rows") is expected; any other error must not be swallowed or it'd silently bypass the once-a-day lockout below.
        if (existingError && existingError.code !== 'PGRST116') throw existingError;

        const isControlGroup = deriveResearchGroup(profile?.research_id) === 'cg';

        // Control group (.cg) may only submit once per day; block updates once completed
        if (isControlGroup && existing && existing.stress_level !== null) {
            const err = new Error('DAILY_ALREADY_SUBMITTED') as any;
            err.status = 409;
            throw err;
        }

        const payload = {
            user_id: userId,
            stress_level: entryData.stress_level,
            calm_before: entryData.calm_before,
            calm_after: entryData.calm_after,
            sleep_quality: entryData.sleep_quality,
            sleep_start_time: entryData.sleep_start_time || null,
            wake_up_time: entryData.wake_up_time || null,
            feelings: entryData.feelings || null,
            mindfulness_practice: isControlGroup ? null : (entryData.mindfulness_practice || null),
            practice_duration: isControlGroup ? null : (entryData.practice_duration || null),
            practice_location: isControlGroup ? null : (entryData.practice_location || null),
        };

        // Upsert on (user_id, entry_date) instead of select-then-insert/update — closes the double-submit race that would otherwise produce duplicate rows for the same day.
        const { data, error } = await supabase
            .from('daily_sliders')
            .upsert(payload, { onConflict: 'user_id,entry_date' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Increment video watch seconds for today's entry.
    public async updateVideoProgress(userId: string, seconds: number) {
        // Atomic INSERT ... ON CONFLICT DO UPDATE via a DB function — closes the same race as submitDailyEntry for these frequent video-progress pings.
        const { data, error } = await supabase.rpc('increment_daily_video_seconds', {
            p_user_id: userId,
            p_seconds: seconds,
        });
        if (error) throw error;

        return { success: true, video_play_seconds: data?.video_play_seconds };
    }
}
