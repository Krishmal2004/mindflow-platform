import { supabase } from '../config/supabase';

/** Reverse scoring: Score = 6 - UserRating. */
const reverseScore = (val: number): number => 6 - val;

export class MindfulService {
    /** Check if user has submitted FFMQ-15 in the last 30 days. */
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

    /** Submit FFMQ-15 entry with facet scoring. */
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

        const payload: Record<string, any> = {
            user_id: userId,
            observing_score: observingScore,
            describing_score: describingScore,
            awareness_score: awarenessScore,
            non_judging_score: nonJudgingScore,
            non_reactivity_score: nonReactivityScore,
            created_at: new Date().toISOString(),
        };

        for (const q of questions) payload[q] = entry[q];
        if (typeof entry.duration === 'number') payload.duration = entry.duration;

        const { data, error } = await supabase
            .from('questionnaire_ffmq15_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
