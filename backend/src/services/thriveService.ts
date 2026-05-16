import { supabase } from '../config/supabase';

export class ThriveService {
    // Check if user has submitted in the last 14 days
    public async getThriveStatus(userId: string) {
        const today = new Date();
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);

        const { data, error } = await supabase
            .from('questionnaire_wemwbs14_responses')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', fourteenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const lastSubmission = data && data[0];
        let nextReset: Date | null = null;

        if (lastSubmission) {
            const lastDate = new Date(lastSubmission.created_at);
            nextReset = new Date(lastDate);
            nextReset.setDate(lastDate.getDate() + 14);
        }

        return {
            completed: !!lastSubmission,
            nextReset
        };
    }

    // Submit a new thrive entry (WEMWBS)
    public async submitThriveEntry(userId: string, entryData: any) {
        // Validation: Ensure all 14 questions are present
        const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14'];
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
            .from('questionnaire_wemwbs14_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
