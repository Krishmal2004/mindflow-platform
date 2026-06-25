import cron from 'node-cron';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

/**
 * Daily reminder jobs, on the server's local timezone:
 *  - 8:00 AM: morning greeting to every registered device.
 *  - 7:00 PM: "hurry up" nudge naming whichever roadmap tasks are still pending.
 */
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
