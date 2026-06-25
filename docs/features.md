# Features

## The Journey (5-step roadmap)

The mobile dashboard presents five independent check-ins as a gamified, sequenced roadmap (`GET /api/journey/status` reports each one's completion so the dashboard can lock/unlock nodes). Each step has its own reset cadence — sequencing is a frontend concept; the underlying tables don't know about each other.

### 1. Daily Sliders (resets every 24h)
- **Guided video** (Step 0): an admin-curated YouTube video (`weekly_recordings`, optionally per study-group), played via `react-native-youtube-iframe`. Watch time is only counted while the player reports `playing`, not just while the screen is open; the user needs ≥60s of actual playback to continue (skippable if no video is published that week).
- **Relaxation & stress** sliders (1–5).
- **Mindfulness practice**: yes/no, and if yes, duration + practice type(s) (free text, not a DB enum — option list lives in `DailySlidersScreen.tsx`).
- **Mood** (1–5) + **primary influencing factor** (Education / Personal / Environment — also free text).
- **Sleep**: start time, wake time, quality (1–5).

### 2. Weekly Whispers (resets weekly, ISO week boundary)
A vocal-biomarker capture, not a text questionnaire: the participant reads a fixed short passage aloud (15–45 seconds), the recording uploads to Cloudflare R2, and metadata is stored in `voice_recordings`.

### 3. Thrive Tracker — WEMWBS-14 (14-day lockout)
Warwick-Edinburgh Mental Wellbeing Scale, 14 items, 1–5 Likert.

### 4. Stress Snapshot — PSS-10 (30-day lockout)
Perceived Stress Scale, 10 items, 1–5 Likert.

### 5. Mindful Mirror — FFMQ-15 (30-day lockout)
Five Facet Mindfulness Questionnaire, 15 items, 1–5 Likert, with computed facet scores (observing, describing, acting with awareness, non-judging, non-reactivity).

---

## Study-group-aware experience (`.ex` vs `.cg`)

A participant's study arm is the suffix of `profiles.research_id` (`.ex` experimental / `.cg` control; no suffix fails open as experimental). Several surfaces branch on it:

- **Dashboard**: the `.ex` group sees rotating mindfulness quotes; the `.cg` group sees a rotating non-mindfulness fun-fact card instead (same slot, orange theme) — `.cg` is never just left with an empty space. The "what would you like to do" header copy also branches (mindful framing vs. neutral).
- **Calendar**: `.cg` users never see "Mindfulness Session"-titled events, filtered server-side in `calendarService`.
- **Daily Sliders guided video**: `weekly_recordings.target_group` can target a specific arm for a given week, falling back to a group-agnostic video if none is set.

This is enforced server-side where the data itself needs to differ (calendar, video selection) and client-side where it's purely presentational (dashboard copy/cards).

---

## Push notification reminders

Two daily jobs (`node-cron`, server-local time):
- **8:00 AM** — "Good morning" greeting to every device with a registered push token.
- **7:00 PM** — a "hurry up" nudge naming whichever of the 5 roadmap steps are still incomplete *that day*, computed from the same per-step status checks the dashboard uses (so it respects each step's own cadence — it won't nag about a 30-day questionnaire every day).

Requires an EAS project to actually deliver (see `mobile/README.md`); without one, registration fails silently and the rest of the app is unaffected.

---

## Calendar

A shared (not per-user) schedule of upcoming sessions, filtered per the study-group rule above.

---

## Onboarding ("About Me")

A one-time detailed questionnaire, gated client-side: every post-auth screen checks `GET /api/profile/about-me` and routes to the About Me form instead of the main app until it's completed. This is a UX gate, not a backend security boundary — other endpoints don't check completion status.

---

## Admin Portal (`web-admin/`)

- Participant record management: research ID / study-group assignment, credentials.
- Analytics: completion rates and aggregated scores across the 5 roadmap steps and 3 clinical scales.
- Audit access to voice-journal uploads.
