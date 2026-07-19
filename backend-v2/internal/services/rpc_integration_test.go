package services_test

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/testutil"
)

func stressAnswers(v int32) services.StressAnswers {
	return services.StressAnswers{Q1: v, Q2: v, Q3: v, Q4: v, Q5: v, Q6: v, Q7: v, Q8: v, Q9: v, Q10: v}
}

func thriveAnswers(v int32) services.ThriveAnswers {
	return services.ThriveAnswers{
		Q1: v, Q2: v, Q3: v, Q4: v, Q5: v, Q6: v, Q7: v,
		Q8: v, Q9: v, Q10: v, Q11: v, Q12: v, Q13: v, Q14: v,
	}
}

func mindfulAnswers(v int32) services.MindfulAnswers {
	return services.MindfulAnswers{
		Q1: v, Q2: v, Q3: v, Q4: v, Q5: v, Q6: v, Q7: v, Q8: v, Q9: v, Q10: v,
		Q11: v, Q12: v, Q13: v, Q14: v, Q15: v,
	}
}

func TestSubmitStressEntry_LockoutAndRPCErrorMapping(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	svc := services.NewStressService(q)

	if _, err := svc.SubmitStressEntry(ctx, pgUserID, stressAnswers(3)); err != nil {
		t.Fatalf("first submit: %v", err)
	}

	_, err := svc.SubmitStressEntry(ctx, pgUserID, stressAnswers(4))
	if err == nil {
		t.Fatal("second submit within 30 days: error = nil, want AlreadySubmittedError")
	}
	var already *services.AlreadySubmittedError
	if !errors.As(err, &already) {
		t.Fatalf("second submit error type = %T, want *AlreadySubmittedError", err)
	}
	if already.Code != "STRESS_ALREADY_SUBMITTED" {
		t.Errorf("Code = %q, want STRESS_ALREADY_SUBMITTED", already.Code)
	}
}

func TestSubmitThriveEntry_LockoutAndRPCErrorMapping(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	svc := services.NewThriveService(q)
	if _, err := svc.SubmitThriveEntry(ctx, pgUserID, thriveAnswers(3)); err != nil {
		t.Fatalf("first submit: %v", err)
	}

	_, err := svc.SubmitThriveEntry(ctx, pgUserID, thriveAnswers(4))
	var already *services.AlreadySubmittedError
	if !errors.As(err, &already) || already.Code != "THRIVE_ALREADY_SUBMITTED" {
		t.Fatalf("second submit error = %v, want AlreadySubmittedError{THRIVE_ALREADY_SUBMITTED}", err)
	}
}

func TestSubmitMindfulEntry_FacetScoresAndLockout(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	svc := services.NewMindfulService(q)
	// q1..q15 = 1,2,3,4,5,1,2,3,4,5,1,2,3,4,5 to give distinct, hand-checkable facet sums.
	answers := services.MindfulAnswers{
		Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5,
		Q6: 1, Q7: 2, Q8: 3, Q9: 4, Q10: 5,
		Q11: 1, Q12: 2, Q13: 3, Q14: 4, Q15: 5,
	}
	row, err := svc.SubmitMindfulEntry(ctx, pgUserID, answers)
	if err != nil {
		t.Fatalf("SubmitMindfulEntry: %v", err)
	}

	// observing = q1+q6+q11 = 1+1+1 = 3
	// describing = q2+q7+reverse(q12) = 2+2+(6-2) = 8
	// awareness = reverse(q3)+reverse(q8)+reverse(q13) = (6-3)+(6-3)+(6-3) = 9
	// nonJudging = reverse(q4)+reverse(q9)+reverse(q14) = (6-4)+(6-4)+(6-4) = 6
	// nonReactivity = q5+q10+q15 = 5+5+5 = 15
	wantObserving, wantDescribing, wantAwareness, wantNonJudging, wantNonReactivity := int32(3), int32(8), int32(9), int32(6), int32(15)

	if row.ObservingScore.Int32 != wantObserving {
		t.Errorf("ObservingScore = %d, want %d", row.ObservingScore.Int32, wantObserving)
	}
	if row.DescribingScore.Int32 != wantDescribing {
		t.Errorf("DescribingScore = %d, want %d", row.DescribingScore.Int32, wantDescribing)
	}
	if row.AwarenessScore.Int32 != wantAwareness {
		t.Errorf("AwarenessScore = %d, want %d", row.AwarenessScore.Int32, wantAwareness)
	}
	if row.NonJudgingScore.Int32 != wantNonJudging {
		t.Errorf("NonJudgingScore = %d, want %d", row.NonJudgingScore.Int32, wantNonJudging)
	}
	if row.NonReactivityScore.Int32 != wantNonReactivity {
		t.Errorf("NonReactivityScore = %d, want %d", row.NonReactivityScore.Int32, wantNonReactivity)
	}

	_, err = svc.SubmitMindfulEntry(ctx, pgUserID, answers)
	var already *services.AlreadySubmittedError
	if !errors.As(err, &already) || already.Code != "MINDFUL_ALREADY_SUBMITTED" {
		t.Fatalf("second submit error = %v, want AlreadySubmittedError{MINDFUL_ALREADY_SUBMITTED}", err)
	}
}

