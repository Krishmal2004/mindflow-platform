import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';

const QUESTIONS = [
  "I notice changes in my body, such as whether my breathing slows down or speeds up.",
  "I'm good at finding words to describe my feelings.",
  "I find myself doing things without paying attention.",
  "I tell myself I shouldn't be feeling the way I'm feeling.",
  "When I have distressing thoughts or images, I just notice them and let them go.",
  "I pay attention to sensations, such as the wind in my hair or sun on my face.",
  "I can easily put my beliefs, opinions, and expectations into words.",
  "I rush through activities without being really attentive to them.",
  "I make judgments about whether my thoughts are good or bad.",
  "When I have distressing thoughts or images, I feel calm soon after.",
  "I pay attention to sounds, such as clocks ticking, birds chirping, or cars passing.",
  "It's hard for me to find the words to describe what I'm thinking.",
  "I get so focused on the goal I want to achieve that I lose touch with what I am doing right now to get there.",
  "I think some of my emotions are bad or inappropriate and I shouldn't feel them.",
  "When I have distressing thoughts or images, I am able to just notice them without reacting.",
];

const SCALE = [
  { value: 1, label: 'Never or very rarely true' },
  { value: 2, label: 'Rarely true' },
  { value: 3, label: 'Sometimes true' },
  { value: 4, label: 'Often true' },
  { value: 5, label: 'Very often or always true' },
];

const COLOR = '#0D9488';
const BG_COLOR = '#F0FDFA';
const PREFIX = 'In the last month, how often has each statement been true for you:';

interface StatusData { completed?: boolean }

export default function MindfulMirrorPage() {
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
    api.getMindfulStatus()
      .then(data => {
        if ((data as StatusData).completed) {
          navigate('/complete', { replace: true, state: { title: 'Already Completed', message: 'You have already completed the Mindful Mirror for this period.', isDaily: false } });
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
      await api.submitMindful(payload);
      navigate('/complete', {
        replace: true,
        state: { title: 'Mindful Mirror Complete!', message: 'Your FFMQ-15 mindfulness assessment has been saved.', isDaily: false },
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
        <div style={{ width: 36, height: 36, border: `3px solid #CCFBF1`, borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3" />
            </svg>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLOR, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>MINDFULNESS SCALE</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>Mindful Mirror</h1>
          <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.6, marginBottom: 8 }}>Five Facet Questionnaire (FFMQ-15)</p>
          <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.7, marginBottom: 24 }}>
            Rate how often each statement is true for you in your <strong>day-to-day life</strong>.
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>{QUESTIONS.length} questions · 3–6 minutes</p>
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
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Mindful Mirror</p>
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
        <p style={{ fontSize: 13, color: '#636E72', fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }}>{PREFIX}</p>

        <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 100, display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#2D3436', lineHeight: 1.6, textAlign: 'center', width: '100%' }}>
            {QUESTIONS[qIndex]}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SCALE.map(s => (
            <button
              key={s.value}
              onClick={() => handleAnswer(s.value)}
              style={{
                width: '100%', padding: '14px 20px', textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${answers[qIndex] === s.value ? COLOR : '#DFE6E9'}`,
                borderRadius: 14, fontSize: 14, fontWeight: answers[qIndex] === s.value ? 700 : 500,
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
