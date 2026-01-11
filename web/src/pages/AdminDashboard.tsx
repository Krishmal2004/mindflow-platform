import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, Users, Activity, Mic, Calendar, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserProfile {
    id: string;
    username: string;
}

interface UserStats {
    userId: string;
    sliderCount: number;
    recordingCount: number;
    lastActive: string | null;
}

interface ChartData {
    date: string;
    submissions: number;
}

export default function AdminDashboard() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<Record<string, UserStats>>({});
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Fetch Data
            const { data: profilesData } = await supabase.from('profiles').select('*');
            const { data: slidersData } = await supabase.from('daily_sliders').select('user_id, created_at');
            const { data: voiceData } = await supabase.from('voice_recordings').select('user_id, created_at');

            // 2. Process Stats
            const newStats: Record<string, UserStats> = {};
            profilesData?.forEach(p => {
                const userSliders = slidersData?.filter(s => s.user_id === p.id) || [];
                const userVoice = voiceData?.filter(v => v.user_id === p.id) || [];
                const allDates = [...userSliders, ...userVoice].map(d => new Date(d.created_at).getTime());
                newStats[p.id] = {
                    userId: p.id,
                    sliderCount: userSliders.length,
                    recordingCount: userVoice.length,
                    lastActive: allDates.length > 0 ? new Date(Math.max(...allDates)).toLocaleDateString() : 'Never'
                };
            });

            // 3. Process Chart Data (Last 7 Days)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const chart = last7Days.map(date => {
                const count = (slidersData || []).filter(s => s.created_at.startsWith(date)).length;
                return { date, submissions: count };
            });

            setProfiles(profilesData || []);
            setStats(newStats);
            setChartData(chart);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;

    const totalSliders = Object.values(stats).reduce((acc, curr) => acc + curr.sliderCount, 0);
    const totalVoice = Object.values(stats).reduce((acc, curr) => acc + curr.recordingCount, 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation */}
            <div className="border-b bg-white">
                <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
                    <div className="flex items-center font-bold text-xl text-slate-800">
                        <div className="h-8 w-8 bg-teal-600 rounded-lg mr-2"></div>
                        MindFlow Admin
                    </div>
                    <div className="ml-auto flex items-center space-x-4">
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => alert("Downloading Report...")} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="participants">Participants</TabsTrigger>
                        <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                                    <Users className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{profiles.length}</div>
                                    <p className="text-xs text-slate-500">+2 from last week</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Daily Engagement</CardTitle>
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalSliders}</div>
                                    <p className="text-xs text-slate-500">Check-ins submitted</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Voice Journals</CardTitle>
                                    <Mic className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalVoice}</div>
                                    <p className="text-xs text-slate-500">Recordings stored</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                                    <Activity className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">12</div>
                                    <p className="text-xs text-slate-500">Users online</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Area */}
                        <div className="grid gap-4 md:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="submissions" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Latest actions across the platform.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-8">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div className="flex items-center" key={i}>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>U{i}</AvatarFallback>
                                                </Avatar>
                                                <div className="ml-4 space-y-1">
                                                    <p className="text-sm font-medium leading-none">User_{100 + i} submitted a journal</p>
                                                    <p className="text-sm text-slate-500">2 minutes ago</p>
                                                </div>
                                                <div className="ml-auto font-medium text-emerald-600 text-sm">Completed</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="participants" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Participants</CardTitle>
                                <CardDescription>Manage and view details of all enrolled users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">ID</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Sliders</TableHead>
                                            <TableHead className="text-center">Journals</TableHead>
                                            <TableHead className="text-right">Last Active</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {profiles.map((profile) => (
                                            <TableRow key={profile.id}>
                                                <TableCell className="font-mono text-xs text-slate-500">{profile.id.slice(0, 8)}...</TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {profile.username || 'Anonymous'}
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Active</Badge></TableCell>
                                                <TableCell className="text-center">{stats[profile.id]?.sliderCount || 0}</TableCell>
                                                <TableCell className="text-center">{stats[profile.id]?.recordingCount || 0}</TableCell>
                                                <TableCell className="text-right text-slate-500">{stats[profile.id]?.lastActive}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
