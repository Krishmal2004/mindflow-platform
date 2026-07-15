-- ==============================================================================
-- Mindfulness Research App Database Schema
-- ==============================================================================
-- This script sets up the complete database schema for the application.
-- It includes User Management, Core Features, Questionnaire System, and Calendar.
--
-- GUIDELINES:
-- 1. All tables have RLS enabled.
-- 2. Users can generally only access their own data.
-- 3. Admins can view all data (implied via RLS policies).
-- 4. Shared functions and extensions are defined first.

-- ==============================================================================
-- 0. EXTENSIONS & SHARED FUNCTIONS
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
-- 1. USER MANAGEMENT
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
-- Table: admins
-- Purpose: Stores admin user credentials and metadata.
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
-- 2. CORE FEATURES (Mindfulness & Tracking)
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
    practice_log TEXT,
    practice_location TEXT CHECK (practice_location IN ('At University', 'Outside University')),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    calm_before INTEGER CHECK (calm_before >= 1 AND calm_before <= 5),
    calm_after INTEGER CHECK (calm_after >= 1 AND calm_after <= 5),
    feelings TEXT,
    sleep_start_time TEXT,
    wake_up_time TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    video_play_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Prevents duplicate daily entries per user per day when concurrent submits race
-- (e.g. double-tap or a client retry-on-timeout hitting submitDailyEntry/updateVideoProgress twice).
-- Cast goes through `AT TIME ZONE '+05:30'` (Sri Lanka Standard Time — the study cohort's
-- home timezone; fixed offset, no DST, therefore IMMUTABLE) rather than a bare
-- `created_at::date`, which Postgres rejects in generated columns because casting a
-- timestamptz straight to date is session-TimeZone-dependent (STABLE, not IMMUTABLE).
-- "+05:30" here follows ISO-8601 sign convention (positive = ahead of UTC), not the
-- flipped POSIX convention used for named "Etc/GMT+n" zones.
ALTER TABLE daily_sliders
    ADD COLUMN IF NOT EXISTS entry_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE '+05:30')::date) STORED;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'daily_sliders_user_entry_date_unique'
    ) THEN
        ALTER TABLE daily_sliders
            ADD CONSTRAINT daily_sliders_user_entry_date_unique UNIQUE (user_id, entry_date);
    END IF;
END $$;

-- Migrates a database provisioned before the switch above from UTC-midnight to Sri Lanka
-- local-midnight reset boundaries: the generated expression on an existing entry_date
-- column can't be altered in place, so this drops and recreates it (STORED, so every row
-- is recomputed from its real created_at — no data loss, just correct reclassification).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'daily_sliders' AND column_name = 'entry_date'
          AND generation_expression ILIKE '%UTC%'
    ) THEN
        ALTER TABLE daily_sliders DROP CONSTRAINT IF EXISTS daily_sliders_user_entry_date_unique;
        ALTER TABLE daily_sliders DROP COLUMN entry_date;
        ALTER TABLE daily_sliders
            ADD COLUMN entry_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE '+05:30')::date) STORED;
        ALTER TABLE daily_sliders
            ADD CONSTRAINT daily_sliders_user_entry_date_unique UNIQUE (user_id, entry_date);
    END IF;
END $$;

