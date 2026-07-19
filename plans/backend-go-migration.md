# Backend Go Migration Plan (`backend/` → `backend-v2/`)

## Context

MindFlow's backend (`backend/`, Express 5 + TypeScript) currently serves mobile, web-app, and (indirectly, for a couple of admin operations) web-admin. The platform is expanding its participant base past 1,000 concurrent users, and the decision has been made to rewrite the backend in Go rather than scale the existing Node service, in order to get lower per-request latency (local JWT verification instead of a network round trip to Supabase Auth on every request) and better connection-pool control under load (direct Postgres access instead of proxying through Supabase's PostgREST layer).

This is a **strangler-fig migration**, not a big-bang rewrite: a new service is built at `backend-v2/`, developed and load-tested in parallel with the untouched `backend/`, cut over only once it has demonstrated behavioral and performance parity, and only then does `backend/` get deleted and `backend-v2/` renamed to `backend/`.

**Decisions already locked in:**
- Directory name: `backend-v2/` during migration (avoids baking "Go" into a name that becomes permanent).
- Framework: **Gin**.
- DB access: **direct Postgres via pgx + sqlc** (not Supabase's REST/PostgREST API) — least-privilege dedicated Postgres role, TLS enforced, RLS stays enabled on every table as defense-in-depth exactly as today.
- Auth: **local JWT verification** against Supabase's JWKS for `requireAuth` on every request (removes the network hop); signup/login/OTP/password-reset/refresh still proxy to Supabase's Auth HTTP API — Go is not reimplementing Supabase Auth, only replacing how *already-issued* tokens get verified.
- OpenAPI: no spec exists today anywhere in the repo. One gets authored in `backend-v2/` as the contract of record and used to verify parity before cutover.
- Must be a drop-in replacement: listen on port 3000, serve everything under `/api/*` (mobile's `EXPO_PUBLIC_API_URL` and web-app's `VITE_API_BASE_URL` both default to `http://localhost:3000` and append `/api/...` themselves). `web-admin` talks to Supabase directly today and imposes no compatibility constraint.

---

## Progress (updated 2026-07-19)

Executed inline against this plan, in `backend-v2/`, verified end-to-end against real infrastructure at every step (containerized Postgres via testcontainers-go, `ts-node`-executed golden values from the real `backend/` source, and `httptest` doubles standing in for Supabase Auth / Cloudflare R2 / Expo's push API — nothing here is "should work," it's been actually run).

### Done

- **Phase 1 (skeleton + health)**: `cmd/server/main.go`, config loading (`internal/config`), pgxpool setup, Gin engine with `gin-contrib/secure` security headers, CORS, `GET /health`. Booted against a real disposable Postgres container.
- **Phase 2 (auth verification + read-only endpoints)**: JWKS *and* HS256 JWT verification (`internal/auth`) with an explicit algorithm-confusion guard (tested), `RequireAuth`/`RequireAdmin` middleware (`RequireAdmin` implemented but deliberately left unwired, per this plan's own instruction), sqlc DB layer (`internal/db`, `internal/db/queries`) pointed directly at `database/project_db.sql`. All six listed read-only endpoints shipped: `dashboard/summary`, `journey/status`, `journey/`, `profile`, `profile/about-me`, `calendar/events` (+ its `roadmap/calendar/events` duplicate).
- **Phase 3 (auth HTTP flows)**: `internal/auth/supabaseauth` client + all 7 handlers (signup/login/verify-otp/resend-otp/reset-password/confirm-reset/refresh), including signup's username-collision-retry-with-fallback logic.
- **Phase 4 (write-heavy RPC endpoints)**: daily/thrive/stress/mindful submit endpoints calling all four Postgres RPCs via pgx, `updateVideoProgress`'s RPC, the cg/ex asymmetric daily-entry lockout, and FFMQ-15 facet scoring computed in Go. A 20-goroutine concurrent-submit test against the real advisory-lock RPC passes: exactly 1 success, 19 correctly-rejected 409s, zero duplicate rows — the scenario this plan's §7 calls "the single most important test to pass."
- **Phase 5 (weekly + R2)**: `internal/r2` S3-compatible client, weekly status/video/upload/submit endpoints, the deterministic `WeeklyVoice/weekly-{year}-W{week}-{userId}.wav` key scheme, `http.MaxBytesReader` 10MB guard, and the mimetype/extension allowlist — all per this plan's §2.5 gotcha notes.
- **Phase 6 (notifications + cron)**: hand-rolled Expo push client (`internal/notify`, no community SDK), register/unregister-token endpoints (delete correctly scoped to `user_id` + token together), `internal/jobs` scheduler with the two `Asia/Colombo`-pinned cron jobs.
- **§4 rate limiting**: `authLimiter` (15min/20) and `apiLimiter` (15min/300) via `ulule/limiter`, emitting `RateLimit-*` standard headers (not legacy `X-RateLimit-*`), applied to every route exactly as `app.ts` does today.
- **§3 least-privilege DB role**: `database/backend_v2_role.sql` (additive, doesn't touch `project_db.sql`) — also adds sequence `USAGE`/`SELECT` grants the plan's original snippet omitted, without which the granted `INSERT`s would fail against the `SERIAL` PK tables.
- **Two real bugs found and fixed along the way** (not hypothetical — both reproduced and verified fixed):
  1. `database/project_db.sql` had a table-ordering bug: `profiles`' RLS policy referenced `admins` in an `EXISTS` subquery before `admins` was created, so a genuinely fresh run of the "rebuilds from scratch" script errored out immediately after creating just the `profiles` table. Reordered; a full fresh bootstrap now succeeds (this is also what makes the `testcontainers-go` integration tests below possible at all).
  2. `pgtype.Time` (the Go type for the `event_time TIME` column) has no `MarshalJSON`, unlike every other `pgtype` field used — it was leaking its internal `{Microseconds, Valid}` struct into the calendar API response. Fixed with a proper response DTO (`db.FormatTime`).
- **Testing, built alongside every phase above rather than deferred**: golden-value unit tests for `timeutil`/`researchgroup` (values captured by actually running the original TS under `ts-node`), JWT verification tests against a real `httptest` JWKS server, `RequireAuth`/`RequireAdmin` and every service/handler layer tested against real `testcontainers-go` Postgres instances (not mocks), full request/response handler tests for the auth flows and multipart weekly upload, and rate-limit bucket-isolation tests.

### Not yet done

- **Phase 7 (parity + load testing)**: the coverage-parity checklist in §7 (mapped from the current 11 Jest files / 105 tests) hasn't been formally cross-checked item-by-item against what's been ported; `backend/loadtest/*.yml` hasn't been copied into `backend-v2/loadtest/` or run against it.
- **§6 OpenAPI / Swagger**: no `backend-v2/api/openapi.yaml` authored yet, no `oapi-codegen` wiring, no `backend-v2/scripts/parity-check` script.
- **§8 CI integration**: no `backend-v2` job added to `.github/workflows/ci.yml` yet. Note when this lands: `go.mod`'s `go` directive is `1.25.0` (one of the dependencies required it), not the `1.23` this section originally specified — the CI job's `go-version` needs to reflect that.
- **§9 Cutover**: not started, and shouldn't be until the parity gate above is actually met — this is the highest-blast-radius phase (staging deploy, production env-var flip, eventual deletion of `backend/`) and also needs real Supabase/R2 credentials and a real deployment target that don't exist in this environment.



Module path: `github.com/BrAINLabs-Inc/mindflow-platform/backend-v2` (matches the `origin` remote).

```
backend-v2/
  cmd/
    server/
      main.go                # entry point: load config, build deps, gin.Run(), graceful shutdown, cron start
    seed/
      main.go                # port of backend/src/seed.ts — dev/test data seeding via the same pgxpool + Supabase Auth admin client
  internal/
    config/
      config.go               # env loading (mirrors backend/src/config env var names exactly)
    db/
      pool.go                 # pgxpool construction, sizing
      queries/                # sqlc-generated Go code (output dir, do not hand-edit)
      sql/
        schema.sql             # symlink or copy of database/project_db.sql (sqlc needs a schema source)
        daily.sql               # hand-written queries, one file per feature domain
        weekly.sql
        thrive.sql
        stress.sql
        mindful.sql
        profile.sql
        calendar.sql
        dashboard.sql
        journey.sql
        notifications.sql
      sqlc.yaml
    auth/
      jwks.go                  # JWKS fetch + cache + refresh
      verify.go                # local JWT verification
      supabase_client.go       # thin HTTP client for signup/login/OTP/refresh/password-reset calls to Supabase Auth API
    middleware/
      auth.go                  # RequireAuth, RequireAdmin (Gin middleware)
      ratelimit.go             # authLimiter/apiLimiter equivalents
      errors.go                # centralized error responder, matches current error-shape/status-code conventions
    handlers/                  # one file per current controller
      auth.go
      calendar.go
      dashboard.go
      journey.go
      mindful.go
      notifications.go
      profile.go
      stress.go
      thrive.go
      weekly.go
      daily.go
    services/                  # business logic, one file per current service — thin wrappers around internal/db/queries
      daily.go
      weekly.go
      thrive.go
      stress.go
      mindful.go
      dashboard.go
      calendar.go
      profile.go
      notifications.go
      journey.go
    timeutil/
      slt.go                   # Sri Lanka time helpers — port of backend/src/utils/date.ts exactly
    researchgroup/
      group.go                 # port of backend/src/utils/researchGroup.ts
    r2/
      client.go                # S3-compatible client for Cloudflare R2, port of backend/src/config/r2.ts
    notify/
      expo.go                  # minimal hand-rolled Expo push client (~100 lines): validate token format, POST to https://exp.host/--/api/v2/push/send in chunks of 100, parse per-message receipts — not an unofficial/unmaintained community SDK port
    jobs/
      scheduler.go              # robfig/cron/v3 with cron.WithLocation(Asia/Colombo): morning greetings (0 8 * * *), pending task reminders (0 19 * * *)
  api/
    openapi.yaml                # hand-authored OpenAPI 3.1 spec, source of truth
  loadtest/                     # copies of backend/loadtest/*.yml, ported to point at backend-v2's port during parallel testing
  go.mod
  go.sum
  Makefile                      # make dev / make build / make test / make sqlc / make lint
  .env.example
  README.md
```

**Why this shape:** `cmd/server` + `internal/` is the standard Go project layout (internal/ prevents accidental import from other modules, not a concern here but idiomatic). One handler file and one service file per current controller/service keeps the mapping to the existing TS code obvious during porting and review. sqlc's generated code and hand-written `.sql` query files are split so regenerating never clobbers logic.

---

## 2. Phased migration order

Each phase ends with the ported endpoints passing equivalent tests and being reachable on `backend-v2`'s dev port for manual/Artillery comparison against `backend`. Order goes low-risk-read-only → auth → write-heavy/RPC-backed → file upload → background jobs, so there's always a working, growing service rather than one big cutover.

1. **Skeleton + health**: `cmd/server/main.go`, config loading, pgxpool setup, Gin engine with helmet-equivalent security headers (see §4 note on Gin middleware choices), CORS, `GET /health`. Verify it boots and connects to a real (dev/staging) Postgres.
2. **Auth verification + read-only endpoints**: JWKS fetch/cache, `RequireAuth` middleware, then `GET /api/dashboard/summary`, `GET /api/journey/status`, `GET /api/journey/`, `GET /api/profile`, `GET /api/profile/about-me`, `GET /api/calendar/events` (+ its `/api/roadmap/calendar/events` duplicate). These are the highest-traffic, lowest-risk routes (no writes) — good for early load-test comparison against `backend`.
3. **Auth HTTP flows**: `POST /api/auth/{signup,login,verify-otp,resend-otp,reset-password,confirm-reset,refresh}` — these proxy to Supabase's Auth API (not local), so port them next since they're self-contained and needed before any real end-to-end testing of the write endpoints (need real tokens).
4. **Write-heavy roadmap endpoints with RPCs**: `daily` (incl. `updateVideoProgress` RPC), `thrive`, `stress`, `mindful` — each calls one of the four existing Postgres RPCs (`increment_daily_video_seconds`, `submit_thrive_entry`, `submit_stress_entry`, `submit_mindful_entry`) via pgx. Port these together since they share the "call existing RPC via pgx, don't reimplement locking" pattern — use `daily`'s video-progress RPC as the template pgx-RPC-call pattern for the other three.
5. **Weekly / file upload**: `GET /api/roadmap/weekly/status`, `GET /api/roadmap/weekly/video`, `POST /api/roadmap/weekly/upload` (multipart → R2), `POST /api/roadmap/weekly` — ported after the RPC-based ones because it adds the R2 client and Gin's multipart handling as new surface area. **Gotcha to plan for**: Gin's `MaxMultipartMemory` alone does not hard-cap total upload size the way multer's `limits.fileSize` does — wrap the request body in `http.MaxBytesReader` (10MB, matching today's limit) before calling `c.FormFile`, or an oversized upload will still buffer to disk/memory before being rejected. Reuse the same mimetype/extension allowlist as `uploadMiddleware.ts` (`audio/wav`, `audio/x-wav`, `audio/wave`, `audio/mpeg`, `audio/mp4`, `audio/webm`, `audio/ogg`, `application/octet-stream`, or `.wav/.mp3/.m4a/.webm/.ogg` extension fallback).
6. **Notifications + cron**: `POST /api/notifications/{register-token,unregister-token}`, then `internal/jobs/scheduler.go` (the two `Asia/Colombo`-pinned cron jobs). Last because it's the only functionality with no HTTP caller waiting on it — nothing breaks if it lands last, and it depends on the roadmap endpoints already being portable (pending-reminders logic fans out to all 5 status checks).
7. **Parity + load testing pass**: run the Jest-equivalent Go tests, run Artillery load tests against `backend-v2` on a separate port, diff results against `backend`'s existing baselines (stress/spike/soak/concurrency thresholds in `backend/loadtest/`).
8. **Cutover** (see §9).

---

## 3. DB access layer

- **Schema source**: sqlc's `sqlc.yaml` points at `database/project_db.sql` (the existing single source of truth — no copy/fork, reference it directly via relative path so schema drift is impossible).
- **Queries**: one `.sql` file per feature domain under `internal/db/sql/`, using sqlc's `-- name: GetDailyStatus :one` annotation style. `sqlc generate` outputs typed Go functions + structs into `internal/db/queries/`.
- **Calling the existing RPCs**: the four Postgres functions (`submit_stress_entry`, `submit_thrive_entry`, `submit_mindful_entry`, `increment_daily_video_seconds`) are called via sqlc queries of the form `SELECT * FROM submit_stress_entry($1, $2, ...)` — sqlc treats this like any other query, so their advisory-lock logic is reused as-is with zero reimplementation risk. This is a hard requirement, not an optimization: these functions exist specifically because their race-safety can't be expressed as a UNIQUE constraint (rolling windows), so reimplementing the locking in Go application code would reintroduce the exact race conditions they were built to close. When an RPC raises its `X_ALREADY_SUBMITTED` exception, catch it via pgx's `*pgconn.PgError.Message` and map it to the same 409 the Express controller returns today (`DAILY_ALREADY_SUBMITTED` / `STRESS_ALREADY_SUBMITTED` / `THRIVE_ALREADY_SUBMITTED` / `MINDFUL_ALREADY_SUBMITTED`).
- **Connection pooling**: `pgxpool.Pool` sized via `MaxConns` — for a 1000-concurrent-user target, start with `MaxConns` around 20–30 per instance (`MinConns` 5, `MaxConnLifetime` ~45m, `MaxConnIdleTime` ~5m), not 1000 — HTTP requests complete in low-double-digit ms, so Gin/Go multiplexes many concurrent users over a small pool. Tune from load-test results in phase 7. Connect through Supabase's **Supavisor pooler** connection string (transaction mode) rather than the direct Postgres port, since that's what actually protects against exhausting Postgres's real connection ceiling once `backend-v2` scales horizontally across multiple instances — if scaling to N instances, total connections = N × MaxConns, which must stay under the project's `max_connections` (check via `SHOW max_connections;`) with headroom for other tooling. Note Supabase's direct Postgres host can be IPv6-only on some plans — if the eventual host lacks IPv6 egress, use the Session-mode pooler endpoint instead (still raw wire protocol, and `pg_advisory_xact_lock` is transaction-scoped so it stays compatible with transaction-mode pooling too); this is purely a `DATABASE_URL` value choice, no code change. Enforce TLS (`sslmode=verify-full` or at minimum `require`). `cmd/server/main.go` should ping the pool at startup and fail fast (non-zero exit) on an unreachable/misconfigured `DATABASE_URL`, rather than pgxpool's default lazy-connect behavior.
- **Least-privilege role**: create a dedicated Postgres role for `backend-v2` via a new, additive file `database/backend_v2_role.sql` (does not touch the canonical `project_db.sql`):
  ```sql
  CREATE ROLE app_backend_v2 WITH LOGIN PASSWORD '...' BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  GRANT SELECT, INSERT, UPDATE, DELETE ON
    profiles, about_me_profiles, daily_sliders, voice_recordings, weekly_recordings,
    questionnaire_pss10_responses, questionnaire_ffmq15_responses, questionnaire_wemwbs14_responses,
    calendar_events, push_tokens
    TO app_backend_v2;
  GRANT SELECT ON admins TO app_backend_v2;  -- needed for requireAdmin parity
  GRANT EXECUTE ON FUNCTION
    submit_stress_entry, submit_thrive_entry, submit_mindful_entry, increment_daily_video_seconds
    TO app_backend_v2;
  -- No grants on auth.* — user identity comes from the locally-verified JWT's claims;
  -- auth-flow actions (signup/login/otp/etc.) proxy over HTTP to Supabase Auth, not SQL.
  ```
  This runs alongside the existing service-role key setup used by `backend/` (both coexist during the parallel-run period). Store its connection string as its own secret (`DATABASE_URL`), separate from `SUPABASE_SERVICE_ROLE_KEY`. **Why `BYPASSRLS` here is not a regression**: RLS stays `ENABLE`d on every table exactly as today (defense-in-depth for every *other* connection path — PostgREST, Studio, ad-hoc scripts). The Go service's authorization model matches today's exactly: `requireAuth` extracts a cryptographically verified `user_id`, and every sqlc query is hand-written with an explicit `WHERE user_id = $1` — this is strictly *narrower* than blanket service-role access (scoped grants per table/function, zero access to `auth.*`), not broader.

---

## 4. Auth design

- **JWKS fetch/cache**: `internal/auth/jwks.go`, using `github.com/golang-jwt/jwt/v5` for parsing + `github.com/MicahParks/keyfunc/v3` for a background-refreshing JWKS client pointed at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` — no per-request network call, which is the whole point of the latency win. **Preflight check required in phase 1, not assumed**: confirm in the Supabase dashboard (Settings → API → JWT Keys) whether this project uses the newer asymmetric JWKS/ES256 signing (path above) or the legacy shared HS256 secret. If legacy, skip JWKS entirely and validate with a static `SUPABASE_JWT_SECRET` env var instead — same `Claims` struct, same middleware, gated by one config flag (`JWT_VERIFICATION_MODE=jwks|hs256`). This is a real fact to verify about the current project, not a hedge on the local-verification decision itself.
- **`RequireAuth` middleware** (`internal/middleware/auth.go`): extracts Bearer token, verifies locally (signature + `exp` + `aud=="authenticated"`), extracts `sub` (user id) and `email` claim, attaches to Gin context — same shape as today's `req.user = {id, email}`. On verification failure, 401 with the same error body shape the Express version returns (needed for the mobile/web-app error-handling code paths to keep working unchanged).
- **`RequireAdmin` middleware**: ports directly — query `admins` table for `id = user_id` using the pgx pool (via the `app_backend_v2` role's `SELECT` grant on `admins`), 403 if absent. Port it even though it's currently unused in Express, but **leave it unwired from any route** — that's intentional parity with today's "defined but unused infrastructure" status, not an oversight to fix.
- **Signup/login/OTP/refresh/reset**: these remain thin proxies to Supabase's Auth (GoTrue) REST API (`internal/auth/supabaseauth/client.go`) — a minimal hand-written `net/http` client against the documented endpoints (`POST /auth/v1/signup`, `POST /auth/v1/token?grant_type=password`, `POST /auth/v1/verify`, `POST /auth/v1/resend`, `POST /auth/v1/recover`, `POST /auth/v1/token?grant_type=refresh_token`, `PUT /auth/v1/admin/users/{id}` with service-role headers for confirm-reset) rather than a full SDK, since there's no mature official Supabase Go SDK and the surface is a handful of stable endpoints. Go is not reimplementing password hashing, OTP generation, or session issuance — this mirrors what `authController.ts` does today (it also just calls the Supabase JS client's auth methods, themselves thin HTTP wrappers).
- **Rate limiting**: port `authLimiter` (15 min window, max 20) and `apiLimiter` (15 min window, max 300) using `github.com/ulule/limiter` — match the existing `standardHeaders`/no-`legacyHeaders` behavior (i.e. emit `RateLimit-*` headers, not the deprecated `X-RateLimit-*` ones) so client-side handling doesn't need to change.

---

## 5. Business-logic parity checklist

Port these exactly — each is a specific, non-obvious behavior that existing tests or real usage depend on:

- **Sri Lanka time math** (`internal/timeutil/slt.go`, port of `backend/src/utils/date.ts`): fixed UTC+5:30 offset (no DST, no `time.LoadLocation` needed — just a fixed `time.FixedZone("SLT", 5*3600+30*60)`), `GetISOWeekNumber`, `StartOfToday` (SL-local midnight → correct UTC instant), `StartOfNextLocalMonday`. Write a direct table-driven test comparing against known outputs from the TS version at boundary dates (year-end ISO week 52/53 is worth an explicit test case).
- **`dashboardService.ts`'s timezone inconsistency — port as-is, do not "fix" it**: unlike every other feature, `dashboardService.ts`'s streak/consistency-percentage math uses raw server-local `new Date()`/`setHours(0,0,0,0)`, NOT the `startOfToday()`/Sri-Lanka-pinned helper used everywhere else. This looks like a bug, and may be one, but silently correcting it during a rewrite would shift real participants' streak numbers with no product sign-off. Replicate the exact (server-local-time) behavior in the Go port, and flag it separately as a follow-up decision for the product/research team to make deliberately — not something to resolve inside this migration.
- **Research-group derivation** (`internal/researchgroup/group.go`): suffix check on `research_id` (`.ex` → `"ex"`, `.cg` → `"cg"`, else `""`) — used in calendar filtering, daily-entry lockout/field-nulling, weekly video selection, dashboard summary. Single function, reused everywhere, exactly like the TS version.
- **Control-group daily-entry behavior**: `cg` users blocked from resubmitting once completed (409), and their `mindfulness_practice`/`practice_duration`/`practice_location` fields forced to `null` regardless of submitted input — this is a data-integrity rule for the study design, not just a UX nicety, so it must be enforced server-side in the Go handler exactly as today, not left to client trust. `ex` users have the opposite behavior — they **can** resubmit/update the same day via the upsert — preserve this asymmetry exactly, don't accidentally lock out both groups.
- **FFMQ-15 facet scoring**: 5 facets computed from q1–q15, reverse-scoring (`6 - val`) applied to specific items — port the exact formulas from `mindfulService.ts` (verify against the source at implementation time; do not re-derive from the general FFMQ literature, since this study's specific item-to-facet mapping is the ground truth): `observing = q1+q6+q11`, `describing = q2+q7+reverse(q12)`, `awareness = reverse(q3)+reverse(q8)+reverse(q13)`, `nonJudging = reverse(q4)+reverse(q9)+reverse(q14)`, `nonReactivity = q5+q10+q15`, where `reverse(v) = 6-v`. Scores are computed in Go before the RPC call, never in SQL.
- **R2 deterministic key scheme**: `WeeklyVoice/weekly-{year}-W{week}-{userId}.wav` — must match exactly, since `submitWeeklyEntry`'s `file_key` prefix-verification check depends on the same format being generated by `uploadAudio`.
- **`about_me` default shape**: `getAboutMe` must return a full all-null/`is_completed:false` object shape when no row exists, never a bare `null` — the mobile onboarding gate (`postAuthRoute.ts`) depends on this exact shape.
- **Notification token unregister scoping**: `removeToken` deletes scoped to both `expo_push_token` AND `user_id` together — this is a security property (prevents unregistering another user's device via a leaked/guessed token), not an incidental query shape.
- **Journey status fault tolerance**: `getJourneyStatus`'s fan-out to all 5 roadmap status checks must use a pattern equivalent to `Promise.allSettled` (Go: goroutines + a `sync.WaitGroup` or `errgroup.Group` with `.Go()` per check, collecting each result/error independently) — one failing check must return `{completed:false, nextReset:null, error:true}` for that key only, never fail the whole endpoint.
- **Username collision retry on signup**: on a UNIQUE constraint violation for `profiles.username`, retry once with an id-suffixed username, and if that also fails, still return signup success with a `warning` string rather than failing the whole signup.

---

## 6. OpenAPI / Swagger setup

**Recommendation: hand-author `backend-v2/api/openapi.yaml` (OpenAPI 3.1) as the source of truth, generate Go request/response types and Gin-compatible stubs from it via `oapi-codegen`.** Concretely:

1. Draft the spec early (phase 0–1, before each route's implementation, not retrofitted after), deriving each path/schema from the current Express `routes/*.ts` + the Zod schemas in `validation/authSchemas.ts` and inline in each controller — this is the closest thing to a spec that exists today, so it's the correct starting draft, not a from-scratch guess.
2. Use **`oapi-codegen/oapi-codegen` v2** (the actively maintained fork — the older `deepmap/oapi-codegen` is archived) to generate `internal/api/types.gen.go` (request/response types) and `internal/api/server.gen.go` (a `ServerInterface` + `RegisterHandlers(router *gin.Engine, si ServerInterface)`) via `go generate`/`make generate`, configured in `backend-v2/api/oapi-codegen-config.yaml` (`generate: [types, gin, embedded-spec]`). Handlers implement that interface, so a handler that doesn't match its documented schema is a compile error, not a runtime surprise.
3. Embed the spec via `go:embed`, serve it raw at `GET /api/openapi.yaml`, and mount a static CDN-loaded Swagger-UI page at `GET /api/docs` pointing at it — no heavyweight UI dependency needed since the spec is hand-authored, not annotation-generated.
4. Use the spec as the parity contract in two layers: (a) **in-repo, automatic** — `oapi-codegen/gin-middleware`'s request/response validator run inside Go tests, so drift between the spec and the implementation fails `go test ./...` directly; (b) **cross-repo, manual pre-cutover step** — a small script (`backend-v2/scripts/parity-check`) that fires a fixed set of golden requests (shared seeded test user, fixed bodies) at `backend/` (port 3000) and `backend-v2/` (port 3001) in parallel and diffs status codes + JSON shape (excluding intentionally-variant fields like timestamps/ids).

This is a one-way decision to make now (not deferred): once handlers are typed against generated OpenAPI structs, the spec can't silently drift from the implementation the way an after-the-fact Swagger annotation approach (`swaggo/swag` code comments) can.

---

## 7. Testing strategy

- **Unit tests**: `testify`, table-driven, for pure functions — `timeutil`, `researchgroup`, FFMQ facet scoring — seeded from the exact boundary-date assertions already in `backend/tests/{calendarService,dashboardService,weeklyService}.test.ts` so the same magic dates stay covered.
- **Handler tests**: Gin test mode + `net/http/httptest`, hitting the real router wired against a hand-written/mocked implementation of sqlc's generated `Querier` interface (generate with `emit_interface: true` in `sqlc.yaml` specifically so this is mockable) — the direct Go analog of mocking `supabase-js` at the module boundary in `tests/helpers/supabaseMock.ts`, but at the sqlc interface boundary instead.
- **Integration tests against a real Postgres**: use `testcontainers-go` to spin up a disposable Postgres container per test run, apply `database/project_db.sql` as the init script, and run sqlc-generated queries against it for real — this replaces the current Supabase-JS-mock approach, since sqlc's generated code doesn't have a natural mocking seam the way a JS client object does; testing against a real (containerized, disposable) Postgres is the standard sqlc-ecosystem pattern and also exercises the actual RPC/advisory-lock behavior (submit-lockout races, `increment_daily_video_seconds` atomicity), which a mock never could. `ubuntu-latest` GitHub runners ship Docker preinstalled, so this runs in CI without extra setup.
- **Auth tests**: mint test JWTs signed with a locally-generated test key/secret, point the JWKS client at an `httptest.Server` (or inject the HS256 secret directly, depending on which mode phase-2's preflight check determines) — no real Supabase dependency in CI.
- **Coverage parity targets** (mapped from the current 11 Jest files / 105 tests): auth middleware (missing/invalid/valid token), signup/login edge cases (username collision retry, email-not-confirmed 403), control-group calendar filtering, journey fault-tolerance (one service failing doesn't 500 the aggregate), rate-limit 429 behavior, an equivalent of `security.test.ts`'s table-driven 18-route auth-required check, security headers present, oversized-body/malformed-JSON handling, weekly video group-based selection.
- **Load testing**: copy `backend/loadtest/{stress,spike,soak,concurrency}.yml` into `backend-v2/loadtest/`, point at `backend-v2`'s dev port, keep the same `ensure` thresholds (p95 <1000ms, error rates per scenario) as the acceptance bar — `concurrency.yml`'s `concurrent-daily-submit` scenario (expects exactly one 200 + rest 409, never a 500 or duplicate row) is the single most important test to pass, since it directly validates the ported RPC-based race-safety.

---

## 8. CI integration

Add a `backend-v2` job to `.github/workflows/ci.yml`, mirroring the existing `backend` job's shape:

```yaml
backend-v2:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: ./backend-v2
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    SUPABASE_JWT_SECRET: ${{ secrets.SUPABASE_JWT_SECRET }}
    DATABASE_URL: ${{ secrets.DATABASE_URL_BACKEND_V2 }}
    R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
    R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
    R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
    R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
    R2_PUBLIC_URL: ${{ secrets.R2_PUBLIC_URL }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-go@v5
      with:
        go-version: '1.23'
        cache: true
        cache-dependency-path: backend-v2/go.sum
    - run: go vet ./...
    - uses: golangci/golangci-lint-action@v6
      with:
        working-directory: backend-v2
    - run: go build ./...
    - run: go test ./...
```

No other workflow (`codeql.yml`, `mobile-build.yml`, `ios-build.yml`, `build-android.yml`) references `backend/` today, so none of them need changes. `DATABASE_URL_BACKEND_V2` and `SUPABASE_JWT_SECRET` (needed only if the phase-2 preflight check finds the project on legacy HS256 signing) are new secrets to provision — `backend-v2` connects directly to Postgres, unlike `backend`, which only ever uses Supabase's client-level keys. `go.sum` must exist (via `go mod tidy` in Phase 0) for the cache key to work.

---

## 9. Cutover plan

1. **Parity gate**: all phase-7 tests and load tests pass against `backend-v2` at thresholds matching or beating `backend`'s current baselines; the OpenAPI-diff check (§6.4) shows no undocumented divergence.
2. **Side-by-side staging run**: deploy `backend-v2` to a staging host (same generic "any Go-compatible host" framing as `docs/architecture.md` already uses for Node — Render/Railway/Fly/a container all work, nothing here is Go-specific), point a staging build of mobile/web-app at it via `EXPO_PUBLIC_API_URL`/`VITE_API_BASE_URL`, exercise the full roadmap manually.
3. **Production cutover**: change the production `EXPO_PUBLIC_API_URL` / `VITE_API_BASE_URL` values (env config, not code) to point at wherever `backend-v2` is deployed — both already default to `http://localhost:3000` and expect `/api/*`, so this is purely an env/infra change, not a client code change, provided `backend-v2` is deployed on the same effective host/port contract.
4. **Monitor**: run the same Artillery scenarios against production traffic patterns (or close to it) for a defined soak period before decommissioning `backend/`.
5. **Rename**: delete `backend/` (Express), rename `backend-v2/` → `backend/`, update `ci.yml`'s job name from `backend-v2` back to `backend` (and drop the old Node `backend` job), update `docs/architecture.md`'s repo-layout section to reflect the new Go structure, update `docs/getting-started.md`'s backend setup instructions (Go toolchain instead of `npm install`).
