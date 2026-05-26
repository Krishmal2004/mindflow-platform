# Features

## 1. Daily Sliders
Participants can track their daily mindfulness metrics:
- **Mindfulness Practice Tracking**: Log whether they completed mindfulness practice today. If yes, they can enter the practice duration and record a log of their specific practices.
- **Stress Levels**: Rate perceived daily stress on a scale of 1-5.
- **Mood**: Track daily mood from bad to good (1-5 scale).
- **Sleep Quality**: Assess sleep quality from poor to excellent (1-5 scale).
- **Influencing Factors**: Select stress-triggering factors from a predefined list.
- **Sleep Schedule**: Record sleep start and wake-up times.
- **Relaxation Level**: Rate their current relaxation level to complete the session.

Only the experimental group participants have access to mindfulness voice guidance sessions.

### 1.1 Voice Guidance (Experimental Group Only)
Participants with research IDs ending in ".ex" have access to weekly voice guidance:
- Listen to mindfulness guidance recordings uploaded by research coordinators.
- Access weekly themed audio sessions for enhanced mindfulness practice.
- Utilize playback controls with visual progress indicators.
- Automatic URL construction for weekly guidance files stored in cloud object storage (AWS S3).

---

## 2. Weekly Questions (Weekly Whispers)
Participants receive thought-provoking questions each week to encourage deeper reflection on their mindfulness journey. The feature includes:
- 10 weekly questions that change periodically.
- Text-based responses for each question.
- Progress tracking and completion notifications.

### 2.1 Vocal Biomarker Capture
As part of the weekly questionnaire process, participants complete a vocal biomarker capture:
- Read a standardized passage aloud for vocal analysis.
- Audio recording with duration validation (15-45 seconds).
- WAV format recording with quality settings.
- Secure upload to cloud object storage (AWS S3) for research analysis.
- Database metadata storage linking recordings to questionnaire responses.

---

## 3. Main Questionnaire
A comprehensive assessment tool featuring standardized psychological scales:
- **Perceived Stress Scale (PSS-10)**: 10-item questionnaire measuring stress perception over the last month.
- **Warwick-Edinburgh Mental Wellbeing Scale (WEMWBS-14)**: 14-item questionnaire measuring mental wellbeing over the last two weeks.
- **Five Facet Mindfulness Questionnaire (FFMQ-15)**: 15-item assessment of mindfulness facets over the last month.
- Time tracking for completion analytics.
- Structured submission process.

---

## 4. Progress Tracking
Visual dashboard showing participant engagement metrics:
- Daily slider completion rates.
- Weekly question participation.
- Main questionnaire progress.
- Streak tracking for consistent engagement.
- 6-month progress visualization.

---

## 5. Personal Profile Management
- User authentication and account management.
- Profile customization options.
- Research identification tracking.
- Password management capabilities.
