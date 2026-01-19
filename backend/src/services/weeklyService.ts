import { supabase } from '../app';
import { r2, BUCKET_NAME, PUBLIC_URL_BASE } from '../config/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

    // Generate Presigned URL (Optional: Kept for reference or mobile use)
    public async getUploadUrl(userId: string) {
        const [year, week] = this.getWeekNumber(new Date());
        const weekStr = week.toString().padStart(2, '0');
        const fileName = `weekly-${year}-W${weekStr}-${userId}.wav`;
        const fileKey = `WeeklyVoice/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            ContentType: 'audio/wav',
        });

        // Expires in 5 minutes
        const url = await getSignedUrl(r2, command, { expiresIn: 300 });

        return {
            url,
            fileKey,
            fileUrl: `${PUBLIC_URL_BASE}/${fileKey}`
        };
    }

    // Proxy Upload: Receive Buffer and Upload to R2
    public async uploadAudio(userId: string, fileBuffer: Buffer, mimeType: string) {
        const [year, week] = this.getWeekNumber(new Date());
        const weekStr = week.toString().padStart(2, '0');
        const fileName = `weekly-${year}-W${weekStr}-${userId}.wav`;
        const fileKey = `WeeklyVoice/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: mimeType || 'audio/wav',
        });

        await r2.send(command);

        return {
            fileKey,
            fileUrl: `${PUBLIC_URL_BASE}/${fileKey}`
        };
    }

    public async getWeeklyVideo() {
        const [year, week] = this.getWeekNumber(new Date());

        const { data, error } = await supabase
            .from('weekly_recordings')
            .select('*')
            .eq('week_no', week)
            .order('published_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found
        return data || null;
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
