import { supabase } from '../config/supabase';
import { r2, BUCKET_NAME, PUBLIC_URL_BASE } from '../config/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getISOWeekNumber } from '../utils/date';

export class WeeklyService {
    /** Check if user has submitted a recording this ISO week. */
    public async getWeeklyStatus(userId: string) {
        const [year, week] = getISOWeekNumber(new Date());

        const { data, error } = await supabase
            .from('voice_recordings')
            .select('id')
            .eq('user_id', userId)
            .eq('week_number', week)
            .eq('year', year)
            .limit(1);

        if (error) throw error;

        // Next Monday as reset boundary
        const now = new Date();
        const nextReset = new Date(now);
        nextReset.setDate(now.getDate() + (8 - (now.getDay() || 7)));
        nextReset.setHours(0, 0, 0, 0);

        return { completed: !!(data?.length), week, year, nextReset };
    }

    /** Generate a presigned upload URL for direct client upload. */
    public async getUploadUrl(userId: string) {
        const [year, week] = getISOWeekNumber(new Date());
        const fileKey = `WeeklyVoice/weekly-${year}-W${week.toString().padStart(2, '0')}-${userId}.wav`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            ContentType: 'audio/wav',
        });

        const url = await getSignedUrl(r2, command, { expiresIn: 300 });
        return { url, fileKey, fileUrl: `${PUBLIC_URL_BASE}/${fileKey}` };
    }

    /** Proxy upload: receives buffer from multer and uploads to R2. */
    public async uploadAudio(userId: string, fileBuffer: Buffer, mimeType: string) {
        const [year, week] = getISOWeekNumber(new Date());
        const fileKey = `WeeklyVoice/weekly-${year}-W${week.toString().padStart(2, '0')}-${userId}.wav`;

        await r2.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: mimeType || 'audio/wav',
        }));

        return { fileKey, fileUrl: `${PUBLIC_URL_BASE}/${fileKey}` };
    }

    /** Fetch the admin-published weekly video for this week. */
    public async getWeeklyVideo() {
        const [, week] = getISOWeekNumber(new Date());

        const { data, error } = await supabase
            .from('weekly_recordings')
            .select('*')
            .eq('week_no', week)
            .order('published_at', { ascending: false })
            .limit(1)
            .single();

        // PGRST116 = "not found" — expected when no video published
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    /** Save recording metadata after successful upload. */
    public async submitWeeklyEntry(userId: string, recordingData: { file_url: string; file_key: string; duration?: number }) {
        const [year, week] = getISOWeekNumber(new Date());

        const { data, error } = await supabase
            .from('voice_recordings')
            .insert({
                user_id: userId,
                week_number: week,
                year,
                file_url: recordingData.file_url,
                file_key: recordingData.file_key,
                duration: recordingData.duration,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
