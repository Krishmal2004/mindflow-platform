-- name: GetLatestMindfulResponse :one
SELECT created_at FROM questionnaire_ffmq15_responses
WHERE user_id = $1 AND created_at >= $2
ORDER BY created_at DESC
LIMIT 1;

-- name: SubmitMindfulEntry :one
-- Rolling 30-day lockout, advisory-lock-enforced RPC -- see thrive.sql's
-- SubmitThriveEntry comment / plan §3 for why. Facet scores are computed
-- in Go (services/mindful.go) before this call, never in SQL -- see
-- CLAUDE.md/plan §5's FFMQ-15 facet-scoring note.
SELECT * FROM submit_mindful_entry(
    sqlc.arg(user_id), sqlc.arg(q1), sqlc.arg(q2), sqlc.arg(q3), sqlc.arg(q4), sqlc.arg(q5),
    sqlc.arg(q6), sqlc.arg(q7), sqlc.arg(q8), sqlc.arg(q9), sqlc.arg(q10),
    sqlc.arg(q11), sqlc.arg(q12), sqlc.arg(q13), sqlc.arg(q14), sqlc.arg(q15),
    sqlc.arg(observing_score), sqlc.arg(describing_score), sqlc.arg(awareness_score),
    sqlc.arg(non_judging_score), sqlc.arg(non_reactivity_score), sqlc.narg(duration)
);
