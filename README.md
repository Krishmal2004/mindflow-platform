# MindFlow - Mindfulness Research App

## About This Project

This is a research project conducted by SLIIT and Brain Labs. The application serves as a data collection tool for experimental and control groups participating in a mindfulness study. The app helps researchers gather valuable data on participants' mental wellness through various interactive features.

## Overview

MindFlow is a comprehensive mindfulness research application designed specifically for academic research purposes. The app enables participants to track their mental wellness through daily reflections, stress monitoring, and guided breathing exercises. It provides researchers with structured data collection mechanisms while offering participants an engaging way to monitor their mental health journey.

## Key Features

### 1. Daily Sliders
Participants can track their:
- **Stress Levels**: Rate stress on a scale of 1-10
- **Mood**: Track daily mood from bad to good (1-5 scale)
- **Sleep Quality**: Assess sleep quality from poor to excellent (1-5 scale)
- **Influencing Factors**: Select factors affecting their stress levels from a predefined list
- **Sleep Schedule**: Record sleep start and wake-up times

After submitting their ratings, participants can engage in guided breathing exercises (4-minute sessions) with visual breathing cues. Post-exercise, they rate their relaxation level to complete the mindfulness session.

### 2. Weekly Questions (Weekly Whispers)
Participants receive thought-provoking questions each week to encourage deeper reflection on their mindfulness journey. The feature includes:
- 10 weekly questions that change periodically
- Text-based responses for each question
- Progress tracking and completion celebrations

### 3. Main Questionnaire
A comprehensive assessment tool featuring standardized psychological scales:
- **Perceived Stress Scale (PSS)**: 10-item questionnaire measuring stress perception
- **Five Facet Mindfulness Questionnaire (FFMQ)**: 15-item assessment of mindfulness facets
- Time tracking for completion analytics
- Structured submission process

### 4. Progress Tracking
Visual dashboard showing participant engagement metrics:
- Daily slider completion rates
- Weekly question participation
- Main questionnaire progress
- Streak tracking for consistent engagement
- 6-month progress visualization

### 5. Personal Profile Management
- User authentication and account management
- Profile customization options
- Research identification tracking
- Password management capabilities

## Technical Architecture

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **UI Components**: Custom SVG icons, animated elements with Reanimated
- **State Management**: React Context API for session management
- **Storage**: AsyncStorage for local data caching

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Cloudflare R2 for media storage
- **API**: Supabase RESTful API

### Database Schema

#### Core Tables
1. `profiles` - User profile information
2. `daily_entries` - Journal-style entries with optional media
3. `daily_sliders` - Quantitative daily wellness metrics
4. `weekly_questions` - Periodic reflection questions
5. `weekly_answers` - Participant responses to weekly questions
6. `main_question_sets` - Versions of main questionnaires
7. `main_questions` - Individual questions in main assessments
8. `main_questionnaire_responses` - Participant responses to main questionnaires

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android/iOS development environment (for native builds)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mindfulness-research-app/app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the `app/` directory with the following keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_R2_ACCOUNT_ID=your_cloudflare_account_id
   EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_r2_access_key
   EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_r2_secret_key
   EXPO_PUBLIC_R2_BUCKET_NAME=your_bucket_name
   EXPO_PUBLIC_R2_PUBLIC_URL=your_r2_public_url
   ```

4. Run the application:
   ```bash
   npm start
   # or
   expo start
   ```

### Development Commands
- `npm start` - Start the development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Research Methodology

### Data Collection Process
1. **Daily Engagement**: Participants complete daily slider assessments
2. **Weekly Reflection**: Participants answer weekly thought-provoking questions
3. **Periodic Assessment**: Participants complete comprehensive questionnaires
4. **Behavioral Tracking**: App tracks engagement patterns and consistency

### Experimental Design
- **Control Group**: Standard mindfulness tracking features
- **Experimental Group**: Enhanced features with additional interventions
- **Blinded Assignment**: Participants unaware of group assignment
- **Longitudinal Study**: 6-month data collection period

## Contributing

This project is maintained by the research team at SLIIT and Brain Labs. External contributions are not accepted as this is a controlled research environment.

## License

This project is proprietary software developed for academic research purposes. All rights reserved by SLIIT and Brain Labs.

## Contact

For research inquiries, please contact the principal investigators at SLIIT and Brain Labs.