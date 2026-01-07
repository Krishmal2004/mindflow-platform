import { supabase } from '../app';

export class DashboardService {
    /**
     * helper to get ISO week number
     */
    private getWeekNumber(d: Date): [number, number] {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(
            (((d as any) - (yearStart as any)) / 86400000 + 1) / 7
        );
        return [d.getUTCFullYear(), weekNo];
    }

    public async getUserSummary(userId: string) {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Parallel Queries
        const [
            { data: streakData },
            { count: totalCount },
            { count: recentCount },
            { data: voiceRecordings },
            { count: monthlyMainCount },
            { data: profile }
        ] = await Promise.all([
            // 1. All Daily Sliders for Streak Calculation (Ordered)
            supabase
                .from("daily_sliders")
                .select("created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            // 2. Total Count (last 6 months)
            supabase
                .from("daily_sliders")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .gte("created_at", sixMonthsAgo.toISOString()),

            // 3. Recent Count (last 30 days) for Consistency
            supabase
                .from("daily_sliders")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .gte("created_at", thirtyDaysAgo.toISOString()),

            // 4. Voice Recordings for Weekly Progress
            supabase
                .from("voice_recordings")
                .select("created_at")
                .eq("user_id", userId)
                .gte("created_at", sixMonthsAgo.toISOString()),

            // 5. Main Questionnaire for Monthly Progress
            supabase
                .from("main_questionnaire_responses")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .gte("submitted_at", startOfMonth.toISOString()),

            // 6. User Profile for Research ID
            supabase
                .from("profiles")
                .select("researchID")
                .eq("id", userId)
                .single()
        ]);

        // --- LOGIC ---

        // 1. Streak Calculation
        let currentStreak = 0;
        let isDailyDone = false;

        if (streakData && streakData.length > 0) {
            const lastEntry = new Date(streakData[0].created_at);
            if (lastEntry >= startOfToday) {
                isDailyDone = true;
            }

            const entryDates = new Set(
                streakData.map((entry) => {
                    const d = new Date(entry.created_at);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                })
            );

            let checkDate = new Date(today);
            checkDate.setHours(0, 0, 0, 0);

            // If not done today, start checking from yesterday
            if (!isDailyDone) {
                checkDate.setDate(checkDate.getDate() - 1);
            }

            while (entryDates.has(checkDate.getTime())) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // 2. Consistency Calculation
        const consistency = recentCount
            ? Math.min(100, Math.round((recentCount / 30) * 100))
            : 0;

        // 3. Weekly Progress
        const uniqueWeeksLines = voiceRecordings || [];
        const uniqueWeeks = new Set(
            uniqueWeeksLines.map((a) => {
                const d = new Date(a.created_at);
                const [year, week] = this.getWeekNumber(d);
                return `${year}-W${week.toString().padStart(2, "0")}`;
            })
        );
        const weeklyProgress = uniqueWeeks.size
            ? Math.min(100, Math.round((uniqueWeeks.size / 26) * 100))
            : 0;

        let isWeeklyDone = false;
        const [currentYear, currentWeek] = this.getWeekNumber(new Date());
        const currentWeekStr = `${currentYear}-W${currentWeek.toString().padStart(2, "0")}`;
        if (uniqueWeeks.has(currentWeekStr)) {
            isWeeklyDone = true;
        }

        // 4. Monthly Progress
        const isMonthlyDone = (monthlyMainCount || 0) > 0;

        // 5. Research Group
        let group = "";
        if (profile?.researchID?.endsWith(".ex")) group = "ex";
        else if (profile?.researchID?.endsWith(".cg")) group = "cg";

        return {
            streak: currentStreak,
            consistency,
            weeklyProgress,
            totalCompleted: totalCount || 0,
            status: {
                dailyDone: isDailyDone,
                weeklyDone: isWeeklyDone,
                monthlyDone: isMonthlyDone
            },
            group
        };
    }
}
