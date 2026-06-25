import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';

const PRACTICE_TYPES = ['Physical Session', 'Other'];

const INFLUENCING_FACTORS = [
  { label: 'Education', covers: 'Exams, deadlines, lectures, grades, studying.' },
  { label: 'Personal', covers: 'Friends, family, romantic partners, job/work, health, energy level, hobbies, self-care.' },
  { label: 'Environment', covers: 'Weather, noise, living space, commute, crowding, safety.' },
];

const SLEEP_TIMES = ['8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM','12:30 AM','1:00 AM','1:30 AM','2:00 AM'];
const WAKE_TIMES = ['4:00 AM','4:30 AM','5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM'];

const STEP_NAMES = ['Guided Session', 'Relaxation & Stress', 'Mindfulness', 'Mood & Feeling', 'Sleep'];
const MIN_WATCH_SECONDS = 60;
const SYNC_INTERVAL = 5;

interface VideoData { youtube_id?: string; title?: string }
interface StatusData { completed?: boolean }

// Emoji-like level icons using colored circles with numbers
function LevelButton({ level, value, onChange, color }: { level: number; value: number | null; onChange: (v: number) => void; color: string }) {
  const emojis = ['😔', '😟', '😐', '🙂', '😊'];
  const selected = value === level;
  return (
    <button
      onClick={() => onChange(level)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 4px',
        borderRadius: 12,
        border: `2px solid ${selected ? color : '#DFE6E9'}`,
        background: selected ? `${color}15` : '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 22 }}>{emojis[level - 1]}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: selected ? color : '#94A3B8' }}>{level}</span>
    </button>
  );
}

export default function DailySlidersPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Video state
  const [weeklyVideoId, setWeeklyVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const unsyncedRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Form state
  const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
  const [practiceDuration, setPracticeDuration] = useState('');
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [otherPracticeText, setOtherPracticeText] = useState('');
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  useEffect(() => {
    Promise.all([
      api.getDailyStatus().catch(() => ({ completed: false })),
      api.getWeeklyVideo().catch(() => null),
    ]).then(([status, video]) => {
      const s = status as StatusData;
      if (s.completed) {
        navigate('/complete', { replace: true, state: { title: 'Great Job Today!', message: 'You have already completed your daily check-in. See you tomorrow!', isDaily: true } });
        return;
      }
      if (video) {
        const v = video as VideoData;
        if (v.youtube_id) { setWeeklyVideoId(v.youtube_id); setVideoTitle(v.title || ''); }
      }
    }).finally(() => setLoading(false));
  }, [navigate]);

  // Watch timer
  useEffect(() => {
    if (currentStep !== 0 || !weeklyVideoId || !isVideoPlaying) return;
    const interval = setInterval(() => {
      setWatchedSeconds(prev => prev + 1);
      unsyncedRef.current += 1;
      if (unsyncedRef.current >= SYNC_INTERVAL) {
        const toSync = unsyncedRef.current;
        unsyncedRef.current = 0;
        api.updateVideoProgress(toSync).catch(() => {});
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (unsyncedRef.current > 0) {
        const toSync = unsyncedRef.current;
        unsyncedRef.current = 0;
        api.updateVideoProgress(toSync).catch(() => {});
      }
    };
  }, [currentStep, weeklyVideoId, isVideoPlaying]);

  // YouTube postMessage listener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onStateChange') {
          setIsVideoPlaying(data.info === 1); // 1 = playing
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const togglePractice = (p: string) => {
    setSelectedPractices(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !weeklyVideoId || watchedSeconds >= MIN_WATCH_SECONDS;
      case 1: return relaxationLevel !== null && stressLevel !== null;
      case 2: {
        if (mindfulnessPractice === null) return false;
        if (mindfulnessPractice === 'yes') {
          if (!practiceDuration.trim() || selectedPractices.length === 0) return false;
          if (selectedPractices.includes('Other') && !otherPracticeText.trim()) return false;
        }
        return true;
      }
      case 3: return moodLevel !== null && selectedFactor !== null;
      case 4: return sleepStart !== null && wakeUp !== null && sleepQuality !== null;
      default: return false;
    }
  };

  const progress = Math.round(((currentStep) / STEP_NAMES.length) * 100);

  const handleNext = () => {
    if (!isStepValid()) {
      setPopup({ visible: true, type: 'warning', title: 'Incomplete', message: 'Please fill in all required fields before continuing.' });
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setPopup({ visible: true, type: 'warning', title: 'Incomplete', message: 'Please complete all fields.' });
      return;
    }
    setSubmitting(true);
    try {
      const practiceLog = mindfulnessPractice === 'yes'
        ? selectedPractices.map(p => p === 'Other' ? otherPracticeText.trim() : p).filter(Boolean).join(', ')
        : null;

      await api.submitDaily({
        mindfulness_practice: mindfulnessPractice,
        practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) || null : null,
        practice_log: practiceLog,
        stress_level: stressLevel!,
        mood: moodLevel!,
        sleep_quality: sleepQuality!,
        relaxation_level: relaxationLevel!,
        sleep_start_time: sleepStart!,
        wake_up_time: wakeUp!,
        feelings: selectedFactor || '',
      });
      navigate('/complete', {
        replace: true,
        state: { title: 'Daily Check-in Complete!', message: "Great job! You've completed your daily check-in. See you tomorrow!", isDaily: true },
      });
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #FDE68A', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const STEP_COLOR = '#D97706';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBEB', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#D97706', paddingTop: 'env(safe-area-inset-top, 0px)', padding: '16px 20px 20px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => currentStep > 0 ? setCurrentStep(p => p - 1) : navigate('/dashboard')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' }}>Step {currentStep + 1} of {STEP_NAMES.length}</p>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{STEP_NAMES[currentStep]}</h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '4px 10px' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{progress}%</span>
            </div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#fff', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 16px' }}>
        {/* Step 0: Video */}
        {currentStep === 0 && (
          <div>
            {weeklyVideoId ? (
              <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <div style={{ aspectRatio: '16/9', background: '#000' }}>
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${weeklyVideoId}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={videoTitle || 'Guided Session'}
                  />
                </div>
                <div style={{ padding: 16 }}>
                  <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 15 }}>{videoTitle || "This Week's Guided Session"}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#F0F0F0', borderRadius: 3 }}>
                      <div style={{ height: '100%', background: watchedSeconds >= MIN_WATCH_SECONDS ? '#749F82' : '#D97706', borderRadius: 3, width: `${Math.min(100, (watchedSeconds / MIN_WATCH_SECONDS) * 100)}%`, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: watchedSeconds >= MIN_WATCH_SECONDS ? '#749F82' : '#D97706' }}>
                      {watchedSeconds}s / {MIN_WATCH_SECONDS}s
                    </span>
                  </div>
                  {watchedSeconds < MIN_WATCH_SECONDS && (
                    <p style={{ fontSize: 12, color: '#636E72', marginTop: 4 }}>Watch at least 60 seconds to continue.</p>
                  )}
                  {watchedSeconds >= MIN_WATCH_SECONDS && (
                    <p style={{ fontSize: 12, color: '#749F82', fontWeight: 600, marginTop: 4 }}>✓ Minimum watch time reached!</p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>📺</div>
                <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 8 }}>No Video This Week</p>
                <p style={{ color: '#636E72', fontSize: 13 }}>No guided session has been assigned for this week. You can proceed to the next step.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Relaxation & Stress */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Relaxation Level</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How relaxed do you feel right now?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={relaxationLevel} onChange={setRelaxationLevel} color={STEP_COLOR} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Not Relaxed</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Relaxed</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Stress Level</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How stressed are you feeling?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={stressLevel} onChange={setStressLevel} color="#EF4444" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Low</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very High</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mindfulness Practice */}
        {currentStep === 2 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Mindfulness Practice</p>
            <p style={{ fontSize: 13, color: '#636E72', marginBottom: 20 }}>Did you practice mindfulness today?</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {(['yes', 'no'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setMindfulnessPractice(v)}
                  style={{
                    flex: 1, padding: 16, borderRadius: 16, border: `2px solid ${mindfulnessPractice === v ? (v === 'yes' ? STEP_COLOR : '#EF4444') : '#DFE6E9'}`,
                    background: mindfulnessPractice === v ? (v === 'yes' ? '#FFFBEB' : '#FEE2E2') : '#fff',
                    color: mindfulnessPractice === v ? (v === 'yes' ? STEP_COLOR : '#EF4444') : '#636E72',
                    fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            {mindfulnessPractice === 'yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#636E72', display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                  <input
                    value={practiceDuration}
                    onChange={e => setPracticeDuration(e.target.value)}
                    type="number"
                    placeholder="e.g., 15"
                    style={{ width: 120, padding: '10px 14px', border: '1.5px solid #DFE6E9', borderRadius: 12, fontSize: 15, outline: 'none', background: '#F6F8F9' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#636E72', display: 'block', marginBottom: 6 }}>Practice Type</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRACTICE_TYPES.map(p => (
                      <button
                        key={p}
                        onClick={() => togglePractice(p)}
                        style={{
                          padding: '8px 16px', borderRadius: 20,
                          border: `1.5px solid ${selectedPractices.includes(p) ? STEP_COLOR : '#DFE6E9'}`,
                          background: selectedPractices.includes(p) ? '#FFFBEB' : '#fff',
                          color: selectedPractices.includes(p) ? STEP_COLOR : '#636E72',
                          fontWeight: selectedPractices.includes(p) ? 700 : 500, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {selectedPractices.includes('Other') && (
                    <input
                      value={otherPracticeText}
                      onChange={e => setOtherPracticeText(e.target.value)}
                      placeholder="Describe your practice..."
                      style={{ marginTop: 8, width: '100%', padding: '10px 14px', border: '1.5px solid #DFE6E9', borderRadius: 12, fontSize: 14, outline: 'none', background: '#F6F8F9', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Mood & Factor */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Mood Level</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How's your mood today?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={moodLevel} onChange={setMoodLevel} color="#6366F1" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Bad</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Good</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Main Influencing Factor</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>What mainly influenced your mood?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {INFLUENCING_FACTORS.map(f => (
                  <button
                    key={f.label}
                    onClick={() => setSelectedFactor(f.label)}
                    style={{
                      padding: '14px 16px', borderRadius: 14, border: `2px solid ${selectedFactor === f.label ? STEP_COLOR : '#DFE6E9'}`,
                      background: selectedFactor === f.label ? '#FFFBEB' : '#F6F8F9',
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <p style={{ fontWeight: 700, color: selectedFactor === f.label ? STEP_COLOR : '#2D3436', marginBottom: 2 }}>{f.label}</p>
                    <p style={{ fontSize: 12, color: '#636E72' }}>{f.covers}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Sleep */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Sleep Quality</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How well did you sleep last night?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={sleepQuality} onChange={setSleepQuality} color="#3B82F6" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Poor</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Excellent</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Sleep Start Time</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 12 }}>When did you go to sleep?</p>
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                  {SLEEP_TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSleepStart(t)}
                      style={{
                        padding: '10px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${sleepStart === t ? '#3B82F6' : '#DFE6E9'}`,
                        background: sleepStart === t ? '#EFF6FF' : '#fff',
                        color: sleepStart === t ? '#3B82F6' : '#636E72',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Wake Up Time</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 12 }}>When did you wake up?</p>
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                  {WAKE_TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => setWakeUp(t)}
                      style={{
                        padding: '10px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${wakeUp === t ? '#3B82F6' : '#DFE6E9'}`,
                        background: wakeUp === t ? '#EFF6FF' : '#fff',
                        color: wakeUp === t ? '#3B82F6' : '#636E72',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
        borderTop: '1px solid #DFE6E9', padding: '12px 16px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        display: 'flex', gap: 12, zIndex: 50,
      }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', gap: 12, width: '100%' }}>
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(p => p - 1)}
              style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 16, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              Back
            </button>
          )}
          {currentStep < STEP_NAMES.length - 1 ? (
            <button
              onClick={handleNext}
              style={{ flex: 2, padding: 14, background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: isStepValid() ? 1 : 0.6 }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 2, padding: 14, background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Saving...' : 'FINISH & SAVE ✓'}
            </button>
          )}
        </div>
      </div>

      <PopupModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(p => ({ ...p, visible: false }))}
      />
    </div>
  );
}
