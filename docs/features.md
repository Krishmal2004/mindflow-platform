# Features

## 1. Daily Sliders
Participants can track their:
- **Stress Levels**: Rate stress on a scale of 1-10
- **Mood**: Track daily mood from bad to good (1-5 scale)
- **Sleep Quality**: Assess sleep quality from poor to excellent (1-5 scale)
- **Influencing Factors**: Select factors affecting their stress levels from a predefined list
- **Sleep Schedule**: Record sleep start and wake-up times

After submitting the Influencing Factors, only the experiment group participants can listn to a mindfulness voice record which have conducted in previous week. Post-exercise, they rate their relaxation level to complete the mindfulness session.

### 1.1 Voice Guidance (Experimental Group Only)
Participants with research IDs ending in ".ex" have access to weekly voice guidance:
- Listen to mindfulness guidance recordings uploaded by research coordinators
- Access to weekly themed audio sessions for enhanced mindfulness practice
- Playback controls with visual progress indicators
- Automatic URL construction for weekly guidance files stored in Cloudflare R2

## 2. Weekly Questions (Weekly Whispers)
Participants receive thought-provoking questions each week to encourage deeper reflection on their mindfulness journey. The feature includes:
- 10 weekly questions that change periodically
- Text-based responses for each question
- Progress tracking and completion celebrations

### 2.1 Vocal Biomarker Capture
As part of the weekly questionnaire process, participants are required to complete a vocal biomarker capture:
- Read a standardized passage aloud for vocal analysis
- Audio recording with duration validation (15-45 seconds)
- WAV format recording with quality settings
- Upload to Cloudflare R2 storage for research analysis
- Database metadata storage linking recordings to questionnaire responses

## 3. Main Questionnaire
A comprehensive assessment tool featuring standardized psychological scales:
- **Perceived Stress Scale (PSS)**: 10-item questionnaire measuring stress perception
- **Five Facet Mindfulness Questionnaire (FFMQ)**: 15-item assessment of mindfulness facets
- Time tracking for completion analytics
- Structured submission process

## 4. Progress Tracking
Visual dashboard showing participant engagement metrics:
- Daily slider completion rates
- Weekly question participation
- Main questionnaire progress
- Streak tracking for consistent engagement
- 6-month progress visualization

## 5. Personal Profile Management
- User authentication and account management
- Profile customization options
- Research identification tracking
- Password management capabilities

## 6. Admin Dashboard
Administrative interface for managing the application and database:
- Secure authentication for administrators
- Database table management with CRUD operations
- Reporting and analytics dashboard
- Responsive design for desktop and tablet devices