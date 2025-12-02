# MindFlow - Mindfulness Research App

## Overview
MindFlow is a mindfulness research application designed to help students track their mental wellness through daily reflections, stress monitoring, and guided breathing exercises.

## New Features

### Daily Sliders
The Daily Sliders feature allows users to track their stress levels and sleep quality on a scale of 1-10. After submitting their ratings, users can participate in guided breathing exercises (2 or 4 minute sessions) with visual breathing cues. Post-exercise, users rate their relaxation level to complete the mindfulness session.

### Database Schema
The application uses Supabase for backend services. The following tables are used:

1. `profiles` - Stores user profile information
2. `daily_entries` - Stores user journal entries
3. `daily_sliders` - Stores daily stress, sleep, and relaxation ratings

#### Daily Sliders Table Structure
```sql
CREATE TABLE IF NOT EXISTS daily_sliders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    relaxation_level INTEGER CHECK (relaxation_level >= 1 AND relaxation_level <= 10),
    exercise_duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.