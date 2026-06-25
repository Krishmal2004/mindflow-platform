# MindFlow

[![CI](https://github.com/BrAINLabs-Inc/mindflow-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/BrAINLabs-Inc/mindflow-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

MindFlow is a longitudinal mindfulness research platform built by **BrainLabs Inc.** Study participants check in daily through a mobile app (and a web counterpart), logging mood, stress, sleep, and a weekly voice journal, alongside three standardized clinical scales (PSS-10, WEMWBS-14, FFMQ-15). Researchers monitor participation and aggregate results through a web admin portal. The study runs a control/experimental design — participants are split into two arms (`.cg` / `.ex`) that see slightly different in-app content, with the underlying check-ins identical across both.

## Project Structure

| Project | What it is |
|---|---|
| [`mobile/`](mobile/) | Expo (React Native) client for study participants |
| [`web-app/`](web-app/) | React + Vite web counterpart of the participant experience |
| [`web-admin/`](web-admin/) | React + Vite + Tailwind portal for researchers/admins |
| [`backend/`](backend/) | Express/TypeScript API — the only project with Supabase service-role access |
| [`database/`](database/) | `project_db.sql` — single source of truth for the schema (no ORM/migrations) |
| [`docs/`](docs/) | Architecture, database, features, and research-methodology guides |

Each project has its own `package.json`/`node_modules`/`.env` — there's no monorepo tooling, and commands run from inside each project's directory. For how the pieces fit together, see [`docs/architecture.md`](docs/architecture.md) (deeper than this README goes on purpose).

## Versions

| Project | Version |
|---|---|
| `backend` | 1.0.0 |
| `mobile` | 1.0.0 |
| `web-admin` | 1.0.0 |
| `web-app` | 0.0.0 |

These are independent per-project `package.json` versions, not a single app version — there's no shared release/versioning scheme across the four projects yet.

## Tech Stack

| Project | Core | Language | Notable dependencies |
|---|---|---|---|
| **backend** | Node.js, Express | TypeScript | Supabase JS, Zod, node-cron, expo-server-sdk, Cloudflare R2 (`@aws-sdk/client-s3`) |
| **mobile** | Expo SDK, React Native | TypeScript | React Navigation, Reanimated, expo-notifications, react-native-youtube-iframe |
| **web-admin** | React, Vite | TypeScript | Tailwind CSS, Radix UI, Recharts, Supabase JS |
| **web-app** | React, Vite | TypeScript | React Router, React Hook Form, Radix UI, Recharts |

## Getting Started

Full setup (database, all four projects, env vars) is in [`docs/getting-started.md`](docs/getting-started.md). Short version:

```bash
# 1. Apply database/project_db.sql in your Supabase project's SQL editor, then:
cd backend && npm install && cp .env.example .env && npm run dev
cd mobile  && npm install && npm start
cd web-admin && npm install && cp .env.example .env && npm run dev
cd web-app && npm install && cp .env.example .env && npm run dev
```

## Building for Production

- **backend**: `npm run build` (→ `dist/`) then `npm start`. Deployable to any Node-compatible host.
- **web-admin** / **web-app**: `npm run build` (→ `dist/`), deployable to any static host.
- **mobile (installable APK)**: requires an EAS (Expo Application Services) account and project — see [`mobile/README.md`](mobile/README.md#building-an-installable-apk-eas) for the full walkthrough. Short version once you have an EAS project linked:
  ```bash
  cd mobile
  eas build --platform android --profile preview
  ```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how the four projects fit together
- [`docs/database.md`](docs/database.md) — schema, RLS, and table-by-table purpose
- [`docs/features.md`](docs/features.md) — what the app actually does, screen by screen
- [`docs/getting-started.md`](docs/getting-started.md) — full local setup for all four projects
- [`docs/research-methodology.md`](docs/research-methodology.md) — the clinical scales and study design

## Issues

Bug reports and feature requests: [github.com/BrAINLabs-Inc/mindflow-platform/issues](https://github.com/BrAINLabs-Inc/mindflow-platform/issues).

## Recent Changes

See the [commit history](https://github.com/BrAINLabs-Inc/mindflow-platform/commits/main) for the full log. Latest at the time of writing:

- `feat:` add notifications, group-aware experiences, and journey screen improvements
- `feat:` finalize dashboard, onboarding, and survey flow improvements
- `feat:` dependencies update
- Merge pull request #1 from `HasithaErandika/release/v2.0`
- `docs:` add GitHub Pull Request template

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Code ownership is defined in [`.github/CODEOWNERS`](.github/CODEOWNERS).

## License

[MIT](LICENSE.md) © BrainLabs Inc.
