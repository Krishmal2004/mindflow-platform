# Technical Architecture

## Frontend
- **Mobile App**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **UI Components**: Custom SVG icons, animated elements with Reanimated
- **State Management**: React Context API for session management
- **Storage**: AsyncStorage for local data caching
- **Audio**: Expo AV for recording and playback

## Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Cloudflare R2 for media storage
- **API**: Supabase RESTful API

## Project Structure

### Mobile App Structure
```
app/
├── (tabs)/              # Tab-based navigation screens
│   ├── _layout.tsx      # Tab navigation layout
│   ├── account.tsx      # User account management
│   ├── calendar.tsx     # Calendar view
│   ├── index.tsx        # Home screen
│   └── progress.tsx     # Progress tracking
├── _layout.tsx          # Main app layout
├── daily-sliders.tsx    # Daily wellness tracking
├── index.tsx            # App entry point
├── main-questionnaire.tsx # Main psychological questionnaires
└── weekly-whispers.tsx  # Weekly reflection questions

src/
├── components/          # Reusable UI components
│   ├── Auth.tsx         # Authentication components
│   └── DailyEntryForm.tsx # Daily entry form component
├── contexts/            # React contexts
│   └── SessionContext.tsx # Session management context
└── lib/                 # Utility libraries
    ├── r2.ts            # Cloudflare R2 integration
    └── supabase.ts      # Supabase client configuration
```