-- Replaces the separate mood/relaxation_level questions with a single "Right now I feel
-- calm" item asked twice (before and after the mindfulness practice step), and replaces
-- the free-text "what did you practice" picker with a two-option practice location.
ALTER TABLE daily_sliders DROP COLUMN IF EXISTS mood;
ALTER TABLE daily_sliders DROP COLUMN IF EXISTS relaxation_level;
ALTER TABLE daily_sliders ADD COLUMN IF NOT EXISTS calm_before INTEGER CHECK (calm_before >= 1 AND calm_before <= 5);
ALTER TABLE daily_sliders ADD COLUMN IF NOT EXISTS calm_after INTEGER CHECK (calm_after >= 1 AND calm_after <= 5);
ALTER TABLE daily_sliders ADD COLUMN IF NOT EXISTS practice_location TEXT CHECK (practice_location IN ('At University', 'Outside University'));

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Prevents duplicate weekly recordings per user per ISO week when concurrent submits race
-- (e.g. double-tap or a client retry-on-timeout hitting submitWeeklyEntry twice) — mirrors
-- daily_sliders_user_entry_date_unique above. WeeklyService#submitWeeklyEntry upserts on
-- this constraint instead of a plain insert.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'voice_recordings_user_week_year_unique'
    ) THEN
        ALTER TABLE voice_recordings
            ADD CONSTRAINT voice_recordings_user_week_year_unique UNIQUE (user_id, week_number, year);
    END IF;
END $$;

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
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- target_group: which study arm this video is for ('ex'/'cg'), or NULL to show to everyone.
ALTER TABLE weekly_recordings
ADD COLUMN IF NOT EXISTS target_group TEXT CHECK (target_group IN ('ex', 'cg'));

-- RLS: weekly_recordings
ALTER TABLE weekly_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access weekly recordings" ON weekly_recordings;
CREATE POLICY "Users can access weekly recordings" ON weekly_recordings FOR SELECT USING (true);

-- Index: week_no is the leading column, so this also covers plain week_no lookups.
-- At most one video per group per week (NULL/group-agnostic rows are exempt, e.g. legacy Week 1 entry).
DROP INDEX IF EXISTS idx_weekly_recordings_week_no;
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_recordings_week_group ON weekly_recordings(week_no, target_group);


-- ==============================================================================
-- 3. QUESTIONNAIRE SYSTEM (Specific Research Instruments)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questionnaire_ffmq15_responses
ADD COLUMN IF NOT EXISTS observing_score INTEGER,
ADD COLUMN IF NOT EXISTS describing_score INTEGER,
ADD COLUMN IF NOT EXISTS awareness_score INTEGER,
ADD COLUMN IF NOT EXISTS non_judging_score INTEGER,
ADD COLUMN IF NOT EXISTS non_reactivity_score INTEGER;


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
-- 4. CALENDAR SYSTEM
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
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "All users can access calendar events" ON calendar_events;
-- DROP POLICY IF EXISTS "Authenticated users can insert events" ON calendar_events;
-- DROP POLICY IF EXISTS "Authenticated users can update their events" ON calendar_events;
-- DROP POLICY IF EXISTS "Authenticated users can delete their events" ON calendar_events;

-- Strict Policy: Public access (or restrict as needed later)
-- CREATE POLICY "Users manage own events" 
--     ON calendar_events 
--     FOR ALL 
--     USING (true);

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
-- 5. PUSH NOTIFICATIONS
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
-- 6. PERMISSIONS
-- ==============================================================================

-- Grant Usage Permissions
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE about_me_profiles TO authenticated;
GRANT ALL ON TABLE daily_sliders TO authenticated;
GRANT ALL ON TABLE voice_recordings TO authenticated;
GRANT ALL ON TABLE weekly_recordings TO authenticated;

-- New Questionnaire Tables
GRANT ALL ON TABLE questionnaire_pss10_responses TO authenticated;
GRANT ALL ON TABLE questionnaire_ffmq15_responses TO authenticated;
GRANT ALL ON TABLE questionnaire_wemwbs14_responses TO authenticated;

GRANT ALL ON TABLE calendar_events TO authenticated;
GRANT ALL ON TABLE push_tokens TO authenticated;

-- Grant Sequence Permissions
GRANT USAGE, SELECT ON SEQUENCE daily_sliders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voice_recordings_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_recordings_id_seq TO authenticated;

-- New Sequences
GRANT USAGE, SELECT ON SEQUENCE questionnaire_pss10_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_ffmq15_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_wemwbs14_responses_id_seq TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE calendar_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE push_tokens_id_seq TO authenticated;
GRANT SELECT ON TABLE admins TO authenticated;
