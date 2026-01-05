# Getting Started Guide

This guide shows how to run the mobile client (Expo) locally from scratch, plus Docker and production build notes.

## Prerequisites
- Node.js v20.x (LTS) + npm (or Yarn)
- Git
- Expo CLI (optional locally — `npx expo` works)
- Android Studio / Xcode (only for native emulator/simulator builds)

## Quickstart — run the mobile app locally

1. Clone the repository and change into the mobile app folder:
   ```bash
   git clone <repository-url>
   cd mindfulness-research-app/app
   ```

2. Install dependencies (prefer `npm ci` in CI, `npm install` locally):
   ```bash
   npm install
   # or
   yarn install
   ```



    - `EXPO_PUBLIC_SUPABASE_URL`
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
    - Cloud-storage keys (R2/S3) if applicable

2. Create environment variables (copy from an example if present):
   ```bash
   cp .env.example .env
   # then edit .env to add your keys
   ```
   Required env keys used by the app (example names):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Cloud-storage keys (R2/S3) if applicable

3. Start the Expo dev server:
   ```bash
   npm start
   # or with Expo CLI explicitly
    # or with Expo CLI explicitly
    npx expo start
    ```

4. Run on a device/emulator:
- Android emulator (must have emulator running):
  ```bash
  npm run android
  ```
- iOS simulator (macOS only):
  ```bash
  npm run ios
  ```
- Web browser:
  ```bash
  npm run web
  ```

If Metro cache issues occur, restart with cache clear:
```bash
npx expo start -c
```

## Running inside Docker (development)

Build and run the development container included in `app/Dockerfile`:

```bash
cd app
docker build -t mindful-app .
docker run -it --rm -p 19000:19000 -p 19001:19001 -p 8081:8081 -p 3000:3000 mindful-app
```

**Note**: The Dockerfile uses `node:20-bookworm-slim` as the base image.

Open the URL printed by Expo (usually `http://localhost:19002` for the dev tools) or use the QR code.

Notes: this container runs the Expo dev server only. Building native binaries inside Docker is not supported by the provided Dockerfile.

## CI / Typecheck / Lint (what CI runs)

The repository contains a GitHub Actions workflow at `.github/workflows/ci.yml` that:
- Installs dependencies in `app/` with `npm ci`.
- Runs TypeScript typecheck: `npx tsc --noEmit`.
- Runs lint: `npm run lint`.

## Building production artifacts

- Web: you can create a production web bundle with Expo (`expo build:web`) or `expo export:web` depending on your Expo version. A production Dockerfile can be added if you need to host the static bundle.
- Native: use EAS Build for cloud native builds.
  ```bash
  npm install -g eas-cli
  eas login
  eas build --platform android
  ```

## Common troubleshooting
- If you see native build errors, ensure `android/` and `ios/` folders are present and you have the correct SDK/tooling installed.
- If Prettier / ESLint hooks prevent commits, you can run `npm run lint:fix` and `npm run format` to fix issues.

---

If you want, I can update `.env.example` with example keys, add a short `scripts/dev.sh` convenience script, or add a production web-build Dockerfile next.