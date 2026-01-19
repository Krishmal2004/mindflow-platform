import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Moon, Brain, Smile, Activity, Coffee, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// --- Constants (Matched with Mobile) ---

const STRESS_FACTORS = [
    'Health', 'Sleep', 'Exercise', 'Food', 'Hobby', 'Money', 'Identity',
    'Friends', 'Pet', 'Family', 'Dating', 'Work', 'Home', 'School',
    'Outdoors', 'Travel', 'Weather'
];

// Generate Sleep Options
const SLEEP_START_OPTIONS: string[] = [];
for (let hour = 18; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        SLEEP_START_OPTIONS.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
    }
}
for (let hour = 0; hour <= 6; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 6 && minute > 0) break;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        SLEEP_START_OPTIONS.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
    }
}

const WAKE_UP_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        WAKE_UP_OPTIONS.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
    }
}

// Emoji Mapping 1-5
const EMOJIS = {
    mood: ['😫', '😕', '😐', '🙂', '😄'], // 1 (Bad) -> 5 (Good)
    stress: ['😌', '🙂', '😐', '😓', '🤯'], // 1 (Low/Good) -> 5 (High/Bad)
    sleep: ['🧟', '😴', '😐', '🙂', '💪'], // 1 (Bad) -> 5 (Good)
    relaxation: ['😖', '😬', '😐', '😌', '🧘'], // 1 (Low) -> 5 (High)
};

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: any;
    }
}

