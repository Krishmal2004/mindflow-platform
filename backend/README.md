# MindFlow Backend Server API (V2)

The Express backend serves as the core API coordinator, validating and storing questionnaire submissions, daily check-ins, and managing participant auth verification.

---

## Features

1.  **Clinical Roadmap Scheduling Logic**:
    *   Unified scheduling frequency and lock timers:
        *   **Daily Sliders**: 24h reset cycle (runs from 00:00 to 23:59 daily).
        *   **Weekly Whispers**: Resets weekly on Mondays at 00:00 (ISO Week schedule).
        *   **Thrive Tracker (WEMWBS-14)**: Measures wellbeing over the last 2 weeks (14-day lockout).
        *   **Stress Snapshot (PSS-10) & Mindful Mirror (FFMQ-15)**: Measures stress & mindfulness over the last month (30-day lockout).
    *   Sequence locking checks so that users must complete preceding steps before unlocking next items.
2.  **Audio Diary Uploads**:
    *   Implements multer middleware and AWS S3-compatible pre-signed URL signatures for robust, secure participant voice diary uploads.
3.  **Security & Stability**:
    *   Header security using helmet.
    *   DDOS protection using express-rate-limit.
    *   Request logging with morgan.
    *   Request schema payload verification with zod.

---

## Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database Integration**: Postgres Client (pg pool queries) + Supabase JS Client
*   **File Parsing**: Multer

---

## Getting Started

### Prerequisites
*   Node.js v20.x (LTS) or higher
*   A running PostgreSQL database instance (local or hosted)

### 1. Installation
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a .env file in the root of backend/ (based on .env.example):
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/mindflow_db
SUPABASE_URL=https://your-supabase.supabase.co
SUPABASE_KEY=your-supabase-anon-key
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-s3-key-id
AWS_SECRET_ACCESS_KEY=your-s3-secret-key
```

### 3. Database Schema Migration
Initialize the database schemas and constraints by importing the SQL configuration:
```bash
psql -d mindflow_db -f ../project_db.sql
```

### 4. Running the Server

#### **Development Mode (with auto-reload)**:
```bash
npm run dev
```

#### **Production Build & Launch**:
```bash
# Compile TS to JS
npm run build

# Start the compiled server
npm start
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database pools and external SDK clients (Supabase, S3)
│   ├── controllers/     # Route handlers and input validation schemas (Zod)
│   ├── middleware/      # Auth validation, rate-limiter, and error handlers
│   ├── routes/          # Express router path mappings
│   ├── services/        # Query-level execution (Daily, Weekly, and Questionnaires)
│   ├── app.ts           # App definition & configurations
│   └── server.ts        # Server listener entry point
└── tsconfig.json        # TypeScript compile parameters
```
