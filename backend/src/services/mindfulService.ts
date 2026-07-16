import { supabase } from '../config/supabase';

// Reverse scoring: Score = 6 - UserRating.
const reverseScore = (val: number): number => 6 - val;

export class MindfulService {
    // Check if user has submitted FFMQ-15 in the last 30 days.
    public async getMindfulStatus(userId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from('questionnaire_ffmq15_responses')
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

    // Submit FFMQ-15 entry with facet scoring.
    public async submitMindfulEntry(userId: string, entry: Record<string, number>) {
        const questions = Array.from({ length: 15 }, (_, i) => `q${i + 1}`);

        // Validate all 15 answers
        for (const q of questions) {
            if (!entry[q] || entry[q] < 1 || entry[q] > 5) {
                throw new Error(`Invalid answer for ${q}. Must be 1–5.`);
            }
        }

        // Facet scores (reverse-scored items noted)
        const observingScore = entry.q1 + entry.q6 + entry.q11;
        const describingScore = entry.q2 + entry.q7 + reverseScore(entry.q12);
        const awarenessScore = reverseScore(entry.q3) + reverseScore(entry.q8) + reverseScore(entry.q13);
        const nonJudgingScore = reverseScore(entry.q4) + reverseScore(entry.q9) + reverseScore(entry.q14);
        const nonReactivityScore = entry.q5 + entry.q10 + entry.q15;

        // Rolling 30-day lockout has no fixed period to key a UNIQUE constraint on, so submit_mindful_entry (project_db.sql) enforces it atomically via a per-user Postgres advisory lock instead.
        const { data, error } = await supabase.rpc('submit_mindful_entry', {
            p_user_id: userId,
            p_q1: entry.q1, p_q2: entry.q2, p_q3: entry.q3, p_q4: entry.q4, p_q5: entry.q5,
            p_q6: entry.q6, p_q7: entry.q7, p_q8: entry.q8, p_q9: entry.q9, p_q10: entry.q10,
            p_q11: entry.q11, p_q12: entry.q12, p_q13: entry.q13, p_q14: entry.q14, p_q15: entry.q15,
            p_observing_score: observingScore,
            p_describing_score: describingScore,
            p_awareness_score: awarenessScore,
            p_non_judging_score: nonJudgingScore,
            p_non_reactivity_score: nonReactivityScore,
            p_duration: typeof entry.duration === 'number' ? entry.duration : null,
        });

        if (error) {
            if (error.message?.includes('MINDFUL_ALREADY_SUBMITTED')) {
                const err = new Error('MINDFUL_ALREADY_SUBMITTED') as any;
                err.status = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }
}
