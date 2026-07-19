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

// Rolling lockout window for FFMQ-15 (Mindful Mirror).
const mindfulLockoutDays = 30

// Port of backend/src/services/mindfulService.ts. Only getMindfulStatus is
// implemented here -- submitMindfulEntry (and its FFMQ-15 facet scoring)
// lands with the phase-4 write-heavy endpoints (see plan §2.4 and §5).
type MindfulService struct {
	q queries.Querier
}

func NewMindfulService(q queries.Querier) *MindfulService {
	return &MindfulService{q: q}
}

type MindfulStatus struct {
	Completed bool       `json:"completed"`
	NextReset *time.Time `json:"nextReset"`
}

func (s *MindfulService) GetMindfulStatus(ctx context.Context, userID pgtype.UUID) (MindfulStatus, error) {
	thirtyDaysAgo := time.Now().AddDate(0, 0, -mindfulLockoutDays)

	last, err := s.q.GetLatestMindfulResponse(ctx, queries.GetLatestMindfulResponseParams{
		UserID:    userID,
		CreatedAt: pgtype.Timestamptz{Time: thirtyDaysAgo, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return MindfulStatus{Completed: false, NextReset: nil}, nil
		}
		return MindfulStatus{}, err
	}

	nextReset := last.Time.AddDate(0, 0, mindfulLockoutDays)
	return MindfulStatus{Completed: true, NextReset: &nextReset}, nil
}

// MindfulAnswers is the validated FFMQ-15 submission (controller-layer
// validated, per plan §5).
type MindfulAnswers struct {
	Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10 int32
	Q11, Q12, Q13, Q14, Q15                 int32
	Duration                                *int32
}

// reverseScore mirrors mindfulService.ts: Score = 6 - UserRating.
func reverseScore(v int32) int32 { return 6 - v }

// SubmitMindfulEntry computes the 5 FFMQ-15 facet scores in Go before
// calling the RPC, never in SQL -- the exact item-to-facet mapping (this
// study's ground truth, not re-derived from the general FFMQ literature)
// is ported verbatim from mindfulService.ts: observing = q1+q6+q11;
// describing = q2+q7+reverse(q12); awareness =
// reverse(q3)+reverse(q8)+reverse(q13); nonJudging =
// reverse(q4)+reverse(q9)+reverse(q14); nonReactivity = q5+q10+q15. See
// plan §5.
func (s *MindfulService) SubmitMindfulEntry(ctx context.Context, userID pgtype.UUID, a MindfulAnswers) (queries.QuestionnaireFfmq15Response, error) {
	observing := a.Q1 + a.Q6 + a.Q11
	describing := a.Q2 + a.Q7 + reverseScore(a.Q12)
	awareness := reverseScore(a.Q3) + reverseScore(a.Q8) + reverseScore(a.Q13)
	nonJudging := reverseScore(a.Q4) + reverseScore(a.Q9) + reverseScore(a.Q14)
	nonReactivity := a.Q5 + a.Q10 + a.Q15

	row, err := s.q.SubmitMindfulEntry(ctx, queries.SubmitMindfulEntryParams{
		UserID: userID,
		Q1:     a.Q1, Q2: a.Q2, Q3: a.Q3, Q4: a.Q4, Q5: a.Q5,
		Q6: a.Q6, Q7: a.Q7, Q8: a.Q8, Q9: a.Q9, Q10: a.Q10,
		Q11: a.Q11, Q12: a.Q12, Q13: a.Q13, Q14: a.Q14, Q15: a.Q15,
		ObservingScore:     observing,
		DescribingScore:    describing,
		AwarenessScore:     awareness,
		NonJudgingScore:    nonJudging,
		NonReactivityScore: nonReactivity,
		Duration:           db.OptionalInt4(a.Duration),
	})
	if err != nil {
		return queries.QuestionnaireFfmq15Response{}, asAlreadySubmitted(err, "MINDFUL_ALREADY_SUBMITTED")
	}
	return row, nil
}
