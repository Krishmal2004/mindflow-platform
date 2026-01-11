import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Emoji Definitions
const EMOJIS = {
    mood: ['😫', '😕', '😐', '🙂', '😄'], // 1 (Bad) -> 5 (Good)
    stress: ['😌', '🙂', '😐', '😓', '🤯'], // 1 (Low/Good) -> 5 (High/Bad)
    sleep: ['🧟', '😴', '😐', '🙂', '💪'], // 1 (Bad) -> 5 (Good)
    energy: ['🪫', '🔋', '⚡', '🚀', '🔥'], // 1 (Low) -> 5 (High)
};

const MOOD_FACTORS = [
    'Work', 'Family', 'Health', 'Sleep', 'Social', 'Weather', 'Exercise', 'Diet',
    'Hobby', 'Money', 'Home', 'Travel'
];

export default function DailySliders() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // State (1-5 scale)
    const [mood, setMood] = useState<number>(3);
    const [stress, setStress] = useState<number>(3);
    const [sleep, setSleep] = useState<number>(3);
    const [energy, setEnergy] = useState<number>(3);
    const [notes, setNotes] = useState('');
    const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);

    // Helper to determine color based on value and type
    const getColor = (value: number, type: 'positive' | 'negative') => {
        if (type === 'positive') {
            // High is Good (Mood, Sleep, Energy)
            if (value >= 4) return 'bg-green-100 text-green-700 border-green-200';
            if (value === 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            return 'bg-red-100 text-red-700 border-red-200';
        } else {
            // Low is Good (Stress)
            if (value <= 2) return 'bg-green-100 text-green-700 border-green-200';
            if (value === 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    const getActiveColor = (value: number, type: 'positive' | 'negative') => {
        if (type === 'positive') {
            if (value >= 4) return 'bg-green-500 border-green-600';
            if (value === 3) return 'bg-yellow-500 border-yellow-600';
            return 'bg-red-500 border-red-600';
        } else {
            if (value <= 2) return 'bg-green-500 border-green-600';
            if (value === 3) return 'bg-yellow-500 border-yellow-600';
            return 'bg-red-500 border-red-600';
        }
    };

    const handleFactorToggle = (factor: string) => {
        if (selectedFactors.includes(factor)) {
            setSelectedFactors(selectedFactors.filter(f => f !== factor));
        } else {
            setSelectedFactors([...selectedFactors, factor]);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.submitDailyEntry({
                mood,
                stress,
                sleep_quality: sleep,
                energy_level: energy,
                mood_factors: selectedFactors,
                notes
            });
            setIsCompleted(true);
        } catch (error) {
            console.error('Failed to submit daily entry', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pt-20">
                <Card className="w-full max-w-md text-center p-8 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-center">
                        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">All Done!</h2>
                        <p className="text-slate-600 mt-2">Your daily check-in has been saved.</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard')} className="w-full bg-teal-600 hover:bg-teal-700">
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Reusable Section Component
    const SliderSection = ({
        title,
        value,
        setValue,
        emojis,
        type
    }: {
        title: string,
        value: number,
        setValue: (v: number) => void,
        emojis: string[],
        type: 'positive' | 'negative'
    }) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold text-slate-900">{title}</Label>
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    getColor(value, type)
                )}>
                    {value}
                </div>
            </div>

            <div className="flex justify-center py-4">
                <div className="text-6xl filter drop-shadow-sm transition-transform hover:scale-110 cursor-default select-none">
                    {emojis[value - 1]}
                </div>
            </div>

            <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((idx) => (
                    <button
                        key={idx}
                        onClick={() => setValue(idx)}
                        className={cn(
                            "h-12 w-12 rounded-full border-2 text-xl flex items-center justify-center transition-all bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50",
                            value === idx && `text-white scale-110 shadow-md ${getActiveColor(value, type)}`
                        )}
                    >
                        {emojis[idx - 1]}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                <span>{type === 'positive' ? 'Low/Bad' : 'Low/Good'}</span>
                <span>{type === 'positive' ? 'High/Good' : 'High/Bad'}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-20">
            <div className="w-full max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Daily Check-in</h1>
                            <p className="text-sm text-slate-500">How are you feeling today?</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderSection
                        title="Mood"
                        value={mood}
                        setValue={setMood}
                        emojis={EMOJIS.mood}
                        type="positive"
                    />

                    <SliderSection
                        title="Stress Level"
                        value={stress}
                        setValue={setStress}
                        emojis={EMOJIS.stress}
                        type="negative"
                    />

                    <SliderSection
                        title="Sleep Quality"
                        value={sleep}
                        setValue={setSleep}
                        emojis={EMOJIS.sleep}
                        type="positive"
                    />

                    <SliderSection
                        title="Energy Level"
                        value={energy}
                        setValue={setEnergy}
                        emojis={EMOJIS.energy}
                        type="positive"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Factors */}
                    <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border space-y-4">
                        <Label className="text-lg font-semibold text-slate-900">Influencing Factors</Label>
                        <div className="flex flex-wrap gap-2">
                            {MOOD_FACTORS.map(factor => (
                                <button
                                    key={factor}
                                    onClick={() => handleFactorToggle(factor)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                        selectedFactors.includes(factor)
                                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    )}
                                >
                                    {factor}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                        <Label className="text-lg font-semibold text-slate-900">Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Anything else?"
                            className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <Button
                        className="w-full md:w-auto md:px-12 h-12 text-lg bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-900/10"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving Journal...
                            </>
                        ) : 'Complete Check-in'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
