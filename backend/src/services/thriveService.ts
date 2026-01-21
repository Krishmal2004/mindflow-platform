import { supabase } from '../config/supabase';

export class ThriveService {
    // Check if user has submitted today
    public async getThriveStatus(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('questionnaire_wemwbs14_responses')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1);

        if (error) throw error;
        return { completed: data && data.length > 0 };
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

        const payload = {
            user_id: userId,
            ...entryData,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('questionnaire_wemwbs14_responses')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
