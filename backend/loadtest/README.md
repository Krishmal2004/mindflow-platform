# Load & reliability tests (Artillery)

These hit a **running server** over HTTP — a real (or staging) Supabase project,
not the Jest-mocked one used by `npm test`. Never point these at production
Supabase; run against a local server backed by a staging/dev Supabase project.

## One-time setup

1. Copy `.env.example` to `.env` in `backend/` and point it at a **staging**
   Supabase project (not production).
2. `npm run seed` — creates the confirmed test account these scripts use by
   default: `seed.participant@mindflow.app` / `SeedParticipant123!`.
3. Start the server: `npm run build && npm start` (test against the built,
   production-mode app, not `npm run dev`) with `NODE_ENV=production`.

## Running a test

```bash
export BASE_URL=http://localhost:3000
export AUTH_TOKEN=$(npm run -s loadtest:token)   # logs in once, reuses the JWT

npm run loadtest:stress        # ramps traffic up until it slows/fails
npm run loadtest:spike         # sudden burst, then watch recovery
npm run loadtest:soak          # sustained moderate load (default 10 min sanity run)
npm run loadtest:concurrency   # many simultaneous logins + Daily Slider submits
```

For a real multi-hour soak run, override the phase duration instead of editing
the file (see the comment in `soak.yml`):

```bash
npx artillery run --overrides '{"config":{"phases":[{"duration":7200,"arrivalRate":10,"name":"sustained-moderate-load"}]}}' loadtest/soak.yml
```

## Why AUTH_TOKEN is fetched once, up front

`/api/auth/login` sits behind the strict auth rate limiter (20 requests /
15 min per IP, see `src/app.ts`). Logging in per virtual user would trip that
limiter almost immediately and the test would just measure the rate limiter,
not the endpoints you actually care about. `stress.yml`, `spike.yml`, and
`soak.yml` all reuse one token obtained via `loadtest/get-token.js`.
`concurrency.yml` is the exception — it deliberately hits `/api/auth/login`
concurrently in one of its two scenarios, because validating that the limiter
holds up under a concurrent burst is the point of that scenario.

## Reading the results

- **Stress**: watch for where p95/p99 latency and the error rate start
  climbing as `arrivalRate` ramps — that inflection point is the breaking
  point, not the final number reached.
- **Spike**: compare latency/error rate in the `recovery` phase against the
  `baseline` phase. If they don't converge back down, the server isn't
  shedding load cleanly.
- **Soak**: Artillery only reports HTTP-level metrics. In parallel, watch the
  server process itself for a slow climb that never plateaus:
  ```bash
  # memory (RSS) over time
  watch -n 30 'ps -o rss,vsz,pid,cmd -p $(pgrep -f "dist/server.js")'
  ```
  For event-loop lag, add `@nodejs/clinic` or a one-line
  `setInterval` probe (e.g. `perf_hooks.monitorEventLoopDelay()`) around the
  soak window if you don't already have APM/monitoring wired up in staging.
- **Concurrency (daily-submit scenario)**: expect exactly one `200` and the
  rest `409 DAILY_ALREADY_SUBMITTED` for a fresh test account (or all `409` if
  the seeded account already has today's entry) — never a `500` and never more
  than one row for the same user/day in `daily_sliders`. That's the actual
  assertion: the unique-per-day constraint holds under concurrent writes.
- **Concurrency (login scenario)**: expect a mix of `200`/`401` early and
  `429` once the burst exceeds the auth limiter's 20/15min budget — a clean
  `429` under burst is a pass, not a bug.

## Known limitations

- All authenticated scenarios reuse **one** seeded participant's token/session,
  so this exercises "N requests against one account concurrently," not "N
  distinct users' sessions concurrently." For true multi-account concurrency
  (e.g. modeling a real cohort logging in at 9am), extend `src/seed.ts` to
  provision several confirmed test accounts and round-robin their tokens in
  the scenario — not currently built, since the study's per-user daily-entry
  shape doesn't change under multiple distinct accounts, only the DB's
  connection/row-lock behavior does.
- `ensure` thresholds (`p95`, `maxErrorRate`) in each `.yml` are starting
  points tuned for a local run against a dev Supabase project; tune them
  against your actual staging SLOs before treating a failed `ensure` as a
  release blocker.
