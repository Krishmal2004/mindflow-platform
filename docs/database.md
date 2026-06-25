# Database Schema

Single source of truth: [`database/project_db.sql`](../database/project_db.sql) — a complete, idempotent schema script (every `CREATE TABLE`/`CREATE POLICY` is guarded with `IF NOT EXISTS`/`DROP POLICY IF EXISTS`, so it's safe to re-run against an existing database after a schema change). There is no ORM and no migration tool; when the schema changes, that file changes and gets re-run.

The database is hosted on **Supabase** (PostgreSQL). The backend connects with the **service-role key**, which bypasses Row Level Security entirely — RLS below is the safety net for any other client (web-admin, future direct-to-Supabase calls), not something the Express layer relies on.

## Tables

### `profiles`
User-facing profile, one row per `auth.users` row.
- `id` (UUID, PK, FK → `auth.users`), `username`, `research_id` (e.g. `MF-2026-001.ex`), `updated_at`.
- Created by application code in `authController.signup` (no DB trigger) — always upserted even when no display name is supplied.
- `research_id`'s suffix (`.ex` / `.cg`) is the only signal of study-arm membership; see `docs/research-methodology.md`.

### `admins`
- `id` (UUID, PK, FK → `auth.users`), `username`, `email`, `created_at`, `last_login`.
- Membership in this table (not a role/claim) is what RLS policies check via `EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())`.

### `about_me_profiles`
Detailed onboarding questionnaire, one row per user.
- `id` (PK, FK → `auth.users`), `university_id`, `education_level`, `major_field_of_study`, `age`, `living_situation`, `family_background`, `cultural_background`, `hobbies_interests`, `personal_goals`, `why_mindflow`, `completion_percentage`, `is_completed`, timestamps.
- Auto-created (mostly empty, `is_completed: false`) by the `handle_new_user_about_me` trigger on `auth.users` insert — this is the onboarding gate mobile checks client-side.

### `daily_sliders`
One row per daily check-in.
- `id`, `user_id`, `mindfulness_practice` (`yes`/`no`), `practice_duration`, `practice_log` (free text, not an enum), `stress_level`/`mood`/`sleep_quality`/`relaxation_level` (all `1–5`, DB-constrained), `feelings` (free text, not an enum), `sleep_start_time`, `wake_up_time`, `video_play_seconds`, `created_at`.
- `practice_log` and `feelings` option lists live entirely in `mobile/src/screens/roadmap/DailySlidersScreen.tsx` — changing them is a frontend-only change.

### `voice_recordings`
Metadata for the "Weekly Whispers" voice-journal audio (the file itself lives in Cloudflare R2).
- `id`, `user_id`, `week_number`, `year`, `file_key`, `file_url`, `duration`, timestamps.

### `weekly_recordings`
Admin-curated guided-session video shown on the Daily Sliders video step (Step 0).
- `id`, `week_no`, `title`, `youtube_id`, `description`, `published_at`, `target_group` (`ex`/`cg`/`NULL` for everyone), `created_at`.
- Unique on `(week_no, target_group)` — at most one video per group per week.

### `questionnaire_pss10_responses` / `questionnaire_ffmq15_responses` / `questionnaire_wemwbs14_responses`
One row per submission of each clinical scale (see `docs/research-methodology.md` for the instruments themselves).
- `id`, `user_id`, `q1`..`qN` (`1–5`, DB-constrained: 10/15/14 items respectively), `duration`, `created_at`.
- FFMQ-15 additionally has computed facet score columns: `observing_score`, `describing_score`, `awareness_score`, `non_judging_score`, `non_reactivity_score`.

### `calendar_events`
Shared (not per-user) schedule shown on the mobile Calendar screen.
- `id`, `title`, `description`, `event_date`, `event_time`, `is_completed`, timestamps.
- No `target_group` column — group-based filtering (control group must not see mindfulness-themed sessions) happens in `backend/src/services/calendarService.ts`, matched by title prefix (`'Mindfulness Session'`), not a schema field.

### `push_tokens`
One row per registered device, for the 8 AM / 7 PM reminder jobs.
- `id`, `user_id`, `expo_push_token` (unique — re-registering the same device updates the existing row), `platform`, timestamps.

## Row Level Security

Every table has RLS enabled. The general pattern is two policies per table:
- `"Users see own, Admins see all"` (or per-table equivalents) — `SELECT` (and sometimes `ALL`) where `user_id = auth.uid()` OR the caller is in `admins`.
- A separate `"Admins manage ..."` `FOR ALL` policy giving admins write access too, for tables where the base policy is read-only for admins.

`calendar_events` and `weekly_recordings` are exceptions — they're shared content, not per-user data, so their `SELECT` policy is simply `USING (true)`.

## Sequencing concept (not a DB concept)

The 5-step roadmap (Daily Sliders, Weekly Whispers, Thrive Tracker, Stress Snapshot, Mindful Mirror) has no shared table or foreign key — each is backed by its own table above, with its own reset cadence (24h / weekly / 14-day / 30-day / 30-day). Sequencing and "locked/active/completed" state is computed by the mobile dashboard from `GET /api/journey/status`, which just fans out to each table's own status check in parallel.
