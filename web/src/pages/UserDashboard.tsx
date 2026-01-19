import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RoadmapMap } from "@/components/RoadmapMap"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { Trophy, Flame, Activity, LogOut } from "lucide-react"
import AuthLogo from "@/assets/Auth.png"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

/**
 * Mindfulness tips to display for experimental group (ex).
 */
const MINDFULNESS_TIPS = [
    "Take a moment to breathe deeply. Notice how your body feels right now, without judgment.",
    "Pause and observe one thing you can see, hear, and feel in this moment.",
    "Let go of yesterday and tomorrow. This moment is all that exists.",
    "Smile gently — even a small one changes your brain chemistry.",
    "Wherever you are, be there completely.",
    "Your breath is your anchor. Return to it whenever you feel lost.",
    "You don't need to fix anything right now. Just notice.",
    "Every exhale is a letting go.",
    "You are exactly where you need to be.",
    "This too shall pass. Breathe through it.",
];

/**
 * Control facts to display for control group (cg).
 */
const CONTROL_FACTS = [
    "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.",
    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
    "Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.",
    "A day on Venus is longer than a year on Venus.",
    "Bananas are curved because they grow towards the sun.",
    "The first computer bug was a real moth found in a Harvard Mark II computer in 1947.",
    "Water covers about 71% of the Earth's surface, but oceans hold 96.5% of all water.",
    "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes.",
    "Oxford University is older than the Aztec Empire.",
    "There are more stars in the universe than grains of sand on all the Earth's beaches.",
];

export default function UserDashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [dailyContent, setDailyContent] = useState<string>("");
    const [activityHistory, setActivityHistory] = useState<number[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Dashboard Summary
                const summaryData = await api.getDashboardSummary();
                setSummary(summaryData);

                // 2. Fetch User Profile for Group Logic
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', user.id)
                        .single();

                    setUserProfile(profile);

                    // Determine content based on username extension
                    const username = profile?.username || "";
                    const isExperimental = username.endsWith('.ex');
                    const isControl = username.endsWith('.cg');

                    // Pick a random tip/fact based on day of year to keep it consistent for the day? 
                    // Or just random for now as requested. Let's do random for variety.
                    if (isExperimental) {
                        setDailyContent(MINDFULNESS_TIPS[Math.floor(Math.random() * MINDFULNESS_TIPS.length)]);
                    } else if (isControl) {
                        setDailyContent(CONTROL_FACTS[Math.floor(Math.random() * CONTROL_FACTS.length)]);
                    } else {
                        // Default fallback if no specific extension
                        setDailyContent(MINDFULNESS_TIPS[Math.floor(Math.random() * MINDFULNESS_TIPS.length)]);
                    }

                    // 3. Fetch Real Activity History (Last 14 days)
                    // We'll query daily_sliders count per day
                    const fourteenDaysAgo = new Date();
                    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

                    const { data: dailyEntries } = await supabase
                        .from('daily_sliders')
                        .select('created_at, mood')
                        .eq('user_id', user.id)
                        .gte('created_at', fourteenDaysAgo.toISOString());

                    // Map entries to percentages or counts. Let's show "Mood" levels as the bar height for visual variety
                    // Or just 100% if completed. Let's do Mood (1-5) scaled to % (20-100%)
                    // If multiple entries per day, take the max mood or average.

                    const history = new Array(14).fill(0);
                    dailyEntries?.forEach(entry => {
                        const date = new Date(entry.created_at);
                        const diffTime = Math.abs(new Date().getTime() - date.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const index = 14 - diffDays;
                        if (index >= 0 && index < 14) {
                            // Scale mood 1-5 to 20-100
                            const val = (entry.mood || 0) * 20;
                            if (val > history[index]) history[index] = val;
                        }
                    });
                    setActivityHistory(history);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleUpcomingFeature = (featureName: string) => {
        toast.info(`${featureName} is coming soon!`, {
            description: "We are currently developing this feature for you."
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={AuthLogo} alt="MindFlow Logo" className="h-8 w-8" />
                        <span className="font-bold text-xl text-slate-900 tracking-tight">MindFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span>{summary?.streak || 0} Day Streak</span>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">
                                {userProfile?.username?.substring(0, 2).toUpperCase() || "ME"}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
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
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{userProfile?.username || "Mindful Traveler"}</h1>
                            <p className="text-slate-600 max-w-2xl italic border-l-4 border-teal-500 pl-4 py-1 bg-slate-50 rounded-r-lg">
                                "{dailyContent || "Loading your daily insights..."}"
                            </p>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="hover:shadow-lg transition-all border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/20">
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
                            <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/20">
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
                            <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/20">
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

                        {/* Daily Tips (Grid) - Now Interactive */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Recommended Practices</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { title: 'Morning Meditation', time: '5 min', color: 'bg-orange-50 border-orange-100 text-orange-900 hover:bg-orange-100', icon: '🧘' },
                                    { title: 'Deep Breathing', time: '3 min', color: 'bg-blue-50 border-blue-100 text-blue-900 hover:bg-blue-100', icon: '🌬️' },
                                    { title: 'Sound Bath', time: '10 min', color: 'bg-purple-50 border-purple-100 text-purple-900 hover:bg-purple-100', icon: '🎵' },
                                ].map((tip, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleUpcomingFeature(tip.title)}
                                        className={`p-4 rounded-xl border flex flex-col justify-between h-32 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${tip.color}`}
                                    >
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
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Activity Overview (Last 14 Days)</h3>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="h-48 flex items-end justify-between gap-2">
                                        {/* Real Graph Bars */}
                                        {activityHistory.length > 0 ? activityHistory.map((h, i) => (
                                            <div key={i} className="w-full bg-teal-100 rounded-t-sm hover:bg-teal-200 transition-colors relative group" style={{ height: `${h || 5}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    Mood: {h / 20}/5
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                No activity data yet. Start your journey!
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>14d ago</span>
                                        <span>Today</span>
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
                                    onSelect={(date) => {
                                        if (date) navigate('/dashboard/calendar');
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    )
}

