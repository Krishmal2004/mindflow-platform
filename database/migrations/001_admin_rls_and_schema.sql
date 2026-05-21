-- Run against Supabase SQL editor (idempotent where possible)

-- Remove legacy plaintext password column from admins (auth is Supabase-only)
ALTER TABLE admins DROP COLUMN IF EXISTS password;

-- Admin write access for operational tables (authenticated admin JWT + RLS)
DROP POLICY IF EXISTS "Admins manage all daily sliders" ON daily_sliders;
CREATE POLICY "Admins manage all daily sliders"
    ON daily_sliders FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all voice recordings" ON voice_recordings;
CREATE POLICY "Admins manage all voice recordings"
    ON voice_recordings FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all about me" ON about_me_profiles;
CREATE POLICY "Admins manage all about me"
    ON about_me_profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles"
    ON profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage PSS10" ON questionnaire_pss10_responses;
CREATE POLICY "Admins manage PSS10"
    ON questionnaire_pss10_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage FFMQ15" ON questionnaire_ffmq15_responses;
CREATE POLICY "Admins manage FFMQ15"
    ON questionnaire_ffmq15_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage WEMWBS14" ON questionnaire_wemwbs14_responses;
CREATE POLICY "Admins manage WEMWBS14"
    ON questionnaire_wemwbs14_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage calendar events" ON calendar_events;
CREATE POLICY "Admins manage calendar events"
    ON calendar_events FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
