import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/lib/api';

interface Question {
    id: number;
    question_text: string;
    question_type: 'likert' | 'radio' | 'text';
    options?: any;
    section_id: number;
}

interface Section {
    id: number;
    title: string;
    description: string;
    section_key: string;
}

export default function MainQuestionnaire() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [questionnaire, setQuestionnaire] = useState<any>(null);

    // Progress State
    const [started, setStarted] = useState(false);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
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
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        setStarted(true);
        setStartTime(Date.now());
    };

    const handleAnswer = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
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
                    questionId: parseInt(qId),
                    value: val
                }))
            };

            await api.submitQuestionnaire(payload);
            // Refresh status
            checkStatus();
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit questionnaire. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Components
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (status?.status === 'completed') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
                <div className="w-full max-w-md mt-10">
                    <Card className="text-center p-8 space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Completed!</h2>
                        <p className="text-slate-600">You have completed the Core Insights questionnaire for this month.</p>
                        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                    </Card>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900">Core Insights</h1>
                    </div>

                    <Card className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-teal-900">{questionnaire?.title || "Monthly Check-in"}</h2>
                            <p className="text-slate-600">{questionnaire?.description || "A deep dive into your mindfulness journey."}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">1</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Part A: Mindfulness</p>
                                    <p className="text-xs text-slate-500">Approx. 5 mins</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">2</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Part B: Well-being</p>
                                    <p className="text-xs text-slate-500">Approx. 3 mins</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">3</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Part C: Reflection</p>
                                    <p className="text-xs text-slate-500">Approx. 2 mins</p>
                                </div>
                            </div>
                        </div>

                        <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleStart}>
                            Begin Questionnaire
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Question Rendering
    const currentSection = questionnaire.sections[currentSectionIndex];
    const sectionQuestions = questionnaire.questions.filter((q: Question) => q.section_id === currentSection.id);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
            <div className="w-full max-w-md space-y-6 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setStarted(false)}>Cancel</Button>
                    <span className="text-sm font-medium text-slate-500">
                        Part {String.fromCharCode(65 + currentSectionIndex)} of {String.fromCharCode(65 + (questionnaire.sections.length - 1))}
                    </span>
                    <div className="w-12"></div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
                    <p className="text-slate-600">{currentSection.description}</p>
                </div>

                <div className="space-y-8">
                    {sectionQuestions.map((q: Question, idx: number) => (
                        <Card key={q.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium leading-relaxed">
                                    {idx + 1}. {q.question_text}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {q.question_type === 'likert' && (
                                    <RadioGroup
                                        className="gap-3"
                                        value={answers[q.id]?.toString()}
                                        onValueChange={(val) => handleAnswer(q.id, parseInt(val))}
                                    >
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <div key={val} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value={val.toString()} id={`q${q.id}-${val}`} />
                                                <Label htmlFor={`q${q.id}-${val}`} className="flex-1 cursor-pointer font-normal">
                                                    {val === 1 && "Strongly Disagree"}
                                                    {val === 2 && "Disagree"}
                                                    {val === 3 && "Neutral"}
                                                    {val === 4 && "Agree"}
                                                    {val === 5 && "Strongly Agree"}
                                                    {!([1, 2, 3, 4, 5].includes(val)) && val}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                                {q.question_type === 'radio' && q.options && (
                                    <RadioGroup
                                        className="gap-3"
                                        value={answers[q.id]?.toString()}
                                        onValueChange={(val) => handleAnswer(q.id, val)}
                                    >
                                        {Object.entries(q.options).map(([key, label]: any) => (
                                            <div key={key} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value={key} id={`q${q.id}-${key}`} />
                                                <Label htmlFor={`q${q.id}-${key}`} className="flex-1 cursor-pointer font-normal">
                                                    {label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                                {q.question_type === 'text' && (
                                    <Textarea
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                        placeholder="Type your answer here..."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer Nav */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center max-w-md mx-auto">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentSectionIndex === 0 || submitting}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={submitting}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {currentSectionIndex === questionnaire.sections.length - 1 ? 'Submit' : 'Next'}
                        {!submitting && currentSectionIndex < questionnaire.sections.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
