import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyEntry {
  created_at: string;
  stress_level?: number;
  sleep_quality?: number;
  relaxation_level?: number;
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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function JourneyPage() {
  const [data, setData] = useState<JourneyData>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('daily');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.getJourneyHistory(90)
      .then(d => setData(d as JourneyData))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const dailyEntries = data.daily || [];
  const last7 = dailyEntries.slice(-7);
  const chartData = last7.map(e => ({
    date: formatDate(e.created_at),
    stress: e.stress_level,
    sleep: e.sleep_quality,
    relaxation: e.relaxation_level,
  }));

  const totalDays = dailyEntries.length;
  const weekly = data.weekly || [];
  const pss10 = data.research?.pss10 || [];
  const ffmq15 = data.research?.ffmq15 || [];
  const wemwbs14 = data.research?.wemwbs14 || [];

  const dailyPct = totalDays > 0 ? Math.round((totalDays / 90) * 100) : 0;
  const researchCount = weekly.length + pss10.length + ffmq15.length + wemwbs14.length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: '#749F82', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#749F82', paddingTop: 'env(safe-area-inset-top, 0px)', padding: '20px 20px 24px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>YOUR</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Journey</h1>
          </div>
          <button
            onClick={fetchData}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 16, padding: 4, margin: '16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {(['daily', 'questionnaire'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: tab === t ? '#749F82' : 'transparent',
                color: tab === t ? '#fff' : '#636E72',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {t === 'daily' ? 'Daily' : 'Questionnaires'}
            </button>
          ))}
        </div>

        {tab === 'daily' && (
          <div>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 11, color: '#636E72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Daily Entries</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#2D3436' }}>{totalDays}</p>
                <p style={{ fontSize: 12, color: '#749F82' }}>{dailyPct}% of 90 days</p>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 11, color: '#636E72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Research</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#2D3436' }}>{researchCount}</p>
                <p style={{ fontSize: 12, color: '#6366F1' }}>total submissions</p>
              </div>
            </div>

            {chartData.length > 0 ? (
              <>
                {/* Stress chart */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', marginBottom: 12 }}>Stress Level (last 7 days)</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="stress" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444' }} name="Stress" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sleep chart */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', marginBottom: 12 }}>Sleep Quality (last 7 days)</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} name="Sleep" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Relaxation chart */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', marginBottom: 12 }}>Relaxation Level (last 7 days)</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="relaxation" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} name="Relaxation" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ color: '#636E72', fontSize: 14 }}>No daily entries yet. Complete your first Daily Sliders check-in!</p>
              </div>
            )}
          </div>
        )}

        {tab === 'questionnaire' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'weekly', label: 'Weekly Whispers', color: '#6366F1', entries: weekly },
              { key: 'pss10', label: 'Stress Snapshot (PSS-10)', color: '#E07A5F', entries: pss10 },
              { key: 'ffmq15', label: 'Mindful Mirror (FFMQ-15)', color: '#0D9488', entries: ffmq15 },
              { key: 'wemwbs14', label: 'Thrive Tracker (WEMWBS-14)', color: '#749F82', entries: wemwbs14 },
            ].map(section => (
              <div key={section.key} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  style={{
                    width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: section.color }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436' }}>{section.label}</p>
                      <p style={{ fontSize: 12, color: '#636E72' }}>
                        {section.entries.length} submissions
                        {section.entries.length > 0 && ` · last ${formatDate(section.entries[section.entries.length - 1].created_at)}`}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: 18, transform: expandedSection === section.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>

                {expandedSection === section.key && section.entries.length > 0 && (
                  <div style={{ borderTop: '1px solid #F0F0F0', padding: '12px 20px' }}>
                    {section.entries.map((e, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: i < section.entries.length - 1 ? '1px solid #F8F9FA' : 'none' }}>
                        <p style={{ fontSize: 13, color: '#2D3436' }}>
                          {new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
