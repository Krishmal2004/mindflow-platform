import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';
import { PageShell } from '@/components/PageShell';
import { LeavesDecoration, ThriveIllustration } from '@/components/Illustrations';

const QUESTIONS = [
  "I've been feeling optimistic about the future",
  "I've been feeling useful",
  "I've been feeling relaxed",
  "I've been feeling interested in other people",
  "I've had energy to spare",
  "I've been dealing with problems well",
  "I've been thinking clearly",
  "I've been feeling good about myself",
  "I've been feeling close to other people",
  "I've been feeling confident",
  "I've been able to make up my own mind about things",
  "I've been feeling loved",
  "I've been interested in new things",
  "I've been feeling cheerful",
];

const SCALE = [
  { value: 1, label: 'None of the time' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Some of the time' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'All of the time' },
];

const COLOR = '#749F82';
const BG_COLOR = '#E6F4EA';
const PREFIX = 'In the last 2 weeks, how often have you felt...';

interface StatusData { completed?: boolean }

export default function ThriveTrackerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'done' | 'intro' | 'questionnaire'>('loading');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    api.getThriveStatus()
      .then(data => {
        if ((data as StatusData).completed) {
          navigate('/complete', { replace: true, state: { title: 'Great Job!', message: 'You have successfully completed the Thrive Tracker. See you in 2 weeks!', isDaily: false, themeColor: COLOR, themeBgColor: BG_COLOR } });
        } else {
          setStep('intro');
        }
      })
      .catch(() => setStep('intro'));
  }, [navigate]);

  const handleAnswer = (value: number) => {
    if (startTimeRef.current === null) startTimeRef.current = Date.now();
    const next = { ...answers, [qIndex]: value };
    setAnswers(next);
    // Clear any pending advance first so rapid re-clicks on the same question
    // reset the timer instead of stacking multiple advances.
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (qIndex < QUESTIONS.length - 1) {
      advanceTimeoutRef.current = setTimeout(() => {
        advanceTimeoutRef.current = null;
        setQIndex(prev => prev + 1);
      }, 250);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      setPopup({ visible: true, type: 'warning', title: 'Incomplete', message: 'Please answer all questions.' });
      return;
    }
    setSubmitting(true);
    try {
      const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
      const payload: Record<string, unknown> = { duration };
      QUESTIONS.forEach((_, i) => { payload[`q${i + 1}`] = answers[i]; });
      await api.submitThrive(payload);
      navigate('/complete', {
        replace: true,
        state: { title: 'Great Job!', message: 'You have successfully completed the Thrive Tracker. See you in 2 weeks!', isDaily: false, themeColor: COLOR, themeBgColor: BG_COLOR },
      });
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: BG_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${BG_COLOR}`, borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      </PageShell>
    );
  }

  if (step === 'intro') {
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: BG_COLOR, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.3, pointerEvents: 'none' }} className="animate-fade-in">
          <LeavesDecoration width={280} height={280} color={COLOR} />
        </div>
        <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }} className="animate-enter">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ThriveIllustration width={150} height={133} color={COLOR} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2D3436', marginBottom: 4 }}>Mental Wellbeing</h1>
          <p style={{ fontSize: 15, color: '#636E72', marginBottom: 28 }}>Warwick-Edinburgh Scale (WEMWBS)</p>
          <div style={{ background: BG_COLOR, borderRadius: 24, padding: 24, width: '100%', textAlign: 'left', marginBottom: 32 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2D3436', marginBottom: 12 }}>Instructions</p>
            <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.6 }}>
              Below are some statements about feelings and thoughts. Please select the option that best describes your experience over the last 2 weeks.
            </p>
          </div>
          <button onClick={() => setStep('questionnaire')} style={{ width: '100%', padding: 18, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
            Start Assessment →
          </button>
        </div>
      </div>
      </PageShell>
    );
  }

  // Header badge = answered-question completion percentage; the step-position bar below
  // it is a separate percentage — matching mobile's ThriveTrackerScreen getProgress() vs.
  // the (currentQuestionIndex+1)/total bar fill.
  const completionProgress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);
  const stepProgress = Math.round(((qIndex + 1) / QUESTIONS.length) * 100);

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => qIndex > 0 ? setQIndex(p => p - 1) : setStep('intro')}
          style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', color: '#1E293B', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#2D3436', margin: 0 }}>Thrive Tracker</p>
        <div style={{ background: BG_COLOR, borderRadius: 20, padding: '6px 12px' }}>
          <span style={{ color: COLOR, fontSize: 12, fontWeight: 700 }}>{completionProgress}%</span>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 24px', marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: COLOR, borderRadius: 4, width: `${stepProgress}%`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 6 }}>Question {qIndex + 1} of {QUESTIONS.length}</p>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 16px' }}>
        {/* Instruction line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '14px 20px', borderRadius: 20, marginBottom: 20, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 14, color: '#475569', fontWeight: 600, margin: 0 }}>{PREFIX}</p>
        </div>

        {/* Question */}
        <div style={{ background: '#fff', borderRadius: 30, padding: 24, marginBottom: 20, boxShadow: '0 6px 16px rgba(0,0,0,0.04)', minHeight: 320 }}>
          <div style={{ display: 'inline-block', background: BG_COLOR, padding: '6px 12px', borderRadius: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: COLOR, textTransform: 'uppercase', letterSpacing: 1 }}>Question {qIndex + 1}</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2D3436', lineHeight: 1.4, marginBottom: 24 }}>
            {QUESTIONS[qIndex]}
          </p>

          {/* Scale options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SCALE.map(s => (
              <button
                key={s.value}
                onClick={() => handleAnswer(s.value)}
                style={{
                  width: '100%', padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${answers[qIndex] === s.value ? COLOR : '#DFE6E9'}`,
                  borderRadius: 16, fontSize: 15, fontWeight: answers[qIndex] === s.value ? 700 : 500,
                  background: answers[qIndex] === s.value ? BG_COLOR : '#fff',
                  color: answers[qIndex] === s.value ? COLOR : '#2D3436',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>{s.label}</span>
                {answers[qIndex] === s.value && <span style={{ fontSize: 18 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #DFE6E9', padding: '12px 16px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)', zIndex: 50 }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', gap: 12 }}>
          {qIndex > 0 && (
            <button onClick={() => setQIndex(p => p - 1)} style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 16, fontWeight: 600, cursor: 'pointer' }}>Back</button>
          )}
          {qIndex < QUESTIONS.length - 1 ? (
            <button
              onClick={() => { if (answers[qIndex]) setQIndex(p => p + 1); }}
              disabled={!answers[qIndex]}
              style={{ flex: 2, padding: 14, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: answers[qIndex] ? 'pointer' : 'not-allowed', opacity: answers[qIndex] ? 1 : 0.5 }}
            >Next →</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !answers[qIndex]}
              style={{ flex: 2, padding: 14, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer', opacity: submitting || !answers[qIndex] ? 0.6 : 1 }}
            >{submitting ? 'Saving...' : 'Submit ✓'}</button>
          )}
        </div>
      </div>

      <PopupModal visible={popup.visible} type={popup.type} title={popup.title} message={popup.message} onClose={() => setPopup(p => ({ ...p, visible: false }))} />
    </div>
    </PageShell>
  );
}
