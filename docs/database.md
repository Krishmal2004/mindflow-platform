# Database Schema

The application uses Supabase PostgreSQL with the following key tables:

1. `profiles` - User profile information
2. `about_me_profiles` - Detailed user background information
3. `daily_sliders` - Daily wellness assessments
4. `weekly_answers` - Weekly reflection responses
5. `main_question_sets` - Standardized questionnaire versions
6. `main_questions` - Individual questions within questionnaires
7. `main_questionnaire_responses` - User responses to main questionnaires
8. `voice_recordings` - Metadata for audio recordings
9. `admins` - Administrative users for the dashboard

## Key Tables Structure

### `profiles`
- Purpose: Store basic user profile information
- Fields: id, username, research_id, created_at, updated_at

### `about_me_profiles`
- Purpose: Store detailed user background information
- Fields: user_id, age, gender, occupation, education_level, created_at, updated_at

### `daily_sliders`
- Purpose: Store daily wellness assessments
- Fields: id, user_id, date, stress_level, mood_rating, sleep_quality, influencing_factors, sleep_start_time, sleep_end_time, relaxation_rating, created_at

### `weekly_answers`
- Purpose: Store participant responses to weekly reflection questions
- Structure: Fixed set of 10 weekly questions with user responses
- Fields: user_id, week_id (format: YYYY-WNN-WQ), a1-a10 (text responses), submitted_at
- Refresh: Questions reset every Monday at 00:00 AM

### `main_question_sets`
- Purpose: Define versions of standardized questionnaires
- Fields: id, name, description, version, created_at

### `main_questions`
- Purpose: Store individual questions within questionnaires
- Fields: id, question_set_id, question_text, question_type, order_index, created_at

### `main_questionnaire_responses`
- Purpose: Store user responses to main questionnaires
- Fields: id, user_id, question_set_id, question_id, response_value, created_at

### `voice_recordings`
- Purpose: Store metadata for participant voice recordings
- Structure: Voice recording metadata for both vocal biomarker capture and weekly guidance
- Fields: id, user_id, week_number, year, file_key, file_url, created_at, updated_at
- RLS Policies: Row-level security ensures users can only access their own recordings

### `admins`
- Purpose: Store administrative users for the dashboard
- Structure: Administrative user accounts
- Fields: id, username, email, password, created_at, last_login
- Sample Entry: admin / admin@mindflow.com / password