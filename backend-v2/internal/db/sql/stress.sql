-- name: GetLatestStressResponse :one
SELECT created_at FROM questionnaire_pss10_responses
WHERE user_id = $1 AND created_at >= $2
ORDER BY created_at DESC
LIMIT 1;

-- name: SubmitStressEntry :one
-- Rolling 30-day lockout, advisory-lock-enforced RPC -- see thrive.sql's
-- SubmitThriveEntry comment / plan §3 for why.
SELECT * FROM submit_stress_entry(
    sqlc.arg(user_id), sqlc.arg(q1), sqlc.arg(q2), sqlc.arg(q3), sqlc.arg(q4), sqlc.arg(q5),
    sqlc.arg(q6), sqlc.arg(q7), sqlc.arg(q8), sqlc.arg(q9), sqlc.arg(q10),
    sqlc.narg(duration)
);
