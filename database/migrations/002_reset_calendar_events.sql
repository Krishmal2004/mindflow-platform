-- Run against Supabase SQL editor (idempotent where possible)
--
-- Wipes all existing calendar_events rows and reseeds the schedule with one
-- entry on every Tuesday, Wednesday, and Friday from today through the next
-- 8 weeks. Re-run any time to push the window forward — it always reseeds
-- relative to CURRENT_DATE, never a hardcoded date.
--
-- Adjust the title/description/event_time below, or the '8 weeks' window,
-- before running if you want different content or a longer/shorter range.
-- Title is kept as 'Mindfulness Session' to match the highlighting check in
-- mobile/src/screens/CalendarScreen.tsx (event.title.startsWith('Mindfulness Session')).

BEGIN;

TRUNCATE TABLE calendar_events RESTART IDENTITY;

INSERT INTO calendar_events (title, description, event_date, event_time, is_completed)
SELECT
    'Mindfulness Session',
    'Guided mindfulness check-in for today''s schedule.',
    d::date,
    '09:00:00',
    FALSE
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '8 weeks', INTERVAL '1 day') AS d
WHERE EXTRACT(ISODOW FROM d) IN (2, 3, 5); -- ISO weekday: Tue=2, Wed=3, Fri=5

COMMIT;
