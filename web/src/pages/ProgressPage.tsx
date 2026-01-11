import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';

export default function ProgressPage() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await api.getDashboardSummary();
                setSummary(data);
            } catch (error) {
                console.error("Failed to fetch progress", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Your Progress</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Consistency Score</CardTitle>
                        <CardDescription>Based on your activity over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-4">
                            <div className="text-5xl font-bold text-teal-600 mb-4">{summary?.consistency || 0}%</div>
                            <Progress value={summary?.consistency || 0} className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <div className="text-3xl font-bold text-slate-900">{summary?.streak || 0}</div>
                            <div className="text-sm text-slate-500 font-medium">Day Streak</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <div className="text-3xl font-bold text-slate-900">{summary?.totalCompleted || 0}</div>
                            <div className="text-sm text-slate-500 font-medium">Total Sessions</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">This Week</span>
                            <span className="text-sm text-slate-500">{summary?.status?.weeklyDone ? 'Completed' : 'Pending'}</span>
                        </div>
                        <Progress value={summary?.status?.weeklyDone ? 100 : 0} className="h-2" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
