-- ==============================================================================
-- Least-privilege Postgres role for backend-v2 (Go rewrite)
-- ==============================================================================
-- Additive file -- does NOT touch project_db.sql (the canonical schema source
-- of truth). Run this once against the same database project_db.sql targets,
-- any time after project_db.sql has been applied (the GRANTs below reference
-- tables/functions that must already exist).
--
-- Coexists with backend/'s existing Supabase service-role key setup during the
-- parallel-run migration period (see plans/backend-go-migration.md).
--
-- Why BYPASSRLS is not a regression: RLS stays ENABLEd on every table exactly
-- as today (defense-in-depth for every *other* connection path -- PostgREST,
-- Studio, ad-hoc scripts). backend-v2's authorization model matches today's
-- exactly: requireAuth extracts a cryptographically verified user_id, and
-- every sqlc query is hand-written with an explicit `WHERE user_id = $1` --
-- this is strictly *narrower* than blanket service-role access (scoped grants
-- per table/function, zero access to auth.*), not broader. See plan §3.
--
-- !! Replace the password placeholder below before running against any real
-- environment, and store the resulting connection string as its own secret
-- (DATABASE_URL), separate from SUPABASE_SERVICE_ROLE_KEY. Never commit a
-- real password to this file. !!

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_backend_v2') THEN
        CREATE ROLE app_backend_v2 WITH LOGIN PASSWORD 'REPLACE_ME_BEFORE_RUNNING' BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    profiles, about_me_profiles, daily_sliders, voice_recordings, weekly_recordings,
    questionnaire_pss10_responses, questionnaire_ffmq15_responses, questionnaire_wemwbs14_responses,
    calendar_events, push_tokens
    TO app_backend_v2;

GRANT SELECT ON admins TO app_backend_v2;  -- needed for requireAdmin parity

GRANT EXECUTE ON FUNCTION
    submit_stress_entry, submit_thrive_entry, submit_mindful_entry, increment_daily_video_seconds
    TO app_backend_v2;

-- Sequence grants for the SERIAL primary keys on the tables above --
-- without USAGE, an INSERT under this role fails to advance nextval()
-- even though the table-level INSERT grant above succeeds. Not present
-- in the plan's original snippet; added here since the write grants
-- above are non-functional without it (profiles/about_me_profiles use a
-- UUID PK tied to auth.users, so they have no sequence to grant).
GRANT USAGE, SELECT ON SEQUENCE
    daily_sliders_id_seq,
    voice_recordings_id_seq,
    questionnaire_pss10_responses_id_seq,
    questionnaire_ffmq15_responses_id_seq,
    questionnaire_wemwbs14_responses_id_seq,
    calendar_events_id_seq,
    push_tokens_id_seq
    TO app_backend_v2;

-- No grants on auth.* -- user identity comes from the locally-verified JWT's
-- claims; auth-flow actions (signup/login/otp/etc.) proxy over HTTP to
-- Supabase Auth, not SQL.
