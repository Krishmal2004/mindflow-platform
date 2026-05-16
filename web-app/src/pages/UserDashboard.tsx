import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RoadmapMap } from "@/components/RoadmapMap"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { Trophy, Flame, Activity, LogOut, ChevronRight, TrendingUp } from "lucide-react"
import AuthLogo from "@/assets/Auth.png"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const MINDFULNESS_TIPS = [
    "Take a moment to breathe deeply. Notice how your body feels right now.",
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

const CONTROL_FACTS = [
    "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.",
    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
    "Octopuses have three hearts.",
    "A day on Venus is longer than a year on Venus.",
    "Bananas are curved because they grow towards the sun.",
    "The first computer bug was a real moth found in a Harvard Mark II in 1947.",
    "Water covers about 71% of the Earth's surface.",
    "The shortest war in history lasted 38 minutes.",
    "Oxford University is older than the Aztec Empire.",
    "There are more stars in the universe than grains of sand on all the Earth's beaches.",
];

export default function UserDashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [dailyContent, setDailyContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryData = await api.getDashboardSummary();
                setSummary(summaryData);

                // Use group from API instead of querying Supabase directly
                const group = summaryData?.group;
                if (group === 'cg') {
                    setDailyContent(CONTROL_FACTS[Math.floor(Math.random() * CONTROL_FACTS.length)]);
                } else {
                    setDailyContent(MINDFULNESS_TIPS[Math.floor(Math.random() * MINDFULNESS_TIPS.length)]);
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', user.id)
                        .single();
                    setUserProfile(profile);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
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

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                {/* Skeleton header */}
                <div className="w-full border-b border-neutral-100 px-4 h-14 flex items-center justify-between" style={{ paddingTop: 'var(--sat, 0px)' }}>
                    <div className="h-6 w-24 bg-neutral-100 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-neutral-100 rounded-full animate-pulse"></div>
                </div>
                {/* Skeleton body */}
                <div className="px-4 py-6 space-y-4">
                    <div className="h-6 w-40 bg-neutral-100 rounded animate-pulse"></div>
                    <div className="h-8 w-56 bg-neutral-100 rounded animate-pulse"></div>
                    <div className="h-20 w-full bg-neutral-50 rounded-xl animate-pulse"></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="h-24 bg-neutral-50 rounded-xl animate-pulse"></div>
                        <div className="h-24 bg-neutral-50 rounded-xl animate-pulse"></div>
                        <div className="h-24 bg-neutral-50 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="h-64 bg-neutral-50 rounded-xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col" style={{ paddingBottom: 'var(--sab, 0px)' }}>
            {/* Mobile-first header */}
            <div className="w-full bg-white border-b border-neutral-100 sticky top-0 z-50" style={{ paddingTop: 'var(--sat, 0px)' }}>
                <div className="px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={AuthLogo} alt="MindFlow" className="h-7 w-7" />
                        <span className="font-bold text-lg text-neutral-900 tracking-tight">MindFlow</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600">
                            <Flame className="h-3.5 w-3.5" />
                            <span>{summary?.streak || 0}</span>
                        </div>
                        <Avatar className="h-8 w-8 border-2 border-neutral-200">
                            <AvatarFallback className="bg-neutral-100 text-neutral-700 font-bold text-xs">
                                {userProfile?.username?.substring(0, 2).toUpperCase() || "ME"}
                            </AvatarFallback>
                        </Avatar>
                        <button onClick={handleLogout} className="p-1.5 text-neutral-400 active:text-neutral-700 transition-colors" title="Sign Out">
                            <LogOut className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content — single column mobile layout */}
            <main className="flex-1 px-4 py-5 space-y-6 max-w-lg mx-auto w-full">
                {/* Greeting */}
                <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-400">{greeting},</p>
                    <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{userProfile?.username || "Mindful Traveler"}</h1>
                </div>

                {/* Daily insight card */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                    <p className="text-sm text-neutral-600 italic leading-relaxed">
                        "{dailyContent || "Loading..."}"
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-3 text-center active:bg-neutral-50 transition-colors">
                        <div className="mx-auto h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
                            <Activity className="h-4 w-4 text-neutral-600" />
                        </div>
                        <div className="text-xl font-bold text-neutral-900">{summary?.consistency || 0}%</div>
                        <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Consistency</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-neutral-200 p-3 text-center active:bg-neutral-50 transition-colors">
                        <div className="mx-auto h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
                            <Flame className="h-4 w-4 text-neutral-600" />
                        </div>
                        <div className="text-xl font-bold text-neutral-900">{summary?.streak || 0}</div>
                        <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Streak</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-neutral-200 p-3 text-center active:bg-neutral-50 transition-colors">
                        <div className="mx-auto h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
                            <Trophy className="h-4 w-4 text-neutral-600" />
                        </div>
                        <div className="text-xl font-bold text-neutral-900">{summary?.totalCompleted || 0}</div>
                        <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Sessions</div>
                    </div>
                </div>

                {/* Roadmap — primary CTA */}
                <Card className="border border-neutral-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base flex items-center gap-2">🚀 Your Roadmap</CardTitle>
                        <CardDescription className="text-xs">Complete daily tasks to unlock insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <RoadmapMap status={summary?.status} />
                    </CardContent>
                </Card>

                {/* Quick actions */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Quick Actions</h3>
                    {[
                        { title: 'View Progress', subtitle: 'Charts & history', icon: TrendingUp, route: '/dashboard/progress' },
                        { title: 'Calendar', subtitle: 'Upcoming events', icon: Activity, route: '/dashboard/calendar' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(item.route)}
                            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-200 active:bg-neutral-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                                    <item.icon className="h-5 w-5 text-neutral-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-neutral-900">{item.title}</div>
                                    <div className="text-xs text-neutral-400">{item.subtitle}</div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                        </button>
                    ))}
                </div>

                {/* Recommended Practices */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Recommended</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        {[
                            { title: 'Morning Meditation', time: '5 min', icon: '🧘' },
                            { title: 'Deep Breathing', time: '3 min', icon: '🌬️' },
                            { title: 'Sound Bath', time: '10 min', icon: '🎵' },
                        ].map((tip, i) => (
                            <div
                                key={i}
                                onClick={() => handleUpcomingFeature(tip.title)}
                                className="min-w-[140px] p-3 rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col justify-between h-28 active:bg-neutral-100 transition-colors flex-shrink-0"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xl">{tip.icon}</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white border border-neutral-200 rounded-full text-neutral-400">{tip.time}</span>
                                </div>
                                <p className="font-semibold text-xs text-neutral-800">{tip.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
