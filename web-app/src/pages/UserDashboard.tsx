import { useEffect, useState, useRef } from "react"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { LogOut, ChevronRight, TrendingUp, Calendar as CalendarIcon } from "lucide-react"
import { JourneyIcons } from "@/components/Icons"
import { Colors } from "@/lib/colors"
import appLogo from "@/assets/app-icon.png"

const MINDFULNESS_QUOTES = [
    { text: "Breathe in peace, breathe out stress.", author: "Unknown" },
    { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
    { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn" },
    { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
    { text: "Be where you are, not where you think you should be.", author: "Unknown" },
    { text: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle" },
]


const JOURNEY_STEPS = [
    { id: 'daily', title: 'Daily Sliders', subtitle: 'Track your mood', Icon: JourneyIcons.Sun, color: '#F59E0B', bgColor: '#FEF3C7', route: '/dashboard/daily' },
    { id: 'weekly', title: 'Weekly Whispers', subtitle: 'Reflect weekly', Icon: JourneyIcons.Microphone, color: '#8B5CF6', bgColor: '#EDE9FE', route: '/dashboard/weekly' },
    { id: 'thrive', title: 'Thrive Tracker', subtitle: 'Monitor growth', Icon: JourneyIcons.Chart, color: '#10B981', bgColor: '#D1FAE5', route: '/dashboard/questionnaire' },
    { id: 'stress', title: 'Stress Snapshot', subtitle: 'Capture stress', Icon: JourneyIcons.StressCamera, color: '#EF4444', bgColor: '#FEE2E2', route: '' },
    { id: 'mirror', title: 'Mindful Mirror', subtitle: 'Self-reflection', Icon: JourneyIcons.Mirror, color: '#6366F1', bgColor: '#E0E7FF', route: '' },
]

export default function UserDashboard() {
    const navigate = useNavigate()
    const [summary, setSummary] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [quoteIndex, setQuoteIndex] = useState(0)
    const [quoteFade, setQuoteFade] = useState(true)
    const quoteInterval = useRef<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryData = await api.getDashboardSummary()
                setSummary(summaryData)


                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', user.id)
                        .single()
                    setUserProfile(profile)
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Quote rotation
    useEffect(() => {
        quoteInterval.current = setInterval(() => {
            setQuoteFade(false)
            setTimeout(() => {
                setQuoteIndex((prev) => (prev + 1) % MINDFULNESS_QUOTES.length)
                setQuoteFade(true)
            }, 400)
        }, 20000)
        return () => clearInterval(quoteInterval.current)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const handleStepClick = (step: typeof JOURNEY_STEPS[0]) => {
        if (step.route) {
            navigate(step.route)
        } else {
            toast.info(`${step.title} is coming soon!`, {
                description: "We are currently developing this feature."
            })
        }
    }

    const getStepStatus = (stepId: string) => {
        if (!summary?.status) return 'active'
        if (stepId === 'daily' && summary.status.dailyDone) return 'completed'
        if (stepId === 'weekly' && summary.status.weeklyDone) return 'completed'
        if (stepId === 'thrive' && summary.status.monthlyDone) return 'completed'
        if (stepId === 'stress' || stepId === 'mirror') return 'locked'
        return 'active'
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
    const currentQuote = MINDFULNESS_QUOTES[quoteIndex]

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #FFFFFF 100%)' }}>
                <div className="w-full px-5 h-14 flex items-center justify-between" style={{ paddingTop: 'var(--sat, 0px)' }}>
                    <div className="h-6 w-24 bg-white/60 rounded-lg animate-pulse"></div>
                    <div className="h-8 w-8 bg-white/60 rounded-full animate-pulse"></div>
                </div>
                <div className="px-5 py-6 space-y-5">
                    <div className="h-6 w-40 bg-white/60 rounded-lg animate-pulse"></div>
                    <div className="h-8 w-56 bg-white/60 rounded-lg animate-pulse"></div>
                    <div className="h-36 w-full bg-white/40 rounded-2xl animate-pulse"></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="h-24 bg-white/40 rounded-2xl animate-pulse"></div>
                        <div className="h-24 bg-white/40 rounded-2xl animate-pulse"></div>
                        <div className="h-24 bg-white/40 rounded-2xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col" style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #FFFFFF 100%)',
            paddingBottom: 'var(--sab, 0px)',
        }}>
            {/* Header */}
            <div className="w-full sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/50" style={{ paddingTop: 'var(--sat, 0px)' }}>
                <div className="px-5 h-14 flex items-center justify-between max-w-lg mx-auto w-full">
                    <div className="flex items-center gap-2.5">
                        <img src={appLogo} alt="MindFlow" className="h-8 w-8 rounded-xl" />
                        <span className="font-bold text-lg tracking-tight" style={{ color: Colors.textPrimary }}>MindFlow</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: Colors.primary, color: '#fff' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 2 4 6 4 10C4 14 12 22 12 22S20 14 20 10C20 6 16 2 12 2Z"/></svg>
                            {summary?.streak || 0}
                        </div>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2"
                            style={{ background: '#F6F8F9', borderColor: Colors.border, color: Colors.textPrimary }}>
                            {userProfile?.username?.substring(0, 2).toUpperCase() || "ME"}
                        </div>
                        <button onClick={handleLogout} className="p-2 rounded-full transition-all active:scale-90 hover:bg-black/5" title="Sign Out">
                            <LogOut className="h-4.5 w-4.5" style={{ color: Colors.textSecondary }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 px-5 py-5 space-y-6 max-w-lg mx-auto w-full overflow-y-auto">
                {/* Greeting */}
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: Colors.textSecondary, letterSpacing: '1px' }}>
                        {greeting},
                    </p>
                    <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: Colors.textPrimary }}>
                        {userProfile?.username || "Mindful Traveler"}
                    </h1>
                </div>

                {/* Mindfulness Quote Card */}
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)' }}>
                    <div className="p-6 relative" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        <div className="absolute top-4 right-4 opacity-30">
                            <JourneyIcons.QuoteIcon size={28} color="rgba(255,255,255,0.4)" />
                        </div>
                        <div className={`transition-opacity duration-400 ${quoteFade ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-white/95 text-sm italic leading-relaxed mb-3">
                                "{currentQuote.text}"
                            </p>
                            <p className="text-white/60 text-xs font-medium">— {currentQuote.author}</p>
                        </div>
                        <div className="flex justify-center gap-1.5 mt-4">
                            {MINDFULNESS_QUOTES.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === quoteIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Consistency', value: `${summary?.consistency || 0}%`, icon: <TrendingUp className="h-4 w-4" /> },
                        { label: 'Streak', value: summary?.streak || 0, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 4 6 4 10C4 14 12 22 12 22S20 14 20 10C20 6 16 2 12 2Z"/></svg> },
                        { label: 'Sessions', value: summary?.totalCompleted || 0, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7m11-3.5A2.5 2.5 0 0 0 15.5 6H18m-4-2c0 2-3 5-3 5"/><path d="M12 15l-2-2m4 0l-2 2"/><circle cx="12" cy="19" r="2"/></svg> },
                    ].map((stat, i) => (
                        <div key={i} className="rounded-2xl p-3.5 text-center transition-all active:scale-95"
                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(223, 230, 233, 0.6)', backdropFilter: 'blur(10px)' }}>
                            <div className="mx-auto h-9 w-9 rounded-full flex items-center justify-center mb-2"
                                style={{ background: '#F0FDF4', color: Colors.primary }}>
                                {stat.icon}
                            </div>
                            <div className="text-xl font-bold" style={{ color: Colors.textPrimary }}>{stat.value}</div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: Colors.textSecondary }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Mindfulness Sessions */}
                <div>
                    <div className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                        style={{ background: Colors.primary, color: '#fff', letterSpacing: '1px' }}>
                        Mindfulness Sessions
                    </div>
                    <div className="space-y-4">
                        {/* Meditation */}
                        <button onClick={() => toast.info("Meditation is coming soon!")}
                            className="w-full flex items-center rounded-2xl p-5 transition-all active:scale-[0.98] hover:shadow-md"
                            style={{ background: '#E3F2FD' }}>
                            <div className="flex-1 text-left">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#4B4E6D' }}>Meditation</p>
                                <p className="text-base font-semibold mb-1" style={{ color: Colors.textPrimary }}>Breathing Exercises</p>
                                <p className="text-xs leading-relaxed mb-2" style={{ color: Colors.textSecondary }}>Focus on your breath. Calm your mind.</p>
                                <p className="text-[11px] font-semibold" style={{ color: '#667eea' }}>5 exercises | 5-10 min</p>
                            </div>
                            <div className="ml-4">
                                <JourneyIcons.BreathingCircles size={80} />
                            </div>
                        </button>

                        {/* Yoga */}
                        <button onClick={() => toast.info("Yoga is coming soon!")}
                            className="w-full flex items-center rounded-2xl p-5 transition-all active:scale-[0.98] hover:shadow-md"
                            style={{ background: '#F3E5F5' }}>
                            <div className="ml-0 mr-4">
                                <JourneyIcons.YogaPose size={80} />
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#4B4E6D' }}>Yoga</p>
                                <p className="text-base font-semibold mb-1" style={{ color: Colors.textPrimary }}>Daily Motivation</p>
                                <p className="text-xs leading-relaxed mb-2" style={{ color: Colors.textSecondary }}>Stretch your body. Energize your mind.</p>
                                <p className="text-[11px] font-semibold" style={{ color: '#667eea' }}>Daily yoga routines</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Journey Roadmap */}
                <div>
                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: Colors.textSecondary, letterSpacing: '1px' }}>Your Journey</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>Follow the path to mindfulness</p>
                    </div>

                    <div className="relative rounded-3xl overflow-hidden p-5 pb-6"
                        style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
                        {/* SVG Curved Path */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 520" style={{ opacity: 0.4 }}>
                            <defs>
                                <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#F59E0B" stopOpacity="0.5" />
                                    <stop offset="0.25" stopColor="#8B5CF6" stopOpacity="0.5" />
                                    <stop offset="0.5" stopColor="#10B981" stopOpacity="0.5" />
                                    <stop offset="0.75" stopColor="#EF4444" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="#6366F1" stopOpacity="0.5" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M220 40 C270 80, 30 100, 80 140 C130 180, 270 190, 220 240 C170 290, 30 290, 80 340 C130 390, 260 400, 220 440"
                                stroke="url(#roadGrad)"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray="8 5"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Journey Nodes */}
                        <div className="relative space-y-4">
                            {JOURNEY_STEPS.map((step, index) => {
                                const status = getStepStatus(step.id)
                                const isCompleted = status === 'completed'
                                const isLocked = status === 'locked'
                                const isRight = index % 2 === 0

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => handleStepClick(step)}
                                        disabled={isLocked}
                                        className={`w-full flex items-center gap-3 transition-all active:scale-[0.97] ${isRight ? 'flex-row' : 'flex-row-reverse'} ${isLocked ? 'opacity-50' : ''}`}
                                        style={{ padding: `${index === 0 ? '0' : '8px'} 0` }}
                                    >
                                        {/* Circle */}
                                        <div className={`flex-shrink-0 rounded-full flex items-center justify-center shadow-lg transition-all ${index === JOURNEY_STEPS.length - 1 ? 'h-16 w-16' : 'h-14 w-14'}`}
                                            style={{
                                                background: isCompleted ? '#10B981' : step.bgColor,
                                                border: isCompleted ? 'none' : `3px solid ${step.color}`,
                                                boxShadow: isCompleted ? '0 4px 14px rgba(16, 185, 129, 0.4)' : `0 4px 14px ${step.color}22`,
                                            }}>
                                            {isCompleted ? (
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            ) : (
                                                <step.Icon size={28} color={step.color} />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${isRight ? 'text-left' : 'text-right'}`}
                                            style={{
                                                background: isCompleted ? '#ECFDF5' : '#fff',
                                                border: `1px solid ${isCompleted ? '#10B981' : 'rgba(0,0,0,0.06)'}`,
                                            }}>
                                            <p className="text-sm font-semibold" style={{ color: isCompleted ? '#10B981' : step.color }}>
                                                {step.title}
                                            </p>
                                            <p className="text-[11px] mt-0.5" style={{ color: isCompleted ? '#64C59A' : '#94A3B8' }}>
                                                {isCompleted ? 'Completed' : isLocked ? 'Coming soon' : step.subtitle}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.textPrimary, letterSpacing: '1px' }}>Quick Actions</h3>
                    {[
                        { title: 'View Progress', subtitle: 'Charts & history', icon: <TrendingUp className="h-5 w-5" />, route: '/dashboard/progress' },
                        { title: 'Calendar', subtitle: 'Upcoming events', icon: <CalendarIcon className="h-5 w-5" />, route: '/dashboard/calendar' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(item.route)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] hover:shadow-md text-left"
                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(223,230,233,0.6)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                                    style={{ background: '#F0FDF4', color: Colors.primary }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm" style={{ color: Colors.textPrimary }}>{item.title}</div>
                                    <div className="text-xs" style={{ color: Colors.textSecondary }}>{item.subtitle}</div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4" style={{ color: '#CBD5E1' }} />
                        </button>
                    ))}
                </div>

                {/* Bottom spacing */}
                <div className="h-6"></div>
            </main>
        </div>
    )
}
