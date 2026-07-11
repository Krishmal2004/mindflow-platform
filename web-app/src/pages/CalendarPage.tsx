import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { PageShell } from '@/components/PageShell';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  is_completed?: boolean;
}

const COLOR = '#749F82';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Mirrors mobile/src/screens/CalendarScreen.tsx#isMindfulnessSession — there is no
// `event_type` column on calendar_events (see database/project_db.sql), so mindfulness
// sessions are identified by their title prefix, not a dedicated field.
function isMindfulnessSession(event: CalendarEvent) {
  return event.title.startsWith('Mindfulness Session');
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    setLoading(true);
    api.getCalendarEvents(formatYMD(start), formatYMD(end))
      .then(data => setEvents((data as { events?: CalendarEvent[] }).events || (data as CalendarEvent[]) || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day: number) => {
    const ymd = formatYMD(new Date(year, month, day));
    return events.filter(e => e.event_date === ymd);
  };

  const todayYMD = formatYMD(today);
  // Filters events directly by the stored date rather than via getEventsForDay, which
  // is scoped to the currently displayed month — selectedDate can be a lingering
  // selection from a month the user has since navigated away from.
  const selectedEvents = selectedDate ? events.filter(e => e.event_date === formatYMD(selectedDate)) : [];

  // Only mindfulness sessions surface in "Upcoming Events" — matches mobile's
  // upcomingMindfulnessSessions memo exactly (not all calendar events).
  const upcoming = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return events
      .filter(e => isMindfulnessSession(e) && new Date(e.event_date) >= t)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 4);
  }, [events]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 80 }}>
      {/* Header — plain background matching mobile, not a colored banner */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 24px 8px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2D3436', margin: 0, marginBottom: 4 }}>Calendar</h1>
        <p style={{ fontSize: 15, color: '#636E72', margin: 0 }}>Track your sessions & schedules</p>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px 24px' }}>
        {/* Calendar card */}
        <div style={{ background: '#fff', borderRadius: 30, padding: 20, marginBottom: 24, boxShadow: '0 6px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ width: 40, height: 40, borderRadius: 20, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16 }}>‹</button>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#2D3436', margin: 0 }}>{MONTHS[month]} {year}</p>
            <button onClick={nextMonth} style={{ width: 40, height: 40, borderRadius: 20, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16 }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94A3B8', paddingBottom: 8 }}>{d}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#636E72', fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const date = new Date(year, month, day);
                const ymd = formatYMD(date);
                const isToday = ymd === todayYMD;
                const dayEvents = getEventsForDay(day);
                const hasMindfulness = dayEvents.some(isMindfulnessSession);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      position: 'relative', aspectRatio: '1', margin: '4px 0', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 20,
                      background: isToday ? COLOR : hasMindfulness ? '#F3E8FF' : hasEvents ? '#E0F2FE' : 'transparent',
                    }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: isToday || hasMindfulness ? 700 : 600,
                      color: isToday ? '#fff' : hasMindfulness ? '#9333EA' : '#2D3436',
                    }}>
                      {day}
                    </span>
                    {hasMindfulness && (
                      <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: '#9C27B0' }} />
                    )}
                    {hasEvents && !hasMindfulness && (
                      <span style={{ position: 'absolute', bottom: 4, right: 4, width: 4, height: 4, borderRadius: 2, background: '#0EA5E9' }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: '#9333EA', display: 'block' }} />
              <span style={{ fontSize: 12, color: '#636E72', fontWeight: 600 }}>Mindfulness</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: COLOR, display: 'block' }} />
              <span style={{ fontSize: 12, color: '#636E72', fontWeight: 600 }}>Today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: '#0EA5E9', display: 'block' }} />
              <span style={{ fontSize: 12, color: '#636E72', fontWeight: 600 }}>Events</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <p style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 4 }}>Upcoming Events</p>

        {upcoming.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, textAlign: 'center', border: '1.5px dashed #E2E8F0' }}>
            <span style={{ fontSize: 32, opacity: 0.4 }}>📅</span>
            <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 12, fontWeight: 600 }}>No upcoming events</p>
          </div>
        ) : (
          upcoming.map(event => {
            const eventDate = new Date(event.event_date);
            return (
              <div
                key={event.id}
                style={{
                  display: 'flex', alignItems: 'center', background: event.is_completed ? '#E6F4EA' : '#fff',
                  borderRadius: 24, padding: 16, marginBottom: 12,
                  border: event.is_completed ? '1.5px solid #C2E7CD' : 'none',
                  boxShadow: event.is_completed ? 'none' : '0 4px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, fontSize: 20, flexShrink: 0 }}>
                  🌼
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2D3436', margin: 0 }}>{event.title}</p>
                  <p style={{ fontSize: 12, color: '#636E72', marginTop: 2, fontWeight: 500 }}>
                    {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {event.event_time ? ` • ${event.event_time.slice(0, 5)}` : ''}
                  </p>
                  {event.description && (
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {event.description}
                    </p>
                  )}
                </div>
                <span style={{ marginLeft: 12, fontSize: 22 }}>
                  {event.is_completed ? '✅' : <span style={{ color: '#F59E0B' }}>⭕</span>}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedDate && (
        <div
          onClick={() => setSelectedDate(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 30, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2D3436', margin: 0 }}>
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event, i) => (
                  <div key={i} style={{ marginBottom: 12, background: '#F6F8F9', padding: 14, borderRadius: 20, border: '1.5px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#2D3436', margin: 0 }}>{event.title}</p>
                      {event.is_completed && <span style={{ fontSize: 18 }}>✅</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#636E72', fontWeight: 500, margin: 0 }}>
                      {event.event_time ? event.event_time.slice(0, 5) : 'All Day'}
                    </p>
                    {event.description && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, lineHeight: 1.5 }}>{event.description}</p>}
                  </div>
                ))
              ) : (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <p style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>No events for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PageShell>
  );
}
