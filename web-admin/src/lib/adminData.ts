import { supabase } from '@/lib/supabaseClient';

export interface OverviewMetrics {
    profilesCount: number;
    dailyCount: number;
    voiceCount: number;
    calendarCount: number;
    recentSubmissions: Array<{
        id: number;
        user_id: string;
        mood: number;
        stress_level: number;
        created_at: string;
    }>;
    chartData: Array<{ date: string; checkins: number }>;
}

/** Single overview fetch — one daily_sliders query for chart + counts elsewhere */
export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysIso = sevenDaysAgo.toISOString();

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const [
        { count: profs },
        { count: daily },
        { count: voice },
        { count: calendar },
        { data: recentSliders },
        { data: chartEntries },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('daily_sliders').select('*', { count: 'exact', head: true }),
        supabase.from('voice_recordings').select('*', { count: 'exact', head: true }),
        supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
        supabase
            .from('daily_sliders')
            .select('id, user_id, mood, stress_level, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('daily_sliders').select('created_at').gte('created_at', sevenDaysIso),
    ]);

    const formattedChart = last7Days.map((date) => {
        const count = (chartEntries || []).filter((e) => e.created_at.startsWith(date)).length;
        return { date, checkins: count };
    });

    return {
        profilesCount: profs || 0,
        dailyCount: daily || 0,
        voiceCount: voice || 0,
        calendarCount: calendar || 0,
        recentSubmissions: recentSliders || [],
        chartData: formattedChart,
    };
}

export async function fetchTablePage(
    tableName: string,
    primaryKey: string,
    page: number,
    pageSize: number
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .order(primaryKey, { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { rows: data || [], total: count ?? 0 };
}
