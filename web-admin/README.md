# MindFlow Admin Web Portal

This is the secure, central administration dashboard for the MindFlow Mindfulness Research Study. Built with React, Vite, TypeScript, and Tailwind CSS, it enables researchers to review participant records, analyze aggregated wellness statistics, and perform system actions.

---

## Key Features

1.  **Analytical Monitoring Dashboard**:
    *   Visual representation of participant progress and completion compliance using interactive graphs (Recharts).
    *   Summary analytics showing overall stress scores (PSS-10), wellbeing indexes (WEMWBS-14), and mindfulness facets (FFMQ-15).
2.  **User Profile Management**:
    *   Provision, update, and search participant records.
    *   Manage specific Research IDs, assign experimental vs. control groups, and update emails or credentials.
3.  **Audit Logs & Submissions**:
    *   Audit logs for user check-ins (Daily Sliders, questionnaires, and Weekly Whispers audio records).
    *   Secure access to voice diary uploads.

---

## Technology Stack

*   **Runtime & Bundler**: Vite (React + TypeScript fast refreshing)
*   **Styling**: Tailwind CSS, Tailwind Animate
*   **UI Components**: Radix UI primitives (Dropdown, Dialog, Select, Progress, Tabs, etc.)
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **Authentication & Services**: Supabase JS SDK

---

## Getting Started

### Prerequisites
*   Node.js v20.x (LTS) or higher
*   A running MindFlow Express Backend service

### 1. Installation
Navigate to the directory and install dependencies:
```bash
cd web-admin
npm install
```

### 2. Configure Environment
Create a .env file in the root of web-admin/ (copy .env.example as a template):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-api-key
```

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
The site will run at http://localhost:5173.

### 4. Build for Production
To build static production files inside the dist/ directory:
```bash
npm run build
```
To preview the compiled production build locally:
```bash
npm run preview
```

---

## Directory Layout

```
web-admin/
├── src/
│   ├── components/      # Common UI parts (Cards, Modal dialogs, ErrorBoundary)
│   ├── hooks/           # User authentication hooks
│   ├── lib/             # Utility clients (Supabase setup, helpers)
│   ├── pages/           # Screen views (LoginPage, AdminDashboard, LandingPage)
│   ├── types/           # TS Interfaces
│   ├── App.tsx          # Main entry routing (react-router-dom)
│   └── main.tsx         # Virtual DOM renderer mount point
├── index.html           # Document shell
├── tailwind.config.js   # Style design token configurations
└── vite.config.ts       # Bundler configs
```
