import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_type?: string;
  is_completed?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const end = formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    setLoading(true);
    api.getCalendarEvents(start, end)
      .then(data => setEvents((data as { events?: CalendarEvent[] }).events || (data as CalendarEvent[]) || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  // Build calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const ymd = formatYMD(new Date(year, month, day));
    return events.filter(e => e.event_date?.startsWith(ymd));
  };

  const todayYMD = formatYMD(today);
  const selectedEvents = selectedDay ? events.filter(e => e.event_date?.startsWith(selectedDay)) : [];

  // Upcoming: next 4 events from today
  const upcoming = events
    .filter(e => e.event_date >= todayYMD)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 4);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const getEventColor = (e: CalendarEvent) => {
    if (e.event_type === 'mindfulness') return '#6366F1';
    return '#3B82F6';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#749F82', paddingTop: 'env(safe-area-inset-top, 0px)', padding: '20px 20px 24px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>SCHEDULE</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Calendar</h1>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px' }}>
        {/* Month navigation */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: '#F6F8F9', border: 'none', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>‹</button>
            <p style={{ fontWeight: 800, fontSize: 16, color: '#2D3436' }}>{MONTHS[month]} {year}</p>
            <button onClick={nextMonth} style={{ background: '#F6F8F9', border: 'none', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94A3B8', paddingBottom: 8 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#636E72', fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const ymd = formatYMD(new Date(year, month, day));
                const isToday = ymd === todayYMD;
                const isSelected = ymd === selectedDay;
                const dayEvents = getEventsForDay(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : ymd)}
                    style={{
                      aspectRatio: '1',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      background: isSelected ? '#749F82' : isToday ? '#E6F4EA' : 'transparent',
                      transition: 'all 0.15s',
                      padding: '4px 2px',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: isSelected ? '#fff' : isToday ? '#749F82' : '#2D3436' }}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', gap: 2 }}>
                        {dayEvents.slice(0, 3).map((e, ei) => (
                          <div key={ei} style={{ width: 4, height: 4, borderRadius: 2, background: isSelected ? '#fff' : getEventColor(e) }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: '#E6F4EA', border: '2px solid #749F82' }} />
              <span style={{ fontSize: 11, color: '#636E72' }}>Today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#6366F1' }} />
              <span style={{ fontSize: 11, color: '#636E72' }}>Mindfulness</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#3B82F6' }} />
              <span style={{ fontSize: 11, color: '#636E72' }}>Other</span>
            </div>
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ fontWeight: 700, color: '#2D3436', marginBottom: 12 }}>
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {selectedEvents.length === 0 ? (
              <p style={{ color: '#636E72', fontSize: 13 }}>No events on this day.</p>
            ) : (
              selectedEvents.map(e => (
                <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: getEventColor(e), flexShrink: 0 }} />
                    <p style={{ fontWeight: 600, color: '#2D3436', fontSize: 14 }}>{e.title}</p>
                  </div>
                  {e.event_time && <p style={{ fontSize: 12, color: '#636E72', marginLeft: 16, marginTop: 2 }}>{e.event_time}</p>}
                  {e.description && <p style={{ fontSize: 12, color: '#94A3B8', marginLeft: 16, marginTop: 2 }}>{e.description}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ fontWeight: 700, color: '#2D3436', marginBottom: 12, fontSize: 14 }}>Upcoming Events</p>
            {upcoming.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F8F9FA', alignItems: 'flex-start' }}>
                <div style={{ background: '#E6F4EA', borderRadius: 10, padding: '8px 10px', textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#749F82', lineHeight: 1 }}>
                    {new Date(e.event_date + 'T00:00:00').getDate()}
                  </p>
                  <p style={{ fontSize: 10, color: '#636E72', textTransform: 'uppercase' }}>
                    {MONTHS[new Date(e.event_date + 'T00:00:00').getMonth()].slice(0, 3)}
                  </p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#2D3436', fontSize: 14 }}>{e.title}</p>
                  {e.event_time && <p style={{ fontSize: 12, color: '#636E72', marginTop: 2 }}>{e.event_time}</p>}
                  {e.description && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{e.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
