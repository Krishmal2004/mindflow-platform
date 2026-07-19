-- name: GetProfile :one
SELECT username, research_id FROM profiles WHERE id = $1;

-- name: GetResearchID :one
SELECT research_id FROM profiles WHERE id = $1;

-- name: GetAboutMe :one
SELECT * FROM about_me_profiles WHERE id = $1;

-- POST /api/profile/about-me (updateAboutMe) is a write endpoint, out of
-- scope for the read-only phase-2 pass -- see plan §2. Its partial-upsert
-- semantics (only fields present in the request body get overwritten,
-- everything else keeps its previous value) don't map onto a single
-- fixed-column sqlc query anyway; it needs a dynamically built UPDATE SET
-- clause, ported when the write endpoints land.

-- name: UpsertProfileUsername :exec
-- Signup's initial username assignment. Only touches username -- never
-- research_id (that's researcher-assigned only, never set at signup --
-- see CLAUDE.md's research-group note). A collision with another user's
-- username surfaces as a unique_violation (SQLSTATE 23505) on the
-- profiles_username_key constraint, which authController.ts's caller
-- catches to retry once with an id-suffixed username.
INSERT INTO profiles (id, username) VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