func TestSubmitDailyEntry_ControlVsExperimentalAsymmetry(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()

	cgUser := uuid.New()
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, cgUser); err != nil {
		t.Fatalf("seeding cg user: %v", err)
	}
	if _, err := pool.Exec(ctx, `UPDATE profiles SET research_id = $2 WHERE id = $1`, cgUser, "MF-TEST.cg"); err != nil {
		t.Fatalf("setting cg research_id: %v", err)
	}

	exUser := uuid.New()
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, exUser); err != nil {
		t.Fatalf("seeding ex user: %v", err)
	}
	if _, err := pool.Exec(ctx, `UPDATE profiles SET research_id = $2 WHERE id = $1`, exUser, "MF-TEST.ex"); err != nil {
		t.Fatalf("setting ex research_id: %v", err)
	}

	svc := services.NewDailyService(q)
	practicePtr := "yes"
	locationPtr := "At University"
	durationPtr := int32(20)

	input := services.DailyEntryInput{
		StressLevel: 3, CalmBefore: 3, CalmAfter: 4, SleepQuality: 4,
		MindfulnessPractice: &practicePtr, PracticeLocation: &locationPtr, PracticeDuration: &durationPtr,
	}

	t.Run("control group: mindfulness fields forced null, resubmit blocked", func(t *testing.T) {
		cgPgID := pgtype.UUID{Bytes: cgUser, Valid: true}
		row, err := svc.SubmitDailyEntry(ctx, cgPgID, input)
		if err != nil {
			t.Fatalf("first cg submit: %v", err)
		}
		if row.MindfulnessPractice.Valid {
			t.Errorf("cg MindfulnessPractice = %v, want NULL (forced regardless of input)", row.MindfulnessPractice)
		}
		if row.PracticeDuration.Valid {
			t.Errorf("cg PracticeDuration = %v, want NULL", row.PracticeDuration)
		}
		if row.PracticeLocation.Valid {
			t.Errorf("cg PracticeLocation = %v, want NULL", row.PracticeLocation)
		}

		_, err = svc.SubmitDailyEntry(ctx, cgPgID, input)
		var already *services.AlreadySubmittedError
		if !errors.As(err, &already) || already.Code != "DAILY_ALREADY_SUBMITTED" {
			t.Fatalf("cg resubmit error = %v, want AlreadySubmittedError{DAILY_ALREADY_SUBMITTED}", err)
		}
	})

	t.Run("experimental group: mindfulness fields preserved, resubmit (update) allowed", func(t *testing.T) {
		exPgID := pgtype.UUID{Bytes: exUser, Valid: true}
		row, err := svc.SubmitDailyEntry(ctx, exPgID, input)
		if err != nil {
			t.Fatalf("first ex submit: %v", err)
		}
		if !row.MindfulnessPractice.Valid || row.MindfulnessPractice.String != "yes" {
			t.Errorf("ex MindfulnessPractice = %v, want \"yes\"", row.MindfulnessPractice)
		}

		updated := input
		newStress := int32(5)
		updated.StressLevel = newStress
		row2, err := svc.SubmitDailyEntry(ctx, exPgID, updated)
		if err != nil {
			t.Fatalf("ex resubmit (should upsert, not block): %v", err)
		}
		if row2.StressLevel.Int32 != newStress {
			t.Errorf("StressLevel after resubmit = %d, want %d (upsert should update)", row2.StressLevel.Int32, newStress)
		}
	})
}

func TestUpdateVideoProgress_Accumulates(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	svc := services.NewDailyService(q)

	got, err := svc.UpdateVideoProgress(ctx, pgUserID, 30)
	if err != nil {
		t.Fatalf("first increment: %v", err)
	}
	if got != 30 {
		t.Errorf("videoPlaySeconds after first increment = %d, want 30", got)
	}

	got, err = svc.UpdateVideoProgress(ctx, pgUserID, 45)
	if err != nil {
		t.Fatalf("second increment: %v", err)
	}
	if got != 75 {
		t.Errorf("videoPlaySeconds after second increment = %d, want 75 (cumulative)", got)
	}
}

// TestSubmitStressEntry_ConcurrentSubmits is, per
// plans/backend-go-migration.md §7, "the single most important test to
// pass" for this phase: it directly validates the ported RPC's
// advisory-lock race-safety (submit_stress_entry's
// pg_advisory_xact_lock) -- exactly one concurrent submit must succeed,
// the rest must get AlreadySubmittedError, and none may 500 or produce a
// duplicate row.
func TestSubmitStressEntry_ConcurrentSubmits(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	const concurrency = 20
	svc := services.NewStressService(q)

	var successes, conflicts, unexpected int64
	var wg sync.WaitGroup
	wg.Add(concurrency)
	for i := 0; i < concurrency; i++ {
		go func() {
			defer wg.Done()
			_, err := svc.SubmitStressEntry(ctx, pgUserID, stressAnswers(3))
			switch {
			case err == nil:
				atomic.AddInt64(&successes, 1)
			default:
				var already *services.AlreadySubmittedError
				if errors.As(err, &already) {
					atomic.AddInt64(&conflicts, 1)
				} else {
					t.Errorf("unexpected error (want either success or AlreadySubmittedError): %v", err)
					atomic.AddInt64(&unexpected, 1)
				}
			}
		}()
	}
	wg.Wait()

	if successes != 1 {
		t.Errorf("successes = %d, want exactly 1", successes)
	}
	if conflicts != concurrency-1 {
		t.Errorf("conflicts = %d, want %d", conflicts, concurrency-1)
	}
	if unexpected != 0 {
		t.Errorf("unexpected errors = %d, want 0", unexpected)
	}

	var rowCount int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM questionnaire_pss10_responses WHERE user_id = $1`, userID).Scan(&rowCount); err != nil {
		t.Fatalf("counting rows: %v", err)
	}
	if rowCount != 1 {
		t.Errorf("row count = %d, want exactly 1 (no duplicate row from the race)", rowCount)
	}
}
