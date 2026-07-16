# Pre-production test checklist (backend)

Status of each item on the pre-production checklist, as of this pass. "Done"
items point at the file; "Manual/ops" items aren't code changes and need a
human decision or a staging environment to execute against.

## Performance and reliability

| Item | Status |
|---|---|
| Stress testing | **Done** — `loadtest/stress.yml` (`npm run loadtest:stress`) |
| Spike testing | **Done** — `loadtest/spike.yml` (`npm run loadtest:spike`) |
| Soak/endurance testing | **Done** — `loadtest/soak.yml` (`npm run loadtest:soak`); see its README section for what to watch (RSS memory, event-loop lag) beyond what Artillery reports |
| Concurrency testing | **Done** — `loadtest/concurrency.yml` (`npm run loadtest:concurrency`): concurrent logins + concurrent Daily Slider submits against the same account |

All four need a running server against a **staging** Supabase project — see
`loadtest/README.md` for setup. They are not run in CI; run them manually
before a release, or wire a subset into a scheduled job later if that becomes
worth the cost.

## Functional and API testing

| Item | Status |
|---|---|
| Unit tests (controllers/services/utils) | **Existing** — `tests/*.test.ts`, e.g. `dashboardService.test.ts`, `weeklyService.test.ts`, `calendarService.test.ts`, `profileService.test.ts` |
| Integration tests (routes/middleware/auth/validation/DB) | **Existing** — `tests/routes.test.ts`, `tests/authMiddleware.test.ts`; **extended** by `tests/security.test.ts` (table-driven 401 checks across every protected route) |
| E2E API tests for critical flows | **Partial** — signup/login covered by `tests/auth.test.ts`; dashboard summary and journey status covered by `tests/routes.test.ts`/`tests/journeyStatus.test.ts`. Questionnaire submission (thrive/stress/mindful) has service-level tests but no route-level e2e test yet — same pattern as `routes.test.ts` would extend cleanly if you want that filled in. |
| Regression tests | **Existing** — the Jest suite (105 tests across 11 files as of this pass) runs on every `npm test`; CI (`.github/workflows/ci.yml`) runs it on backend changes. |

## Security testing

| Item | Status |
|---|---|
| Auth/authz: protected routes reject missing/invalid JWTs | **Done** — `tests/security.test.ts` runs this against all 18 protected routes, not just one sample route |
| Input validation: malformed JSON, oversized payloads, unexpected fields | **Done** — same file. Fixing this test surfaced a real bug: the global error handler in `src/app.ts` was catching body-parser's `PayloadTooLargeError`/`SyntaxError` and returning a generic `500` instead of `413`/`400` — fixed as part of this pass (see `app.ts`'s error handler). |
| Rate limiting on login/OTP/public endpoints | **Existing + tested** — `authLimiter` (20/15min) already wired in `app.ts`; `tests/rateLimiting.test.ts` now asserts it actually returns `429` under burst, and that it's scoped separately from the general `apiLimiter` (300/15min). |
| OWASP checks (injection, broken access control, sensitive data exposure, headers) | **Partial** — Supabase's query builder parameterizes everything the codebase does (no raw SQL string interpolation found), so classic SQL injection isn't a live surface. `requireAdmin` correctly checks the `admins` table server-side rather than trusting a client-supplied role. Security headers are verified in `tests/security.test.ts`. Not covered: a dependency vulnerability scan — run `npm audit` (also `npm audit --omit=dev` for the production dependency tree specifically) before shipping. `artillery` (added as a devDependency for load testing) currently pulls in ~16 moderate-severity transitive advisories; since it's dev-only and never ships to `dist/`, that's acceptable, but re-check with `npm audit` if you add other devDependencies. |
| Secrets review: service-role key never exposed to clients | **Verified** — grepped `mobile/`, `web-admin/`, `web-app/` for `SERVICE_ROLE`; none found. Only `backend/src/config/supabase.ts` reads `SUPABASE_SERVICE_ROLE_KEY`. |

## Database and Supabase checks

