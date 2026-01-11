import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { api } from '@/lib/api';

export default function CalendarPage() {
    const navigate = useNavigate();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

            try {
                const data = await api.getCalendarEvents(start, end);
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [date]); // Re-fetch if month changes (need to handle month change callback in Calendar)

    // Helper to check if a day has an event
    const isDayWithEvent = (day: Date) => {
        // Logic to check if 'day' matches any event date
        return false; // Placeholder logic
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Your Journey</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                    </CardContent>
                </Card>

                {/* Event List for Selected Day */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">
                        {date?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    {/* List events here if any */}
                    <p className="text-slate-500 text-sm italic">No entries for this day.</p>
                </div>
            </div>
        </div>
    );
}
