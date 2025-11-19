research-app-expo/
├── mobile/                       # Expo app (React Native + TS)
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── App.tsx                # Root app entry (can use Expo Router _layout.tsx)
│   │   ├── lib/
│   │   │   └── supabase.ts        # Supabase client singleton
│   │   │   └── storage.ts         # Cloudflare R2 helper
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDailyCompletion.ts
│   │   │   └── useCalendarData.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── profile.service.ts
│   │   │   ├── questionnaire.service.ts
│   │   │   ├── submissions.service.ts
│   │   │   └── voice.service.ts
│   │   ├── components/
│   │   │   ├── DynamicForm.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── QuickCard.tsx
│   │   │   ├── DailyTipBanner.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── SignupScreen.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── AboutMeScreen.tsx
│   │   │   ├── home/
│   │   │   │   └── HomeDashboard.tsx
│   │   │   ├── questionnaires/
│   │   │   │   ├── basic/
│   │   │   │   │   ├── MorningQuestionScreen.tsx
│   │   │   │   │   └── EveningQuestionScreen.tsx
│   │   │   │   ├── main/
│   │   │   │   │   └── MainQuestionScreen.tsx
│   │   │   │   └── weekly/
│   │   │   │       ├── WeeklyListScreen.tsx
│   │   │   │       └── WeeklyQuestionScreen.tsx  # with voice recorder
│   │   │   ├── progress/
│   │   │   │   └── ProgressScreen.tsx
│   │   │   └── account/
│   │   │       └── AccountScreen.tsx
│   │   └── types/
│   │       ├── profile.ts
│   │       ├── questionnaire.ts
│   │       └── responses.ts
│   └── assets/
│       ├── icons/
│       ├── images/
│       └── fonts/
│
├── backend/                      # Supabase Edge Functions & DB scripts
│   ├── edge/
│   │   ├── voice-presign/
│   │   │   └── index.ts
│   │   └── voice-register/
│   │       └── index.ts
│   ├── migrations/
│   │   └── 001_init_tables.sql
│   └── export_scripts/
│       └── export_by_research_id.ts
│
├── infra/                        # Cloudflare R2 / IAM / Env Notes
│   └── R2-setup.md
├── docs/
│   ├── RLS-policies.md
│   └── API-contracts.md
├── .github/
│   └── workflows/
│       └── e2e-build.yml
├── README.md
└── LICENSE
