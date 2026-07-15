// Seeds Supabase with realistic dev/test data (npm run seed); self-provisions its own participant/admin auth users so it works in any environment.
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for seeding.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const PARTICIPANT_EMAIL = 'seed.participant@mindflow.app';
const ADMIN_EMAIL = 'seed.admin@mindflow.app';

// Random int between min and max (inclusive).
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Random element from array.
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

// ISO date string N days ago with random time.
const daysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(rand(6, 22), rand(0, 59), rand(0, 59), 0);
    return d.toISOString();
};

// Finds an existing auth user by email, or creates one. Returns the user id.
async function findOrCreateAuthUser(email: string, password: string): Promise<string> {
    const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (!error && created?.user) return created.user.id;

    // Already exists — look it up instead.
    let page = 1;
    for (;;) {
        const { data, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) throw listErr;
        const match = data.users.find((u) => u.email === email);
        if (match) return match.id;
        if (data.users.length < 200) break;
        page += 1;
    }
    throw new Error(`Could not find or create auth user for ${email}`);
}

// Seed generators — daily_sliders uses the current calm_before/calm_after + mindfulness_practice/practice_duration/practice_location fields, not the retired mood/relaxation_level/practice_log ones.

function generateDailySliders(userId: string, count: number) {
    const feelings = [
        'Felt calm and focused today.',
        'Had a restless morning but improved after meditation.',
        "Grateful for a good night's sleep.",
        'Struggled with anxiety in the afternoon.',
        'Energized after a walk in nature.',
        'Felt overwhelmed with work deadlines.',
        'Peaceful evening with family.',
        'Managed stress well through breathing exercises.',
        null,
    ];
    const practices: Array<'yes' | 'no'> = ['yes', 'no'];
    const locations = ['At University', 'Outside University'];

    return Array.from({ length: count }, (_, i) => {
        const practiced = pick(practices);
        return {
            user_id: userId,
            stress_level: rand(1, 5),
            calm_before: rand(1, 5),
            calm_after: rand(1, 5),
            sleep_quality: rand(1, 5),
            sleep_start_time: `${rand(21, 23)}:${rand(0, 59).toString().padStart(2, '0')}`,
            wake_up_time: `${rand(5, 8)}:${rand(0, 59).toString().padStart(2, '0')}`,
            feelings: pick(feelings),
            mindfulness_practice: practiced,
            practice_duration: practiced === 'yes' ? rand(5, 30) : null,
            practice_location: practiced === 'yes' ? pick(locations) : null,
            video_play_seconds: rand(0, 300),
            created_at: daysAgo(i),
        };
    });
}

function generateVoiceRecordings(userId: string, count: number) {
    const records = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - i * 7);
        const year = weekDate.getFullYear();

        const d = new Date(Date.UTC(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        const weekKey = weekNo.toString().padStart(2, '0');

        records.push({
            user_id: userId,
            week_number: weekNo,
            year,
            file_url: `https://storage.example.com/WeeklyVoice/weekly-${year}-W${weekKey}-${userId}.wav`,
            file_key: `WeeklyVoice/weekly-${year}-W${weekKey}-${userId}.wav`,
            duration: rand(15, 45),
            created_at: weekDate.toISOString(),
        });
    }
    return records;
}

function generatePSS10(userId: string, count: number) {
    return Array.from({ length: count }, (_, i) => {
        const entry: Record<string, any> = {
            user_id: userId,
            created_at: daysAgo(i * 7 + rand(0, 3)),
            duration: rand(120, 600),
        };
        for (let q = 1; q <= 10; q++) entry[`q${q}`] = rand(1, 5);
        return entry;
    });
}

function generateWEMWBS14(userId: string, count: number) {
    return Array.from({ length: count }, (_, i) => {
        const entry: Record<string, any> = {
            user_id: userId,
            created_at: daysAgo(i * 14 + rand(0, 5)),
            duration: rand(180, 900),
        };
        for (let q = 1; q <= 14; q++) entry[`q${q}`] = rand(1, 5);
        return entry;
    });
}

