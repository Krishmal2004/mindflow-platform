-- name: GetWeeklyRecordingForWeek :one
SELECT id FROM voice_recordings
WHERE user_id = $1 AND week_number = $2 AND year = $3
LIMIT 1;

-- name: UpsertVoiceRecording :one
-- Upsert on (user_id, week_number, year) instead of a plain insert --
-- closes the double-submit race and lets a legitimate re-submit update
-- the existing row (see project_db.sql's
-- voice_recordings_user_week_year_unique constraint).
INSERT INTO voice_recordings (user_id, week_number, year, file_url, file_key, duration)
VALUES (sqlc.arg(user_id), sqlc.arg(week_number), sqlc.arg(year), sqlc.arg(file_url), sqlc.arg(file_key), sqlc.narg(duration))
ON CONFLICT (user_id, week_number, year) DO UPDATE SET
    file_url = EXCLUDED.file_url,
    file_key = EXCLUDED.file_key,
    duration = EXCLUDED.duration
RETURNING *;

-- name: ListWeeklyRecordingsForWeek :many
-- Ordered so the caller (getWeeklyVideo) can prefer the most recently
-- published match; group vs. group-agnostic selection happens in Go.
SELECT * FROM weekly_recordings
WHERE week_no = $1
ORDER BY published_at DESC;
