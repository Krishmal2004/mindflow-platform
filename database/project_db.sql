-- ==============================================================================
-- Mindfulness Research App Database Schema
-- ==============================================================================
-- This script rebuilds the entire database schema from scratch: section 0 drops
-- every table/trigger/function this file owns, then sections 1-7 recreate
-- everything fresh. It includes User Management, Core Features, Questionnaire
-- System, Calendar, Push Notifications, and Permissions.
--
-- !! Running this script deletes all existing data in these tables. See the
-- warning at the top of section 0 before running it against anything but a
-- database you intend to fully rebuild. !!
--
-- GUIDELINES:
-- 1. All tables have RLS enabled.
-- 2. Users can generally only access their own data.
-- 3. Admins can view all data (implied via RLS policies).
-- 4. Shared functions and extensions are defined first.

-- ==============================================================================
-- 0. RESET — DROP EVERYTHING THIS SCRIPT OWNS
-- ==============================================================================
-- !! DESTRUCTIVE !! Running this section deletes every row in every table below,
-- permanently. This whole file is meant to be run against a database you intend to
-- rebuild from scratch (fresh project, or a dev/test database you're OK wiping) —
-- NOT pasted into a production SQL Editor without a backup/export first.
--
-- Scoped deliberately to only what the rest of this file creates: our own `public`
-- tables/functions, plus the two triggers we attach to Supabase's `auth.users` table.
-- `auth.users` (and the rest of the `auth`/`storage` schemas) belongs to Supabase's
-- own Auth/Storage services and is never touched here — dropping it would break
-- login for every existing account.
--
-- DROP TABLE ... CASCADE also removes that table's own triggers, RLS policies, and
-- indexes automatically, so they don't need separate DROP statements.

-- Triggers we placed on auth.users (auth.users itself is NOT dropped)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_about_me ON auth.users;

-- Our own tables (CASCADE clears their triggers/policies/indexes with them)
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS questionnaire_wemwbs14_responses CASCADE;
DROP TABLE IF EXISTS questionnaire_ffmq15_responses CASCADE;
DROP TABLE IF EXISTS questionnaire_pss10_responses CASCADE;
DROP TABLE IF EXISTS weekly_recordings CASCADE;
DROP TABLE IF EXISTS voice_recordings CASCADE;
DROP TABLE IF EXISTS daily_sliders CASCADE;
DROP TABLE IF EXISTS about_me_profiles CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Standalone functions (trigger functions + RPCs). Names are unique in this schema,
-- so no parameter-type list is needed; CASCADE covers anything still referencing them.
DROP FUNCTION IF EXISTS public.submit_thrive_entry CASCADE;
DROP FUNCTION IF EXISTS public.submit_mindful_entry CASCADE;
DROP FUNCTION IF EXISTS public.submit_stress_entry CASCADE;
DROP FUNCTION IF EXISTS public.increment_daily_video_seconds CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_about_me CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- ==============================================================================
-- 1. EXTENSIONS & SHARED FUNCTIONS
-- ==============================================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function: update_updated_at_column
-- Purpose: Automatically updates the `updated_at` column to the current timestamp.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. USER MANAGEMENT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: profiles
-- Purpose: Stores basic user profile information linked to auth.users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    research_id TEXT UNIQUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Trigger: Update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-create a bare profiles row (blank username, blank research_id) on
-- signup — a safety net so a user is never left without a profiles row even if the
-- app-level upsert in authController.signup fails for some reason. authController
-- fills in a real username via upsert immediately after (ON CONFLICT (id) DO UPDATE,
-- so it updates this same row rather than inserting a second one); research_id stays
-- NULL/blank until a researcher assigns it via the admin portal — signup never sets it.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- ------------------------------------------------------------------------------
-- Table: admins
-- Purpose: Stores admin user credentials and metadata.
--
-- Created here, before profiles' own RLS policies below, because those
-- policies reference `admins` in an EXISTS subquery -- CREATE POLICY
-- resolves table references at creation time (unlike a plain FK), so
-- `admins` must already exist or a from-scratch run of this script errors
-- out immediately after creating just the profiles table.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- RLS: admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own status" ON admins;
CREATE POLICY "Admins can view their own status"
    ON admins
    FOR SELECT
    USING (id = auth.uid());

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_admins_id ON admins(id);

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own, Admins see all" ON profiles;
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;

CREATE POLICY "Users see own, Admins see all"
    ON profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles"
    ON profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ------------------------------------------------------------------------------
-- Table: about_me_profiles
-- Purpose: Detailed specialized profile information for research context.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS about_me_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    university_id TEXT,
    education_level TEXT,
    faculty TEXT,
    major_field_of_study TEXT,
    age INTEGER,
    living_situation TEXT,
    family_background TEXT,
    cultural_background TEXT,
    hobbies_interests TEXT,
    personal_goals TEXT,
    why_mindflow TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Update updated_at
DROP TRIGGER IF EXISTS update_about_me_updated_at ON about_me_profiles;
CREATE TRIGGER update_about_me_updated_at
    BEFORE UPDATE ON about_me_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-create mostly empty about_me_profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_about_me()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.about_me_profiles (id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created_about_me ON auth.users;
CREATE TRIGGER on_auth_user_created_about_me
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_about_me();

-- RLS: about_me_profiles
ALTER TABLE about_me_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own about me profile" ON about_me_profiles;
DROP POLICY IF EXISTS "Users see own, Admins see all" ON about_me_profiles;

CREATE POLICY "Users see own, Admins see all"
    ON about_me_profiles
    FOR ALL
    USING (
        id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );

-- ==============================================================================
-- 3. CORE FEATURES (Mindfulness & Tracking)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: daily_sliders
-- Purpose: Stores daily user check-ins for mood, stress, sleep, etc.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_sliders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mindfulness_practice TEXT CHECK (mindfulness_practice IN ('yes', 'no')),
    practice_duration INTEGER,
    practice_location TEXT CHECK (practice_location IN ('At University', 'Outside University')),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    calm_before INTEGER CHECK (calm_before >= 1 AND calm_before <= 5),
    calm_after INTEGER CHECK (calm_after >= 1 AND calm_after <= 5),
    feelings TEXT,
    sleep_start_time TEXT,
    wake_up_time TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    video_play_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- One row per user per Sri Lanka calendar day (the study cohort's home timezone).
    -- Cast goes through `AT TIME ZONE '+05:30'` (fixed offset, no DST, therefore
    -- IMMUTABLE) rather than a bare `created_at::date`, which Postgres rejects in
    -- generated columns because casting a timestamptz straight to date is
    -- session-TimeZone-dependent (STABLE, not IMMUTABLE). "+05:30" follows ISO-8601
    -- sign convention (positive = ahead of UTC), not the flipped POSIX convention
    -- used for named "Etc/GMT+n" zones.
    entry_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE '+05:30')::date) STORED,
    -- Prevents duplicate daily entries per user per day when concurrent submits race
    -- (e.g. double-tap or a client retry-on-timeout hitting submitDailyEntry/updateVideoProgress twice).
    CONSTRAINT daily_sliders_user_entry_date_unique UNIQUE (user_id, entry_date)
);