function generateFFMQ15(userId: string, count: number) {
    const rev = (v: number) => 6 - v;

    return Array.from({ length: count }, (_, i) => {
        const a: Record<string, number> = {};
        for (let q = 1; q <= 15; q++) a[`q${q}`] = rand(1, 5);

        return {
            user_id: userId,
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

// calendar_events: matches schema (title, description, event_date, is_completed — no user_id).
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

async function seed() {
    console.log('Starting database seed...\n');

    console.log('  -> Creating/finding participant auth user...');
    const participantId = await findOrCreateAuthUser(PARTICIPANT_EMAIL, 'SeedParticipant123!');
    console.log(`     participant id: ${participantId}`);

    console.log('  -> Seeding profiles...');
    const { error: profileErr } = await supabase.from('profiles').upsert({
        id: participantId,
        username: 'seed_participant',
        research_id: 'MF-SEED-001.ex',
    });
    if (profileErr) console.error('    Profile error:', profileErr.message);
    else console.log('    profiles: 1 entry');

    console.log('  -> Seeding about_me_profiles...');
    const { error: aboutErr } = await supabase.from('about_me_profiles').upsert({
        id: participantId,
        university_id: 'UNI-SEED-001',
        education_level: "Bachelor's Degree",
        major_field_of_study: 'Computer Science',
        age: 22,
        living_situation: 'Living alone',
        family_background: 'Supportive family environment',
        cultural_background: 'Sri Lankan',
        hobbies_interests: 'Meditation, yoga, hiking, reading',
        personal_goals: 'Improve daily mindfulness practice and reduce stress',
        why_mindflow: 'To track my mindfulness journey and contribute to research',
        is_completed: true,
        updated_at: new Date().toISOString(),
    });
    if (aboutErr) console.error('    About Me error:', aboutErr.message);
    else console.log('    about_me_profiles: 1 entry');

    console.log('  -> Creating/finding admin auth user...');
    const adminId = await findOrCreateAuthUser(ADMIN_EMAIL, 'SeedAdmin123!');
    const { error: adminErr } = await supabase.from('admins').upsert({
        id: adminId,
        username: 'seed_admin',
        email: ADMIN_EMAIL,
    });
    if (adminErr) console.error('    Admin error:', adminErr.message);
    else console.log(`    admins: 1 entry (${ADMIN_EMAIL})`);

    console.log('  -> Seeding daily_sliders...');
    const dailyData = generateDailySliders(participantId, 42);
    const { error: dailyErr } = await supabase.from('daily_sliders').insert(dailyData);
    if (dailyErr) console.error('    Daily error:', dailyErr.message);
    else console.log(`    daily_sliders: ${dailyData.length} entries`);

    console.log('  -> Seeding voice_recordings...');
    const voiceData = generateVoiceRecordings(participantId, 8);
    const { error: voiceErr } = await supabase.from('voice_recordings').insert(voiceData);
    if (voiceErr) console.error('    Voice error:', voiceErr.message);
    else console.log(`    voice_recordings: ${voiceData.length} entries`);

    console.log('  -> Seeding questionnaire_pss10_responses...');
    const pss10Data = generatePSS10(participantId, 6);
    const { error: pss10Err } = await supabase.from('questionnaire_pss10_responses').insert(pss10Data);
    if (pss10Err) console.error('    PSS-10 error:', pss10Err.message);
    else console.log(`    questionnaire_pss10_responses: ${pss10Data.length} entries`);

    console.log('  -> Seeding questionnaire_wemwbs14_responses...');
    const wemwbsData = generateWEMWBS14(participantId, 3);
    const { error: wemwbsErr } = await supabase.from('questionnaire_wemwbs14_responses').insert(wemwbsData);
    if (wemwbsErr) console.error('    WEMWBS error:', wemwbsErr.message);
    else console.log(`    questionnaire_wemwbs14_responses: ${wemwbsData.length} entries`);

    console.log('  -> Seeding questionnaire_ffmq15_responses...');
    const ffmqData = generateFFMQ15(participantId, 6);
    const { error: ffmqErr } = await supabase.from('questionnaire_ffmq15_responses').insert(ffmqData);
    if (ffmqErr) console.error('    FFMQ error:', ffmqErr.message);
    else console.log(`    questionnaire_ffmq15_responses: ${ffmqData.length} entries`);

    console.log('  -> Seeding calendar_events...');
    const calendarData = generateCalendarEvents(20);
    const { error: calErr } = await supabase.from('calendar_events').insert(calendarData);
    if (calErr) console.error('    Calendar error:', calErr.message);
    else console.log(`    calendar_events: ${calendarData.length} entries`);

    console.log('\nSeed complete!\n');
    console.log(`  Participant: ${PARTICIPANT_EMAIL} / SeedParticipant123! (${participantId})`);
    console.log(`  Admin:       ${ADMIN_EMAIL} / SeedAdmin123! (${adminId})\n`);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