| Item | Status |
|---|---|
| Indexes on frequently filtered columns | **Mostly in place** — every per-user table (`daily_sliders`, `voice_recordings`, `questionnaire_pss10/ffmq15/wemwbs14_responses`, `push_tokens`) has a `user_id` index; `daily_sliders` additionally indexes `created_at`. **Gap found**: the three questionnaire tables and `daily_sliders` are always queried as `WHERE user_id = ? AND created_at >= ?` (see `dashboardService.ts`, `thriveService.ts`, `stressService.ts`, `mindfulService.ts`) but only have single-column indexes, not a composite one. At current seed-data volume this doesn't matter; at production volume it will mean Postgres either does a bitmap-AND of two indexes or falls back to a sequential scan filtered by the less-selective column. Recommended (review before applying — `database/project_db.sql` is the single source of truth, no migration tool):<br>`CREATE INDEX IF NOT EXISTS idx_pss10_user_created ON questionnaire_pss10_responses(user_id, created_at);`<br>`CREATE INDEX IF NOT EXISTS idx_ffmq15_user_created ON questionnaire_ffmq15_responses(user_id, created_at);`<br>`CREATE INDEX IF NOT EXISTS idx_wemwbs14_user_created ON questionnaire_wemwbs14_responses(user_id, created_at);`<br>`CREATE INDEX IF NOT EXISTS idx_daily_sliders_user_created ON daily_sliders(user_id, created_at);` (the two existing single-column indexes on this table can then be dropped). `calendar_events` and `weekly_recordings` are shared/global content tables, not per-user, so they don't need a `user_id` index. |
| Queries against production-like data volume | **Manual/ops** — not exercised by the current seed script (tens of rows per user). Before launch, seed a copy of staging with realistic row counts (e.g. thousands of `daily_sliders` rows across many users) and re-run `EXPLAIN ANALYZE` on the queries above, plus re-run `loadtest/soak.yml` against that copy. |
| Connection limits, slow queries, RLS impact on direct client access | **Manual/ops** — the backend uses the service-role key and bypasses RLS entirely (by design, see CLAUDE.md), so RLS is only exercised if `web-admin`/`web-app`/`mobile` ever call Supabase directly. Check Supabase's connection pooler (pgbouncer) mode and pool size against expected concurrent backend instances if you move to clustering/PM2 (below). |
| Backups, restore procedures, migration/schema-change safety | **Manual/ops** — Supabase manages automated backups; confirm the point-in-time-recovery window matches your data-loss tolerance for a longitudinal study, and do one practice restore before relying on it. Since there's no migration tool, schema changes go: edit `database/project_db.sql` → apply manually to staging → verify → apply to production, with no ad-hoc `ALTER` statements left uncommitted to the file. |

## Express-specific hardening

| Item | Status |
|---|---|
| `NODE_ENV=production` in staging/production tests | **Manual/ops** — the code branches on it (e.g. morgan's log format in `app.ts`); make sure your staging deploy actually sets it, since it's easy to forget outside of a process manager. |
| `helmet` for security headers | **Already present** — `app.ts` |
| `compression` for response compression | **Added this pass** — `app.ts` |
| `express-rate-limit` on login/auth routes | **Already present** — `authLimiter` in `app.ts`, now covered by `tests/rateLimiting.test.ts` |
| Request body validation via a schema library | **Already present** — Zod schemas in every controller (`src/validation/authSchemas.ts` plus inline schemas in each roadmap controller) |
| Centralized error handling → clean 4xx/5xx under load | **Fixed this pass** — see the body-parser bug noted above |
| Monitor memory/event-loop lag during soak tests | **Manual/ops** — no APM wired up yet; see `loadtest/README.md`'s soak section for a manual `ps`-based stopgap |
| Clustering/PM2/horizontal scaling if CPU-bound | **Manual/ops, deferred** — no evidence yet that the API is CPU-bound (it's mostly I/O-bound against Supabase); revisit only if the stress test in `loadtest/stress.yml` shows CPU saturation rather than I/O wait as the bottleneck |

## What changed in this pass

- `src/app.ts`: added `compression()`; fixed the global error handler to return `413`/`400` for oversized/malformed request bodies instead of a generic `500`.
- `tests/security.test.ts` (new): 401/malformed-input/security-header coverage across all 18 protected routes.
- `tests/rateLimiting.test.ts` (new): confirms the auth limiter actually returns `429` under burst and is scoped separately from the general API limiter.
- `loadtest/` (new): `stress.yml`, `spike.yml`, `soak.yml`, `concurrency.yml`, `get-token.js`, `README.md` — Artillery scenarios plus `npm run loadtest:*` scripts.
- `package.json`: added `compression`, `@types/compression`, `artillery` (dev).

Full Jest suite: 105 tests / 11 suites, all passing (`npm test`).