-- RLS: daily_sliders
ALTER TABLE daily_sliders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own daily sliders data" ON daily_sliders;
DROP POLICY IF EXISTS "Users see own, Admins see all" ON daily_sliders;

CREATE POLICY "Users see own, Admins see all"
    ON daily_sliders
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own daily sliders"
    ON daily_sliders
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily sliders"
    ON daily_sliders
    FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all daily sliders" ON daily_sliders;
CREATE POLICY "Admins manage all daily sliders"
    ON daily_sliders FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_sliders_user_id ON daily_sliders(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_sliders_created_at ON daily_sliders(created_at);

-- Function: increment_daily_video_seconds
-- Purpose: Atomically inserts-or-increments today's video_play_seconds in a single
-- statement, closing the read-then-write race in DailyService#updateVideoProgress.
CREATE OR REPLACE FUNCTION public.increment_daily_video_seconds(p_user_id UUID, p_seconds INTEGER)
RETURNS daily_sliders AS $$
    INSERT INTO daily_sliders (user_id, video_play_seconds, created_at)
    VALUES (p_user_id, p_seconds, NOW())
    ON CONFLICT (user_id, entry_date)
    DO UPDATE SET video_play_seconds = daily_sliders.video_play_seconds + EXCLUDED.video_play_seconds
    RETURNING *;
$$ LANGUAGE sql;

-- ------------------------------------------------------------------------------
-- Table: voice_recordings
-- Purpose: Stores metadata for user voice recordings uploaded to storage (e.g., R2).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_recordings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    file_key TEXT NOT NULL, -- Storage key
    file_url TEXT,          -- Public/Signed URL
    duration INTEGER,       -- Duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevents duplicate weekly recordings per user per ISO week when concurrent
    -- submits race (e.g. double-tap or a client retry-on-timeout hitting
    -- submitWeeklyEntry twice). WeeklyService#submitWeeklyEntry upserts on this
    -- constraint instead of a plain insert.
    CONSTRAINT voice_recordings_user_week_year_unique UNIQUE (user_id, week_number, year)
);

