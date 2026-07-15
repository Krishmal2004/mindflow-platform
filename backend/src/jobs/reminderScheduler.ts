import cron from 'node-cron';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

// Cron jobs run on the server's local timezone: 8am morning greeting, 7pm pending-task nudge.
export function startReminderScheduler(): void {
    cron.schedule('0 8 * * *', async () => {
        try {
            const result = await notificationService.sendMorningGreetings();
            console.log(`[Reminders] Morning greetings sent: ${result.sent}`);
        } catch (error) {
            console.error('[Reminders] Morning greeting job failed:', error);
        }
    }, { name: 'morning-greeting' });

    cron.schedule('0 19 * * *', async () => {
        try {
            const result = await notificationService.sendPendingTaskReminders();
            console.log(`[Reminders] Pending-task reminders sent: ${result.sent}`);
        } catch (error) {
            console.error('[Reminders] Pending-task reminder job failed:', error);
        }
    }, { name: 'pending-task-reminder' });
}
