import { supabase } from '../config/supabase';

interface FFMQResponse {
    user_id: string;
    q1: number; q2: number; q3: number; q4: number; q5: number;
    q6: number; q7: number; q8: number; q9: number; q10: number;
    q11: number; q12: number; q13: number; q14: number; q15: number;
    duration: number;
}

export class MindfulService {
    // Check if user has submitted today
    public async getMindfulStatus(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('questionnaire_ffmq15_responses')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1);

        if (error) throw error;
        return { completed: data && data.length > 0 };
    }

    // Submit a new FFMQ entry
    public async submitMindfulEntry(userId: string, entryData: any) {
        const questions = Array.from({ length: 15 }, (_, i) => `q${i + 1}`);

        // 1. Validation
        for (const q of questions) {
            if (!entryData[q] || entryData[q] < 1 || entryData[q] > 5) {
                throw new Error(`Invalid answer for ${q}. Must be between 1 and 5.`);
            }
        }

        // 2. Calculate Facet Scores with Reverse Scoring Logic
        // Formula: Score = 6 - UserRating (for reverse items)

        const getScore = (qKey: string, isReverse: boolean): number => {
            const val = entryData[qKey] as number;
            return isReverse ? (6 - val) : val;
        };

        // Facet: Observing (Q1, Q6, Q11) - NO Reverse
        const observingScore =
            getScore('q1', false) +
            getScore('q6', false) +
            getScore('q11', false);

        // Facet: Describing (Q2, Q7, Q12) - Q12 Reverse
        const describingScore =
            getScore('q2', false) +
            getScore('q7', false) +
            getScore('q12', true);

        // Facet: Awareness (Q3, Q8, Q13) - ALL Reverse
        const awarenessScore =
            getScore('q3', true) +
            getScore('q8', true) +
            getScore('q13', true);

        // Facet: Non-Judging (Q4, Q9, Q14) - ALL Reverse
        const nonJudgingScore =
            getScore('q4', true) +
            getScore('q9', true) +
            getScore('q14', true);

        // Facet: Non-Reactivity (Q5, Q10, Q15) - NO Reverse
        const nonReactivityScore =
            getScore('q5', false) +
            getScore('q10', false) +
            getScore('q15', false);

        // 3. Prepare Payload
        const payload = {
            user_id: userId,
            ...entryData,
            observing_score: observingScore,
            describing_score: describingScore,
            awareness_score: awarenessScore,
            non_judging_score: nonJudgingScore,
            non_reactivity_score: nonReactivityScore,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('questionnaire_ffmq15_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
