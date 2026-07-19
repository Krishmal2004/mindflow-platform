-- Minimal stand-in for the parts of Supabase's managed `auth` schema that
-- database/project_db.sql references (auth.users for FKs, auth.uid() in
-- RLS policies, the `authenticated` role for GRANTs). Supabase provisions
-- all of this itself in a real project; a vanilla postgres:17 container
-- used for integration tests needs it stubbed out first so project_db.sql
-- applies unmodified -- this file must run BEFORE project_db.sql.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY
);

-- Real auth.uid() reads the JWT claims of the current PostgREST/Supabase
-- request. backend-v2 never runs as this role (it connects with its own
-- least-privilege role and does its own application-level `WHERE user_id
-- = $1` filtering -- see plan §3), so a constant NULL is sufficient: it
-- only needs to exist for CREATE POLICY's expressions to resolve.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT NULL::UUID;
$$ LANGUAGE sql STABLE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;
