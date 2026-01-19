import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Question {
    id: number;
    question_id: string; // e.g., 'PSS_01'
    question_text: string;
    question_type: 'likert' | 'radio' | 'text';
    options?: any;
    section_key: string; // Changed from section_id to match DB/API
    scale_min?: number;
    scale_max?: number;
    scale_labels?: string[];
}

interface Section {
    id: number;
    section_key: string;
    title: string;
    description?: string;
    instructions: string;
    scale_labels?: string[];
}

export default function MainQuestionnaire() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [questionnaire, setQuestionnaire] = useState<any>(null);

    // Progress State
    const [started, setStarted] = useState(false);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({}); // Keyed by Question ID
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const statusData = await api.getQuestionnaireStatus();
            setStatus(statusData);

            if (statusData.status !== 'completed') {
                const qData = await api.getActiveQuestionnaire();
                setQuestionnaire(qData);
            }
        } catch (error) {
            console.error("Failed to load questionnaire", error);
            toast.error("Failed to load questionnaire. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        setStarted(true);
        setStartTime(Date.now());
        window.scrollTo(0, 0);
    };

    const handleAnswer = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        // Validate current section
        const currentSection = questionnaire.sections[currentSectionIndex];
        const sectionQuestions = questionnaire.questions.filter((q: Question) => q.section_key === currentSection.section_key);

        const missing = sectionQuestions.some((q: Question) => answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '');
        if (missing) {
            toast.error("Please answer all questions in this section.");
            return;
        }

        if (currentSectionIndex < (questionnaire?.sections?.length || 0) - 1) {
            setCurrentSectionIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        } else {
            setStarted(false); // Go back to intro
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const timeToComplete = Math.floor((Date.now() - startTime) / 1000);
            const payload = {
                questionSetId: questionnaire.id,
                timeToComplete,
                answers: Object.entries(answers).map(([qId, val]) => ({
                    questionId: questionnaire.questions.find((q: Question) => q.id === parseInt(qId))?.question_id, // Send the string ID (e.g., PSS_01) if backend expects it, or just mapped properly
                    value: val
                }))
            };

            // NOTE: The previous backend service expected 'questionId' in the payload to match what matches the DB insert. 
            // In questionnaireService.ts: `question_id: ans.questionId`. 
            // The DB `main_questionnaire_responses` expects `question_id` (TEXT).
            // So we must ensure we send the TEXT ID (e.g. 'PSS_01'), not the numeric PK.

            await api.submitQuestionnaire(payload);
            setSubmitting(false);
            setStatus({ status: 'completed' });
            toast.success("Questionnaire submitted successfully!");
        } catch (error: any) {
            console.error("Submission failed", error);
            toast.error(error.message || "Failed to submit. Please try again.");
            setSubmitting(false);
        }
    };

    // --- Renders ---

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    if (status?.status === 'completed') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-8 space-y-6 animate-in zoom-in-95 duration-500 shadow-xl border-teal-100">
                    <div className="flex justify-center mb-4">
                        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">All Done!</h2>
                        <p className="text-slate-600 mt-2">Thank you for completing your Core Insights for this period.</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 hover:bg-slate-800" size="lg">
                        Return to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (!questionnaire) return <div className="p-8 text-center">No active questionnaire found.</div>;

    if (!started) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
                <div className="w-full max-w-lg space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="flex items-center space-x-4 pt-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
                            <ArrowLeft className="h-6 w-6 text-slate-600" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Core Insights</h1>
                    </div>

                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="bg-teal-600 p-8 text-white">
                            <h2 className="text-2xl font-bold mb-2">{questionnaire.title}</h2>
                            <p className="opacity-90 leading-relaxed">{questionnaire.description}</p>
                        </div>
                        <div className="p-6 space-y-6 bg-white">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-900 flex items-center">
                                    <HelpCircle className="h-4 w-4 mr-2 text-teal-600" />
                                    What to expect
                                </h3>

                                {questionnaire.sections.map((section: Section, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0 text-sm">
                                            {section.section_key}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{section.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {/* Rough estimate based on sections, can be hardcoded or dynamic */}
                                                Approx. 3-5 mins
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700 h-14 text-lg shadow-teal-200 shadow-lg" onClick={handleStart}>
                                Start Questionnaire
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // --- Active Questionnaire View ---
    const currentSection = questionnaire.sections[currentSectionIndex];
    // FIX: Filter by section_key, not section_id
    const sectionQuestions = questionnaire.questions.filter((q: Question) => q.section_key === currentSection.section_key);

    // Scale labels fallback
    const scaleLabels = currentSection.scale_labels || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

    return (
        <div className="min-h-screen bg-slate-50 pb-28">
            {/* Sticky Progress Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase">
                            Part {currentSection.section_key}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                            {currentSectionIndex + 1} of {questionnaire.sections.length}
                        </span>
                    </div>
                    <Progress value={((currentSectionIndex + (Object.keys(answers).length > 0 ? 0.1 : 0)) / questionnaire.sections.length) * 100} className="h-1.5 bg-slate-100" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-8 mt-4 animate-in fade-in duration-500">

                {/* Section Intro */}
                <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base border-l-4 border-teal-500 pl-4 bg-teal-50/50 py-2 rounded-r-lg">
                        {currentSection.instructions}
                    </p>
                </div>

                <div className="space-y-6">
                    {sectionQuestions.map((q: Question, idx: number) => (
                        <Card key={q.id} className="border-0 shadow-sm ring-1 ring-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-4">
                                <CardTitle className="text-base font-medium leading-relaxed text-slate-800">
                                    <span className="text-slate-400 mr-2 font-light">{(currentSectionIndex * 10) + idx + 1}.</span>
                                    {q.question_text}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {q.question_type === 'likert' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{scaleLabels[0]}</span>
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{scaleLabels[scaleLabels.length - 1]}</span>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            {scaleLabels.map((label: string, i: number) => {
                                                const val = i + (currentSection.scale_min || 1);
                                                const isSelected = answers[q.id] === val;
                                                return (
                                                    <div
                                                        key={val}
                                                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                                                        onClick={() => handleAnswer(q.id, val)}
                                                    >
                                                        <div className={cn(
                                                            "h-12 w-full max-w-[60px] rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all duration-200 shadow-sm",
                                                            isSelected
                                                                ? "border-teal-600 bg-teal-600 text-white shadow-teal-200 transform scale-105"
                                                                : "border-slate-200 bg-white text-slate-600 group-hover:border-teal-300 group-hover:bg-slate-50"
                                                        )}>
                                                            {val}
                                                        </div>
                                                        {/* Optional: Show label tooltip on hover or just rely on end labels */}
                                                        <span className="text-[10px] text-center leading-tight text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                                                            {label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="md:hidden text-center h-4">
                                            {answers[q.id] && (
                                                <span className="text-xs font-medium text-teal-600 animate-in fade-in">
                                                    {scaleLabels[(answers[q.id] - (currentSection.scale_min || 1))]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {q.question_type === 'text' && (
                                    <Textarea
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="min-h-[100px] text-base"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-10">
                <div className="max-w-2xl mx-auto flex justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={submitting}
                        className="h-12 w-28"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={submitting}
                        className="h-12 flex-1 bg-teal-600 hover:bg-teal-700 text-lg shadow-lg shadow-teal-100"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {currentSectionIndex === questionnaire.sections.length - 1 ? 'Submit Answers' : 'Next Section'}
                        {!submitting && currentSectionIndex < questionnaire.sections.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
