// Package jobs runs backend-v2's background cron schedule.
package jobs

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// studyTimezone is fixed to the study cohort's local time (Sri Lanka),
// not the deploy host's ambient timezone -- a host provisioned with
// TZ=UTC (the common default) would otherwise fire these hours off from
// the intended 8am/7pm local. 8am morning greeting, 7pm pending-task
// nudge -- see reminderScheduler.ts.
const studyTimezone = "Asia/Colombo"

// StartReminderScheduler registers the two Asia/Colombo-pinned cron jobs
// and starts the scheduler in the background. Returns the cron.Cron so
// main can Stop() it during graceful shutdown.
func StartReminderScheduler(notificationSvc *services.NotificationService) (*cron.Cron, error) {
	loc, err := time.LoadLocation(studyTimezone)
	if err != nil {
		return nil, err
	}
	c := cron.New(cron.WithLocation(loc))

	if _, err := c.AddFunc("0 8 * * *", func() {
		sent, err := notificationSvc.SendMorningGreetings(context.Background())
		if err != nil {
			log.Printf("[Reminders] Morning greeting job failed: %v", err)
			return
		}
		log.Printf("[Reminders] Morning greetings sent: %d", sent)
	}); err != nil {
		return nil, err
	}

	if _, err := c.AddFunc("0 19 * * *", func() {
		sent, err := notificationSvc.SendPendingTaskReminders(context.Background())
		if err != nil {
			log.Printf("[Reminders] Pending-task reminder job failed: %v", err)
			return
		}
		log.Printf("[Reminders] Pending-task reminders sent: %d", sent)
	}); err != nil {
		return nil, err
	}

	c.Start()
	return c, nil
}
