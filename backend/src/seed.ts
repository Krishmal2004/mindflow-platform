/**
 * Database seed script — populates Supabase with realistic test data.
 * Run: npm run seed
 *
 * User: Hasitha Erandika (47aeae89-2055-4a8d-bd95-2a2f31af9052)
 * Admin: Mock admin account
 */
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for seeding.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constants ───────────────────────────────────────────────────────────────
const USER_ID = '47aeae89-2055-4a8d-bd95-2a2f31af9052';
const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

/** Random int between min and max (inclusive). */
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Random element from array. */
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

/** ISO date string N days ago with random time. */
const daysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(rand(6, 22), rand(0, 59), rand(0, 59), 0);
    return d.toISOString();
};

// ─── Seed Generators ─────────────────────────────────────────────────────────

/** daily_sliders: stress_level, mood, sleep_quality, relaxation_level are 1-5 per DB CHECK. */
function generateDailySliders(count: number) {
    const feelings = [
        'Felt calm and focused today.',
        'Had a restless morning but improved after meditation.',
        'Grateful for a good night\'s sleep.',
        'Struggled with anxiety in the afternoon.',
        'Energized after a walk in nature.',
        'Felt overwhelmed with work deadlines.',
        'Peaceful evening with family.',
        'Managed stress well through breathing exercises.',
        null,
    ];

    const practices = ['yes', 'no'];
    const logs = [
        'Breathing Exercise', 'Guided Meditation', 'Body Scan', 'Yoga',
        'Mindful Walking', 'Journaling', 'Progressive Relaxation', null,
    ];

    return Array.from({ length: count }, (_, i) => ({
        user_id: USER_ID,
        stress_level: rand(1, 5),
        mood: rand(1, 5),
        sleep_quality: rand(1, 5),
        relaxation_level: rand(1, 5),
        sleep_start_time: `${rand(21, 23)}:${rand(0, 59).toString().padStart(2, '0')}`,
        wake_up_time: `${rand(5, 8)}:${rand(0, 59).toString().padStart(2, '0')}`,
        feelings: pick(feelings),
        mindfulness_practice: pick(practices),
        practice_duration: rand(0, 30),
        practice_log: pick(logs),
        video_play_seconds: rand(0, 300),
        created_at: daysAgo(i),
    }));
}

function generateVoiceRecordings(count: number) {
    const records = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - (i * 7));
        const year = weekDate.getFullYear();

        // ISO week number calculation
        const d = new Date(Date.UTC(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

        records.push({
            user_id: USER_ID,
            week_number: weekNo,
            year,
            file_url: `https://storage.example.com/WeeklyVoice/weekly-${year}-W${weekNo.toString().padStart(2, '0')}-${USER_ID}.wav`,
            file_key: `WeeklyVoice/weekly-${year}-W${weekNo.toString().padStart(2, '0')}-${USER_ID}.wav`,
            duration: rand(15, 45),
            created_at: weekDate.toISOString(),
        });
    }
    return records;
}

function generatePSS10(count: number) {
    return Array.from({ length: count }, (_, i) => {
        const entry: Record<string, any> = {
            user_id: USER_ID,
            created_at: daysAgo(i * 7 + rand(0, 3)),
            duration: rand(120, 600),
        };
        for (let q = 1; q <= 10; q++) entry[`q${q}`] = rand(1, 5);
        return entry;
    });
}

function generateWEMWBS14(count: number) {
    return Array.from({ length: count }, (_, i) => {
        const entry: Record<string, any> = {
            user_id: USER_ID,
            created_at: daysAgo(i * 14 + rand(0, 5)),
            duration: rand(180, 900),
        };
        for (let q = 1; q <= 14; q++) entry[`q${q}`] = rand(1, 5);
        return entry;
    });
}

function generateFFMQ15(count: number) {
    const rev = (v: number) => 6 - v;

    return Array.from({ length: count }, (_, i) => {
        const a: Record<string, number> = {};
        for (let q = 1; q <= 15; q++) a[`q${q}`] = rand(1, 5);

        return {
            user_id: USER_ID,
            ...a,
            observing_score: a.q1 + a.q6 + a.q11,
            describing_score: a.q2 + a.q7 + rev(a.q12),
            awareness_score: rev(a.q3) + rev(a.q8) + rev(a.q13),
            non_judging_score: rev(a.q4) + rev(a.q9) + rev(a.q14),
            non_reactivity_score: a.q5 + a.q10 + a.q15,
            duration: rand(200, 800),
            created_at: daysAgo(i * 7 + rand(0, 3)),
        };
    });
}

