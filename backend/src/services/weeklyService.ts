import { supabase } from '../app';

export class WeeklyService {
    private getWeekNumber(d: Date): [number, number] {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
        return [d.getUTCFullYear(), weekNo];
    }

    public async getWeeklyStatus(userId: string) {
        const [year, week] = this.getWeekNumber(new Date());

        const { data, error } = await supabase
            .from('voice_recordings')
            .select('id')
            .eq('user_id', userId)
            .eq('week_number', week)
            .eq('year', year)
            .limit(1);

        if (error) throw error;
        return { completed: data && data.length > 0, week, year };
    }

    // Submit metadata for the uploaded recording
    public async submitWeeklyEntry(userId: string, recordingData: { file_url: string, file_key: string, duration?: number }) {
        const [year, week] = this.getWeekNumber(new Date());

        const { data, error } = await supabase
            .from('voice_recordings')
            .insert({
                user_id: userId,
                week_number: week,
                year: year,
                file_url: recordingData.file_url,
                file_key: recordingData.file_key,
                // duration: recordingData.duration // if backend db supports it
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
