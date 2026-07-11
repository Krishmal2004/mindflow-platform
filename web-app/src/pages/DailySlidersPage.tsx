import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv } from 'lucide-react';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';
import { EmotionIcons } from '@/components/Icons';

const PRACTICE_LOCATIONS = ['At University', 'Outside University'];

const INFLUENCING_FACTORS = [
  { label: 'Education', covers: 'Exams, deadlines, lectures, grades, studying.' },
  { label: 'Personal', covers: 'Friends, family, romantic partners, job/work, health, energy level, hobbies, self-care, or unexplained mood.' },
  { label: 'Environment', covers: 'Weather, noise, living space, commute, crowding, safety.' },
];

const SLEEP_TIMES = ['6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM','12:30 AM','1:00 AM','1:30 AM','2:00 AM','2:30 AM','3:00 AM','3:30 AM','4:00 AM'];
const WAKE_TIMES = ['2:00 AM','2:30 AM','3:00 AM','3:30 AM','4:00 AM','4:30 AM','5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM'];

// 0 = Calm(before)/Stress/Factor, 1 = Sleep, 2 = Video, 3 = Practice, 4 = Calm(after)
const SYNC_INTERVAL = 5;

interface VideoData { youtube_id?: string; title?: string }
interface StatusData { completed?: boolean; group?: string }

function LevelButton({ level, value, onChange, color, category }: { level: number; value: number | null; onChange: (v: number) => void; color: string; category: keyof typeof EmotionIcons }) {
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
      {EmotionIcons[category](level, 28)}
      <span style={{ fontSize: 10, fontWeight: 600, color: selected ? color : '#94A3B8' }}>{level}</span>
    </button>
  );
}

