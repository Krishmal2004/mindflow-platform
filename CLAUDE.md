# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MindFlow is a longitudinal mindfulness research platform. Study participants use the mobile app; researchers use the web admin portal. Four independent npm projects share one Postgres/Supabase database (schema in `database/project_db.sql` — there is no ORM or migration tool, this file is the single source of truth for the schema):

- `mobile/` — Expo (React Native) client for study participants.
- `backend/` — Express/TypeScript API, the only thing that talks to Supabase with the service-role key.
- `web-admin/` — React + Vite + Tailwind portal for researchers/admins.
- `web-app/` — React + Vite web counterpart of the participant experience (Daily Sliders, Weekly Whispers, questionnaires, calendar).
- `docs/` — architecture, database, and research-methodology guides; read these for deeper context before changing schema or clinical-scale logic.

Each subproject has its own `package.json`, `node_modules`, and `.env`/`.env.example` — there is no root-level workspace tooling.

## Commands

Run these from inside the relevant subdirectory (`backend/`, `mobile/`, `web-admin/`, or `web-app/`), not from the repo root.

**backend/**
- `npm run dev` — nodemon + ts-node, watches `src/`.
- `npm run build` — `tsc` to `dist/`.
- `npm start` — run the compiled server (`dist/server.js`).
- `npm test` — Jest (`tests/**/*.test.ts`); single file: `npx jest tests/auth.test.ts`; single test: `npx jest -t "name fragment"`.
- `npm run seed` — `ts-node src/seed.ts`, seeds sample data including `.ex`/`.cg` research accounts.

**mobile/**
- `npm start` / `npm run android` / `npm run ios` / `npm run web` — Expo dev server.
- `npx tsc --noEmit` — type check (no separate build step; this is what CI runs).
- `npm test` — Jest via the `jest-expo` preset; single file: `npx jest src/screens/__tests__/JourneyScreen.test.tsx`.

**web-admin/** and **web-app/**
- `npm run dev` — Vite dev server (web-app defaults to port 5174 to coexist with web-admin's 5173).
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — ESLint.

CI (`.github/workflows/ci.yml`) runs build+test for `backend` and `mobile`, and build for `web-admin`, as separate jobs.

## Architecture notes that span multiple files

**Research group (`.cg` / `.ex`) controls mindfulness content, not access.** `profiles.research_id` is a researcher-assigned string ending in `.cg` (control) or `.ex` (experimental) — it is never set during self-registration, only by seed/admin tooling. `backend/src/services/dashboardService.ts` (`DashboardService.getUserSummary`) derives `group` from that suffix and exposes it via `GET /api/dashboard/summary`. The mobile `DashboardScreen` calls that endpoint and hides mindfulness-specific content (e.g. the rotating quotes card) when `group === 'cg'`. If you add new mindfulness-themed UI to the dashboard, gate it the same way — don't assume all logged-in users should see it.

**Onboarding gate is enforced client-side via a shared helper, not a backend middleware.** `about_me_profiles` rows are auto-created by a Postgres trigger (`handle_new_user_about_me` in `project_db.sql`) on signup with `is_completed: false`. Every post-auth entry point in mobile (`SplashScreen`, `LoginScreen`, `OtpVerificationScreen`) calls `mobile/src/lib/postAuthRoute.ts#getPostAuthRoute()`, which checks `GET /api/profile/about-me` and routes to `AboutMe` instead of `MainTabs` if incomplete. There is no backend-side block on other routes — it's a UX gate, not a security boundary. `profiles` rows (separate from `about_me_profiles`) get a bare safety-net row (blank `username`, blank `research_id`) from a Postgres trigger too (`handle_new_user_profile` in `project_db.sql`, added after a real-world case where the app-level upsert silently failed and left a user with no `profiles` row at all). `authController.signup` still does its own upsert immediately after — via `ON CONFLICT (id) DO UPDATE`, so it updates that same trigger-created row rather than inserting a second one — to fill in a real username derived from `full_name`/email; always keep that upsert even when `full_name` is absent, since the trigger alone doesn't set a username and downstream `profiles` lookups (display name, research group) need one.

**The 5-step roadmap is gamified sequencing on top of independent feature tables.** Daily Sliders, Weekly Whispers, Thrive Tracker (WEMWBS-14), Stress Snapshot (PSS-10), and Mindful Mirror (FFMQ-15) are unrelated tables/controllers (`dailyController`, `weeklyController`, `thriveController`, `stressController`, `mindfulController`) that each expose a `*/status` endpoint. `GET /api/journey/status` (via `journeyController.getJourneyStatus`) fans out to all five in parallel; the mobile `DashboardScreen` uses the combined result purely to decide which roadmap node is locked/active/completed — sequencing is a frontend concept, each table has no awareness of the others.

**`daily_sliders.feelings` is free text, not a DB enum.** `feelings` (primary influencing-factor label) is a plain `TEXT` column with no `CHECK` constraint — its option list lives entirely in `mobile/src/screens/roadmap/DailySlidersScreen.tsx` (`INFLUENCING_FACTORS`); changing it is a frontend-only change, no migration needed. `practice_log` (superseded by `mindfulness_practice`/`practice_duration`/`practice_location`, the mobile client's `PRACTICE_LOCATIONS` list backing `practice_location`) has been dropped from the schema entirely via `project_db.sql`. `mindfulness_practice` and `practice_location` ARE constrained via `CHECK` at the DB level, as are the numeric scales (`stress_level`, `calm_before`, `calm_after`, `sleep_quality`) 1–5.

**Backend env vars use its own names, not Expo's.** Backend reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (`backend/src/config/supabase.ts`). Mobile reads `EXPO_PUBLIC_*`-prefixed vars by Expo convention. Don't copy mobile's `.env` naming into `backend/.env` — they are deliberately different and the backend config no longer falls back to the `EXPO_PUBLIC_*` names.

**RLS is on for every table; admin bypass is a separate `admins` table.** Every table in `project_db.sql` has `"Users see own, Admins see all"` policies that check `EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())`. The backend itself connects with the Supabase **service role key** (bypasses RLS entirely) — RLS is the safety net for any direct client access (web-admin, future direct-to-Supabase calls), not something the Express layer relies on.

**Tests mock the Supabase client at the module boundary, not the network.** Both `backend/tests/helpers/supabaseMock.ts` and mobile's per-test `jest.mock('../../lib/apiClient', ...)` replace `supabase`/`apiFetch` entirely rather than hitting a real or local database — there is no test database. When adding backend tests, mock `../src/config/supabase` before importing the controller/service under test, since the real module throws at import time if `SUPABASE_URL` isn't set.
