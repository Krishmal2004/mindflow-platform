import { supabase } from '../config/supabase';
import { startOfToday } from '../utils/date';
import { deriveResearchGroup } from '../utils/researchGroup';

export class DailyService {
    /** Check if user has submitted today's daily sliders. */
    public async getDailyStatus(userId: string) {
        const today = startOfToday();

        // Fetch user's profile to retrieve research_id for study arm segmentation
        const { data: profile } = await supabase
            .from('profiles')
            .select('research_id')
            .eq('id', userId)
            .single();

        const group = profile ? deriveResearchGroup(profile.research_id) : '';

        const { data, error } = await supabase
            .from('daily_sliders')
            .select('stress_level, video_play_seconds')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1);

        if (error) throw error;

        const nextReset = new Date(today);
        nextReset.setDate(today.getDate() + 1);

        const hasEntry = data && data.length > 0;
        const completed = hasEntry && data[0].stress_level !== null;
        const videoPlaySeconds = hasEntry ? (data[0].video_play_seconds || 0) : 0;

        return { completed, nextReset, videoPlaySeconds, group };
    }

    /** Submit or update today's daily entry. */
    public async submitDailyEntry(userId: string, entryData: any) {
        const today = startOfToday();

        const { data: existing } = await supabase
            .from('daily_sliders')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1)
            .single();

        // Fetch user's profile to retrieve research_id for study arm segmentation
        const { data: profile } = await supabase
            .from('profiles')
            .select('research_id')
            .eq('id', userId)
            .single();

        const isControlGroup = profile?.research_id?.endsWith('.cg');

        const payload = {
            user_id: userId,
            stress_level: entryData.stress_level,
            mood: entryData.mood,
            sleep_quality: entryData.sleep_quality,
            relaxation_level: entryData.relaxation_level,
            sleep_start_time: entryData.sleep_start_time || null,
            wake_up_time: entryData.wake_up_time || null,
            feelings: entryData.feelings || null,
            mindfulness_practice: isControlGroup ? null : (entryData.mindfulness_practice || null),
            practice_duration: isControlGroup ? null : (entryData.practice_duration || null),
            practice_log: isControlGroup ? null : (entryData.practice_log || null),
        };

        let result;
        if (existing) {
            result = await supabase.from('daily_sliders').update(payload).eq('id', existing.id).select().single();
        } else {
            result = await supabase.from('daily_sliders').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        }

        if (result.error) throw result.error;
        return result.data;
    }

    /** Increment video watch seconds for today's entry. */
    public async updateVideoProgress(userId: string, seconds: number) {
        const today = startOfToday();

        const { data: existing } = await supabase
            .from('daily_sliders')
            .select('id, video_play_seconds')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('daily_sliders')
                .update({ video_play_seconds: (existing.video_play_seconds || 0) + seconds })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('daily_sliders')
                .insert({ user_id: userId, video_play_seconds: seconds, created_at: new Date().toISOString() });
            if (error) throw error;
        }

        return { success: true };
    }
}
