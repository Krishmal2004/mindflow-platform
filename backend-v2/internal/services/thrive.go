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

// Rolling lockout window for WEMWBS-14 (Thrive Tracker).
const thriveLockoutDays = 14

// Port of backend/src/services/thriveService.ts. Only getThriveStatus is
// implemented here -- submitThriveEntry lands with the phase-4
// write-heavy endpoints (see plan §2.4).
type ThriveService struct {
	q queries.Querier
}

func NewThriveService(q queries.Querier) *ThriveService {
	return &ThriveService{q: q}
}

type ThriveStatus struct {
	Completed bool       `json:"completed"`
	NextReset *time.Time `json:"nextReset"`
}

func (s *ThriveService) GetThriveStatus(ctx context.Context, userID pgtype.UUID) (ThriveStatus, error) {
	fourteenDaysAgo := time.Now().AddDate(0, 0, -thriveLockoutDays)

	last, err := s.q.GetLatestThriveResponse(ctx, queries.GetLatestThriveResponseParams{
		UserID:    userID,
		CreatedAt: pgtype.Timestamptz{Time: fourteenDaysAgo, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ThriveStatus{Completed: false, NextReset: nil}, nil
		}
		return ThriveStatus{}, err
	}

	nextReset := last.Time.AddDate(0, 0, thriveLockoutDays)
	return ThriveStatus{Completed: true, NextReset: &nextReset}, nil
}

// ThriveAnswers is the validated WEMWBS-14 submission (controller-layer
// validated, per plan §5).
type ThriveAnswers struct {
	Q1, Q2, Q3, Q4, Q5, Q6, Q7      int32
	Q8, Q9, Q10, Q11, Q12, Q13, Q14 int32
	Duration                        *int32
}

func (s *ThriveService) SubmitThriveEntry(ctx context.Context, userID pgtype.UUID, a ThriveAnswers) (queries.QuestionnaireWemwbs14Response, error) {
	row, err := s.q.SubmitThriveEntry(ctx, queries.SubmitThriveEntryParams{
		UserID: userID,
		Q1:     a.Q1, Q2: a.Q2, Q3: a.Q3, Q4: a.Q4, Q5: a.Q5, Q6: a.Q6, Q7: a.Q7,
		Q8: a.Q8, Q9: a.Q9, Q10: a.Q10, Q11: a.Q11, Q12: a.Q12, Q13: a.Q13, Q14: a.Q14,
		Duration: db.OptionalInt4(a.Duration),
	})
	if err != nil {
		return queries.QuestionnaireWemwbs14Response{}, asAlreadySubmitted(err, "THRIVE_ALREADY_SUBMITTED")
	}
	return row, nil
}
