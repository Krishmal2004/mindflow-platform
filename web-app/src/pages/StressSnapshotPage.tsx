import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';

const QUESTIONS = [
  "been upset because of something that happened unexpectedly?",
  "felt that you were unable to control the important things in your life?",
  'felt nervous and "stressed"?',
  "felt confident about your ability to handle your personal problems?",
  "felt that things were going your way?",
  "found that you could not cope with all the things that you had to do?",
  "been able to control irritations in your life?",
  "felt that you were on top of things?",
  "been angered because of things that were outside of your control?",
  "felt difficulties were piling up so high that you could not overcome them?",
];

const SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Almost Never' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Fairly Often' },
  { value: 5, label: 'Very Often' },
];

const COLOR = '#E07A5F';
const BG_COLOR = '#FFF4F2';
const PREFIX = 'In the last month, how often have you...';

interface StatusData { completed?: boolean }

export default function StressSnapshotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'intro' | 'questionnaire'>('loading');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  useEffect(() => {
    api.getStressStatus()
      .then(data => {
        if ((data as StatusData).completed) {
          navigate('/complete', { replace: true, state: { title: 'Already Completed', message: 'You have already completed the Stress Snapshot for this period.', isDaily: false } });
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
    if (qIndex < QUESTIONS.length - 1) {
      setTimeout(() => setQIndex(prev => prev + 1), 250);
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
      await api.submitStress(payload);
      navigate('/complete', {
        replace: true,
        state: { title: 'Stress Snapshot Complete!', message: 'Your PSS-10 stress assessment has been saved.', isDaily: false },
      });
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: BG_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid #FECACA`, borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: BG_COLOR, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: BG_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `3px solid ${COLOR}` }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLOR, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>MONTHLY ASSESSMENT</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>Stress Snapshot</h1>
          <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.6, marginBottom: 8 }}>Perceived Stress Scale (PSS-10)</p>
          <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.7, marginBottom: 24 }}>
            The questions below ask about your feelings and thoughts during the <strong>last month</strong>.
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>{QUESTIONS.length} questions · 3–5 minutes</p>
          <button onClick={() => setStep('questionnaire')} style={{ width: '100%', padding: 16, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Begin Assessment
          </button>
        </div>
      </div>
    );
  }

  const progress = Math.round(((qIndex + (answers[qIndex] ? 1 : 0)) / QUESTIONS.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: BG_COLOR, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: COLOR, paddingTop: 'env(safe-area-inset-top, 0px)', padding: '16px 20px 20px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => qIndex > 0 ? setQIndex(p => p - 1) : setStep('intro')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>Question {qIndex + 1} of {QUESTIONS.length}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Stress Snapshot</p>
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

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '24px 16px' }}>
        {/* Prefix */}
        <p style={{ fontSize: 13, color: '#636E72', fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }}>{PREFIX}</p>

        {/* Question */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 100, display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2D3436', lineHeight: 1.6, textAlign: 'center', width: '100%' }}>
            ...{QUESTIONS[qIndex]}
          </p>
        </div>

        {/* Scale */}
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

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #DFE6E9', padding: '12px 16px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)', zIndex: 50 }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', gap: 12 }}>
          {qIndex > 0 && (
            <button onClick={() => setQIndex(p => p - 1)} style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 16, fontWeight: 600, cursor: 'pointer' }}>Back</button>
          )}
          {qIndex < QUESTIONS.length - 1 ? (
            <button onClick={() => { if (answers[qIndex]) setQIndex(p => p + 1); }} disabled={!answers[qIndex]}
              style={{ flex: 2, padding: 14, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: answers[qIndex] ? 'pointer' : 'not-allowed', opacity: answers[qIndex] ? 1 : 0.5 }}>Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !answers[qIndex]}
              style={{ flex: 2, padding: 14, background: COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer', opacity: submitting || !answers[qIndex] ? 0.6 : 1 }}>
              {submitting ? 'Saving...' : 'Submit ✓'}
            </button>
          )}
        </div>
      </div>

      <PopupModal visible={popup.visible} type={popup.type} title={popup.title} message={popup.message} onClose={() => setPopup(p => ({ ...p, visible: false }))} />
    </div>
  );
}
