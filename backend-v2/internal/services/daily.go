package services

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/researchgroup"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/timeutil"
)

// Port of backend/src/services/dailyService.ts.
type DailyService struct {
	q queries.Querier
}

// DailyEntryInput is the validated request body for submitDailyEntry.
type DailyEntryInput struct {
	StressLevel         int32
	CalmBefore          int32
	CalmAfter           int32
	SleepQuality        int32
	SleepStartTime      *string
	WakeUpTime          *string
	Feelings            *string
	MindfulnessPractice *string
	PracticeDuration    *int32
	PracticeLocation    *string
}

func NewDailyService(q queries.Querier) *DailyService {
	return &DailyService{q: q}
}

type DailyStatus struct {
	Completed        bool                `json:"completed"`
	NextReset        *time.Time          `json:"nextReset"`
	VideoPlaySeconds int32               `json:"videoPlaySeconds"`
	Group            researchgroup.Group `json:"group"`
	Error            bool                `json:"error,omitempty"`
}

func (s *DailyService) GetDailyStatus(ctx context.Context, userID pgtype.UUID) (DailyStatus, error) {
	today := timeutil.StartOfToday()

	researchID, err := s.q.GetResearchID(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return DailyStatus{}, err
	}
	var group researchgroup.Group
	if researchID.Valid {
		group = researchgroup.Derive(&researchID.String)
	}

	row, err := s.q.GetTodayDailyEntry(ctx, queries.GetTodayDailyEntryParams{
		UserID:    userID,
		CreatedAt: pgtype.Timestamptz{Time: today, Valid: true},
	})
	hasEntry := true
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			hasEntry = false
		} else {
			return DailyStatus{}, err
		}
	}

	// today is already the UTC instant of Sri Lanka local midnight, so "+1
	// day" is a plain 24h offset -- not calendar-field arithmetic, which
	// would drift since that instant doesn't fall on a day boundary in
	// every timezone.
	nextReset := today.Add(24 * time.Hour)

	completed := hasEntry && row.StressLevel.Valid
	var videoPlaySeconds int32
	if hasEntry && row.VideoPlaySeconds.Valid {
		videoPlaySeconds = row.VideoPlaySeconds.Int32
	}

	return DailyStatus{
		Completed:        completed,
		NextReset:        &nextReset,
		VideoPlaySeconds: videoPlaySeconds,
		Group:            group,
	}, nil
}

// SubmitDailyEntry mirrors submitDailyEntry: control-group (.cg)
// participants may only submit once per day (blocked with
// DAILY_ALREADY_SUBMITTED once completed) and their
// mindfulness_practice/practice_duration/practice_location fields are
// forced to null regardless of submitted input -- a data-integrity rule
// for the study design, not a UX nicety (see CLAUDE.md). Experimental
// (.ex) participants have the opposite behavior: they CAN resubmit/update
// the same day via the upsert -- this asymmetry must not be broken.
func (s *DailyService) SubmitDailyEntry(ctx context.Context, userID pgtype.UUID, in DailyEntryInput) (queries.DailySlider, error) {
	today := timeutil.StartOfToday()

	researchID, err := s.q.GetResearchID(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return queries.DailySlider{}, err
	}
	isControlGroup := researchID.Valid && researchgroup.Derive(&researchID.String) == researchgroup.Control

	existing, err := s.q.GetTodayDailyEntryForSubmit(ctx, queries.GetTodayDailyEntryForSubmitParams{
		UserID:    userID,
		CreatedAt: pgtype.Timestamptz{Time: today, Valid: true},
	})
	hasExisting := true
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			hasExisting = false
		} else {
			return queries.DailySlider{}, err
		}
	}

	if isControlGroup && hasExisting && existing.StressLevel.Valid {
		return queries.DailySlider{}, &AlreadySubmittedError{Code: "DAILY_ALREADY_SUBMITTED"}
	}

	params := queries.UpsertDailyEntryParams{
		UserID:         userID,
		StressLevel:    pgtype.Int4{Int32: in.StressLevel, Valid: true},
		CalmBefore:     pgtype.Int4{Int32: in.CalmBefore, Valid: true},
		CalmAfter:      pgtype.Int4{Int32: in.CalmAfter, Valid: true},
		SleepQuality:   pgtype.Int4{Int32: in.SleepQuality, Valid: true},
		SleepStartTime: db.OptionalText(in.SleepStartTime),
		WakeUpTime:     db.OptionalText(in.WakeUpTime),
		Feelings:       db.OptionalText(in.Feelings),
	}
	if !isControlGroup {
		params.MindfulnessPractice = db.OptionalText(in.MindfulnessPractice)
		params.PracticeDuration = db.OptionalInt4(in.PracticeDuration)
		params.PracticeLocation = db.OptionalText(in.PracticeLocation)
	}

	return s.q.UpsertDailyEntry(ctx, params)
}

// UpdateVideoProgress increments today's video watch seconds atomically
// via the increment_daily_video_seconds RPC.
func (s *DailyService) UpdateVideoProgress(ctx context.Context, userID pgtype.UUID, seconds int32) (int32, error) {
	row, err := s.q.IncrementDailyVideoSeconds(ctx, queries.IncrementDailyVideoSecondsParams{
		UserID:  userID,
		Seconds: seconds,
	})
	if err != nil {
		return 0, err
	}
	if row.VideoPlaySeconds.Valid {
		return row.VideoPlaySeconds.Int32, nil
	}
	return 0, nil
}
