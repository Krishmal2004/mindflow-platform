import { supabase } from '../config/supabase';

export class StressService {
    // Check if user has submitted in the last 30 days
    public async getStressStatus(userId: string) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const { data, error } = await supabase
            .from('questionnaire_pss10_responses')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const lastSubmission = data && data[0];
        let nextReset: Date | null = null;

        if (lastSubmission) {
            const lastDate = new Date(lastSubmission.created_at);
            nextReset = new Date(lastDate);
            nextReset.setDate(lastDate.getDate() + 30);
        }

        return {
            completed: !!lastSubmission,
            nextReset
        };
    }

    // Submit a new stress entry (PSS-10)
    public async submitStressEntry(userId: string, entryData: any) {
        // Validation: Ensure all 10 questions are present
        const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
        for (const q of questions) {
            if (!entryData[q] || entryData[q] < 1 || entryData[q] > 5) {
                throw new Error(`Invalid answer for ${q}. Must be between 1 and 5.`);
            }
        }

        const payload: Record<string, any> = {
            user_id: userId,
            created_at: new Date().toISOString()
        };
        for (const q of questions) {
            payload[q] = entryData[q];
        }
        if (typeof entryData.duration === 'number') {
            payload.duration = entryData.duration;
        }

        const { data, error } = await supabase
            .from('questionnaire_pss10_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
