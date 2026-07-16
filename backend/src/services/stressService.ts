import { supabase } from '../config/supabase';

export class StressService {
    // Check if user has submitted PSS-10 in the last 30 days.
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

    // Submit PSS-10 response (validated at controller layer).
    public async submitStressEntry(userId: string, entry: Record<string, number>) {
        // Rolling 30-day lockout has no fixed period to key a UNIQUE constraint on, so submit_stress_entry (project_db.sql) enforces it atomically via a per-user Postgres advisory lock instead.
        const { data, error } = await supabase.rpc('submit_stress_entry', {
            p_user_id: userId,
            p_q1: entry.q1, p_q2: entry.q2, p_q3: entry.q3, p_q4: entry.q4, p_q5: entry.q5,
            p_q6: entry.q6, p_q7: entry.q7, p_q8: entry.q8, p_q9: entry.q9, p_q10: entry.q10,
            p_duration: typeof entry.duration === 'number' ? entry.duration : null,
        });

        if (error) {
            if (error.message?.includes('STRESS_ALREADY_SUBMITTED')) {
                const err = new Error('STRESS_ALREADY_SUBMITTED') as any;
                err.status = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }
}
