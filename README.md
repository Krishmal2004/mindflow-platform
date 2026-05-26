# MindFlow (Mindfulness Research App) - V2

MindFlow is a comprehensive, secure system designed to support longitudinal academic mindfulness research. The platform consists of a mobile client for study participants, an administration portal for researchers, and a robust Node.js API backend linked to a PostgreSQL database.

## System Architecture

The project is structured into three decoupled sub-applications:

*   **backend/**: A TypeScript Node.js & Express server handling endpoints, authentication, relational business logic, database connections, and validation checks.
*   **mobile/**: The client-side React Native (Expo) app providing a gamified roadmap with daily check-ins, voice diaries, and clinical assessments (PSS-10, FFMQ-15, WEMWBS-14) for participants.
*   **web-admin/**: A React + Vite + Tailwind CSS admin portal for study administrators to monitor participation rates, view clinical scores, and manage researcher tasks.

---

## Key Features

### 1. Unified Mindfulness Journey (Roadmap Dashboard)
A visual roadmap guiding users through successive locked/unlocked stages:
*   **Daily Sliders**: 24h cycle check-ins assessing Mood, Stress, Sleep, and Relaxation.
*   **Weekly Whispers**: Audio log responses to prompt variables.
*   **Scale Assessments**: Clinical scales containing PSS-10 (Stress Snapshot), WEMWBS-14 (Thrive Tracker), and FFMQ-15 (Mindful Mirror) mapping user progress over monthly/fortnightly frequencies.

### 2. Audio Vocal Biomarkers & Diaries
Secure audio recording using expo-av (translating to Android mic inputs) with automated file uploads to cloud object storage (AWS S3-compatible bucket) via secure pre-signed URLs.

### 3. Comprehensive Admin Dashboard
*   **Live Analytics**: Interactive charting of user scores and daily submission streaks.
*   **Participant Management**: Research ID allocations, password recovery, profile editing, and logs monitoring.

---

## Tech Stack

| Module | Core Framework / Runtime | Language | Primary Ecosystem |
| :--- | :--- | :--- | :--- |
| **Backend** | Node.js v20.x, Express.js | TypeScript | Supabase Client (PostgreSQL), Zod, Express Rate Limit, Helmet |
| **Mobile** | Expo SDK, React Native | TypeScript | React Navigation (Bottom Tabs & Stack), Reanimated, Async Storage, Expo AV |
| **Web Admin** | React v19.x, Vite, Tailwind CSS | TypeScript | Recharts, Radix UI primitives, React Router, Supabase-JS, AWS S3 Client |

---

## Getting Started

### Prerequisites
*   **Node.js**: v20.x (LTS) or higher
*   **PostgreSQL**: A local or hosted PostgreSQL instance. Run the schema migrations inside project_db.sql before booting the backend.

---

### 1. Database Setup
Create your PostgreSQL database (e.g., mindflow_db) and apply the tables and seed configuration:
```bash
psql -h localhost -U postgres -d mindflow_db -f project_db.sql
```

---

### 2. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a .env file based on .env.example:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/mindflow_db
   SUPABASE_URL=https://your-supabase-url.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   AWS_S3_BUCKET=your-bucket-name
   AWS_ACCESS_KEY_ID=your-s3-key-id
   AWS_SECRET_ACCESS_KEY=your-s3-secret-key
   ```
3. Boot the API server in development mode:
   ```bash
   npm run dev
   ```

---

### 3. Mobile Client Setup
1. Navigate to the mobile directory and install dependencies:
   ```bash
   cd mobile
   npm install
   ```
2. Configure .env with your development server local IP address:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000
   ```
3. Launch Metro:
   ```bash
   npx expo start -c
   ```
4. Run on a virtual device (press a for Android, i for iOS) or scan the QR code using the Expo Go application.

---

### 4. Admin Web Portal Setup
1. Navigate to the web admin directory:
   ```bash
   cd web-admin
   npm install
   ```
2. Configure environment variables in .env:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at http://localhost:5173.

---

## Documentation Directory

Additional specialized technical guides can be found in the docs/ folder:
*   [Technical Architecture](docs/architecture.md) — Structural layout, data flow, and file layout descriptions.
*   [Database Schema](docs/database.md) — Table schemas, relations, and data fields details.
*   [Research Methodology](docs/research-methodology.md) — Details on the clinical scales (PSS-10, FFMQ-15, WEMWBS) and frequency lockout intervals.