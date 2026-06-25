# Getting Started

How to set up and run all four MindFlow projects locally. Each has its own `package.json`/`node_modules`/`.env` — commands run from inside that project's directory, not the repo root.

## Prerequisites
- **Node.js** v20.x (LTS), npm, Git.
- A **Supabase** project (free tier is fine) — this is the database; there's no local-Postgres option since the backend talks to it via the Supabase client, not a raw connection string.
- **Expo Go** app (for mobile, local dev only) or Android Studio / Xcode if you want an emulator/simulator.

## 0. Database

In your Supabase project's SQL editor, run [`database/project_db.sql`](../database/project_db.sql). It's idempotent, so re-running it after a future schema change is safe.

Grab from the Supabase dashboard (Project Settings → API): the project URL, the `anon` key, and the `service_role` key — you'll need these for `backend/.env` and the web projects' `.env`.

## 1. Backend (`backend/`)

```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, R2_* (Cloudflare R2, for voice-recording uploads)
npm run dev             # nodemon + ts-node, http://localhost:3000
```
`npm test` runs the Jest suite (mocked Supabase client, no real network/DB needed). `npm run seed` seeds sample data, including `.ex`/`.cg`-tagged research accounts.

## 2. Mobile (`mobile/`)

```bash
cd mobile
npm install
cp .env.example .env    # only needed for a physical device or non-default host — see the comments in .env.example
npm start                # or: npx expo start -c to clear the Metro cache
```
Press `a`/`i` for an emulator/simulator, or scan the QR code with **Expo Go**. `npx tsc --noEmit` type-checks; `npm test` runs Jest (`jest-expo`).

> Push notifications (8 AM / 7 PM reminders) need an EAS project, which isn't configured yet — see `mobile/README.md` before relying on them.

## 3. Web Admin (`web-admin/`)

```bash
cd web-admin
npm install
cp .env.example .env    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:5173
```

## 4. Web App (`web-app/`)

```bash
cd web-app
npm install
cp .env.example .env    # same shape as web-admin
npm run dev              # http://localhost:5174 (deliberately different port, so it can run alongside web-admin)
```

---

## Troubleshooting

- **Mobile can't reach the backend**: `localhost` doesn't resolve from a device/emulator the way it does on your machine. `mobile/src/config/api.ts` already special-cases the Android emulator (`10.0.2.2`); for a physical device, set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your machine's LAN IP.
- **Backend throws on startup**: it throws immediately if `SUPABASE_URL` isn't set — that's intentional, not a bug to work around.
- **Metro/bundler acting up after adding a package or asset**: `npx expo start -c`.
