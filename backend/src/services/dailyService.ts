import { supabase } from '../app';

export class DailyService {
    // Check if user has submitted today
    public async getDailyStatus(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('daily_sliders')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .limit(1);

        if (error) throw error;
        return { completed: data && data.length > 0 };
    }

    // Submit a new daily entry
    public async submitDailyEntry(userId: string, entryData: any) {
        // Basic validation could go here

        // Prepare data for insertion
        const payload = {
            user_id: userId,
            ...entryData,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('daily_sliders')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
