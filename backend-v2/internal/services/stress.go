package services

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
)

// Rolling lockout window for PSS-10 (Stress Snapshot).
const stressLockoutDays = 30

// Port of backend/src/services/stressService.ts. Only getStressStatus is
// implemented here -- submitStressEntry lands with the phase-4
// write-heavy endpoints (see plan §2.4).
type StressService struct {
	q queries.Querier
}

func NewStressService(q queries.Querier) *StressService {
	return &StressService{q: q}
}

type StressStatus struct {
	Completed bool       `json:"completed"`
	NextReset *time.Time `json:"nextReset"`
}

func (s *StressService) GetStressStatus(ctx context.Context, userID pgtype.UUID) (StressStatus, error) {
	thirtyDaysAgo := time.Now().AddDate(0, 0, -stressLockoutDays)

	last, err := s.q.GetLatestStressResponse(ctx, queries.GetLatestStressResponseParams{
		UserID:    userID,
		CreatedAt: pgtype.Timestamptz{Time: thirtyDaysAgo, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return StressStatus{Completed: false, NextReset: nil}, nil
		}
		return StressStatus{}, err
	}

	nextReset := last.Time.AddDate(0, 0, stressLockoutDays)
	return StressStatus{Completed: true, NextReset: &nextReset}, nil
}

// StressAnswers is the validated PSS-10 submission (controller-layer
// validated, per plan §5).
type StressAnswers struct {
	Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10 int32
	Duration                                *int32
}

func (s *StressService) SubmitStressEntry(ctx context.Context, userID pgtype.UUID, a StressAnswers) (queries.QuestionnairePss10Response, error) {
	row, err := s.q.SubmitStressEntry(ctx, queries.SubmitStressEntryParams{
		UserID: userID,
		Q1:     a.Q1, Q2: a.Q2, Q3: a.Q3, Q4: a.Q4, Q5: a.Q5,
		Q6: a.Q6, Q7: a.Q7, Q8: a.Q8, Q9: a.Q9, Q10: a.Q10,
		Duration: db.OptionalInt4(a.Duration),
	})
	if err != nil {
		return queries.QuestionnairePss10Response{}, asAlreadySubmitted(err, "STRESS_ALREADY_SUBMITTED")
	}
	return row, nil
}
