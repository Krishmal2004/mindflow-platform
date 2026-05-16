import { supabase } from '../config/supabase';

export class DailyService {
    // Check if user has submitted today (and completed the core sliders)
    public async getDailyStatus(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('daily_sliders')
            .select('stress_level')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .not('stress_level', 'is', null) // Only count as done if stress_level is filled
            .limit(1);

        if (error) throw error;

        const nextReset = new Date(today);
        nextReset.setDate(today.getDate() + 1);

        return { completed: data && data.length > 0, nextReset };
    }

    // Submit a new daily entry
    public async submitDailyEntry(userId: string, entryData: any) {
        // Upsert based on potentially existing entry for the day (e.g. from video watching)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // check existing
        const { data: existing } = await supabase
            .from('daily_sliders')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1)
            .single();

        const payload = {
            user_id: userId,
            stress_level: entryData.stress_level,
            mood: entryData.mood,
            sleep_quality: entryData.sleep_quality,
            relaxation_level: entryData.relaxation_level,
            sleep_start_time: entryData.sleep_start_time || null,
            wake_up_time: entryData.wake_up_time || null,
            feelings: entryData.feelings || null,
            mindfulness_practice: entryData.mindfulness_practice || null,
            practice_duration: entryData.practice_duration || null,
            practice_log: entryData.practice_log || null,
        };

        let result;
        if (existing) {
            result = await supabase
                .from('daily_sliders')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from('daily_sliders')
                .insert({
                    ...payload,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;
        return result.data;
    }

    // Update video progress
    public async updateVideoProgress(userId: string, seconds: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for existing entry today
        const { data: existing } = await supabase
            .from('daily_sliders')
            .select('id, video_play_seconds')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1)
            .single();

        if (existing) {
            // Update existing
            const newSeconds = (existing.video_play_seconds || 0) + seconds;
            const { error } = await supabase
                .from('daily_sliders')
                .update({ video_play_seconds: newSeconds })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabase
                .from('daily_sliders')
                .insert({
                    user_id: userId,
                    video_play_seconds: seconds,
                    created_at: new Date().toISOString()
                });
            if (error) throw error;
        }
        return { success: true };
    }

    // Get recent history for graphs
    public async getRecentHistory(userId: string, days: number = 7) {
        const { data, error } = await supabase
            .from('daily_sliders')
            .select('created_at, stress_level, mood, sleep_quality, relaxation_level')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(days);

        if (error) throw error;

        // Return in chronological order for graphs
        return data?.reverse() || [];
    }
}
