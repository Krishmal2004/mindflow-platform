package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/researchgroup"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/testutil"
)

func TestReadOnlyServices_Integration(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()

	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}

	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("inserting test user: %v", err)
	}

	t.Run("profile service: trigger-created blank profile", func(t *testing.T) {
		svc := services.NewProfileService(q)
		profile, err := svc.GetProfile(ctx, pgUserID)
		if err != nil {
			t.Fatalf("GetProfile: %v", err)
		}
		if profile.Username != nil {
			t.Errorf("Username = %v, want nil (trigger sets no username)", *profile.Username)
		}
		if profile.ResearchID != nil {
			t.Errorf("ResearchID = %v, want nil", *profile.ResearchID)
		}
	})

	t.Run("about-me service: trigger-created row (not the no-row fallback)", func(t *testing.T) {
		svc := services.NewProfileService(q)
		about, err := svc.GetAboutMe(ctx, pgUserID)
		if err != nil {
			t.Fatalf("GetAboutMe: %v", err)
		}
		if about.IsCompleted {
			t.Error("IsCompleted = true, want false for a freshly-triggered row")
		}
		if about.UniversityID != nil {
			t.Errorf("UniversityID = %v, want nil", *about.UniversityID)
		}
		if about.CreatedAt == nil {
			t.Error("CreatedAt = nil, want a timestamp (row exists, unlike the fallback branch)")
		}
	})

	t.Run("about-me service: no-row fallback shape", func(t *testing.T) {
		svc := services.NewProfileService(q)
		neverSignedUp := pgtype.UUID{Bytes: uuid.New(), Valid: true}
		about, err := svc.GetAboutMe(ctx, neverSignedUp)
		if err != nil {
			t.Fatalf("GetAboutMe: %v", err)
		}
		if about.IsCompleted {
			t.Error("IsCompleted = true, want false")
		}
		if about.CreatedAt != nil {
			t.Error("CreatedAt should be omitted (nil) in the no-row fallback, matching profileService.ts")
		}
	})

	t.Run("dashboard service: one entry today", func(t *testing.T) {
		if _, err := pool.Exec(ctx, `UPDATE profiles SET research_id = $2 WHERE id = $1`, userID, "MF-TEST-001.ex"); err != nil {
			t.Fatalf("setting research_id: %v", err)
		}
		if _, err := pool.Exec(ctx, `INSERT INTO daily_sliders (user_id, stress_level, calm_before, calm_after, sleep_quality, created_at) VALUES ($1, 3, 3, 4, 4, NOW())`, userID); err != nil {
			t.Fatalf("inserting daily_sliders: %v", err)
		}

		svc := services.NewDashboardService(q)
		summary, err := svc.GetUserSummary(ctx, pgUserID)
		if err != nil {
			t.Fatalf("GetUserSummary: %v", err)
		}
		if !summary.Status.DailyDone {
			t.Error("Status.DailyDone = false, want true")
		}
		if summary.Streak != 1 {
			t.Errorf("Streak = %d, want 1", summary.Streak)
		}
		if summary.TotalCompleted != 1 {
			t.Errorf("TotalCompleted = %d, want 1", summary.TotalCompleted)
		}
		if summary.Group != researchgroup.Experimental {
			t.Errorf("Group = %q, want %q", summary.Group, researchgroup.Experimental)
		}
	})

	t.Run("calendar service: control group filters mindfulness sessions", func(t *testing.T) {
		today := time.Now().Format("2006-01-02")
		if _, err := pool.Exec(ctx, `INSERT INTO calendar_events (title, event_date) VALUES ($1, $2), ($3, $2)`,
			"Mindfulness Session: Breathing", today, "Study Check-in"); err != nil {
			t.Fatalf("inserting calendar_events: %v", err)
		}

		cgUser := uuid.New()
		if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, cgUser); err != nil {
			t.Fatalf("inserting cg test user: %v", err)
		}
		if _, err := pool.Exec(ctx, `UPDATE profiles SET research_id = $2 WHERE id = $1`, cgUser, "MF-TEST-002.cg"); err != nil {
			t.Fatalf("setting cg research_id: %v", err)
		}

		start := pgtype.Date{Time: time.Now().AddDate(0, 0, -1), Valid: true}
		end := pgtype.Date{Time: time.Now().AddDate(0, 0, 1), Valid: true}

		svc := services.NewCalendarService(q)

		exEvents, err := svc.GetCalendarEvents(ctx, pgUserID, start, end)
		if err != nil {
			t.Fatalf("GetCalendarEvents (ex): %v", err)
		}
		if len(exEvents) != 2 {
			t.Errorf("ex group sees %d events, want 2 (unfiltered)", len(exEvents))
		}

		cgEvents, err := svc.GetCalendarEvents(ctx, pgtype.UUID{Bytes: cgUser, Valid: true}, start, end)
		if err != nil {
			t.Fatalf("GetCalendarEvents (cg): %v", err)
		}
		if len(cgEvents) != 1 {
			t.Fatalf("cg group sees %d events, want 1 (mindfulness session filtered)", len(cgEvents))
		}
		if cgEvents[0].Title != "Study Check-in" {
			t.Errorf("cg group's visible event = %q, want %q", cgEvents[0].Title, "Study Check-in")
		}
	})

	t.Run("journey status: fans out without spurious error fallback", func(t *testing.T) {
		freshUser := uuid.New()
		if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, freshUser); err != nil {
			t.Fatalf("inserting fresh test user: %v", err)
		}
		freshPgID := pgtype.UUID{Bytes: freshUser, Valid: true}

		daily := services.NewDailyService(q)
		weekly := services.NewWeeklyService(q, nil) // GetWeeklyStatus never touches R2
		thrive := services.NewThriveService(q)
		stress := services.NewStressService(q)
		mindful := services.NewMindfulService(q)
		journey := services.NewJourneyService(q, daily, weekly, thrive, stress, mindful)

		status := journey.GetJourneyStatus(ctx, freshPgID)

		dailyStatus, ok := status.Daily.(services.DailyStatus)
		if !ok {
			t.Fatalf("Daily = %#v (%T), want services.DailyStatus (no fallback)", status.Daily, status.Daily)
		}
		if dailyStatus.Completed {
			t.Error("fresh user's daily status Completed = true, want false")
		}

		thriveStatus, ok := status.Thrive.(services.ThriveStatus)
		if !ok {
			t.Fatalf("Thrive = %#v (%T), want services.ThriveStatus (no fallback)", status.Thrive, status.Thrive)
		}
		if thriveStatus.Completed {
			t.Error("fresh user's thrive status Completed = true, want false")
		}
	})
}
