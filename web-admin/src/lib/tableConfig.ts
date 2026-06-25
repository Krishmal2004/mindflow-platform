// All table definitions that align with database/project_db.sql

export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'textarea' | 'select';
    options?: { label: string; value: string }[];
    required?: boolean;
    readOnly?: boolean;      // shown but disabled in edit mode
    hideInTable?: boolean;   // too verbose for table column view
    defaultValue?: string | number | boolean;
}

export interface TableConfig {
    name: string;           // Supabase table name
    label: string;          // Display name
    primaryKey: string;
    hasUserId: boolean;     // whether this table has a user_id column
    hasCreatedAt: boolean;  // whether this table supports time-frame export
    searchable: boolean;    // whether username search is applicable
    searchColumn: string;   // Column to search by default
    /** Admin identity table — view only; auth is via Supabase */
    readOnly?: boolean;
    fields: FieldConfig[];
    /** Columns to show in the table view (subset of fields) */
    tableColumns: string[];
}

// Helper to build questionnaire question fields
const buildQuestionFields = (count: number): FieldConfig[] =>
    Array.from({ length: count }, (_, i) => ({
        name: `q${i + 1}`,
        label: `Q${i + 1}`,
        type: 'number' as const,
        required: true,
    }));

export const TABLES_CONFIG: TableConfig[] = [
    {
        name: 'profiles',
        label: 'Profiles',
        primaryKey: 'id',
        hasUserId: false,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'username',
        tableColumns: ['id', 'username', 'research_id', 'created_at'],
        fields: [
            { name: 'id', label: 'User ID', type: 'text', required: true, readOnly: true },
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'research_id', label: 'Research ID', type: 'text', required: true },
        ],
    },
    {
        name: 'about_me_profiles',
        label: 'About Me',
        primaryKey: 'id',
        hasUserId: false,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'university_id',
        tableColumns: ['id', 'university_id', 'education_level', 'age', 'is_completed', 'completion_percentage'],
        fields: [
            { name: 'id', label: 'User ID', type: 'text', required: true, readOnly: true },
            { name: 'university_id', label: 'University ID', type: 'text' },
            { name: 'education_level', label: 'Education Level', type: 'text' },
            { name: 'major_field_of_study', label: 'Major Field', type: 'text' },
            { name: 'age', label: 'Age', type: 'number' },
            { name: 'living_situation', label: 'Living Situation', type: 'text' },
            { name: 'family_background', label: 'Family Background', type: 'text' },
            { name: 'cultural_background', label: 'Cultural Background', type: 'text' },
            { name: 'hobbies_interests', label: 'Hobbies & Interests', type: 'textarea', hideInTable: true },
            { name: 'personal_goals', label: 'Personal Goals', type: 'textarea', hideInTable: true },
            { name: 'why_mindflow', label: 'Why MindFlow', type: 'textarea', hideInTable: true },
            { name: 'completion_percentage', label: 'Completion %', type: 'number' },
            { name: 'is_completed', label: 'Completed', type: 'boolean', defaultValue: false },
        ],
    },
    {
        name: 'admins',
        label: 'Admins',
        primaryKey: 'id',
        hasUserId: false,
        hasCreatedAt: false,
        searchable: false,
        readOnly: true,
        searchColumn: 'username',
        tableColumns: ['id', 'username', 'email', 'created_at'],
        fields: [
            { name: 'id', label: 'Admin ID', type: 'text', required: true, readOnly: true },
            { name: 'username', label: 'Username', type: 'text', readOnly: true },
            { name: 'email', label: 'Email', type: 'text', readOnly: true },
            { name: 'created_at', label: 'Created', type: 'date', readOnly: true },
        ],
    },
    {
        name: 'daily_sliders',
        label: 'Daily Sliders',
        primaryKey: 'id',
        hasUserId: true,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'user_id',
        tableColumns: ['user_id', 'stress_level', 'mood', 'sleep_quality', 'relaxation_level', 'mindfulness_practice', 'created_at'],
        fields: [
            { name: 'user_id', label: 'User', type: 'text', required: true },
            { name: 'stress_level', label: 'Stress (1-5)', type: 'number', required: true },
            { name: 'mood', label: 'Mood (1-5)', type: 'number', required: true },
            { name: 'sleep_quality', label: 'Sleep Quality (1-5)', type: 'number', required: true },
            { name: 'relaxation_level', label: 'Relaxation (1-5)', type: 'number', required: true },
            { name: 'sleep_start_time', label: 'Sleep Start', type: 'text' },
            { name: 'wake_up_time', label: 'Wake Up', type: 'text' },
            { name: 'feelings', label: 'Feelings', type: 'textarea', hideInTable: true },
            {
                name: 'mindfulness_practice', label: 'Mindfulness Practice', type: 'select',
                options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
            },
            { name: 'practice_duration', label: 'Duration (mins)', type: 'number' },
            { name: 'practice_log', label: 'Practice Log', type: 'textarea', hideInTable: true },
            { name: 'video_play_seconds', label: 'Video Watch (s)', type: 'number' },
        ],
    },
    {
        name: 'voice_recordings',
        label: 'Voice Recordings',
        primaryKey: 'id',
        hasUserId: true,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'user_id',
        tableColumns: ['user_id', 'week_number', 'year', 'duration', 'created_at'],
        fields: [
            { name: 'user_id', label: 'User', type: 'text', required: true },
            { name: 'week_number', label: 'Week No.', type: 'number', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'file_key', label: 'R2 File Key', type: 'text', required: true },
            { name: 'file_url', label: 'Public URL', type: 'text', required: true, hideInTable: true },
            { name: 'duration', label: 'Duration (s)', type: 'number' },
        ],
    },
    {
        name: 'weekly_recordings',
        label: 'Weekly Videos',
        primaryKey: 'id',
        hasUserId: false,
        hasCreatedAt: true,
        searchable: false,
        searchColumn: 'title',
        tableColumns: ['id', 'week_no', 'title', 'youtube_id'],
        fields: [
            { name: 'week_no', label: 'Week No.', type: 'number', required: true },
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'youtube_id', label: 'YouTube ID', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', hideInTable: true },
        ],
    },
    {
        name: 'questionnaire_pss10_responses',
        label: 'PSS-10 Responses',
        primaryKey: 'id',
        hasUserId: true,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'user_id',
        tableColumns: ['user_id', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'created_at'],
        fields: [
            { name: 'user_id', label: 'User', type: 'text', required: true },
            ...buildQuestionFields(10),
            { name: 'duration', label: 'Duration (ms)', type: 'number' },
        ],
    },
    {
        name: 'questionnaire_wemwbs14_responses',
        label: 'WEMWBS-14 Responses',
        primaryKey: 'id',
        hasUserId: true,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'user_id',
        tableColumns: ['user_id', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'created_at'],
        fields: [
            { name: 'user_id', label: 'User', type: 'text', required: true },
            ...buildQuestionFields(14),
            { name: 'duration', label: 'Duration (ms)', type: 'number' },
        ],
    },
    {
        name: 'questionnaire_ffmq15_responses',
        label: 'FFMQ-15 Responses',
        primaryKey: 'id',
        hasUserId: true,
        hasCreatedAt: true,
        searchable: true,
        searchColumn: 'user_id',
        tableColumns: ['user_id', 'q1', 'q2', 'q3', 'q4', 'q5', 'observing_score', 'describing_score', 'created_at'],
        fields: [
            { name: 'user_id', label: 'User', type: 'text', required: true },
            ...buildQuestionFields(15),
            { name: 'observing_score', label: 'Observing', type: 'number' },
            { name: 'describing_score', label: 'Describing', type: 'number' },
            { name: 'awareness_score', label: 'Awareness', type: 'number' },
            { name: 'non_judging_score', label: 'Non-Judging', type: 'number' },
            { name: 'non_reactivity_score', label: 'Non-Reactivity', type: 'number' },
            { name: 'duration', label: 'Duration (ms)', type: 'number' },
        ],
    },
    {
        name: 'calendar_events',
        label: 'Calendar Events',
        primaryKey: 'id',
        hasUserId: false,
        hasCreatedAt: true,
        searchable: false,
        searchColumn: 'title',
        tableColumns: ['id', 'title', 'event_date', 'event_time', 'is_completed'],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', hideInTable: true },
            { name: 'event_date', label: 'Date', type: 'date', required: true },
            { name: 'event_time', label: 'Time', type: 'text', required: true },
            { name: 'is_completed', label: 'Completed', type: 'boolean', defaultValue: false },
        ],
    },
];
