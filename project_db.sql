-- Existing profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);


-- about_me_profiles table
create table about_me_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  university_id text,
  education_level text,
  major_field_of_study text,
  age integer,
  living_situation text,
  family_background text,
  cultural_background text,
  hobbies_interests text,
  personal_goals text,
  why_mindflow text,
  completion_percentage integer default 0,
  is_completed boolean default false
);

-- Enable RLS
alter table about_me_profiles enable row level security;

-- Add RLS policies for about_me_profiles
DROP POLICY IF EXISTS "Users can only access their own about me profile" ON about_me_profiles;
CREATE POLICY "Users can only access their own about me profile" 
    ON about_me_profiles 
    FOR ALL 
    USING (id = auth.uid());

-- auto-create about_me_profile trigger
create or replace function public.handle_new_user_about_me()
returns trigger as $$
begin
  insert into public.about_me_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace trigger on_auth_user_created_about_me
  after insert on auth.users
  for each row execute procedure public.handle_new_user_about_me();


-- Daily sliders table
CREATE TABLE IF NOT EXISTS daily_sliders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    feelings TEXT,
    sleep_start_time TEXT,
    wake_up_time TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    exercise_duration INTEGER,
    completed_exercise_time INTEGER,
    relaxation_level INTEGER CHECK (relaxation_level >= 1 AND relaxation_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sliders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
CREATE POLICY "Users can only access their own profile" 
    ON profiles 
    FOR ALL 
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own daily sliders data" ON daily_sliders;
CREATE POLICY "Users can only access their own daily sliders data" 
    ON daily_sliders 
    FOR ALL 
    USING (user_id = auth.uid());

-- Create indexes for better query performance
-- CREATE INDEX idx_daily_sliders_user_id ON daily_sliders(user_id);
-- CREATE INDEX idx_daily_sliders_created_at ON daily_sliders(created_at);
-- CREATE INDEX idx_daily_sliders_user_date ON daily_sliders(user_id, DATE(created_at));

-- Grant necessary permissions
GRANT ALL ON TABLE daily_sliders TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_sliders_id_seq TO authenticated;
GRANT ALL ON TABLE about_me_profiles TO authenticated;


-- Updated Weekly Answers Table (without weekly_questions table)
-- Purpose: Store each user's answers with week identifiers

-- Drop existing tables and policies
DROP TABLE IF EXISTS weekly_questions;
DROP TABLE IF EXISTS weekly_answers;

-- Create the updated weekly_answers table
CREATE TABLE IF NOT EXISTS weekly_answers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_id TEXT NOT NULL, -- Format: YYYY-WNN-WQ (e.g., 2025-W50-WQ)
    voice_recording_id INTEGER REFERENCES voice_recordings(id) ON DELETE SET NULL, -- Reference to voice recording
    a1 TEXT,
    a2 TEXT,
    a3 TEXT,
    a4 TEXT,
    a5 TEXT,
    a6 TEXT,
    a7 TEXT,
    a8 TEXT,
    a9 TEXT,
    a10 TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE weekly_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access weekly questions" ON weekly_questions;
DROP POLICY IF EXISTS "Users can only access their own weekly answers" ON weekly_answers;

-- RLS Policies (optimized to avoid re-evaluation of auth.uid())
CREATE POLICY "Users can only access their own weekly answers" 
    ON weekly_answers 
    FOR ALL 
    USING (user_id = (SELECT auth.uid()));

-- Indexes for better performance
CREATE INDEX idx_weekly_answers_user_id ON weekly_answers(user_id);
CREATE INDEX idx_weekly_answers_week_id ON weekly_answers(week_id);
CREATE INDEX idx_weekly_answers_user_week ON weekly_answers(user_id, week_id);

-- Grant permissions
GRANT ALL ON TABLE weekly_answers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_answers_id_seq TO authenticated;

-- Insert sample data for the fixed weekly questions
-- Note: These questions are now fixed and stored in the application code, not in the database
-- Sample data would be inserted through the application

-- Main Questionnaire Tables

-- Table 1: main_question_sets
-- Purpose: Store each main questionnaire set with 25 questions
CREATE TABLE IF NOT EXISTS main_question_sets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    version TEXT UNIQUE NOT NULL, -- Unique identifier for each version (e.g., '2023-Q1')
    section_a_title TEXT NOT NULL,
    section_a_instructions TEXT NOT NULL,
    section_a_scale_min INTEGER NOT NULL,
    section_a_scale_max INTEGER NOT NULL,
    section_a_scale_labels TEXT[] NOT NULL, -- Array of labels for the scale
    section_b_title TEXT NOT NULL,
    section_b_instructions TEXT NOT NULL,
    section_b_scale_min INTEGER NOT NULL,
    section_b_scale_max INTEGER NOT NULL,
    section_b_scale_labels TEXT[] NOT NULL, -- Array of labels for the scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: main_questions
-- Purpose: Store individual questions for each section
CREATE TABLE IF NOT EXISTS main_questions (
    id SERIAL PRIMARY KEY,
    question_set_id INTEGER REFERENCES main_question_sets(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL, -- 'A' or 'B'
    question_id TEXT NOT NULL, -- e.g., 'PSS_01', 'FFMQ_01'
    question_text TEXT NOT NULL,
    facet TEXT, -- For FFMQ questions
    reverse_score BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL, -- Order of questions within section
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: main_questionnaire_responses
-- Purpose: Store each user's answers to the main questionnaire
CREATE TABLE IF NOT EXISTS main_questionnaire_responses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_set_id INTEGER REFERENCES main_question_sets(id) ON DELETE CASCADE,
    -- Section A answers (10 questions)
    a1 INTEGER,
    a2 INTEGER,
    a3 INTEGER,
    a4 INTEGER,
    a5 INTEGER,
    a6 INTEGER,
    a7 INTEGER,
    a8 INTEGER,
    a9 INTEGER,
    a10 INTEGER,
    -- Section B answers (15 questions)
    b1 INTEGER,
    b2 INTEGER,
    b3 INTEGER,
    b4 INTEGER,
    b5 INTEGER,
    b6 INTEGER,
    b7 INTEGER,
    b8 INTEGER,
    b9 INTEGER,
    b10 INTEGER,
    b11 INTEGER,
    b12 INTEGER,
    b13 INTEGER,
    b14 INTEGER,
    b15 INTEGER,
    -- Metadata
    time_to_complete INTEGER, -- Time in seconds to complete the questionnaire
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE main_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access main question sets" 
    ON main_question_sets 
    FOR ALL 
    USING (true);

CREATE POLICY "Users can only access main questions" 
    ON main_questions 
    FOR ALL 
    USING (true);

CREATE POLICY "Users can only access their own main questionnaire responses" 
    ON main_questionnaire_responses 
    FOR ALL 
    USING (user_id = auth.uid());

-- Indexes for better performance
CREATE INDEX idx_main_question_sets_version ON main_question_sets(version);
CREATE INDEX idx_main_questions_set_section ON main_questions(question_set_id, section_type);
CREATE INDEX idx_main_questions_sort_order ON main_questions(sort_order);
CREATE INDEX idx_main_responses_user_id ON main_questionnaire_responses(user_id);
CREATE INDEX idx_main_responses_question_set_id ON main_questionnaire_responses(question_set_id);
CREATE INDEX idx_main_responses_user_question_set ON main_questionnaire_responses(user_id, question_set_id);

-- Grant permissions
GRANT ALL ON TABLE main_question_sets TO authenticated;
GRANT ALL ON TABLE main_questions TO authenticated;
GRANT ALL ON TABLE main_questionnaire_responses TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE main_question_sets_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE main_questions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE main_questionnaire_responses_id_seq TO authenticated;

-- Sample data for main_question_sets table
INSERT INTO main_question_sets (
    title, 
    description, 
    version,
    section_a_title,
    section_a_instructions,
    section_a_scale_min,
    section_a_scale_max,
    section_a_scale_labels,
    section_b_title,
    section_b_instructions,
    section_b_scale_min,
    section_b_scale_max,
    section_b_scale_labels
) VALUES (
    'Perceived Stress & Mindfulness Assessment',
    'Standardized questionnaire measuring perceived stress and mindfulness facets',
    '2025-Q1',
    'Part A: Perceived Stress Scale (PSS-10)',
    'In the last month, how often have you felt...',
    0,
    4,
    ARRAY['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'],
    'Part B: Five Facet Mindfulness Questionnaire (FFMQ-15)',
    'Please rate each of the following statements...',
    1,
    5,
    ARRAY['Never or very rarely true', 'Rarely true', 'Sometimes true', 'Often true', 'Very often or always true']
);

-- Sample data for main_questions table (Section A - PSS-10)
INSERT INTO main_questions (question_set_id, section_type, question_id, question_text, reverse_score, sort_order) VALUES
(1, 'A', 'PSS_01', 'In the last month, how often have you been upset because of something that happened unexpectedly?', false, 1),
(1, 'A', 'PSS_02', 'In the last month, how often have you felt that you were unable to control the important things in your life?', false, 2),
(1, 'A', 'PSS_03', 'In the last month, how often have you felt nervous and ''stressed''?', false, 3),
(1, 'A', 'PSS_04', 'In the last month, how often have you felt confident about your ability to handle your personal problems?', true, 4),
(1, 'A', 'PSS_05', 'In the last month, how often have you felt that things were going your way?', true, 5),
(1, 'A', 'PSS_06', 'In the last month, how often have you found that you could not cope with all the things that you had to do?', false, 6),
(1, 'A', 'PSS_07', 'In the last month, how often have you been able to control irritations in your life?', true, 7),
(1, 'A', 'PSS_08', 'In the last month, how often have you felt that you were on top of things?', true, 8),
(1, 'A', 'PSS_09', 'In the last month, how often have you been angered because of things that were outside of your control?', false, 9),
(1, 'A', 'PSS_10', 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', false, 10);

-- Sample data for main_questions table (Section B - FFMQ-15)
INSERT INTO main_questions (question_set_id, section_type, question_id, question_text, facet, reverse_score, sort_order) VALUES
(1, 'B', 'FFMQ_01', 'I notice changes in my body, such as whether my breathing slows down or speeds up.', 'Observing', false, 1),
(1, 'B', 'FFMQ_02', 'I''m good at finding words to describe my feelings.', 'Describing', false, 2),
(1, 'B', 'FFMQ_03', 'I find myself doing things without paying attention.', 'Acting with Awareness', true, 3),
(1, 'B', 'FFMQ_04', 'I tell myself I shouldn''t be feeling the way I''m feeling.', 'Non-Judging', true, 4),
(1, 'B', 'FFMQ_05', 'When I have distressing thoughts or images, I just notice them and let them go.', 'Non-Reactivity', false, 5),
(1, 'B', 'FFMQ_06', 'I pay attention to sensations, such as the wind in my hair or sun on my face.', 'Observing', false, 6),
(1, 'B', 'FFMQ_07', 'I can easily put my beliefs, opinions, and expectations into words.', 'Describing', false, 7),
(1, 'B', 'FFMQ_08', 'I rush through activities without being really attentive to them.', 'Acting with Awareness', true, 8),
(1, 'B', 'FFMQ_09', 'I make judgments about whether my thoughts are good or bad.', 'Non-Judging', true, 9),
(1, 'B', 'FFMQ_10', 'When I have distressing thoughts or images, I feel calm soon after.', 'Non-Reactivity', false, 10),
(1, 'B', 'FFMQ_11', 'I pay attention to sounds, such as clocks ticking, birds chirping, or cars passing.', 'Observing', false, 11),
(1, 'B', 'FFMQ_12', 'It''s hard for me to find the words to describe what I''m thinking.', 'Describing', true, 12),
(1, 'B', 'FFMQ_13', 'I get so focused on the goal I want to achieve that I lose touch with what I am doing right now to get there.', 'Acting with Awareness', true, 13),
(1, 'B', 'FFMQ_14', 'I think some of my emotions are bad or inappropriate and I shouldn''t feel them.', 'Non-Judging', true, 14),
(1, 'B', 'FFMQ_15', 'When I have distressing thoughts or images, I am able to just notice them without reacting.', 'Non-Reactivity', false, 15);

-- Table for storing voice recording metadata
CREATE TABLE IF NOT EXISTS voice_recordings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    file_key TEXT NOT NULL, -- Key to locate the file in R2 bucket
    file_url TEXT, -- Public URL to access the file
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own voice recordings" 
    ON voice_recordings 
    FOR ALL 
    USING (user_id = auth.uid());

-- Indexes for better performance
CREATE INDEX idx_voice_recordings_user_id ON voice_recordings(user_id);
CREATE INDEX idx_voice_recordings_week_year ON voice_recordings(week_number, year);

-- Grant permissions
GRANT ALL ON TABLE voice_recordings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voice_recordings_id_seq TO authenticated;

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_voice_recordings_updated_at 
    BEFORE UPDATE ON voice_recordings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();