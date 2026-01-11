import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Play, RotateCcw, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { r2, BUCKET_NAME, PUBLIC_URL_BASE } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabaseClient';

const PASSAGE_TEXT = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";

function getWeekNumber(d: Date): [number, number] {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return [date.getUTCFullYear(), weekNo];
}

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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        checkStatus();
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' }); // or webm
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access is required to record.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleReset = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const [year, week] = getWeekNumber(new Date());
            const fileName = `weekly-${year}-W${week.toString().padStart(2, '0')}-${user.id}.wav`;
            const fileKey = `WeeklyVoice/${fileName}`;

            // Convert Blob to ArrayBuffer
            const buffer = await audioBlob.arrayBuffer();

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: new Uint8Array(buffer),
                ContentType: audioBlob.type,
            });

            await r2.send(command);

            const fileUrl = `${PUBLIC_URL_BASE}/${fileKey}`;

            await api.submitWeeklyEntry({
                file_url: fileUrl,
                file_key: fileKey,
                duration
            });

            // Refresh status to show completion
            checkStatus();

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload recording. Please try again.");
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
                                    Please read the following passage aloud. Speak naturally and clearly.
                                </p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic text-slate-700 leading-relaxed">
                                    "{PASSAGE_TEXT}"
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center pt-4 space-y-4">
                                <div className="text-4xl font-mono font-bold text-slate-700">
                                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                                </div>

                                <Button
                                    size="lg"
                                    className={`h-20 w-20 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                                </Button>
                                <p className="text-sm text-slate-500">
                                    {isRecording ? 'Tap to Stop' : 'Tap to Record'}
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
