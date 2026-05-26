import { supabase } from '../config/supabase';
import { getISOWeekNumber } from '../utils/date';
import { STREAK_LOOKBACK_DAYS } from '../constants/limits';

export class DashboardService {
    public async getUserSummary(userId: string) {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const streakSince = new Date(today);
        streakSince.setDate(today.getDate() - STREAK_LOOKBACK_DAYS);

        // Parallel queries for performance
        const [
            { data: streakData },
            { count: totalCount },
            { count: recentCount },
            { data: voiceRecordings },
            { count: pss10Count },
            { count: ffmq15Count },
            { count: wemwbs14Count },
            { data: profile },
        ] = await Promise.all([
            supabase.from('daily_sliders').select('created_at').eq('user_id', userId).gte('created_at', streakSince.toISOString()).order('created_at', { ascending: false }),
            supabase.from('daily_sliders').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', sixMonthsAgo.toISOString()),
            supabase.from('daily_sliders').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString()),
            supabase.from('voice_recordings').select('created_at').eq('user_id', userId).gte('created_at', sixMonthsAgo.toISOString()),
            supabase.from('questionnaire_pss10_responses').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfMonth.toISOString()),
            supabase.from('questionnaire_ffmq15_responses').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfMonth.toISOString()),
            supabase.from('questionnaire_wemwbs14_responses').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfMonth.toISOString()),
            supabase.from('profiles').select('research_id').eq('id', userId).single(),
        ]);

        // Streak calculation
        let currentStreak = 0;
        let isDailyDone = false;

        if (streakData?.length) {
            const lastEntry = new Date(streakData[0].created_at);
            isDailyDone = lastEntry >= startOfToday;

            const entryDates = new Set(
                streakData.map((e) => {
                    const d = new Date(e.created_at);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                })
            );

            const checkDate = new Date(today);
            checkDate.setHours(0, 0, 0, 0);
            if (!isDailyDone) checkDate.setDate(checkDate.getDate() - 1);

            while (entryDates.has(checkDate.getTime())) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // Consistency: % of last 30 days with entries
        const consistency = recentCount ? Math.min(100, Math.round((recentCount / 30) * 100)) : 0;

        // Weekly progress: unique weeks with voice recordings out of 26
        const uniqueWeeks = new Set(
            (voiceRecordings || []).map((r: { created_at: string }) => {
                const [year, week] = getISOWeekNumber(new Date(r.created_at));
                return `${year}-W${week.toString().padStart(2, '0')}`;
            })
        );
        const weeklyProgress = uniqueWeeks.size ? Math.min(100, Math.round((uniqueWeeks.size / 26) * 100)) : 0;

        const [currentYear, currentWeek] = getISOWeekNumber(new Date());
        const isWeeklyDone = uniqueWeeks.has(`${currentYear}-W${currentWeek.toString().padStart(2, '0')}`);

        // Monthly questionnaire completion
        const isMonthlyDone = ((pss10Count || 0) + (ffmq15Count || 0) + (wemwbs14Count || 0)) > 0;

        // Research group from profile suffix
        let group = '';
        if (profile?.research_id?.endsWith('.ex')) group = 'ex';
        else if (profile?.research_id?.endsWith('.cg')) group = 'cg';

        return {
            streak: currentStreak,
            consistency,
            weeklyProgress,
            totalCompleted: totalCount || 0,
            status: { dailyDone: isDailyDone, weeklyDone: isWeeklyDone, monthlyDone: isMonthlyDone },
            group,
        };
    }
}
