import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Mic, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { PageShell } from '@/components/PageShell';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyEntry {
  created_at: string;
  stress_level?: number;
  sleep_quality?: number;
  calm_after?: number;
}

interface WeeklyEntry { created_at: string; duration?: number }
interface ResearchEntry { created_at: string }

interface JourneyData {
  daily?: DailyEntry[];
  weekly?: WeeklyEntry[];
  research?: {
    pss10?: ResearchEntry[];
    ffmq15?: ResearchEntry[];
    wemwbs14?: ResearchEntry[];
  };
}

type Tab = 'daily' | 'questionnaire';

const COLOR = '#0F9B71';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Mirrors mobile/src/screens/JourneyScreen.tsx's SummaryCard — a non-interactive
// count + latest-date summary. Mobile never passes an `entries` list on this screen,
// so it is not an expandable accordion here either.
function SummaryCard({ icon, title, count, latestDate }: { icon: ReactNode; title: string; count: number; latestDate?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: 16, borderRadius: 24, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: '#E7F9F1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: COLOR, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', margin: 0 }}>{title}</p>
        {count === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#94A3B8', fontWeight: 500, fontSize: 13, marginTop: 4 }}>No submissions yet</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: COLOR, fontWeight: 700, marginTop: 2 }}>{count} {count === 1 ? 'submission' : 'submissions'}</p>
            {latestDate && <p style={{ fontSize: 12, color: '#636E72', marginTop: 4, fontWeight: 500 }}>Latest: {latestDate}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function JourneyPage() {
  const [data, setData] = useState<JourneyData>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('daily');

  const fetchData = () => {
    setLoading(true);
    api.getJourneyHistory(90)
      .then(d => setData(d as JourneyData))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const dailyData = data.daily || [];
  const last7 = dailyData.slice(0, 7).reverse();
  const chartData = last7.map(e => ({
    date: formatDate(e.created_at),
    stress: e.stress_level,
    sleep: e.sleep_quality,
    relaxation: e.calm_after,
  }));

  const weeklyData = data.weekly || [];
  const pss10Data = data.research?.pss10 || [];
  const ffmq15Data = data.research?.ffmq15 || [];
  const wemwbs14Data = data.research?.wemwbs14 || [];

  // Matches mobile's dailyCompletion/researchCompletion exactly — these are NOT the
  // same shape as a raw submission count. Daily = days-covered vs. days-since-first-entry;
  // Research = binary 100/0 (any PSS-10/FFMQ-15/WEMWBS-14 submission at all), not a count.
  const dailyCompletion = (() => {
    if (dailyData.length === 0) return 0;
    const firstDate = new Date(dailyData[dailyData.length - 1].created_at);
    const diffDays = Math.ceil(Math.abs(Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    return Math.min(100, Math.round((dailyData.length / diffDays) * 100));
  })();
  const researchCompletion = (pss10Data.length + ffmq15Data.length + wemwbs14Data.length) > 0 ? 100 : 0;

  if (loading) {
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: '#F8FAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: '#F8FAF8', paddingBottom: 80 }}>
      {/* Header — plain background matching mobile, no refresh button (pull-to-refresh
          isn't a web concept, but there's no header action on mobile either) */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 24px 8px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2D3436', margin: 0, marginBottom: 4 }}>Your Journey</h1>
        <p style={{ fontSize: 15, color: '#636E72', margin: 0 }}>Track your comprehensive progress</p>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 24px' }}>
        {/* Completion cards */}
        <div style={{ display: 'flex', gap: 12, margin: '16px 0 24px' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 24, padding: 16, textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: COLOR, margin: 0 }}>{dailyCompletion}%</p>
            <p style={{ fontSize: 11, color: '#636E72', marginTop: 6, fontWeight: 700, textAlign: 'center' }}>Daily</p>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 24, padding: 16, textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: COLOR, margin: 0 }}>{researchCompletion}%</p>
            <p style={{ fontSize: 11, color: '#636E72', marginTop: 6, fontWeight: 700, textAlign: 'center' }}>Questionnaires</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {(['daily', 'questionnaire'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px',
                fontSize: 16, fontWeight: 700, color: tab === t ? '#2D3436' : '#94A3B8',
                borderBottom: tab === t ? `3px solid ${COLOR}` : '3px solid transparent',
              }}
            >
              {t === 'daily' ? 'Daily' : 'Surveys'}
            </button>
          ))}
        </div>

        {tab === 'daily' && (
          <div style={{ paddingBottom: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#2D3436', marginBottom: 16 }}>Daily Metrics (Last 7 Entries)</p>

            {[
              { key: 'stress', title: 'Stress Levels', color: '#EF4444' },
              { key: 'sleep', title: 'Sleep Quality', color: '#3B82F6' },
              { key: 'relaxation', title: 'Calm (After Practice)', color: COLOR },
            ].map(m => (
              <div key={m.key} style={{ background: '#fff', borderRadius: 30, padding: 16, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', marginBottom: 8, marginLeft: 4 }}>{m.title}</p>
                {chartData.length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: '#94A3B8', textAlign: 'center', margin: '16px 0', fontWeight: 500 }}>No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={{ r: 5, fill: m.color }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'questionnaire' && (
          <div style={{ paddingBottom: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#2D3436', marginBottom: 16 }}>Weekly Recording Summary</p>
            <SummaryCard
              icon={<Mic size={18} />}
              title="Weekly Whispers"
              count={weeklyData.length}
              latestDate={weeklyData[0] ? formatDateTime(weeklyData[0].created_at) : undefined}
            />

            <p style={{ fontSize: 15, fontWeight: 800, color: '#2D3436', marginTop: 8, marginBottom: 16 }}>Questionnaire Summary</p>
            <SummaryCard
              icon={<FileText size={18} />}
              title="Perceived Stress Scale (PSS-10)"
              count={pss10Data.length}
              latestDate={pss10Data[0] ? formatDateTime(pss10Data[0].created_at) : undefined}
            />
            <SummaryCard
              icon={<FileText size={18} />}
              title="Five Facet Mindfulness (FFMQ-15)"
              count={ffmq15Data.length}
              latestDate={ffmq15Data[0] ? formatDateTime(ffmq15Data[0].created_at) : undefined}
            />
            <SummaryCard
              icon={<FileText size={18} />}
              title="Mental Wellbeing (WEMWBS-14)"
              count={wemwbs14Data.length}
              latestDate={wemwbs14Data[0] ? formatDateTime(wemwbs14Data[0].created_at) : undefined}
            />
          </div>
        )}
      </div>
    </div>
    </PageShell>
  );
}
