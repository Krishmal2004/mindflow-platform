-- name: GetTodayDailyEntry :one
SELECT stress_level, video_play_seconds FROM daily_sliders
WHERE user_id = $1 AND created_at >= $2
LIMIT 1;

-- name: GetTodayDailyEntryForSubmit :one
SELECT id, stress_level FROM daily_sliders
WHERE user_id = $1 AND created_at >= $2
LIMIT 1;

-- name: UpsertDailyEntry :one
-- Upsert on (user_id, entry_date) instead of select-then-insert/update --
-- closes the double-submit race that would otherwise produce duplicate
-- rows for the same day (see project_db.sql's
-- daily_sliders_user_entry_date_unique constraint).
INSERT INTO daily_sliders (
    user_id, stress_level, calm_before, calm_after, sleep_quality,
    sleep_start_time, wake_up_time, feelings,
    mindfulness_practice, practice_duration, practice_location
) VALUES (
    sqlc.arg(user_id), sqlc.arg(stress_level), sqlc.arg(calm_before), sqlc.arg(calm_after), sqlc.arg(sleep_quality),
    sqlc.arg(sleep_start_time), sqlc.arg(wake_up_time), sqlc.arg(feelings),
    sqlc.arg(mindfulness_practice), sqlc.arg(practice_duration), sqlc.arg(practice_location)
)
ON CONFLICT (user_id, entry_date) DO UPDATE SET
    stress_level = EXCLUDED.stress_level,
    calm_before = EXCLUDED.calm_before,
    calm_after = EXCLUDED.calm_after,
    sleep_quality = EXCLUDED.sleep_quality,
    sleep_start_time = EXCLUDED.sleep_start_time,
    wake_up_time = EXCLUDED.wake_up_time,
    feelings = EXCLUDED.feelings,
    mindfulness_practice = EXCLUDED.mindfulness_practice,
    practice_duration = EXCLUDED.practice_duration,
    practice_location = EXCLUDED.practice_location
RETURNING *;

-- name: IncrementDailyVideoSeconds :one
-- Atomic INSERT ... ON CONFLICT DO UPDATE via the increment_daily_video_seconds
-- DB function -- closes the same race as UpsertDailyEntry for these
-- frequent video-progress pings.
SELECT * FROM increment_daily_video_seconds(sqlc.arg(user_id), sqlc.arg(seconds));
