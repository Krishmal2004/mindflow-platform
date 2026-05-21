import { supabase } from '../config/supabase';

export class StressService {
    /** Check if user has submitted PSS-10 in the last 30 days. */
    public async getStressStatus(userId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from('questionnaire_pss10_responses')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const last = data?.[0];
        let nextReset: Date | null = null;
        if (last) {
            nextReset = new Date(last.created_at);
            nextReset.setDate(nextReset.getDate() + 30);
        }

        return { completed: !!last, nextReset };
    }

    /** Submit PSS-10 response (validated at controller layer). */
    public async submitStressEntry(userId: string, entry: Record<string, number>) {
        const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

        const payload: Record<string, any> = {
            user_id: userId,
            created_at: new Date().toISOString(),
        };
        for (const q of questions) payload[q] = entry[q];
        if (typeof entry.duration === 'number') payload.duration = entry.duration;

        const { data, error } = await supabase
            .from('questionnaire_pss10_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