export default function DailySliders() {
    const navigate = useNavigate();
    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [userExtension, setUserExtension] = useState<'ex' | 'cg' | ''>('');

    // --- State ---
    const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
    const [practiceDuration, setPracticeDuration] = useState('');
    const [practiceLog, setPracticeLog] = useState('');

    const [stressLevel, setStressLevel] = useState<number | null>(null);
    const [moodLevel, setMoodLevel] = useState<number | null>(null);
    const [sleepQuality, setSleepQuality] = useState<number | null>(null);
    const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);

    const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
    const [otherFactor, setOtherFactor] = useState('');

    const [sleepStart, setSleepStart] = useState<string | null>(null);
    const [wakeUp, setWakeUp] = useState<string | null>(null);

    // Video State
    const [weeklyVideo, setWeeklyVideo] = useState<any>(null);
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    // --- Effects ---

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/'); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('researchID')
                    .eq('id', user.id)
                    .single();

                let ext = '';
                if (profile?.researchID) {
                    if (profile.researchID.endsWith('.ex')) ext = 'ex';
                    else if (profile.researchID.endsWith('.cg')) ext = 'cg';
                    setUserExtension(ext as any);
                }

                if (ext === 'ex') {
                    const vid = await api.getWeeklyVideo();
                    setWeeklyVideo(vid);
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { data: existing } = await supabase
                    .from('daily_sliders')
                    .select('stress_level')
                    .eq('user_id', user.id)
                    .gte('created_at', today.toISOString())
                    .not('stress_level', 'is', null)
                    .limit(1);

                if (existing && existing.length > 0) {
                    setAlreadySubmitted(true);
                }

            } catch (err) {
                console.error("Init Error:", err);
            } finally {
                setPageLoading(false);
            }
        };
        init();
    }, [navigate]);

    // Initialize YouTube Player for Tracking when Modal Open
    useEffect(() => {
        if (!weeklyVideo || !isVideoOpen) return;

        // Load API if not present
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
            // Attach to existing iframe
            if (window.YT && window.YT.Player) {
                new window.YT.Player('youtube-player-iframe', {
                    events: {
                        'onStateChange': (event: any) => {
                            const p = event.target;
                            if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                                const currentTime = p.getCurrentTime();
                                if (currentTime > 0) {
                                    api.updateVideoProgress(Math.floor(currentTime)).catch(console.error);
                                }
                            }
                        }
                    }
                });
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            const existing = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (existing) existing();
                initPlayer();
            };
        }

        return () => {
            // Cleanup if needed
        };
    }, [weeklyVideo, isVideoOpen]);

    // --- Helpers ---

    const toggleFactor = (factor: string) => {
        if (selectedFactors.includes(factor)) {
            setSelectedFactors(prev => prev.filter(f => f !== factor));
        } else {
            setSelectedFactors(prev => [...prev, factor]);
        }
    };

    const getProgress = () => {
        let completed = 0;
        let total = 7;

        if (mindfulnessPractice !== null) {
            if (mindfulnessPractice === 'no') completed++;
            else if (practiceDuration && practiceLog) completed++;
        }
        if (stressLevel) completed++;
        if (moodLevel) completed++;
        if (sleepQuality) completed++;
        if (relaxationLevel) completed++;
        if (selectedFactors.length > 0) completed++;
        if (sleepStart && wakeUp) completed++;

        return Math.min(100, Math.round((completed / total) * 100));
    };

    const handleSubmit = async () => {
        let factorsToSubmit = [...selectedFactors];
        if (selectedFactors.includes('Other') && otherFactor.trim()) {
            factorsToSubmit = factorsToSubmit.filter(f => f !== 'Other');
            factorsToSubmit.push(`Other: ${otherFactor.trim()}`);
        }

        if (!stressLevel || !moodLevel || !sleepQuality || !relaxationLevel || !sleepStart || !wakeUp || factorsToSubmit.length === 0) {
            toast.error("Please complete all fields.");
            return;
        }

        if (userExtension === 'ex') {
            if (mindfulnessPractice === null) {
                toast.error("Please answer the mindfulness question.");
                return;
            }
            if (mindfulnessPractice === 'yes' && (!practiceDuration || !practiceLog)) {
                toast.error("Please fill in practice details.");
                return;
            }
        }

        setSubmitting(true);
        try {
            await api.submitDailyEntry({
                mindfulness_practice: mindfulnessPractice,
                practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
                practice_log: mindfulnessPractice === 'yes' ? practiceLog : null,
                stress_level: stressLevel,
                mood: moodLevel,
                sleep_quality: sleepQuality,
                relaxation_level: relaxationLevel,
                sleep_start_time: sleepStart,
                wake_up_time: wakeUp,
                feelings: factorsToSubmit.join(','),
            });
            setAlreadySubmitted(true);
            toast.success("Saved successfully!");
        } catch (error: any) {
            console.error("Submit Error:", error);
            toast.error(error.message || "Failed to submit.");
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    if (alreadySubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pt-20">
                <Card className="w-full max-w-md text-center p-8 space-y-6 animate-in fade-in duration-500">
                    <div className="flex justify-center">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Great Job Today!</h2>
                    <p className="text-slate-600">You've completed your daily entry.</p>
                    <Button onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-20">
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-4">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Daily Check-in</h1>
                            <p className="text-xs text-slate-500 font-medium">{getProgress()}% Completed</p>
                        </div>
                    </div>
                </div>

                {/* 1. Mindfulness (Conditional) */}
                {userExtension === 'ex' && (
                    <Card className="p-6 space-y-4 border-l-4 border-l-teal-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-100 rounded-full"><Brain className="h-5 w-5 text-teal-600" /></div>
                            <div>
                                <h3 className="font-semibold text-lg">Mindfulness Practice</h3>
                                <p className="text-sm text-slate-500">Have you done your practice today?</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant={mindfulnessPractice === 'yes' ? 'default' : 'outline'}
                                className={cn("flex-1 h-12", mindfulnessPractice === 'yes' ? "bg-teal-600 hover:bg-teal-700" : "")}
                                onClick={() => setMindfulnessPractice('yes')}
                            >
                                Yes
                            </Button>
                            <Button
                                variant={mindfulnessPractice === 'no' ? 'default' : 'outline'}
                                className={cn("flex-1 h-12", mindfulnessPractice === 'no' ? "bg-red-500 hover:bg-red-600 text-white" : "")}
                                onClick={() => setMindfulnessPractice('no')}
                            >
                                No
                            </Button>
                        </div>
                        {mindfulnessPractice === 'yes' && (
                            <div className="space-y-4 pt-4 animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g., 15"
                                        value={practiceDuration}
                                        onChange={(e) => setPracticeDuration(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>What did you practice?</Label>
                                    <Textarea
                                        placeholder="• Breathing exercise&#10;• Body scan"
                                        rows={3}
                                        value={practiceLog}
                                        onChange={(e) => setPracticeLog(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* 2. Mood & Stress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full"><Smile className="h-5 w-5 text-yellow-600" /></div>
                            <h3 className="font-semibold text-lg">Mood</h3>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-full">
                            {EMOJIS.mood.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMoodLevel(i + 1)}
                                    className={cn(
                                        "h-10 w-10 text-2xl flex items-center justify-center rounded-full transition-all",
                                        moodLevel === i + 1 ? "bg-white shadow-md scale-110" : "opacity-50 hover:opacity-100"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-2">
                            <span>Bad</span><span>Good</span>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full"><Activity className="h-5 w-5 text-red-600" /></div>
                            <h3 className="font-semibold text-lg">Stress</h3>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-full">
                            {EMOJIS.stress.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStressLevel(i + 1)}
                                    className={cn(
                                        "h-10 w-10 text-2xl flex items-center justify-center rounded-full transition-all",
                                        stressLevel === i + 1 ? "bg-white shadow-md scale-110" : "opacity-50 hover:opacity-100"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-2">
                            <span>Low</span><span>High</span>
                        </div>
                    </Card>
                </div>

                {/* 3. Factors (Moved Here) */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-full"><Brain className="h-5 w-5 text-slate-600" /></div>
                        <div>
                            <h3 className="font-semibold text-lg">Factors Influencing Mood</h3>
                            <p className="text-sm text-slate-500">Select all that apply</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STRESS_FACTORS.map(factor => (
                            <button
                                key={factor}
                                onClick={() => toggleFactor(factor)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                    selectedFactors.includes(factor)
                                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {factor}
                            </button>
                        ))}
                        <button
                            onClick={() => toggleFactor('Other')}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                selectedFactors.includes('Other')
                                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            Other
                        </button>
                    </div>
                    {selectedFactors.includes('Other') && (
                        <Input
                            placeholder="Please specify..."
                            value={otherFactor}
                            onChange={(e) => setOtherFactor(e.target.value)}
                            className="mt-2 animate-in fade-in"
                        />
                    )}
                </Card>

                {/* 4. Sleep Section */}
                <div className="space-y-6">
                    {/* Sleep Schedule (Moved Before Quality) */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-full"><Moon className="h-5 w-5 text-purple-600" /></div>
                            <h3 className="font-semibold text-lg">Sleep Schedule</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sleep Start</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={sleepStart || ''}
                                    onChange={(e) => setSleepStart(e.target.value)}
                                >
                                    <option value="" disabled>Select time</option>
                                    {SLEEP_START_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Wake Up</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={wakeUp || ''}
                                    onChange={(e) => setWakeUp(e.target.value)}
                                >
                                    <option value="" disabled>Select time</option>
                                    {WAKE_UP_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Sleep Quality */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-full"><Moon className="h-5 w-5 text-indigo-600" /></div>
                            <h3 className="font-semibold text-lg">Sleep Quality</h3>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-full">
                            {EMOJIS.sleep.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSleepQuality(i + 1)}
                                    className={cn(
                                        "h-10 w-10 text-2xl flex items-center justify-center rounded-full transition-all",
                                        sleepQuality === i + 1 ? "bg-white shadow-md scale-110" : "opacity-50 hover:opacity-100"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-2">
                            <span>Bad</span><span>Good</span>
                        </div>
                    </Card>
                </div>

                {/* 5. Weekly Video (For 'ex') - AFTER Sleep */}
                {userExtension === 'ex' && weeklyVideo && (
                    <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                        <Card className="overflow-hidden">
                            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                <div className="relative w-full md:w-1/3 aspect-video bg-slate-900 rounded-lg overflow-hidden group cursor-pointer" onClick={() => setIsVideoOpen(true)}>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-all">
                                        <Play className="h-12 w-12 text-white opacity-90 group-hover:scale-110 transition-transform" fill="currentColor" />
                                    </div>
                                    <img
                                        src={`https://img.youtube.com/vi/${weeklyVideo.youtube_id}/mqdefault.jpg`}
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <h3 className="font-semibold text-lg">This Week's Recording</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{weeklyVideo.title}</p>
                                    <DialogTrigger asChild>
                                        <Button className="w-full md:w-auto bg-teal-600 hover:bg-teal-700">
                                            <Play className="h-4 w-4 mr-2" fill="currentColor" /> Watch Video
                                        </Button>
                                    </DialogTrigger>
                                </div>
                            </div>
                        </Card>
                        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none aspect-video">
                            <iframe
                                id="youtube-player-iframe"
                                title={weeklyVideo.title}
                                src={`https://www.youtube.com/embed/${weeklyVideo.youtube_id}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1&autoplay=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* 6. Relaxation Level - AFTER Video */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full"><Coffee className="h-5 w-5 text-blue-600" /></div>
                        <h3 className="font-semibold text-lg">Relaxation Level</h3>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-full">
                        {EMOJIS.relaxation.map((emoji, i) => (
                            <button
                                key={i}
                                onClick={() => setRelaxationLevel(i + 1)}
                                className={cn(
                                    "h-10 w-10 text-2xl flex items-center justify-center rounded-full transition-all",
                                    relaxationLevel === i + 1 ? "bg-white shadow-md scale-110" : "opacity-50 hover:opacity-100"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-medium px-2">
                        <span>Low</span><span>High</span>
                    </div>
                </Card>

                {/* Submit */}
                <div className="pt-4 pb-8">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-14 text-lg bg-teal-600 hover:bg-teal-700 shadow-lg"
                    >
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : 'Complete Check-in'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
