import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';

const PASSAGE_TEXT = `The North Wind and the Sun had a quarrel about which of them was the stronger. While they were disputing with much heat and bluster, a Traveler passed along the road wrapped in a cloak.

Let us agree, said the Sun, that he is the most powerful who can strip that Traveler of his cloak.

The North Wind tried first, blowing as hard as he could. But the harder he blew, the more tightly did the Traveler wrap his cloak around him.

At last the North Wind gave up in despair. Then the Sun shone out warmly. Immediately the Traveler took off his cloak.

And so the North Wind was obliged to confess that the Sun was the more powerful of the two.`;

const MIN_RECORD_SECONDS = 15;
const MAX_RECORD_SECONDS = 45;

interface WeeklyStatus { completed?: boolean; nextReset?: string | null }

export default function WeeklyWhispersPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'intro' | 'recording' | 'review' | 'done'>('loading');
  const [nextReset, setNextReset] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  useEffect(() => {
    api.getWeeklyStatus()
      .then(data => {
        const s = data as WeeklyStatus;
        if (s.completed) {
          setNextReset(s.nextReset || null);
          setStep('done');
        } else {
          setStep('intro');
        }
      })
      .catch(() => setStep('intro'));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setStep('review');
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev + 1 >= MAX_RECORD_SECONDS) {
            stopRecording();
            return MAX_RECORD_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setPopup({ visible: true, type: 'error', title: 'Microphone Error', message: 'Could not access microphone. Please allow microphone permission.' });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const retake = () => {
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setRecordSeconds(0);
    setStep('recording');
  };

  const submit = async () => {
    if (!audioBlob) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'reflection.webm');
      const uploadResult = await api.uploadWeeklyAudio(formData);
      await api.submitWeekly({
        duration: recordSeconds,
        file_key: uploadResult.fileKey,
        file_url: uploadResult.fileUrl,
      });
      navigate('/complete', {
        replace: true,
        state: { title: 'Reflection Saved!', message: 'Your weekly voice reflection has been saved. Keep up the great work!', isDaily: false },
      });
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Upload Failed', message: err instanceof Error ? err.message : 'Failed to save reflection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_COLOR = '#6366F1';

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #C7D2FE', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF2FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>🎙️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>Already Submitted</h2>
          <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.6, marginBottom: 8 }}>You've completed your Weekly Whispers for this week.</p>
          {nextReset && (
            <p style={{ fontSize: 13, color: '#6366F1', fontWeight: 600, marginBottom: 20 }}>
              Next available: {new Date(nextReset).toLocaleDateString()}
            </p>
          )}
          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: 14, background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2FF', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: STEP_COLOR, paddingTop: 'env(safe-area-inset-top, 0px)', padding: '16px 20px 20px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { if (step === 'recording' || step === 'review') { setStep('intro'); } else navigate('/dashboard'); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Weekly Whispers</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Voice reflection journal</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 16px' }}>
        {/* Intro step */}
        {step === 'intro' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
                <div>
                  <p style={{ fontWeight: 700, color: '#2D3436', fontSize: 15 }}>This Week's Passage</p>
                  <p style={{ fontSize: 12, color: '#636E72' }}>Read aloud when ready</p>
                </div>
              </div>
              <div style={{ background: '#F8F8FF', borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 14, color: '#2D3436', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{PASSAGE_TEXT}</p>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
              <p style={{ fontWeight: 700, color: '#2D3436', marginBottom: 8 }}>Instructions</p>
              <ul style={{ fontSize: 13, color: '#636E72', lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Read the passage aloud naturally</li>
                <li>Record for 15–45 seconds</li>
                <li>Find a quiet place</li>
              </ul>
            </div>
            <button
              onClick={() => setStep('recording')}
              style={{ width: '100%', padding: 16, background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            >
              Let's Go 🎙️
            </button>
          </div>
        )}

        {/* Recording step */}
        {step === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              {/* Animated ring */}
              <div style={{
                width: 120, height: 120, borderRadius: 60,
                background: isRecording ? '#EDE9FE' : '#F6F8F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                border: `4px solid ${isRecording ? STEP_COLOR : '#DFE6E9'}`,
                animation: isRecording ? 'pulse 1.5s ease infinite' : 'none',
              }}>
                <span style={{ fontSize: 48 }}>🎙️</span>
              </div>
              <style>{`@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 16px rgba(99,102,241,0); } }`}</style>

              <div style={{ fontSize: 48, fontWeight: 800, color: isRecording ? STEP_COLOR : '#636E72', fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}
              </div>
              <p style={{ fontSize: 13, color: '#636E72', marginBottom: 20 }}>
                {isRecording
                  ? recordSeconds < MIN_RECORD_SECONDS
                    ? `Keep going... ${MIN_RECORD_SECONDS - recordSeconds}s more to stop`
                    : 'Recording in progress — tap Stop when done'
                  : 'Tap the button to start recording'}
              </p>

              {/* Progress bar */}
              {isRecording && (
                <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, marginBottom: 20 }}>
                  <div style={{ height: '100%', background: STEP_COLOR, borderRadius: 3, width: `${(recordSeconds / MAX_RECORD_SECONDS) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              )}

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{ padding: '14px 32px', background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 30, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  disabled={recordSeconds < MIN_RECORD_SECONDS}
                  style={{
                    padding: '14px 32px', background: recordSeconds >= MIN_RECORD_SECONDS ? '#EF4444' : '#DFE6E9',
                    color: '#fff', border: 'none', borderRadius: 30, fontWeight: 700, fontSize: 16,
                    cursor: recordSeconds >= MIN_RECORD_SECONDS ? 'pointer' : 'not-allowed',
                  }}
                >
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && audioUrl && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✅</div>
              <p style={{ fontWeight: 800, color: '#2D3436', fontSize: 18, marginBottom: 4 }}>Recording Complete!</p>
              <p style={{ color: '#636E72', fontSize: 13, marginBottom: 20 }}>Duration: {recordSeconds}s</p>
              <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={retake} style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 16, fontWeight: 600, cursor: 'pointer' }}>
                  Retake
                </button>
                <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: 14, background: STEP_COLOR, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Uploading...' : 'Submit ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
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
