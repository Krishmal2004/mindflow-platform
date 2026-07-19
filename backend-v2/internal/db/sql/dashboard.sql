-- Queries backing dashboardService.ts's getUserSummary -- see plan §5's
-- note that this endpoint deliberately keeps dashboardService.ts's
-- server-local-time streak/consistency math as-is (not the SLT-pinned
-- helper used everywhere else); that inconsistency is replicated in Go,
-- not "fixed", pending a deliberate product/research decision.

-- name: ListDailyEntriesSince :many
SELECT created_at FROM daily_sliders
WHERE user_id = $1 AND created_at >= $2
ORDER BY created_at DESC;

-- name: CountDailyEntriesSince :one
SELECT COUNT(*) FROM daily_sliders WHERE user_id = $1 AND created_at >= $2;

-- name: ListVoiceRecordingsSince :many
SELECT created_at FROM voice_recordings WHERE user_id = $1 AND created_at >= $2;

-- name: CountStressResponsesSince :one
SELECT COUNT(*) FROM questionnaire_pss10_responses WHERE user_id = $1 AND created_at >= $2;

-- name: CountMindfulResponsesSince :one
SELECT COUNT(*) FROM questionnaire_ffmq15_responses WHERE user_id = $1 AND created_at >= $2;

-- name: CountThriveResponsesSince :one
SELECT COUNT(*) FROM questionnaire_wemwbs14_responses WHERE user_id = $1 AND created_at >= $2;