/** calendar_events: matches schema (title, description, event_date, is_completed — no user_id). */
function generateCalendarEvents(count: number) {
    const titles = [
        'Daily Check-in', 'Weekly Voice Recording', 'Stress Assessment',
        'Wellbeing Check', 'Mindfulness Assessment', 'Meditation Session',
        'Yoga Practice', 'Breathing Exercise', 'Body Scan', 'Gratitude Journal',
    ];

    const descs = [
        'Completed morning routine', 'Afternoon mindfulness break',
        'Evening reflection session', 'Quick breathing exercise',
        'Full meditation session', null,
    ];

    return Array.from({ length: count }, (_, i) => {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - i);
        return {
            title: pick(titles),
            description: pick(descs),
            event_date: eventDate.toISOString().split('T')[0],
            is_completed: Math.random() > 0.2,
        };
    });
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function seed() {
    console.log('🌱 Starting database seed...\n');

    // 1. Profile
    console.log('  → Seeding profiles...');
    const { error: profileErr } = await supabase.from('profiles').upsert({
        id: USER_ID,
        username: 'Hasitha Erandika',
        research_id: 'MF-2026-001.ex',
    });
    if (profileErr) console.error('    Profile error:', profileErr.message);
    else console.log('    ✓ profiles: 1 entry');

    // 2. About Me (matches actual DB schema)
    console.log('  → Seeding about_me_profiles...');
    const { error: aboutErr } = await supabase.from('about_me_profiles').upsert({
        id: USER_ID,
        university_id: 'UNI-2026-HE',
        education_level: 'Bachelor\'s Degree',
        major_field_of_study: 'Computer Science',
        age: 28,
        living_situation: 'Living alone',
        family_background: 'Supportive family environment',
        cultural_background: 'Sri Lankan',
        hobbies_interests: 'Meditation, yoga, hiking, reading',
        personal_goals: 'Improve daily mindfulness practice and reduce stress',
        why_mindflow: 'To track my mindfulness journey and contribute to research',
        completion_percentage: 100,
        is_completed: true,
        updated_at: new Date().toISOString(),
    });
    if (aboutErr) console.error('    About Me error:', aboutErr.message);
    else console.log('    ✓ about_me_profiles: 1 entry');

    // 3. Admins (mock — requires username, email, password)
    console.log('  → Seeding admins...');
    
    // First, ensure the admin exists in auth.users
    const { data: adminUser, error: authErr } = await supabase.auth.admin.createUser({
        email: 'admin@mindflow.app',
        password: 'admin123',
        email_confirm: true,
    });
    
    if (authErr && authErr.message !== 'User already registered') {
        console.error('    Admin Auth error:', authErr.message);
    } else {
        const adminId = adminUser?.user?.id || ADMIN_ID; // Use created ID or fallback if already exists
        const { error: adminErr } = await supabase.from('admins').upsert({
            id: adminId,
            username: 'admin',
            email: 'admin@mindflow.app',
        });
        
        if (adminErr) console.error('    Admin error:', adminErr.message);
        else console.log('    ✓ admins: 1 mock entry');
    }

    // 4. Daily Sliders (42 entries, values 1-5 per DB CHECK)
    console.log('  → Seeding daily_sliders...');
    const dailyData = generateDailySliders(42);
    const { error: dailyErr } = await supabase.from('daily_sliders').insert(dailyData);
    if (dailyErr) console.error('    Daily error:', dailyErr.message);
    else console.log(`    ✓ daily_sliders: ${dailyData.length} entries`);

    // 5. Voice Recordings (42 entries)
    console.log('  → Seeding voice_recordings...');
    const voiceData = generateVoiceRecordings(42);
    const { error: voiceErr } = await supabase.from('voice_recordings').insert(voiceData);
    if (voiceErr) console.error('    Voice error:', voiceErr.message);
    else console.log(`    ✓ voice_recordings: ${voiceData.length} entries`);

    // 6. PSS-10 Responses (42 entries)
    console.log('  → Seeding questionnaire_pss10_responses...');
    const pss10Data = generatePSS10(42);
    const { error: pss10Err } = await supabase.from('questionnaire_pss10_responses').insert(pss10Data);
    if (pss10Err) console.error('    PSS-10 error:', pss10Err.message);
    else console.log(`    ✓ questionnaire_pss10_responses: ${pss10Data.length} entries`);

    // 7. WEMWBS-14 Responses (42 entries)
    console.log('  → Seeding questionnaire_wemwbs14_responses...');
    const wemwbsData = generateWEMWBS14(42);
    const { error: wemwbsErr } = await supabase.from('questionnaire_wemwbs14_responses').insert(wemwbsData);
    if (wemwbsErr) console.error('    WEMWBS error:', wemwbsErr.message);
    else console.log(`    ✓ questionnaire_wemwbs14_responses: ${wemwbsData.length} entries`);

    // 8. FFMQ-15 Responses (42 entries)
    console.log('  → Seeding questionnaire_ffmq15_responses...');
    const ffmqData = generateFFMQ15(42);
    const { error: ffmqErr } = await supabase.from('questionnaire_ffmq15_responses').insert(ffmqData);
    if (ffmqErr) console.error('    FFMQ error:', ffmqErr.message);
    else console.log(`    ✓ questionnaire_ffmq15_responses: ${ffmqData.length} entries`);

    // 9. Calendar Events (42 entries — no user_id per schema)
    console.log('  → Seeding calendar_events...');
    const calendarData = generateCalendarEvents(42);
    const { error: calErr } = await supabase.from('calendar_events').insert(calendarData);
    if (calErr) console.error('    Calendar error:', calErr.message);
    else console.log(`    ✓ calendar_events: ${calendarData.length} entries`);

    console.log('\n✅ Seed complete!\n');
    console.log(`  User:  Hasitha Erandika (${USER_ID})`);
    console.log(`  Admin: Mock Admin (${ADMIN_ID})\n`);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