export default function DailySlidersPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userGroup, setUserGroup] = useState('');

  // Video state
  const [weeklyVideoId, setWeeklyVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const unsyncedRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Form state
  const [calmBefore, setCalmBefore] = useState<number | null>(null);
  const [calmAfter, setCalmAfter] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
  const [practiceDuration, setPracticeDuration] = useState('');
  const [practiceLocation, setPracticeLocation] = useState<string | null>(null);
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
      if (s.group) setUserGroup(s.group);
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
    if (currentStep !== 2 || !weeklyVideoId || !isVideoPlaying) return;
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

  // YouTube postMessage listener. The IFrame Player API only starts broadcasting
  // onStateChange/infoDelivery events after it receives a {event:"listening"} handshake
  // from the host page — without sending that, isVideoPlaying (and the watch-time
  // tracking effect above that depends on it) never fires.
  useEffect(() => {
    const sendListening = () => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'daily-video' }), '*');
    };
    // The player needs a moment after `src` is set before it accepts the handshake;
    // resend a few times to cover slow loads rather than relying on a single onLoad fire.
    const retries = [500, 1500, 3000].map(delay => setTimeout(sendListening, delay));

    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onStateChange') {
          setIsVideoPlaying(data.info === 1); // 1 = playing
        } else if (data.event === 'infoDelivery' && typeof data.info?.playerState === 'number') {
          setIsVideoPlaying(data.info.playerState === 1);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      retries.forEach(clearTimeout);
    };
  }, [weeklyVideoId]);

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return calmBefore !== null && stressLevel !== null && selectedFactor !== null;
      case 1: return sleepStart !== null && wakeUp !== null && sleepQuality !== null;
      // Watch time is tracked for analytics only, matching mobile's DailySlidersScreen —
      // the user is not forced to watch before continuing.
      case 2: return true;
      case 3: {
        if (mindfulnessPractice === null) return false;
        if (mindfulnessPractice === 'yes') {
          if (!practiceDuration.trim() || parseInt(practiceDuration, 10) < 5 || practiceLocation === null) return false;
        }
        return true;
      }
      case 4: return calmAfter !== null;
      default: return false;
    }
  };

  // Control group (.cg) skips step 3 (Mindfulness Practice) entirely, matching
  // mobile's DailySlidersScreen getStepDisplayNumber/getStepTotalCount/nextStep/prevStep.
  const getStepDisplayNumber = () => {
    if (userGroup === 'cg') {
      if (currentStep === 0) return 1;
      if (currentStep === 1) return 2;
      if (currentStep === 2) return 3;
      if (currentStep === 4) return 4;
    }
    return currentStep + 1;
  };
  const getStepTotalCount = () => (userGroup === 'cg' ? 4 : 5);

  // Field-completion percentage shown in the header badge — distinct from the step
  // position bar below it, matching mobile's DailySlidersScreen getCompletionProgress.
  const getCompletionProgress = () => {
    let completed = 0;
    const total = userGroup === 'cg' ? 6 : 7;

    if (userGroup !== 'cg' && mindfulnessPractice !== null) {
      if (mindfulnessPractice === 'no') {
        completed++;
      } else if (practiceDuration && practiceLocation !== null) {
        completed++;
      }
    }
    if (stressLevel !== null) completed++;
    if (calmBefore !== null) completed++;
    if (selectedFactor) completed++;
    if (sleepStart && wakeUp) completed++;
    if (sleepQuality !== null) completed++;
    if (calmAfter !== null) completed++;

    return Math.round((completed / total) * 100);
  };

  const stepProgress = Math.round((getStepDisplayNumber() / getStepTotalCount()) * 100);

  const handleNext = () => {
    if (!isStepValid()) {
      setPopup({ visible: true, type: 'warning', title: 'Incomplete', message: 'Please fill in all required fields before continuing.' });
      return;
    }
    if (currentStep === 2 && userGroup === 'cg') {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    if (currentStep === 4 && userGroup === 'cg') {
      setCurrentStep(2);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setPopup({ visible: true, type: 'warning', title: 'Incomplete', message: 'Please complete all fields.' });
      return;
    }
    setSubmitting(true);
    try {
      const isControlGroup = userGroup === 'cg';

      await api.submitDaily({
        mindfulness_practice: isControlGroup ? null : mindfulnessPractice,
        practice_duration: !isControlGroup && mindfulnessPractice === 'yes' ? parseInt(practiceDuration, 10) || null : null,
        practice_location: !isControlGroup && mindfulnessPractice === 'yes' ? practiceLocation : null,
        stress_level: stressLevel!,
        calm_before: calmBefore!,
        calm_after: calmAfter!,
        sleep_quality: sleepQuality!,
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
      <div style={{ minHeight: '100vh', background: '#FFF6E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #FDE68A', borderTopColor: '#EA8F00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const STEP_COLOR = '#EA8F00';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF8', paddingBottom: 100 }}>
      {/* Header — mirrors mobile's close-to-dashboard button + static title + completion badge */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', color: '#1E293B', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#2D3436', margin: 0 }}>Daily Check-in</p>
        <div style={{ background: '#FFF6E5', borderRadius: 20, padding: '6px 12px' }}>
          <span style={{ color: STEP_COLOR, fontSize: 12, fontWeight: 700 }}>{getCompletionProgress()}%</span>
        </div>
      </div>

      {/* Step progress line — separate from the header, matching mobile's progressBarContainer */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 24px', marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: STEP_COLOR, borderRadius: 4, width: `${stepProgress}%`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 6 }}>Step {getStepDisplayNumber()} of {getStepTotalCount()}</p>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 16px 20px' }}>
        {/* Step 0: Calm (Before), Stress Level & Primary Influencing Factor */}
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Right now I feel calm</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>Select the response that best matches how much you agree</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={calmBefore} onChange={setCalmBefore} color={STEP_COLOR} category="relaxation" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Strongly Disagree</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Strongly Agree</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Stress Level</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How stressed are you feeling?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={stressLevel} onChange={setStressLevel} color="#EF4444" category="stress" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very Low</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Very High</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Primary Influencing Factor</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>Select the single factor that mostly affected your mood today</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {INFLUENCING_FACTORS.map(f => (
                  <button
                    key={f.label}
                    onClick={() => setSelectedFactor(f.label)}
                    style={{
                      padding: '14px 16px', borderRadius: 14, border: `2px solid ${selectedFactor === f.label ? STEP_COLOR : '#DFE6E9'}`,
                      background: selectedFactor === f.label ? '#FFF6E5' : '#F8FAF8',
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

        {/* Step 1: Sleep */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Sleep Quality</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>How well did you sleep last night?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={sleepQuality} onChange={setSleepQuality} color="#3B82F6" category="sleep" />
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

        {/* Step 2: Guided Session */}
        {currentStep === 2 && (
          <div>
            {weeklyVideoId ? (
              <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <div style={{ aspectRatio: '16/9', background: '#000' }}>
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${weeklyVideoId}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={videoTitle || 'Guided Session'}
                    onLoad={() => iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'daily-video' }), '*')}
                  />
                </div>
                <div style={{ padding: 16 }}>
                  <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 15 }}>{videoTitle || "This Week's Guided Session"}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#EA8F00' }}>
                      {watchedSeconds === 0 && !isVideoPlaying
                        ? `Press play above to start ${userGroup === 'cg' ? "today's weekly watch" : "today's guided session"}`
                        : `${userGroup === 'cg' ? 'Watching weekly watch' : 'Watching guided session'} — ${Math.floor(watchedSeconds / 60)}m ${(watchedSeconds % 60).toString().padStart(2, '0')}s watched`}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontStyle: 'italic', color: '#94A3B8', marginTop: 8 }}>
                    Tip: You can watch the {userGroup === 'cg' ? 'weekly video' : 'session video'} first, then tap Next to begin your mindfulness practice.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#FFF6E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EA8F00' }}><Tv size={28} /></div>
                <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 8 }}>No Video This Week</p>
                <p style={{ color: '#636E72', fontSize: 13 }}>No guided session has been assigned for this week. You can proceed to the next step.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Mindfulness Practice */}
        {currentStep === 3 && (
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
                    background: mindfulnessPractice === v ? (v === 'yes' ? '#FFF6E5' : '#FEE2E2') : '#fff',
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
                    min="5"
                    inputMode="numeric"
                    placeholder="Min. 5 minutes"
                    style={{ width: 140, padding: '10px 14px', border: '1.5px solid #DFE6E9', borderRadius: 12, fontSize: 16, outline: 'none', background: '#F8FAF8' }}
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Minimum 5 minutes</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#636E72', display: 'block', marginBottom: 6 }}>Where did you practice?</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRACTICE_LOCATIONS.map(p => (
                      <button
                        key={p}
                        onClick={() => setPracticeLocation(p)}
                        style={{
                          padding: '8px 16px', borderRadius: 20,
                          border: `1.5px solid ${practiceLocation === p ? STEP_COLOR : '#DFE6E9'}`,
                          background: practiceLocation === p ? '#FFF6E5' : '#fff',
                          color: practiceLocation === p ? STEP_COLOR : '#636E72',
                          fontWeight: practiceLocation === p ? 700 : 500, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Calm (After) */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 16, marginBottom: 4 }}>Right now I feel calm</p>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>Select the response that best matches how much you agree</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <LevelButton key={l} level={l} value={calmAfter} onChange={setCalmAfter} color={STEP_COLOR} category="relaxation" />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Strongly Disagree</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Strongly Agree</span>
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
              onClick={handleBack}
              style={{ flex: 1, padding: 14, background: '#F8FAF8', color: '#636E72', border: 'none', borderRadius: 16, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              Back
            </button>
          )}
          {currentStep < 4 ? (
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
