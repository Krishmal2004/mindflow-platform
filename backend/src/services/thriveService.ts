import { supabase } from '../config/supabase';

export class ThriveService {
    // Check if user has submitted WEMWBS-14 in the last 14 days.
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

    // Submit WEMWBS-14 response (validated at controller layer).
    public async submitThriveEntry(userId: string, entry: Record<string, number>) {
        // Rolling 14-day lockout has no fixed period to key a UNIQUE constraint on, so submit_thrive_entry (project_db.sql) enforces it atomically via a per-user Postgres advisory lock instead.
        const { data, error } = await supabase.rpc('submit_thrive_entry', {
            p_user_id: userId,
            p_q1: entry.q1, p_q2: entry.q2, p_q3: entry.q3, p_q4: entry.q4, p_q5: entry.q5,
            p_q6: entry.q6, p_q7: entry.q7, p_q8: entry.q8, p_q9: entry.q9, p_q10: entry.q10,
            p_q11: entry.q11, p_q12: entry.q12, p_q13: entry.q13, p_q14: entry.q14,
            p_duration: typeof entry.duration === 'number' ? entry.duration : null,
        });

        if (error) {
            if (error.message?.includes('THRIVE_ALREADY_SUBMITTED')) {
                const err = new Error('THRIVE_ALREADY_SUBMITTED') as any;
                err.status = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }
}
