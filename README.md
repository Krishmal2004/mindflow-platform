# MindFlow (Mindfulness Research App) - V2

**MindFlow** is a comprehensive mobile application designed for mindfulness research. This repository contains the source code for the mobile client and the backend server.

## ⚠️ Important: Project Structure Update

This project has been restructured to separate concerns and address security improvements. Please defer to the following directories:

*   **`mobile/`** (V2): **THE ACTIVE MOBILE APP.** The current, secure, and maintained React Native application. All development should happen here.
*   **`backend/`** (V2): **THE ACTIVE BACKEND.** The Node.js/Express server handling API requests, business logic, and database interactions.
*   **`app/`** (V1): **DEPRECATED / ARCHIVED.** The older version of the application. **Do not use.** It is kept for reference but has known security/structural issues.

---

## Overview

The app supports a longitudinal study on mindfulness, offering distinct experiences for:
- **Experimental Group**: Access to mindfulness/control logic and tailored interventions.
- **Control Group**: Standard tracking without specific interventions.

## Key Features

### 1. Daily Sliders
Quick, intuitive daily check-ins for tracking Stress, Mood, Sleep, and Energy.

### 2. Weekly Whispers
A secure voice diary feature allowing participants to record audio responses to weekly prompts.

### 3. Core Insights
Monthly questionnaires integrating standardized scales like **PSS-10** (Perceived Stress Scale) and **FFMQ-15** (Five Facet Mindfulness Questionnaire).

### 4. Mindfulness Path (Dashboard)
A gamified, visual roadmap (Thrive Tracker, Stress Snapshot, Mindful Mirror) guiding the user through their journey.

## Tech Stack

### Mobile (`/mobile`)
- **Framework**: [Expo](https://expo.dev) (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **UI**: `react-native-svg`, `react-native-reanimated`, `expo-linear-gradient`

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Language**: TypeScript

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x (LTS)
- **npm** or **Yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **PostgreSQL**: Local or hosted instance.

### 1. Backend Setup
Navigate to the backend directory:
```bash
cd backend
npm install
```

Configure environment variables (copy `.env.example` to `.env`) and start the server:
```bash
npm run dev
```

### 2. Mobile App Setup
Navigate to the active mobile directory:
```bash
cd mobile
npm install
```

Start the development server:
```bash
npx expo start -c
```
- **Android**: Press `a` (requires Emulator or USB device).
- **iOS**: Press `i` (requires macOS + Simulator).

---

## Documentation
For detailed information, check the `docs/` folder (Updated for V2):
- [Architecture](docs/architecture.md)
- [Getting Started Guide](docs/getting-started.md)