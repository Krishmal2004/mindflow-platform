import { supabase } from '@/lib/supabaseClient';
import type { TableConfig } from '@/lib/tableConfig';

export interface OverviewMetrics {
    profilesCount: number;
    dailyCount: number;
    voiceCount: number;
    calendarCount: number;
    recentSubmissions: Array<{
        id: number;
        user_id: string;
        calm_before: number;
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
            .select('id, user_id, calm_before, stress_level, created_at')
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

export interface TableFilters {
    /** Raw search box text. */
    searchQuery?: string;
    /** user_id values whose profile username matched searchQuery (resolved client-side
     * against the already-loaded profiles list — cheap, since that list is small). */
    searchUserIds?: string[];
    startDate?: string;
    endDate?: string;
    /** Restrict to these user_id values (from the cg/ex group filter), or null for no restriction. */
    groupUserIds?: string[] | null;
}

/** Escapes characters that are syntactically meaningful inside a PostgREST `.or()`
 * filter string, so search text can't break out of the intended filter clause. */
function escapeOrValue(v: string): string {
    return v.replace(/[,()]/g, '\\$&');
}

/**
 * Paginated table fetch with search/date/group filtering applied at the database query
 * level (via count: 'exact' + .range()) instead of client-side on an already-paginated
 * page. Fixes the earlier bug where searching or filtering only ever matched the 50 rows
 * already loaded for the current page — records elsewhere in the table were invisible.
 */
export async function fetchFilteredTablePage(
    config: TableConfig,
    page: number,
    pageSize: number,
    filters: TableFilters
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(config.name).select('*', { count: 'exact' });

    if (config.hasUserId) {
        let ids: string[] | null = filters.groupUserIds ?? null;
        let rawIdPattern: string | null = null;

        if (filters.searchQuery) {
            const matched = filters.searchUserIds ?? [];
            if (matched.length > 0) {
                ids = ids ? ids.filter((id) => matched.includes(id)) : matched;
            } else {
                // No username matched — fall back to a raw user_id substring match
                // (e.g. an admin pasted a partial UUID) via an explicit ::text cast,
                // since Postgres has no ilike operator for uuid directly.
                rawIdPattern = filters.searchQuery;
            }
        }

        if (ids !== null && ids.length === 0) {
            // Group/username filter matched nobody — short-circuit rather than send
            // `user_id=in.()`, which PostgREST rejects.
            return { rows: [], total: 0 };
        }
        if (rawIdPattern !== null) query = query.filter('user_id::text', 'ilike', `%${rawIdPattern}%`);
        if (ids) query = query.in('user_id', ids);
    } else if (filters.searchQuery) {
        if (config.name === 'profiles') {
            const q = escapeOrValue(filters.searchQuery);
            query = query.or(`username.ilike.%${q}%,research_id.ilike.%${q}%`);
        } else {
            query = query.ilike(config.searchColumn, `%${filters.searchQuery}%`);
        }
    }

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);

    const { data, error, count } = await query
        .order(config.primaryKey, { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { rows: data || [], total: count ?? 0 };
}
