# Technical Architecture (V2)

## Overview
MindFlow V2 adopts a separated client-server architecture to improve security, scalability, and code manageability.

- **Mobile Client (`/mobile`)**: React Native (Expo) app for user interaction.
- **Backend Server (`/backend`)**: Node.js/Express API for logic and data persistence.
- **Database**: PostgreSQL (Relational data storage).

---

## 1. Mobile Client (`/mobile`)
The active mobile application.

- **Framework**: React Native with Expo SDK.
- **Navigation**: `react-navigation` (Stack + Bottom Tabs). *Replaced Expo Router from V1.*
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`).
- **Styling**: `StyleSheet` (Standard React Native) + `expo-linear-gradient`.
- **Assets**: `react-native-svg` for custom illustrations.

### Directory Structure
```
mobile/
├── assets/              # Images and icons
├── src/
│   ├── components/      # Reusable UI components (buttons, headers, SVGs)
│   ├── constants/       # App-wide constants (colors, fonts, API URLs)
│   ├── navigation/      # Navigation configuration (AppNavigator, TabNavigator)
│   ├── screens/         # Screen components
│   │   ├── roadmap/     # Feature-specific roadmap screens (Thrive, Stress, etc.)
│   │   └── ...          # Dashboard, Profile, etc.
│   ├── services/        # API service calls
│   └── types/           # TypeScript interfaces
├── App.tsx              # Application entry point
└── app.json             # Expo configuration
```

---

## 2. Backend Server (`/backend`)
The central API handling data processing and secure database access.

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database Helper**: `pg` (node-postgres) or ORM (Prisma/Sequelize if applicable).
- **Security**: Centralized validation and secure env variable management.

### Directory Structure
```
backend/
├── src/
│   ├── config/          # Database connection and env config
│   ├── controllers/     # Request handlers (logic layer)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic and database queries
│   └── app.ts           # Express app setup
└── server.ts            # Server entry point
```

---

## 3. Deployment & Infrastructure
- **Database**: PostgreSQL (Self-hosted or Cloud provider).
- **Backend**: Can be deployed to any Node.js compatible host (Render, Railway, Heroku, AWS).
- **Mobile**:
    - **Development**: Expo Go.
    - **Production**: EAS Build (APK/AAB/IPA).

## 4. Deprecated V1 (`/app`)
**Status**: Archived / Insecure.
The `app/` directory contains the initial prototype which relied on client-side logic and direct Supabase connections. It is preserved for reference but should not be actively developed.
