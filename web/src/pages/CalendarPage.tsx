import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabaseClient';

interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    is_completed: boolean;
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('event_time', { ascending: true });

                if (error) {
                    throw error;
                }
                setEvents(data || []);
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Filter events for selected date
    const selectedDateEvents = events.filter(event => {
        if (!date) return false;
        // Compare dates (YYYY-MM-DD from DB matches local date selection)
        // Note: JS Date handling can be tricky with timezones. 
        // Assuming DB stores YYYY-MM-DD string or we parse correctly.
        // Let's create a YYYY-MM-DD string from the selected date to compare.
        const selectedStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format

        // If event_date is a full timestamp, split it. If it's a date string, use strictly.
        // Supabase 'date' type returns 'YYYY-MM-DD'.
        return event.event_date === selectedStr;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
            <div className="w-full max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-900">Your Schedule</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Calendar Selection */}
                    <Card className="md:col-span-5 h-fit">
                        <CardHeader>
                            <CardTitle>Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm"
                            />
                        </CardContent>
                    </Card>

                    {/* Events List */}
                    <Card className="md:col-span-7 min-h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>
                                    {date?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </CardTitle>
                                <CardDescription>
                                    You have {selectedDateEvents.length} event{selectedDateEvents.length !== 1 && 's'} scheduled.
                                </CardDescription>
                            </div>
                            {/* Potential Add Button could go here */}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-8 text-slate-500">Loading schedule...</div>
                                ) : selectedDateEvents.length > 0 ? (
                                    selectedDateEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-start gap-4 p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                                    <CalendarIcon className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900">{event.title}</h4>
                                                {event.description && <p className="text-sm text-slate-500 mt-1">{event.description}</p>}
                                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {event.event_time ? (
                                                        // Format Time HH:MM:SS -> HH:MM AM/PM
                                                        new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })
                                                    ) : 'All Day'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50/50">
                                        <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                                        <p>No events for this day.</p>
                                        <p className="text-sm">Enjoy your free time!</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
