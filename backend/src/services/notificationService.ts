import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { supabase } from '../config/supabase';
import { DailyService } from './dailyService';
import { WeeklyService } from './weeklyService';
import { ThriveService } from './thriveService';
import { StressService } from './stressService';
import { MindfulService } from './mindfulService';

const dailyService = new DailyService();
const weeklyService = new WeeklyService();
const thriveService = new ThriveService();
const stressService = new StressService();
const mindfulService = new MindfulService();

const expo = new Expo();

// Mirrors the labels shown on the mobile DashboardScreen's roadmap nodes (JOURNEY_STEPS),
// so the reminder text matches what the user sees in the app.
const TASK_LABELS: Record<string, string> = {
    daily: 'Daily Sliders',
    weekly: 'Weekly Whispers',
    thrive: 'Thrive Tracker',
    stress: 'Stress Snapshot',
    mindful: 'Mindful Mirror',
};

export class NotificationService {
    public async registerToken(userId: string, token: string, platform?: string) {
        if (!Expo.isExpoPushToken(token)) {
            throw new Error('Invalid Expo push token');
        }

        const { error } = await supabase
            .from('push_tokens')
            .upsert({ user_id: userId, expo_push_token: token, platform }, { onConflict: 'expo_push_token' });

        if (error) throw error;
        return { success: true };
    }

    public async removeToken(token: string) {
        const { error } = await supabase.from('push_tokens').delete().eq('expo_push_token', token);
        if (error) throw error;
        return { success: true };
    }

    /** Sends the "Good morning, have you done today's tasks?" push to every registered device. */
    public async sendMorningGreetings() {
        const tokensByUser = await this.getTokensByUser();
        if (tokensByUser.size === 0) return { sent: 0 };

        const nameByUser = await this.getNamesByUser([...tokensByUser.keys()]);

        const messages: ExpoPushMessage[] = [];
        for (const [userId, tokens] of tokensByUser) {
            const name = nameByUser.get(userId) || 'there';
            for (const token of tokens) {
                messages.push({
                    to: token,
                    sound: 'default',
                    title: 'Good Morning! ☀️',
                    body: `Hi ${name}, Good Morning! Have you done today's tasks?`,
                    data: { type: 'morning-greeting' },
                });
            }
        }

        return this.sendChunked(messages);
    }

    /** Sends a "hurry up" nudge naming whichever of the 5 roadmap tasks are still pending. */
    public async sendPendingTaskReminders() {
        const tokensByUser = await this.getTokensByUser();
        if (tokensByUser.size === 0) return { sent: 0 };

        const userIds = [...tokensByUser.keys()];
        const nameByUser = await this.getNamesByUser(userIds);

        const messages: ExpoPushMessage[] = [];
        for (const userId of userIds) {
            const pending = await this.getPendingTaskLabels(userId);
            if (pending.length === 0) continue;

            const name = nameByUser.get(userId) || 'there';
            const body = `Hi ${name}, you still have time to do: ${pending.join(', ')}. Hurry up!`;

            for (const token of tokensByUser.get(userId) || []) {
                messages.push({
                    to: token,
                    sound: 'default',
                    title: 'Still time today ⏰',
                    body,
                    data: { type: 'pending-tasks', pending },
                });
            }
        }

        return this.sendChunked(messages);
    }

    private async getPendingTaskLabels(userId: string): Promise<string[]> {
        const [daily, weekly, thrive, stress, mindful] = await Promise.all([
            dailyService.getDailyStatus(userId),
            weeklyService.getWeeklyStatus(userId),
            thriveService.getThriveStatus(userId),
            stressService.getStressStatus(userId),
            mindfulService.getMindfulStatus(userId),
        ]);

        const statuses: Record<string, { completed: boolean }> = { daily, weekly, thrive, stress, mindful };

        return Object.entries(statuses)
            .filter(([, status]) => !status.completed)
            .map(([key]) => TASK_LABELS[key]);
    }

    private async getTokensByUser(): Promise<Map<string, string[]>> {
        const { data, error } = await supabase.from('push_tokens').select('user_id, expo_push_token');
        if (error) throw error;

        const tokensByUser = new Map<string, string[]>();
        for (const row of data || []) {
            if (!Expo.isExpoPushToken(row.expo_push_token)) continue;
            const tokens = tokensByUser.get(row.user_id) ?? [];
            tokens.push(row.expo_push_token);
            tokensByUser.set(row.user_id, tokens);
        }
        return tokensByUser;
    }

    private async getNamesByUser(userIds: string[]): Promise<Map<string, string>> {
        if (userIds.length === 0) return new Map();

        const { data, error } = await supabase.from('profiles').select('id, username').in('id', userIds);
        if (error) throw error;

        return new Map((data || []).map((p) => [p.id, p.username || 'there']));
    }

    private async sendChunked(messages: ExpoPushMessage[]): Promise<{ sent: number }> {
        if (messages.length === 0) return { sent: 0 };

        let sent = 0;
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const receipts = await expo.sendPushNotificationsAsync(chunk);
                for (const receipt of receipts) {
                    if (receipt.status === 'ok') sent++;
                    else console.error('[NotificationService] Push delivery error:', receipt);
                }
            } catch (error) {
                console.error('[NotificationService] Failed to send chunk:', error);
            }
        }
        return { sent };
    }
}
