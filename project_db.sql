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

-- Weekly Questions Tables

-- Table 1: weekly_questions
-- Purpose: Store each weekly question set
CREATE TABLE IF NOT EXISTS weekly_questions (
    id SERIAL PRIMARY KEY,
    week_id TEXT UNIQUE NOT NULL, -- Unique identifier for each week's set (e.g., '2023-W45')
    q1 TEXT NOT NULL,
    q2 TEXT NOT NULL,
    q3 TEXT NOT NULL,
    q4 TEXT NOT NULL,
    q5 TEXT NOT NULL,
    q6 TEXT NOT NULL,
    q7 TEXT NOT NULL,
    q8 TEXT NOT NULL,
    q9 TEXT NOT NULL,
    q10 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: weekly_answers
-- Purpose: Store each user's answers
CREATE TABLE IF NOT EXISTS weekly_answers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_set_id INTEGER REFERENCES weekly_questions(id) ON DELETE CASCADE,
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
ALTER TABLE weekly_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access weekly questions" ON weekly_questions;
DROP POLICY IF EXISTS "Users can only access their own weekly answers" ON weekly_answers;

-- RLS Policies
CREATE POLICY "Users can only access weekly questions" 
    ON weekly_questions 
    FOR ALL 
    USING (true);

-- RLS Policies (optimized to avoid re-evaluation of auth.uid())
CREATE POLICY "Users can only access their own weekly answers" 
    ON weekly_answers 
    FOR ALL 
    USING (user_id = (SELECT auth.uid()));

-- Indexes for better performance
CREATE INDEX idx_weekly_questions_week_id ON weekly_questions(week_id);
CREATE INDEX idx_weekly_answers_user_id ON weekly_answers(user_id);
CREATE INDEX idx_weekly_answers_question_set_id ON weekly_answers(question_set_id);
CREATE INDEX idx_weekly_answers_user_question_set ON weekly_answers(user_id, question_set_id);

-- Grant permissions
GRANT ALL ON TABLE weekly_questions TO authenticated;
GRANT ALL ON TABLE weekly_answers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_questions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_answers_id_seq TO authenticated;


-- Sample data for weekly_questions table
INSERT INTO weekly_questions (week_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10) VALUES
('2025-W50', 
 'What is one thing you are grateful for this week?',
 'Describe a moment this week when you felt truly present.',
 'What challenge did you face this week, and how did you handle it?',
 'Which of your values guided you most this week?',
 'What activity brought you the most joy this week?',
 'How have your relationships influenced your well-being this week?',
 'What is one habit you would like to develop or improve?',
 'In what way did you show kindness to yourself this week?',
 'What is one thing you learned about yourself this week?',
 'How do you plan to take care of your mental health in the coming week?');