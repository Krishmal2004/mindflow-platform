-- name: GetLatestThriveResponse :one
SELECT created_at FROM questionnaire_wemwbs14_responses
WHERE user_id = $1 AND created_at >= $2
ORDER BY created_at DESC
LIMIT 1;

-- name: SubmitThriveEntry :one
-- Rolling 14-day lockout has no fixed period to key a UNIQUE constraint
-- on, so submit_thrive_entry (project_db.sql) enforces it atomically via
-- a per-user Postgres advisory lock instead -- reused as-is via this RPC
-- call, zero reimplementation risk (see plan §3). Raises
-- THRIVE_ALREADY_SUBMITTED, caught by the caller via *pgconn.PgError.
SELECT * FROM submit_thrive_entry(
    sqlc.arg(user_id), sqlc.arg(q1), sqlc.arg(q2), sqlc.arg(q3), sqlc.arg(q4), sqlc.arg(q5),
    sqlc.arg(q6), sqlc.arg(q7), sqlc.arg(q8), sqlc.arg(q9), sqlc.arg(q10),
    sqlc.arg(q11), sqlc.arg(q12), sqlc.arg(q13), sqlc.arg(q14), sqlc.narg(duration)
);
