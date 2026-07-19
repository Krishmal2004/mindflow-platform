-- Queries backing journeyController.ts's getJourneyData (GET /api/journey/).
-- getJourneyStatus (GET /api/journey/status) has no queries of its own --
-- it fans out to each feature domain's own status query (daily.sql,
-- weekly.sql, thrive.sql, stress.sql, mindful.sql).

-- name: ListJourneyDaily :many
SELECT id, user_id, calm_before, calm_after, stress_level, sleep_quality,
       mindfulness_practice, practice_location, feelings, created_at
FROM daily_sliders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: ListJourneyWeekly :many
SELECT id, user_id, week_number, year, file_url, duration, created_at
FROM voice_recordings
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: ListJourneyStress :many
SELECT id, created_at FROM questionnaire_pss10_responses
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: ListJourneyMindful :many
SELECT id, created_at FROM questionnaire_ffmq15_responses
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: ListJourneyThrive :many
SELECT id, created_at FROM questionnaire_wemwbs14_responses
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;
