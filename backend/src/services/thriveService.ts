import { supabase } from '../config/supabase';

export class ThriveService {
    /** Check if user has submitted WEMWBS-14 in the last 14 days. */
    public async getThriveStatus(userId: string) {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data, error } = await supabase
            .from('questionnaire_wemwbs14_responses')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', fourteenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const last = data?.[0];
        let nextReset: Date | null = null;
        if (last) {
            nextReset = new Date(last.created_at);
            nextReset.setDate(nextReset.getDate() + 14);
        }

        return { completed: !!last, nextReset };
    }

    /** Submit WEMWBS-14 response (validated at controller layer). */
    public async submitThriveEntry(userId: string, entry: Record<string, number>) {
        const questions = Array.from({ length: 14 }, (_, i) => `q${i + 1}`);

        const payload: Record<string, any> = {
            user_id: userId,
            created_at: new Date().toISOString(),
        };
        for (const q of questions) payload[q] = entry[q];
        if (typeof entry.duration === 'number') payload.duration = entry.duration;

        const { data, error } = await supabase
            .from('questionnaire_wemwbs14_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
