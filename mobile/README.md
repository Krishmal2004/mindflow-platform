# MindFlow Mobile

The Expo (React Native) client study participants use: the 5-step daily/weekly/periodic roadmap, calendar, and profile. Talks to `backend/` over HTTPS — never to Supabase directly.

See [`../docs/features.md`](../docs/features.md) for what it does and [`../docs/architecture.md`](../docs/architecture.md) for how it fits with the other three projects.

## Setup

```bash
npm install
cp .env.example .env   # only needed for a physical device or non-default API host
npm start                # or: npx expo start -c to clear the Metro cache
```
Press `a`/`i` for an Android/iOS emulator/simulator, or scan the QR code with the **Expo Go** app on a physical device (same Wi-Fi network as your dev machine).

## Scripts

| Command | What it does |
|---|---|
| `npm start` / `npm run android` / `npm run ios` / `npm run web` | Expo dev server |
| `npx tsc --noEmit` | Type check (no separate build step) |
| `npm test` | Jest (`jest-expo` preset) |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |

## Building an installable APK (EAS)

Local `expo start` only runs inside Expo Go / a dev client — it's not an installable app. Building an actual APK happens in Expo's cloud build service, **EAS Build**. None of this repo's config can do it for you non-interactively, since it requires your own Expo account:

1. **Install the CLI and log in** (one-time, needs an Expo account — free tier is fine):
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. **Link this project to an EAS project** (one-time per project):
   ```bash
   cd mobile
   eas init
   ```
   This writes an `extra.eas.projectId` into `app.json` — required for both EAS builds and for push notifications to work (see "Push notifications" below). `eas.json` (build profiles) is already committed in this directory.
3. **Build the APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   `preview` (defined in `eas.json`) is configured for `"buildType": "apk"` — a directly-installable file, as opposed to the `production` profile, which builds an `.aab` for Play Store submission. The build runs on Expo's servers; the CLI prints a link to track progress and download the `.apk` once it finishes (also available via `eas build:list`).
4. **Install it**: download the `.apk` to an Android device and open it (you'll need to allow installs from unknown sources, since it's not from the Play Store).

### Push notifications need step 2 done first

`mobile/src/lib/notifications.ts` calls `getExpoPushTokenAsync()`, which requires an EAS project ID to exist. Until `eas init` has been run, push registration fails with "No projectId found" — caught and logged, not a crash, but reminders won't be delivered. Also note: Expo Go (SDK 53+) no longer supports remote push notifications at all — testing push requires a dev client or a real build (steps above), not `npm start` + Expo Go.

## Environment variables

See `.env.example`. `EXPO_PUBLIC_API_URL` is the only one most setups need, and only when the default host detection (`src/config/api.ts` — `10.0.2.2` for the Android emulator, `localhost` for iOS) doesn't match your setup (physical device, staging, production).
