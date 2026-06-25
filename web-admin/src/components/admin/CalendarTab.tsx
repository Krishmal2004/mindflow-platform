import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Plus, Trash2, Edit, ChevronLeft, ChevronRight,
    Loader2, Calendar, CheckCircle2, Circle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string;
    is_completed: boolean;
    created_at: string;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const EMPTY_FORM = { title: '', description: '', event_date: '', event_time: '09:00', is_completed: 'false' };

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export function CalendarTab() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .order('event_date', { ascending: true })
                .order('event_time', { ascending: true });
            if (error) throw error;
            setEvents(data || []);
        } catch (err: unknown) {
            toast.error(`Failed to load events: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const todayStr = new Date().toISOString().split('T')[0];

    const eventsOn = (dateStr: string) => events.filter(e => e.event_date === dateStr);

    const openCreate = (dateStr?: string) => {
        setEditingEvent(null);
        setForm({ ...EMPTY_FORM, event_date: dateStr || todayStr });
        setIsFormOpen(true);
    };

    const openEdit = (ev: CalendarEvent) => {
        setEditingEvent(ev);
        setForm({
            title: ev.title,
            description: ev.description || '',
            event_date: ev.event_date,
            event_time: ev.event_time,
            is_completed: String(ev.is_completed),
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.event_date || !form.event_time) {
            toast.error('Title, date and time are required.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                event_date: form.event_date,
                event_time: form.event_time,
                is_completed: form.is_completed === 'true',
            };
            if (editingEvent) {
                const { error } = await supabase.from('calendar_events').update(payload).eq('id', editingEvent.id);
                if (error) throw error;
                toast.success('Event updated');
            } else {
                const { error } = await supabase.from('calendar_events').insert(payload);
                if (error) throw error;
                toast.success('Event created');
            }
            setIsFormOpen(false);
            load();
        } catch (err: unknown) {
            toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('calendar_events').delete().eq('id', deleteTarget);
            if (error) throw error;
            toast.success('Event deleted');
            setDeleteTarget(null);
            setSelectedDate(null);
            load();
        } catch (err: unknown) {
            toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const toggleComplete = async (ev: CalendarEvent) => {
        try {
            const { error } = await supabase.from('calendar_events').update({ is_completed: !ev.is_completed }).eq('id', ev.id);
            if (error) throw error;
            load();
        } catch (err: unknown) {
            toast.error(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const selectedDateEvents = selectedDate ? eventsOn(selectedDate) : [];
    const upcomingEvents = events.filter(e => e.event_date >= todayStr && !e.is_completed).slice(0, 6);
    const pendingCount = events.filter(e => !e.is_completed).length;
    const completedCount = events.filter(e => e.is_completed).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Calendar Events</h1>
                    <p className="text-neutral-500 text-xs mt-0.5">Schedule global study milestones and session checkpoints for all participants.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={load} className="h-9 w-9 bg-white border-neutral-300 hover:bg-neutral-50 rounded-lg">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => openCreate()} className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-sm">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Event
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {!loading && (
                <div className="flex items-center gap-5 text-xs text-neutral-500">
                    <span><span className="font-bold text-neutral-900">{events.length}</span> total events</span>
                    <span><span className="font-bold text-neutral-900">{pendingCount}</span> pending</span>
                    <span className="text-emerald-600"><span className="font-bold">{completedCount}</span> completed</span>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Calendar Grid */}
                <Card className="lg:col-span-5 border border-neutral-200 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-neutral-100">
                        <CardTitle className="text-sm font-bold text-neutral-900">
                            {MONTHS[month]} {year}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="h-7 w-7 border-neutral-200 hover:bg-neutral-50 rounded-md">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost" size="sm"
                                onClick={() => setCurrentDate(new Date())}
                                className="text-[11px] h-7 px-2 rounded-md font-semibold text-neutral-600 hover:text-neutral-900"
                            >
                                Today
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="h-7 w-7 border-neutral-200 hover:bg-neutral-50 rounded-md">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                            </div>
                        ) : (
                            <>
                                {/* Day-of-week headers */}
                                <div className="grid grid-cols-7 mb-1">
                                    {DAYS_SHORT.map(d => (
                                        <div key={d} className="text-center text-[10px] font-bold text-neutral-400 uppercase py-2">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                {/* Day cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                                        <div key={`e-${i}`} />
                                    ))}
                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                        const day = i + 1;
                                        const dateStr = toDateStr(year, month, day);
                                        const dayEvents = eventsOn(dateStr);
                                        const isToday = dateStr === todayStr;
                                        const isSelected = dateStr === selectedDate;
                                        const hasPending = dayEvents.some(e => !e.is_completed);
                                        const hasDone = dayEvents.some(e => e.is_completed);

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                                className={`
                                                    relative aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5 transition-colors text-xs font-medium
                                                    ${isSelected
                                                        ? 'bg-neutral-950 text-white'
                                                        : isToday
                                                        ? 'bg-neutral-100 text-neutral-900 ring-1 ring-neutral-300'
                                                        : 'text-neutral-700 hover:bg-neutral-50'
                                                    }
                                                `}
                                            >
                                                <span className={isToday && !isSelected ? 'font-bold' : ''}>{day}</span>
                                                {dayEvents.length > 0 && (
                                                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                                                        {hasPending && (
                                                            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-neutral-800'}`} />
                                                        )}
                                                        {hasDone && (
                                                            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-neutral-300' : 'bg-emerald-500'}`} />
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-neutral-100">
                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                        <span className="h-2 w-2 rounded-full bg-neutral-800" />
                                        Pending
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Completed
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                        <span className="h-2 w-2 rounded-full bg-neutral-200 ring-1 ring-neutral-400" />
                                        Today
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Right panel */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Selected date */}
                    {selectedDate ? (
                        <Card className="border border-neutral-200 bg-white">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-bold text-neutral-900">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </CardTitle>
                                    <p className="text-[10px] text-neutral-400 mt-0.5">{selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}</p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => openCreate(selectedDate)}
                                    className="h-7 w-7 p-0 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md"
                                    title="Add event on this day"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-1.5 pb-3">
                                {selectedDateEvents.length === 0 ? (
                                    <p className="text-[11px] text-neutral-400 text-center py-4">No events on this day.</p>
                                ) : (
                                    selectedDateEvents.map(ev => (
                                        <div key={ev.id} className="group flex items-start gap-2 rounded-lg p-2 hover:bg-neutral-50 border border-neutral-100 transition-colors">
                                            <button onClick={() => toggleComplete(ev)} className="mt-0.5 shrink-0" title={ev.is_completed ? 'Mark pending' : 'Mark complete'}>
                                                {ev.is_completed
                                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    : <Circle className="h-3.5 w-3.5 text-neutral-300 hover:text-neutral-500" />
                                                }
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] font-semibold leading-tight ${ev.is_completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                                                    {ev.title}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 mt-0.5">{ev.event_time}</p>
                                                {ev.description && (
                                                    <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">{ev.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(ev)} className="h-5 w-5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100">
                                                    <Edit className="h-2.5 w-2.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(ev.id)} className="h-5 w-5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border border-dashed border-neutral-200 bg-neutral-50/50">
                            <CardContent className="py-8 text-center">
                                <Calendar className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
                                <p className="text-[11px] text-neutral-400">Click a date to view or create events.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming events */}
                    <Card className="border border-neutral-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-neutral-900">Upcoming</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 pb-3">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-[11px] text-neutral-400 text-center py-3">No upcoming events.</p>
                            ) : (
                                upcomingEvents.map(ev => {
                                    const d = new Date(ev.event_date + 'T00:00:00');
                                    return (
                                        <button
                                            key={ev.id}
                                            onClick={() => {
                                                setSelectedDate(ev.event_date);
                                                setCurrentDate(new Date(ev.event_date + 'T00:00:00'));
                                            }}
                                            className="w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-neutral-50 border border-neutral-100 transition-colors text-left"
                                        >
                                            <div className="h-9 w-9 rounded-lg bg-neutral-950 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[8px] text-neutral-400 uppercase font-bold leading-none">{MONTHS[d.getMonth()].slice(0, 3)}</span>
                                                <span className="text-white font-bold text-sm leading-none mt-0.5">{d.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-semibold text-neutral-900 truncate">{ev.title}</p>
                                                <p className="text-[10px] text-neutral-400">{ev.event_time}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={open => !open && setIsFormOpen(false)}>
                <DialogContent className="max-w-md bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">
                            {editingEvent ? 'Edit Event' : 'New Event'}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            Global events are visible to all study participants in the schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-neutral-700">Title *</Label>
                            <Input
                                type="text"
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                required
                                className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-neutral-700">Date *</Label>
                                <Input
                                    type="date"
                                    value={form.event_date}
                                    onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                                    required
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-neutral-700">Time *</Label>
                                <Input
                                    type="time"
                                    value={form.event_time}
                                    onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))}
                                    required
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-neutral-700">Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                className="text-xs border-neutral-200 bg-neutral-50 rounded-lg resize-none min-h-[60px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-neutral-700">Status</Label>
                            <Select value={form.is_completed} onValueChange={v => setForm(p => ({ ...p, is_completed: v }))}>
                                <SelectTrigger className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">Pending</SelectItem>
                                    <SelectItem value="true">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-2 border-t border-neutral-100 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg">
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={submitting} className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm">
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingEvent ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="max-w-sm bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">Delete Event</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            This will permanently remove this calendar event from all participant schedules.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="text-xs border-neutral-200 text-neutral-600 rounded-lg">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleDelete} className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg">
                            Delete Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
