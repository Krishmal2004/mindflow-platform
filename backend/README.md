# MindFlow Backend

The Express/TypeScript API. The only project that holds the Supabase **service-role key**, so it's the only thing that can act on behalf of any user — everything else (mobile, web-admin, web-app) talks to this API, not to Supabase directly (web-admin is a partial exception for some admin-only reads).

## Features

- **Roadmap step endpoints**: Daily Sliders (24h reset), Weekly Whispers voice upload (weekly/ISO-week reset), Thrive Tracker/WEMWBS-14 (14-day lockout), Stress Snapshot/PSS-10 and Mindful Mirror/FFMQ-15 (30-day lockout). `GET /api/journey/status` fans out to all five in parallel for the mobile dashboard's lock/unlock logic.
- **Audio uploads**: `multer` receives the recording, the service streams it straight to Cloudflare R2 (S3-compatible) — no local disk storage.
- **Push notification reminders**: `node-cron` jobs (started from `server.ts`) send an 8 AM greeting and a 7 PM "pending tasks" nudge via Expo's push service, computed from real per-user completion status.
- **Study-group-aware responses**: weekly guided video and calendar events both filter by the caller's `.ex`/`.cg` research group (`src/utils/researchGroup.ts`).
- **Security**: `helmet`, `express-rate-limit` (separate stricter limit for `/api/auth`), Zod request validation, centralized error handling.

## Setup

```bash
npm install
cp .env.example .env
npm run dev   # nodemon + ts-node, http://localhost:3000
```

### Environment variables (see `.env.example`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — note these names are backend-specific, **not** the `EXPO_PUBLIC_*`/`VITE_*`-prefixed ones the client projects use for the same Supabase project.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2, for voice-recording uploads.
- `PORT`, `CORS_ORIGINS` (comma-separated, production only).

The server throws on startup if `SUPABASE_URL` is missing — that's intentional.

### Database
Schema lives in [`../database/project_db.sql`](../database/project_db.sql), applied via the Supabase SQL editor — there's no local Postgres, no ORM, and no migration tool. See `../docs/database.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | nodemon + ts-node, watches `src/` |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | runs the compiled server (`dist/server.js`) |
| `npm test` | Jest (`tests/**/*.test.ts`) — mocks the Supabase client at the module boundary, no real DB |
| `npm run seed` | `ts-node src/seed.ts` — seeds sample data, including `.ex`/`.cg`-tagged research accounts |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Project Structure

```
backend/src/
├── config/        # Supabase client, Cloudflare R2 client
├── constants/     # Rate limits, pagination caps
├── controllers/   # Request handlers — auth check, Zod validation, call a service
├── services/      # Business logic + Supabase queries, one per feature area
├── routes/        # Express routers, mounted in app.ts under /api/*
├── middlewares/   # requireAuth / requireAdmin, error handling
├── jobs/          # node-cron reminder scheduler
├── utils/         # date helpers, research-group derivation
├── validation/    # shared Zod schemas
├── app.ts         # Express app (imported by tests — no side effects on import)
└── server.ts      # process entry point: app.listen() + starts the cron scheduler
```
