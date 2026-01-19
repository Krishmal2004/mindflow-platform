import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, List, Calendar as CalendarIcon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface DailyEntry {
    created_at: string;
    stress_level: number;
    sleep_quality: number;
    relaxation_level: number;
}

interface WeeklyEntry {
    week: string;
    completed: boolean;
    submitted_at?: string;
}

interface MainEntry {
    id: number;
    version: string;
    submitted_at: string;
}

export default function ProgressPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<DailyEntry[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([]);
    const [mainData, setMainData] = useState<MainEntry[]>([]);

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Fetch Daily Sliders
                const { data: sliders } = await supabase
                    .from('daily_sliders')
                    .select('created_at, stress_level, sleep_quality, relaxation_level')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });
                setDailyData(sliders || []);

                // 2. Fetch Weekly Recordings
                const { data: recordings } = await supabase
                    .from('voice_recordings')
                    .select('week_number, year, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                // Process Weekly Data
                const weeksMap = new Map();
                recordings?.forEach(r => {
                    const key = `${r.year}-W${r.week_number}`;
                    weeksMap.set(key, { week: key, completed: true, submitted_at: r.created_at });
                });
                // (Simplified: just showing completed ones for now vs full history generation)
                setWeeklyData(Array.from(weeksMap.values()));

                // 3. Fetch Main Questionnaires
                const { data: sessions } = await supabase
                    .from('main_questionnaire_sessions')
                    .select('id, question_set_id, started_at') // using started_at as approximation for submission if submitted_at missing
                    .eq('user_id', user.id)
                    .order('started_at', { ascending: false });

                // Fetch set versions if needed, for now mocking version mapping or simple display
                const formattedMain = sessions?.map(s => ({
                    id: s.id,
                    version: `Session ${s.id}`, // Placeholder version logic
                    submitted_at: s.started_at
                })) || [];
                setMainData(formattedMain);

            } catch (error) {
                console.error("Failed to fetch progress", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgressData();
    }, []);

    // Memoized Stats
    const stats = useMemo(() => {
        if (!dailyData.length) return { stress: 0, sleep: 0, relax: 0, consistency: 0 };
        const stress = dailyData.reduce((acc, curr) => acc + (curr.stress_level || 0), 0) / dailyData.length;
        const sleep = dailyData.reduce((acc, curr) => acc + (curr.sleep_quality || 0), 0) / dailyData.length;
        const relax = dailyData.reduce((acc, curr) => acc + (curr.relaxation_level || 0), 0) / dailyData.length;
        return { stress, sleep, relax, consistency: Math.min(100, (dailyData.length / 30) * 100) }; // Mock logic for consistency
    }, [dailyData]);

    const chartData = useMemo(() => {
        return dailyData.slice(-14).map(d => ({
            date: format(new Date(d.created_at), 'MMM dd'),
            stress: d.stress_level,
            sleep: d.sleep_quality,
            relax: d.relaxation_level
        }));
    }, [dailyData]);

    if (loading) return <div className="flex justify-center p-8 h-screen items-center bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-900">Your Progress</h1>
                </div>
            </div>

            <main className="w-full max-w-4xl px-4 py-6 space-y-6">

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-t-4 border-t-teal-500 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-teal-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <List className="h-6 w-6 text-teal-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{dailyData.length}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Daily Check-ins</div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-blue-500 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <CalendarIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{weeklyData.length}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Weekly Recordings</div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-purple-500 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <History className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{mainData.length}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Questionnaires</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-200">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="main">Main</TabsTrigger>
                    </TabsList>

                    {/* DAILY TAB */}
                    <TabsContent value="daily" className="space-y-6 animate-in fade-in-50">
                        <Card>
                            <CardHeader>
                                <CardTitle>Well-being Trends (Last 14 Days)</CardTitle>
                                <CardDescription>Tracking your Stress, Sleep, and Relaxation levels.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                            <YAxis domain={[0, 10]} hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} name="Stress" />
                                            <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sleep" />
                                            <Line type="monotone" dataKey="relax" stroke="#10b981" strokeWidth={2} dot={false} name="Relaxation" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4 text-sm">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Stress</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Sleep</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Relaxation</div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                                <div className="text-sm text-slate-500 mb-1">Avg Stress</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.stress.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                                <div className="text-sm text-slate-500 mb-1">Avg Sleep</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.sleep.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                                <div className="text-sm text-slate-500 mb-1">Avg Relax</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.relax.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* WEEKLY TAB */}
                    <TabsContent value="weekly" className="space-y-6 animate-in fade-in-50">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Submissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {weeklyData.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">No weekly entries found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {weeklyData.map((week, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                        <CalendarIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{week.week}</div>
                                                        <div className="text-xs text-slate-500">Submitted on {format(new Date(week.submitted_at!), 'MMM dd, yyyy')}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completed</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MAIN TAB */}
                    <TabsContent value="main" className="space-y-6 animate-in fade-in-50">
                        <Card>
                            <CardHeader>
                                <CardTitle>Questionnaire History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {mainData.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">No questionnaires found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {mainData.map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                                        <History className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{entry.version}</div>
                                                        <div className="text-xs text-slate-500">Submitted on {format(new Date(entry.submitted_at), 'MMM dd, yyyy')}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completed</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
