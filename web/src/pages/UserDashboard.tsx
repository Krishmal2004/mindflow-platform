import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RoadmapMap } from "@/components/RoadmapMap"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { ArrowRight, Trophy, Flame, Activity } from "lucide-react"

export default function UserDashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await api.getDashboardSummary();
                setSummary(data);
            } catch (error) {
                console.error("Failed to fetch dashboard summary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">MindFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span>{summary?.streak || 0} Day Streak</span>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">HE</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content Area (8 Cols) */}
                    <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Welcome Branding */}
                        <div className="space-y-2">
                            <h2 className="text-lg font-medium text-slate-500">Good Morning,</h2>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hasitha Erandika</h1>
                            <p className="text-slate-600 max-w-2xl">
                                Ready to continue your mindfulness journey? You're on a great path today.
                            </p>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                                            <Activity className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Great</span>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{summary?.consistency || 0}%</div>
                                    <div className="text-sm text-slate-500 font-medium">Consistency</div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                                            <Flame className="h-5 w-5 text-orange-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{summary?.streak || 0}</div>
                                    <div className="text-sm text-slate-500 font-medium">Day Streak</div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                                            <Trophy className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{summary?.totalCompleted || 0}</div>
                                    <div className="text-sm text-slate-500 font-medium">Total Sessions</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Tips (Grid) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Daily Tips</h3>
                                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { title: 'Morning Meditation', time: '5 min', color: 'bg-orange-50 border-orange-100 text-orange-900', icon: '🧘' },
                                    { title: 'Deep Breathing', time: '3 min', color: 'bg-blue-50 border-blue-100 text-blue-900', icon: '🌬️' },
                                    { title: 'Sound Bath', time: '10 min', color: 'bg-purple-50 border-purple-100 text-purple-900', icon: '🎵' },
                                ].map((tip, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between h-32 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${tip.color}`}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-2xl">{tip.icon}</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-white/50 rounded-full backdrop-blur-sm">{tip.time}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold">{tip.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Preview Calendar */}
                        <div className="hidden lg:block">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Activity Overview</h3>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="h-48 flex items-end justify-between gap-2">
                                        {/* Mock Graph Bars */}
                                        {[40, 60, 30, 80, 50, 90, 70, 40, 60, 80, 50, 70, 40, 60].map((h, i) => (
                                            <div key={i} className="w-full bg-teal-100 rounded-t-sm hover:bg-teal-200 transition-colors relative group" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {h}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                        <span className="hidden sm:inline">Mon</span><span className="hidden sm:inline">Tue</span><span className="hidden sm:inline">Wed</span><span className="hidden sm:inline">Thu</span><span className="hidden sm:inline">Fri</span><span className="hidden sm:inline">Sat</span><span className="hidden sm:inline">Sun</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar Area (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Roadmap Card */}
                        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 sticky top-24">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    🚀 Your Roadmap
                                </CardTitle>
                                <CardDescription>Complete daily tasks to unlock insights.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <RoadmapMap status={summary?.status} />
                            </CardContent>
                        </Card>

                        {/* Mini Calendar */}
                        <Card>
                            <CardContent className="p-4 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={new Date()}
                                    className="rounded-md"
                                />
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    )
}
import { Button } from "@/components/ui/button"
