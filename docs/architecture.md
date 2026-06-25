# Architecture

## Overview

Four independent npm projects share one Supabase (PostgreSQL) database. There's no monorepo tooling (no Turborepo/Nx/workspaces) — each project has its own `package.json`, `node_modules`, and `.env`, and is built/run from inside its own directory.

```
mobile/      Expo (React Native) client — study participants
web-app/     React + Vite web counterpart of the participant experience
web-admin/   React + Vite + Tailwind portal — researchers/admins
backend/     Express/TypeScript API — the only thing that talks to Supabase with the service-role key
database/    project_db.sql — single source of truth for the schema (no ORM, no migration tool)
docs/        this directory
```

`mobile/` and `web-app/` are two clients for the *same* participant-facing features (Daily Sliders, Weekly Whispers, questionnaires, calendar), both talking to the same `backend/` API.

---

## `backend/`

Express + TypeScript. Connects to Supabase with the **service-role key** (bypasses RLS — see `docs/database.md`), so it's the only project that can act as every user. Every other project talks to `backend/`, not to Supabase directly (web-admin is the one partial exception — see below).

```
backend/src/
├── config/        # Supabase client, Cloudflare R2 (S3-compatible) client
├── constants/      # Shared limits (rate limits, pagination caps)
├── controllers/    # Request handlers — auth, parse/validate (Zod), call a service, respond
├── services/       # Business logic + Supabase queries, one per feature area
├── routes/         # Express routers, mounted in app.ts under /api/*
├── middlewares/    # requireAuth / requireAdmin, error handling
├── jobs/           # node-cron reminder scheduler (started from server.ts, not app.ts)
├── utils/          # date helpers, research-group derivation
├── validation/      # shared Zod schemas
├── app.ts          # Express app + middleware + route mounting (imported by tests, no side effects)
└── server.ts       # process entry point — app.listen() + starts the cron scheduler
```

Tests (`backend/tests/`) mock the Supabase client at the module boundary (`jest.doMock('../src/config/supabase', ...)`), not the network — there's no test database.

---

## `mobile/`

Expo (React Native) + TypeScript, React Navigation (native-stack + bottom-tabs), Reanimated for animation.

```
mobile/src/
├── screens/
│   └── roadmap/      # The 5 roadmap step screens (DailySliders, WeeklyWhispers, etc.)
├── components/        # Shared UI (icons, modals, decorations)
├── navigation/        # AppNavigator (stack) + tab navigator
├── lib/               # apiClient (fetch wrapper + GET cache), notifications, postAuthRoute
├── constants/         # Colors, etc.
└── config/            # API base URL resolution (per-platform: emulator vs device vs prod)
```

Auth/session state lives in `AsyncStorage` (`authToken`, `isLoggedIn`, `userName`). The onboarding gate (`lib/postAuthRoute.ts`) and the push-token registration (`lib/notifications.ts`) are the two pieces of logic that run from multiple screens rather than being screen-local.

---

## `web-admin/`

React + Vite + TypeScript + Tailwind, Radix UI primitives, Recharts. Talks to the `backend/` API for most things, but also imports `@supabase/supabase-js` directly for some admin operations — this is the one place outside `backend/` that touches Supabase directly, which is exactly why RLS exists as a real enforcement layer here (not just a UX nicety like it is for mobile).

---

## `web-app/`

React + Vite + TypeScript, React Router, React Hook Form, Radix UI, Recharts — the web counterpart of the mobile participant experience. Same `backend/` API.

---

## Deployment shape

- **Database**: Supabase-hosted Postgres. Apply `database/project_db.sql` via the Supabase SQL editor (it's idempotent — safe to re-run after a schema change).
- **Backend**: any Node-compatible host (Render/Railway/Fly/etc.) — stateless, no local file storage (audio uploads go straight to R2).
- **Mobile**: Expo Go for local dev only; production builds need EAS (see `mobile/README.md` — no EAS project is configured yet, so push notifications and standalone builds aren't available out of the box).
- **web-admin / web-app**: static builds (`npm run build` → `dist/`), deployable to any static host.

## CI

`.github/workflows/ci.yml` runs, per push/PR to `main`/`development`: `backend` (build + test), `mobile` (typecheck + test), `web-admin` (build). `web-app` has no CI job yet.
