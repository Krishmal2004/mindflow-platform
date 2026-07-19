-- name: UpsertPushToken :exec
INSERT INTO push_tokens (user_id, expo_push_token, platform)
VALUES (sqlc.arg(user_id), sqlc.arg(expo_push_token), sqlc.narg(platform))
ON CONFLICT (expo_push_token) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    platform = EXCLUDED.platform;

-- name: DeletePushToken :exec
-- Scoped to both expo_push_token AND user_id together -- a security
-- property (prevents unregistering another user's device via a leaked/
-- guessed token), not an incidental query shape. See plan §5.
DELETE FROM push_tokens WHERE expo_push_token = $1 AND user_id = $2;

-- name: ListAllPushTokens :many
SELECT user_id, expo_push_token FROM push_tokens;

-- name: ListProfileUsernamesByID :many
SELECT id, username FROM profiles WHERE id = ANY(sqlc.arg(ids)::uuid[]);
