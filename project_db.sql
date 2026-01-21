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

-- ------------------------------------------------------------------------------
-- Table: admins
-- Purpose: Stores admin user credentials and metadata.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- Store hashed passwords in production!
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
    major_field_of_study TEXT,
    age INTEGER,
    living_situation TEXT,
    family_background TEXT,
    cultural_background TEXT,
    hobbies_interests TEXT,
    personal_goals TEXT,
    why_mindflow TEXT,
    completion_percentage INTEGER DEFAULT 0,
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
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    feelings TEXT,
    sleep_start_time TEXT,
    wake_up_time TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    video_play_seconds INTEGER DEFAULT 0,
    relaxation_level INTEGER CHECK (relaxation_level >= 1 AND relaxation_level <= 5),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_sliders_user_id ON daily_sliders(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_sliders_created_at ON daily_sliders(created_at);

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
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: weekly_recordings
ALTER TABLE weekly_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access weekly recordings" ON weekly_recordings;
CREATE POLICY "Users can access weekly recordings" ON weekly_recordings FOR SELECT USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_weekly_recordings_week_no ON weekly_recordings(week_no);

-- Seed Data: Weekly Recordings
INSERT INTO weekly_recordings (week_no, title, youtube_id, description, published_at)
VALUES (
    1, 'Guided Mindfulness Practice — Week 1 (2026)', 'wAIoe992Qak',
    'Curated guided mindfulness practice for the first week of 2026 (YouTube)',
    '2026-01-01T00:00:00Z'
)
ON CONFLICT DO NOTHING;

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

-- Index
CREATE INDEX IF NOT EXISTS idx_pss10_user_id ON questionnaire_pss10_responses(user_id);


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

-- Index
CREATE INDEX IF NOT EXISTS idx_ffmq15_user_id ON questionnaire_ffmq15_responses(user_id);


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

-- Index
CREATE INDEX IF NOT EXISTS idx_wemwbs14_user_id ON questionnaire_wemwbs14_responses(user_id);


-- ==============================================================================
-- 4. CALENDAR SYSTEM
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: calendar_events
-- Purpose: Stores user-specific calendar events.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

DROP POLICY IF EXISTS "All users can access calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update their events" ON calendar_events;
DROP POLICY IF EXISTS "Authenticated users can delete their events" ON calendar_events;

-- Strict Policy: Users only see/manage THEIR OWN events.
CREATE POLICY "Users manage own events" 
    ON calendar_events 
    FOR ALL 
    USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- ==============================================================================
-- 5. PERMISSIONS
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

-- Grant Sequence Permissions
GRANT USAGE, SELECT ON SEQUENCE daily_sliders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voice_recordings_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_recordings_id_seq TO authenticated;

-- New Sequences
GRANT USAGE, SELECT ON SEQUENCE questionnaire_pss10_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_ffmq15_responses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_wemwbs14_responses_id_seq TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE calendar_events_id_seq TO authenticated;
GRANT SELECT ON TABLE admins TO authenticated;