-- Trigger: Update updated_at
DROP TRIGGER IF EXISTS update_voice_recordings_updated_at ON voice_recordings;
CREATE TRIGGER update_voice_recordings_updated_at
    BEFORE UPDATE ON voice_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: voice_recordings
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own voice recordings" ON voice_recordings;
DROP POLICY IF EXISTS "Users see own, Admins see all" ON voice_recordings;

CREATE POLICY "Users see own, Admins see all"
    ON voice_recordings
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own recordings"
    ON voice_recordings
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recordings"
    ON voice_recordings
    FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all voice recordings" ON voice_recordings;
CREATE POLICY "Admins manage all voice recordings"
    ON voice_recordings FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_week_year ON voice_recordings(week_number, year);

-- ------------------------------------------------------------------------------
-- Table: weekly_recordings
-- Purpose: Curated content (e.g., Youtube videos) distributed weekly to users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_recordings (
    id SERIAL PRIMARY KEY,
    week_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    youtube_id TEXT NOT NULL,
    description TEXT,
    -- Which study arm this video is for ('ex'/'cg'), or NULL to show to everyone.
    target_group TEXT CHECK (target_group IN ('ex', 'cg')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: weekly_recordings
ALTER TABLE weekly_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access weekly recordings" ON weekly_recordings;
CREATE POLICY "Users can access weekly recordings" ON weekly_recordings FOR SELECT USING (true);

-- Index: week_no is the leading column, so this also covers plain week_no lookups.
-- At most one video per group per week (NULL/group-agnostic rows are exempt, e.g. legacy Week 1 entry).
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_recordings_week_group ON weekly_recordings(week_no, target_group);


-- ==============================================================================
-- 4. QUESTIONNAIRE SYSTEM (Specific Research Instruments)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: questionnaire_pss10_responses
-- Purpose: Responses for Perceived Stress Scale (PSS-10).
-- Structure: 10 items (q1-q10), answering scale 1-5.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_pss10_responses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    q1 INTEGER NOT NULL CHECK (q1 BETWEEN 1 AND 5),
    q2 INTEGER NOT NULL CHECK (q2 BETWEEN 1 AND 5),
    q3 INTEGER NOT NULL CHECK (q3 BETWEEN 1 AND 5),
    q4 INTEGER NOT NULL CHECK (q4 BETWEEN 1 AND 5),
    q5 INTEGER NOT NULL CHECK (q5 BETWEEN 1 AND 5),
    q6 INTEGER NOT NULL CHECK (q6 BETWEEN 1 AND 5),
    q7 INTEGER NOT NULL CHECK (q7 BETWEEN 1 AND 5),
    q8 INTEGER NOT NULL CHECK (q8 BETWEEN 1 AND 5),
    q9 INTEGER NOT NULL CHECK (q9 BETWEEN 1 AND 5),
    q10 INTEGER NOT NULL CHECK (q10 BETWEEN 1 AND 5),
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: PSS-10
ALTER TABLE questionnaire_pss10_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own PSS10 responses" ON questionnaire_pss10_responses;
CREATE POLICY "Users manage own PSS10 responses"
    ON questionnaire_pss10_responses
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all PSS10 responses" ON questionnaire_pss10_responses;
CREATE POLICY "Admins view all PSS10 responses"
    ON questionnaire_pss10_responses
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage PSS10" ON questionnaire_pss10_responses;
CREATE POLICY "Admins manage PSS10"
    ON questionnaire_pss10_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_pss10_user_id ON questionnaire_pss10_responses(user_id);

-- Function: submit_stress_entry
-- Purpose: Atomically enforces the 30-day PSS-10 lockout and inserts the response in one
-- transaction. The lockout window is rolling (not a fixed calendar period like
-- daily/weekly), so it can't be enforced with a UNIQUE constraint alone — an
-- advisory lock scoped to this user+instrument serializes concurrent submits so two
-- requests can no longer both pass the "not yet submitted" check before either inserts.
CREATE OR REPLACE FUNCTION public.submit_stress_entry(
    p_user_id UUID,
    p_q1 INTEGER, p_q2 INTEGER, p_q3 INTEGER, p_q4 INTEGER, p_q5 INTEGER,
    p_q6 INTEGER, p_q7 INTEGER, p_q8 INTEGER, p_q9 INTEGER, p_q10 INTEGER,
    p_duration INTEGER DEFAULT NULL
)
RETURNS questionnaire_pss10_responses AS $$
DECLARE
    v_result questionnaire_pss10_responses;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('stress:' || p_user_id::text));

    IF EXISTS (
        SELECT 1 FROM questionnaire_pss10_responses
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days'
    ) THEN
        RAISE EXCEPTION 'STRESS_ALREADY_SUBMITTED';
    END IF;

    INSERT INTO questionnaire_pss10_responses (user_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, duration)
    VALUES (p_user_id, p_q1, p_q2, p_q3, p_q4, p_q5, p_q6, p_q7, p_q8, p_q9, p_q10, p_duration)
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------------------------
-- Table: questionnaire_ffmq15_responses
-- Purpose: Responses for Five Facet Mindfulness Questionnaire (FFMQ-15).
-- Structure: 15 items (q1-q15), answering scale 1-5.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_ffmq15_responses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    q1 INTEGER NOT NULL CHECK (q1 BETWEEN 1 AND 5),
    q2 INTEGER NOT NULL CHECK (q2 BETWEEN 1 AND 5),
    q3 INTEGER NOT NULL CHECK (q3 BETWEEN 1 AND 5),
    q4 INTEGER NOT NULL CHECK (q4 BETWEEN 1 AND 5),
    q5 INTEGER NOT NULL CHECK (q5 BETWEEN 1 AND 5),
    q6 INTEGER NOT NULL CHECK (q6 BETWEEN 1 AND 5),
    q7 INTEGER NOT NULL CHECK (q7 BETWEEN 1 AND 5),
    q8 INTEGER NOT NULL CHECK (q8 BETWEEN 1 AND 5),
    q9 INTEGER NOT NULL CHECK (q9 BETWEEN 1 AND 5),
    q10 INTEGER NOT NULL CHECK (q10 BETWEEN 1 AND 5),
    q11 INTEGER NOT NULL CHECK (q11 BETWEEN 1 AND 5),
    q12 INTEGER NOT NULL CHECK (q12 BETWEEN 1 AND 5),
    q13 INTEGER NOT NULL CHECK (q13 BETWEEN 1 AND 5),
    q14 INTEGER NOT NULL CHECK (q14 BETWEEN 1 AND 5),
    q15 INTEGER NOT NULL CHECK (q15 BETWEEN 1 AND 5),
    duration INTEGER,
    -- Facet scores computed application-side (mindfulService#submitMindfulEntry) at
    -- submission time and stored directly here — never recomputed on read.
    observing_score INTEGER,
    describing_score INTEGER,
    awareness_score INTEGER,
    non_judging_score INTEGER,
    non_reactivity_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: FFMQ-15
ALTER TABLE questionnaire_ffmq15_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own FFMQ15 responses" ON questionnaire_ffmq15_responses;
CREATE POLICY "Users manage own FFMQ15 responses"
    ON questionnaire_ffmq15_responses
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all FFMQ15 responses" ON questionnaire_ffmq15_responses;
CREATE POLICY "Admins view all FFMQ15 responses"
    ON questionnaire_ffmq15_responses
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage FFMQ15" ON questionnaire_ffmq15_responses;
CREATE POLICY "Admins manage FFMQ15"
    ON questionnaire_ffmq15_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_ffmq15_user_id ON questionnaire_ffmq15_responses(user_id);

-- Function: submit_mindful_entry
-- Purpose: Atomically enforces the 30-day FFMQ-15 lockout and inserts the response (with
-- facet scores computed application-side, same as before) in one transaction. See
-- submit_stress_entry above for why an advisory lock is used instead of a UNIQUE
-- constraint for these rolling-window instruments.
CREATE OR REPLACE FUNCTION public.submit_mindful_entry(
    p_user_id UUID,
    p_q1 INTEGER, p_q2 INTEGER, p_q3 INTEGER, p_q4 INTEGER, p_q5 INTEGER,
    p_q6 INTEGER, p_q7 INTEGER, p_q8 INTEGER, p_q9 INTEGER, p_q10 INTEGER,
    p_q11 INTEGER, p_q12 INTEGER, p_q13 INTEGER, p_q14 INTEGER, p_q15 INTEGER,
    p_observing_score INTEGER, p_describing_score INTEGER, p_awareness_score INTEGER,
    p_non_judging_score INTEGER, p_non_reactivity_score INTEGER,
    p_duration INTEGER DEFAULT NULL
)
RETURNS questionnaire_ffmq15_responses AS $$
DECLARE
    v_result questionnaire_ffmq15_responses;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('mindful:' || p_user_id::text));

    IF EXISTS (
        SELECT 1 FROM questionnaire_ffmq15_responses
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days'
    ) THEN
        RAISE EXCEPTION 'MINDFUL_ALREADY_SUBMITTED';
    END IF;

    INSERT INTO questionnaire_ffmq15_responses (
        user_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15,
        observing_score, describing_score, awareness_score, non_judging_score, non_reactivity_score,
        duration
    )
    VALUES (
        p_user_id, p_q1, p_q2, p_q3, p_q4, p_q5, p_q6, p_q7, p_q8, p_q9, p_q10, p_q11, p_q12, p_q13, p_q14, p_q15,
        p_observing_score, p_describing_score, p_awareness_score, p_non_judging_score, p_non_reactivity_score,
        p_duration
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------------------------
-- Table: questionnaire_wemwbs14_responses
-- Purpose: Responses for Warwick-Edinburgh Mental Wellbeing Scale (WEMWBS-14).
-- Structure: 14 items (q1-q14), answering scale 1-5.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_wemwbs14_responses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    q1 INTEGER NOT NULL CHECK (q1 BETWEEN 1 AND 5),
    q2 INTEGER NOT NULL CHECK (q2 BETWEEN 1 AND 5),
    q3 INTEGER NOT NULL CHECK (q3 BETWEEN 1 AND 5),
    q4 INTEGER NOT NULL CHECK (q4 BETWEEN 1 AND 5),
    q5 INTEGER NOT NULL CHECK (q5 BETWEEN 1 AND 5),
    q6 INTEGER NOT NULL CHECK (q6 BETWEEN 1 AND 5),
    q7 INTEGER NOT NULL CHECK (q7 BETWEEN 1 AND 5),
    q8 INTEGER NOT NULL CHECK (q8 BETWEEN 1 AND 5),
    q9 INTEGER NOT NULL CHECK (q9 BETWEEN 1 AND 5),
    q10 INTEGER NOT NULL CHECK (q10 BETWEEN 1 AND 5),
    q11 INTEGER NOT NULL CHECK (q11 BETWEEN 1 AND 5),
    q12 INTEGER NOT NULL CHECK (q12 BETWEEN 1 AND 5),
    q13 INTEGER NOT NULL CHECK (q13 BETWEEN 1 AND 5),
    q14 INTEGER NOT NULL CHECK (q14 BETWEEN 1 AND 5),
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: WEMWBS-14
ALTER TABLE questionnaire_wemwbs14_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own WEMWBS14 responses" ON questionnaire_wemwbs14_responses;
CREATE POLICY "Users manage own WEMWBS14 responses"
    ON questionnaire_wemwbs14_responses
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all WEMWBS14 responses" ON questionnaire_wemwbs14_responses;
CREATE POLICY "Admins view all WEMWBS14 responses"
    ON questionnaire_wemwbs14_responses
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage WEMWBS14" ON questionnaire_wemwbs14_responses;
CREATE POLICY "Admins manage WEMWBS14"
    ON questionnaire_wemwbs14_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_wemwbs14_user_id ON questionnaire_wemwbs14_responses(user_id);

-- Function: submit_thrive_entry
-- Purpose: Atomically enforces the 14-day WEMWBS-14 lockout and inserts the response in
-- one transaction. See submit_stress_entry above for why an advisory lock is used
-- instead of a UNIQUE constraint for these rolling-window instruments.
CREATE OR REPLACE FUNCTION public.submit_thrive_entry(
    p_user_id UUID,
    p_q1 INTEGER, p_q2 INTEGER, p_q3 INTEGER, p_q4 INTEGER, p_q5 INTEGER,
    p_q6 INTEGER, p_q7 INTEGER, p_q8 INTEGER, p_q9 INTEGER, p_q10 INTEGER,
    p_q11 INTEGER, p_q12 INTEGER, p_q13 INTEGER, p_q14 INTEGER,
    p_duration INTEGER DEFAULT NULL
)
RETURNS questionnaire_wemwbs14_responses AS $$
DECLARE
    v_result questionnaire_wemwbs14_responses;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('thrive:' || p_user_id::text));

    IF EXISTS (
        SELECT 1 FROM questionnaire_wemwbs14_responses
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '14 days'
    ) THEN
        RAISE EXCEPTION 'THRIVE_ALREADY_SUBMITTED';
    END IF;

    INSERT INTO questionnaire_wemwbs14_responses (user_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, duration)
    VALUES (p_user_id, p_q1, p_q2, p_q3, p_q4, p_q5, p_q6, p_q7, p_q8, p_q9, p_q10, p_q11, p_q12, p_q13, p_q14, p_duration)
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 5. CALENDAR SYSTEM
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: calendar_events
-- Purpose: Stores user-specific calendar events.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Update updated_at
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: calendar_events
-- Global/shared events (no user_id column on this table — every participant sees the
-- same calendar), so read access is intentionally unrestricted; only admins can write.
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access" ON calendar_events;
CREATE POLICY "Allow read access"
    ON calendar_events
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage calendar events" ON calendar_events;
CREATE POLICY "Admins manage calendar events"
    ON calendar_events FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON calendar_events(event_date);


-- ==============================================================================
-- 6. PUSH NOTIFICATIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: push_tokens
-- Purpose: Stores each device's Expo push token so the backend can send
-- scheduled reminder notifications (morning greeting / pending-task nudge).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL UNIQUE,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Update updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON push_tokens;
CREATE POLICY "Users manage own push tokens"
    ON push_tokens
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- ==============================================================================
-- 7. PERMISSIONS
-- ==============================================================================

-- Grant Usage Permissions
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE about_me_profiles TO authenticated;
GRANT ALL ON TABLE daily_sliders TO authenticated;
GRANT ALL ON TABLE voice_recordings TO authenticated;
GRANT ALL ON TABLE weekly_recordings TO authenticated;

-- Questionnaire Tables
GRANT ALL ON TABLE questionnaire_pss10_responses TO authenticated;
GRANT ALL ON TABLE questionnaire_ffmq15_responses TO authenticated;
GRANT ALL ON TABLE questionnaire_wemwbs14_responses TO authenticated;

GRANT ALL ON TABLE calendar_events TO authenticated;
GRANT ALL ON TABLE push_tokens TO authenticated;

-- Grant Sequence Permissions
GRANT USAGE, SELECT ON SEQUENCE daily_sliders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voice_recordings_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_recordings_id_seq TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE questionnaire_pss10_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_ffmq15_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_wemwbs14_responses_id_seq TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE calendar_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE push_tokens_id_seq TO authenticated;
GRANT SELECT ON TABLE admins TO authenticated;
