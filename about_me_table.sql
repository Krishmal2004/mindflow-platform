-- Existing profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Existing daily_entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  media_url TEXT,
  media_type TEXT
);

-- Daily sliders table
CREATE TABLE IF NOT EXISTS daily_sliders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    feelings TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_start_time TEXT,
    wake_up_time TEXT,
    relaxation_level INTEGER CHECK (relaxation_level >= 1 AND relaxation_level <= 10),
    exercise_duration INTEGER,
    completed_exercise_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sliders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own profile" 
    ON profiles 
    FOR ALL 
    USING (id = auth.uid());

CREATE POLICY "Users can only access their own daily entries" 
    ON daily_entries 
    FOR ALL 
    USING (user_id = auth.uid());

CREATE POLICY "Users can only access their own daily sliders data" 
    ON daily_sliders 
    FOR ALL 
    USING (user_id = auth.uid());


CREATE INDEX idx_profiles_id ON profiles(id); 
CREATE INDEX idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX idx_daily_entries_user_created ON daily_entries(user_id, created_at); -

CREATE INDEX idx_daily_sliders_user_id ON daily_sliders(user_id);
CREATE INDEX idx_daily_sliders_user_created ON daily_sliders(user_id, created_at);

-- Note: idx_daily_sliders_created_at is optional if you query across all users by time (rare); keep only if needed.

-- Grant permissions
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE daily_entries TO authenticated;
GRANT ALL ON TABLE daily_sliders TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_entries_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_sliders_id_seq TO authenticated;