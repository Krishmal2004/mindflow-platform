# MindFlow (Mindfulness Research App)

**MindFlow** is a comprehensive mobile application designed for mindfulness research. It enables participants to track their daily wellness, engage in weekly reflective voice diaries, and complete standardized psychological assessments.

## Overview
The app supports a longitudinal study on mindfulness, offering distinct experiences for:
- **Experimental Group**: Access to mindfulness/control logic and tailored interventions.
- **Control Group**: Standard tracking without specific interventions.

## Key Features

### 1. Daily Sliders
Quick, intuitive daily check-ins for tracking:
- **Stress Levels**: 1-5 scale.
- **Mood**: Bad to Good spectrum.
- **Sleep**: Quality and duration.
- **Completion**: Simple "Done" confirmation for daily logs.

### 2. Weekly Whispers
A secure voice diary feature allowing participants to:
- Respond to thought-provoking weekly prompts.
- Record audio responses directly in the app.
- Recordings are securely stored (via Cloudflare R2) for analysis.

### 3. Core Insights
Monthly questionnaires integrating standardized scales:
- **Perceived Stress Scale (PSS)**
- **Five Facet Mindfulness Questionnaire (FFMQ)**

### 4. Mindfulness Path (Dashboard)
A gamified, visual roadmap on the home screen:
- **Daily Node**: Lights up upon completing daily sliders.
- **Weekly Node**: Unlocks for weekly voice reflections.
- **Monthly Node**: Becomes available for "Core Insights".
- **Visual Feedback**: Icons and animations indicate progress and streaks.

## Tech Stack
- **Framework**: [Expo](https://expo.dev) (React Native)
- **Language**: TypeScript
- **Navigation**: Expo Router (File-based routing)
- **Backend**: Supabase (Auth, Database)
- **Storage**: Cloudflare R2 (Audio files), Supabase Storage (Images)
- **UI/Animation**:
    - `react-native-reanimated` for smooth interactions.
    - `react-native-svg` for custom drawing (Path Map).
    - `expo-linear-gradient` for visual polish.

## Getting Started

### Prerequisites
- **Node.js**: v20.x (LTS)
- **npm** or **Yarn**

### Installation
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd mindfulness-research-app/app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the `app` directory with your Supabase keys:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
    ```

### Running the App
Start the development server:
```bash
npx expo start
```
- **Android**: Press `a` (requires Emulator or USB device).
- **iOS**: Press `i` (requires macOS + Simulator).
- **Web**: Press `w`.

### Building for Production
Use EAS Build for creating APKs or AABs:
```bash
npx eas build -p android --profile preview
```

## Documentation
For more detailed information, check the `docs/` folder:
- [Architecture](docs/architecture.md)
- [Features](docs/features.md)
- [Getting Started Guide](docs/getting-started.md)