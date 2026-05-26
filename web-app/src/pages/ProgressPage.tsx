import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, List, Calendar as CalendarIcon, History, CheckCircle } from 'lucide-react';
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

                const { data: sliders } = await supabase
                    .from('daily_sliders')
                    .select('created_at, stress_level, sleep_quality, relaxation_level')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });
                setDailyData(sliders || []);

                const { data: recordings } = await supabase
                    .from('voice_recordings')
                    .select('week_number, year, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                const weeksMap = new Map();
                recordings?.forEach(r => {
                    const key = `${r.year}-W${r.week_number}`;
                    weeksMap.set(key, { week: key, completed: true, submitted_at: r.created_at });
                });
                setWeeklyData(Array.from(weeksMap.values()));

                const { data: sessions } = await supabase
                    .from('main_questionnaire_sessions')
                    .select('id, question_set_id, started_at')
                    .eq('user_id', user.id)
                    .order('started_at', { ascending: false });

                const formattedMain = sessions?.map(s => ({
                    id: s.id,
                    version: `Session ${s.id}`,
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

    const stats = useMemo(() => {
        if (!dailyData.length) return { stress: 0, sleep: 0, relax: 0, consistency: 0 };
        const stress = dailyData.reduce((acc, curr) => acc + (curr.stress_level || 0), 0) / dailyData.length;
        const sleep = dailyData.reduce((acc, curr) => acc + (curr.sleep_quality || 0), 0) / dailyData.length;
        const relax = dailyData.reduce((acc, curr) => acc + (curr.relaxation_level || 0), 0) / dailyData.length;
        return { stress, sleep, relax, consistency: Math.min(100, (dailyData.length / 30) * 100) };
    }, [dailyData]);

    const chartData = useMemo(() => {
        return dailyData.slice(-7).map(d => ({
            date: format(new Date(d.created_at), 'MMM dd'),
            stress: d.stress_level,
            sleep: d.sleep_quality,
            relax: d.relaxation_level
        }));
    }, [dailyData]);

    const last7DaysList = useMemo(() => {
        const list = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const entry = dailyData.find(d => format(new Date(d.created_at), 'yyyy-MM-dd') === dateStr);
            list.push({
                date,
                isToday: i === 0,
                entry
            });
        }
        return list;
    }, [dailyData]);

    if (loading) return <div className="flex justify-center p-8 h-screen items-center bg-white"><Loader2 className="animate-spin h-8 w-8 text-neutral-400" /></div>;

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <div className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-5 w-5 text-neutral-600" />
                    </Button>
                    <h1 className="text-xl font-bold text-neutral-900">Your Progress</h1>
                </div>
            </div>

            <main className="w-full max-w-4xl px-4 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-neutral-200">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <List className="h-6 w-6 text-neutral-600" />
                            </div>
                            <div className="text-2xl font-bold text-neutral-900">{dailyData.length}</div>
                            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Daily Check-ins</div>
                        </CardContent>
                    </Card>
                    <Card className="border border-neutral-200">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <CalendarIcon className="h-6 w-6 text-neutral-600" />
                            </div>
                            <div className="text-2xl font-bold text-neutral-900">{weeklyData.length}</div>
                            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Weekly Recordings</div>
                        </CardContent>
                    </Card>
                    <Card className="border border-neutral-200">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <History className="h-6 w-6 text-neutral-600" />
                            </div>
                            <div className="text-2xl font-bold text-neutral-900">{mainData.length}</div>
                            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Questionnaires</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="main">Main</TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="space-y-6 animate-in fade-in-50">
                        {/* 7-Day Journey List */}
                        <Card className="border border-neutral-200">
                            <CardHeader>
                                <CardTitle>Your 7-Day Journey</CardTitle>
                                <CardDescription>Your check-ins over the last 7 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {last7DaysList.map((day, i) => (
                                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${day.isToday ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 bg-white'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${day.entry ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                                    {day.entry ? <CheckCircle className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-neutral-300" />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-neutral-900">
                                                        {day.isToday ? 'Today' : format(day.date, 'EEEE')}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">{format(day.date, 'MMM dd, yyyy')}</div>
                                                </div>
                                            </div>
                                            <div>
                                                {day.entry ? (
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Completed</span>
                                                ) : day.isToday ? (
                                                    <Button size="sm" onClick={() => navigate('/dashboard/daily')} className="h-8 rounded-full bg-neutral-900 text-xs">Start</Button>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 font-medium">Missed</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-neutral-200">
                            <CardHeader>
                                <CardTitle>Well-being Trends (Last 7 Days)</CardTitle>
                                <CardDescription>Tracking your Stress, Sleep, and Relaxation levels.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                                            <YAxis domain={[0, 10]} hide />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="stress" stroke="#171717" strokeWidth={2} dot={false} name="Stress" />
                                            <Line type="monotone" dataKey="sleep" stroke="#737373" strokeWidth={2} dot={false} name="Sleep" />
                                            <Line type="monotone" dataKey="relax" stroke="#d4d4d4" strokeWidth={2} dot={false} name="Relaxation" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4 text-sm">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-900"></div> Stress</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-500"></div> Sleep</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-300"></div> Relaxation</div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border border-neutral-200">
                                <div className="text-sm text-neutral-500 mb-1">Avg Stress</div>
                                <div className="text-2xl font-bold text-neutral-800">{stats.stress.toFixed(1)}<span className="text-sm font-normal text-neutral-400">/10</span></div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-neutral-200">
                                <div className="text-sm text-neutral-500 mb-1">Avg Sleep</div>
                                <div className="text-2xl font-bold text-neutral-800">{stats.sleep.toFixed(1)}<span className="text-sm font-normal text-neutral-400">/10</span></div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-neutral-200">
                                <div className="text-sm text-neutral-500 mb-1">Avg Relax</div>
                                <div className="text-2xl font-bold text-neutral-800">{stats.relax.toFixed(1)}<span className="text-sm font-normal text-neutral-400">/10</span></div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="weekly" className="space-y-6 animate-in fade-in-50">
                        <Card className="border border-neutral-200">
                            <CardHeader><CardTitle>Weekly Submissions</CardTitle></CardHeader>
                            <CardContent>
                                {weeklyData.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-400">No weekly entries found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {weeklyData.map((week, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                                                        <CalendarIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900">{week.week}</div>
                                                        <div className="text-xs text-neutral-500">Submitted on {format(new Date(week.submitted_at!), 'MMM dd, yyyy')}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-neutral-900 text-white text-xs font-bold rounded-full">Completed</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="main" className="space-y-6 animate-in fade-in-50">
                        <Card className="border border-neutral-200">
                            <CardHeader><CardTitle>Questionnaire History</CardTitle></CardHeader>
                            <CardContent>
                                {mainData.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-400">No questionnaires found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {mainData.map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                                                        <History className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900">{entry.version}</div>
                                                        <div className="text-xs text-neutral-500">Submitted on {format(new Date(entry.submitted_at), 'MMM dd, yyyy')}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-neutral-900 text-white text-xs font-bold rounded-full">Completed</div>
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
