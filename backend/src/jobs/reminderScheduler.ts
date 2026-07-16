import cron from 'node-cron';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

// Fixed to the study cohort's local time (Sri Lanka), not the deploy host's ambient
// timezone — a host provisioned with TZ=UTC (the common default) would otherwise fire
// these hours off from the intended 8am/7pm local. 8am morning greeting, 7pm pending-task nudge.
const STUDY_TIMEZONE = 'Asia/Colombo';

export function startReminderScheduler(): void {
    cron.schedule('0 8 * * *', async () => {
        try {
            const result = await notificationService.sendMorningGreetings();
            console.log(`[Reminders] Morning greetings sent: ${result.sent}`);
        } catch (error) {
            console.error('[Reminders] Morning greeting job failed:', error);
        }
    }, { name: 'morning-greeting', timezone: STUDY_TIMEZONE });

    cron.schedule('0 19 * * *', async () => {
        try {
            const result = await notificationService.sendPendingTaskReminders();
            console.log(`[Reminders] Pending-task reminders sent: ${result.sent}`);
        } catch (error) {
            console.error('[Reminders] Pending-task reminder job failed:', error);
        }
    }, { name: 'pending-task-reminder', timezone: STUDY_TIMEZONE });
}
