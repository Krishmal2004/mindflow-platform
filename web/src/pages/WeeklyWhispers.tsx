import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, RotateCcw, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const PASSAGE_TEXT = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";

export default function WeeklyWhispers() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const durationRef = useRef(0); // To access fresh duration inside callbacks

    // Keep durationRef in sync with state
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);

    useEffect(() => {
        checkStatus();
        return () => {
            // Cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const checkStatus = async () => {
        try {
            const data = await api.getWeeklyStatus();
            setStatus(data);
        } catch (error) {
            console.error("Failed to check status", error);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            // Audio constraints for 44.1kHz, 2 channels
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100,
                    channelCount: 2,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                // Determine if valid based on durationRef
                const finalDuration = durationRef.current;

                if (finalDuration < 15) {
                    toast.error("Recording is less than 15 seconds. Please retake.");
                    setAudioBlob(null);
                    setAudioUrl(null);
                    // Reset duration/recording state is handled in handleStop usually, 
                    // but onstop is called exactly when recorder stops.
                } else {
                    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    setAudioBlob(blob);
                    setAudioUrl(URL.createObjectURL(blob));
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            durationRef.current = 0;

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    const next = prev + 1;
                    if (next >= 30) {
                        // Auto-stop at 30s
                        stopRecordingInternal();
                    }
                    return next;
                });
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Microphone access is required to record.");
        }
    };

    const stopRecordingInternal = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleStopClick = () => {
        stopRecordingInternal();
    };

    const handleReset = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
        durationRef.current = 0;
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setUploading(true);

        try {
            // 1. Prepare FormData
            const formData = new FormData();
            formData.append('file', audioBlob);

            // 2. Upload via Backend Proxy
            const { fileKey, fileUrl } = await api.uploadWeeklyAudio(formData);

            // 3. Submit Metadata to Backend
            await api.submitWeeklyEntry({
                file_url: fileUrl,
                file_key: fileKey,
                duration
            });

            toast.success("Recording submitted successfully!");
            // Refresh status to show completion
            checkStatus();

        } catch (error: any) {
            console.error("Upload failed", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Upload failed: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (status?.completed) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
                <div className="w-full max-w-md mt-10">
                    <Card className="text-center p-8 space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Weekly Check-in Complete!</h2>
                        <p className="text-slate-600">Great job reflecting on your week.</p>
                        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Weekly Whispers</h1>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                    {!audioBlob ? (
                        <>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-teal-800">Instructions</h3>
                                <p className="text-slate-600">
                                    Please read the following passage aloud. Speak naturally and clearly. Recording will auto-stop at 30 seconds.
                                </p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic text-slate-700 leading-relaxed">
                                    "{PASSAGE_TEXT}"
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center pt-4 space-y-4">
                                <div className={`text-4xl font-mono font-bold ${duration >= 25 ? 'text-red-500' : 'text-slate-700'}`}>
                                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}{duration === 30 ? '' : ''}
                                </div>

                                {isRecording && (
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                                        <div
                                            className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                                            style={{ width: `${(duration / 30) * 100}%` }}
                                        />
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className={`h-20 w-20 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                                    onClick={isRecording ? handleStopClick : startRecording}
                                >
                                    {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                                </Button>
                                <p className="text-sm text-slate-500">
                                    {isRecording ? 'Tap to Stop' : 'Tap to Record (Min 15s)'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6 text-center">
                            <h3 className="font-semibold text-lg text-slate-900">Review Recording</h3>
                            {audioUrl && (
                                <audio src={audioUrl} controls className="w-full" />
                            )}

                            <div className="flex gap-4 justify-center">
                                <Button variant="outline" onClick={handleReset} disabled={uploading}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Retake
                                </Button>
                                <Button onClick={handleUpload} disabled={uploading} className="bg-teal-600 hover:bg-teal-700">
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Submit
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
