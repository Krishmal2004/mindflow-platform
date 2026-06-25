import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getUserName } from '@/lib/auth';
import { PopupModal } from '@/components/PopupModal';
import appLogo from '@/assets/app-icon.png';

const MINDFULNESS_QUOTES = [
  { text: 'Breathe in peace, breathe out stress.', author: 'Unknown' },
  { text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', author: 'Thich Nhat Hanh' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { text: 'Mindfulness is a way of befriending ourselves and our experience.', author: 'Jon Kabat-Zinn' },
  { text: 'The greatest weapon against stress is our ability to choose one thought over another.', author: 'William James' },
  { text: 'Be where you are, not where you think you should be.', author: 'Unknown' },
];

const FUN_FACTS = [
  { text: "Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs.", author: 'Fun Fact' },
  { text: "A day on Venus is longer than a year on Venus.", author: 'Fun Fact' },
  { text: "The shortest war in history lasted 38 to 45 minutes.", author: 'Fun Fact' },
  { text: "Octopuses have three hearts, two of which stop beating when they swim.", author: 'Fun Fact' },
  { text: "Bananas are berries, but strawberries aren't.", author: 'Fun Fact' },
];

interface JourneyStep {
  id: string;
  statusKey: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  route: string;
  icon: (color: string) => React.ReactNode;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'daily', statusKey: 'daily', title: 'Daily Sliders', subtitle: 'Track your daily mood',
    color: '#D97706', bgColor: '#FFFBEB', route: '/dashboard/daily',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    id: 'weekly', statusKey: 'weekly', title: 'Weekly Whispers', subtitle: 'Voice reflection journal',
    color: '#6366F1', bgColor: '#EEF2FF', route: '/dashboard/weekly',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    id: 'thrive', statusKey: 'thrive', title: 'Thrive Tracker', subtitle: 'WEMWBS wellbeing scale',
    color: '#749F82', bgColor: '#E6F4EA', route: '/dashboard/thrive',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'stress', statusKey: 'stress', title: 'Stress Snapshot', subtitle: 'PSS-10 stress assessment',
    color: '#E07A5F', bgColor: '#FFF4F2', route: '/dashboard/stress',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    id: 'mirror', statusKey: 'mindful', title: 'Mindful Mirror', subtitle: 'FFMQ mindfulness scale',
    color: '#0D9488', bgColor: '#F0FDFA', route: '/dashboard/mirror',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3" />
      </svg>
    ),
  },
];

interface StepStatus { completed: boolean; nextReset?: string | null }
interface JourneyStatusResponse {
  daily?: StepStatus;
  weekly?: StepStatus;
  thrive?: StepStatus;
  stress?: StepStatus;
  mindful?: StepStatus;
}
interface DashboardSummary { group?: string }

type ModalType = 'success' | 'error' | 'warning' | 'info';

export default function DashboardPage() {
  const navigate = useNavigate();
  const userName = getUserName();

  const [journeyStatuses, setJourneyStatuses] = useState<JourneyStatusResponse>({});
  const [researchGroup, setResearchGroup] = useState<string>('');
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  const [modal, setModal] = useState<{
    visible: boolean; type: ModalType; title: string; message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      api.getJourneyStatus().catch(() => ({})),
      api.getDashboardSummary().catch(() => ({})),
    ]).then(([js, summary]) => {
      setJourneyStatuses(js as JourneyStatusResponse);
      setResearchGroup((summary as DashboardSummary).group || '');
      setSummaryLoaded(true);
    });
  }, []);

  // Quote rotation every 20s
  useEffect(() => {
    const quotes = researchGroup === 'cg' ? FUN_FACTS : MINDFULNESS_QUOTES;
    quoteIntervalRef.current = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % quotes.length);
        setQuoteFade(true);
      }, 400);
    }, 20000);
    return () => { if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current); };
  }, [researchGroup]);

  const isUnassigned = summaryLoaded && researchGroup === '';

  const getStatusForStep = (step: JourneyStep): StepStatus => {
    const key = step.statusKey as keyof JourneyStatusResponse;
    return journeyStatuses[key] || { completed: false };
  };

  // First incomplete step index
  const activeStepIndex = (() => {
    for (let i = 0; i < JOURNEY_STEPS.length; i++) {
      if (!getStatusForStep(JOURNEY_STEPS[i]).completed) return i;
    }
    return JOURNEY_STEPS.length - 1;
  })();

  const isSequenceLocked = (index: number) => index > activeStepIndex;

  const isTimeLocked = (step: JourneyStep) => {
    const status = getStatusForStep(step);
    if (!status.nextReset) return false;
    return new Date(status.nextReset) > new Date();
  };

  const handleStepPress = (step: JourneyStep, index: number) => {
    const status = getStatusForStep(step);

    if (isSequenceLocked(index)) {
      setModal({ visible: true, type: 'info', title: 'Step Locked', message: 'Complete the previous steps to unlock this one.' });
      return;
    }
    if (status.completed && isTimeLocked(step)) {
      const reset = status.nextReset ? new Date(status.nextReset).toLocaleDateString() : 'soon';
      setModal({ visible: true, type: 'info', title: 'Already Completed', message: `You have completed this step. It will reset on ${reset}.` });
      return;
    }
    navigate(step.route);
  };

  const quotes = researchGroup === 'cg' ? FUN_FACTS : MINDFULNESS_QUOTES;
  const currentQuote = quotes[quoteIndex % quotes.length];
  const showQuoteCard = researchGroup !== '';

  const quoteGradient = researchGroup === 'cg'
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : 'linear-gradient(135deg, #749F82 0%, #5D856D 100%)';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #FFFFFF 100%)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{ maxWidth: 430, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={appLogo} alt="MindFlow" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: '#2D3436', letterSpacing: -0.5 }}>MindFlow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: '#749F82', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 20px 0' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase' }}>{greeting},</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2D3436', marginTop: 4 }}>HELLO, {userName.toUpperCase()}!</h1>
        </div>

        {/* Unassigned banner */}
        {isUnassigned && (
          <div style={{ background: '#FFFBEB', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, color: '#D97706', fontSize: 14 }}>Research Group Pending</p>
                <p style={{ fontSize: 12, color: '#636E72', lineHeight: 1.5 }}>Complete your profile to get assigned to a research group.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/about-me')}
              style={{ background: '#D97706', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              Complete About Me Profile
            </button>
          </div>
        )}

        {/* Quote / Fun Fact card */}
        {showQuoteCard && (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ background: quoteGradient, padding: '24px 20px', position: 'relative' }}>
              <div style={{ opacity: 0.15, position: 'absolute', top: 10, right: 14, fontSize: 48, color: '#fff', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
              <div style={{ opacity: quoteFade ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                <p style={{ color: '#fff', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 10 }}>
                  "{currentQuote.text}"
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>— {currentQuote.author}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                {quotes.map((_, i) => (
                  <div key={i} style={{ width: i === quoteIndex % quotes.length ? 20 : 6, height: 6, borderRadius: 3, background: i === quoteIndex % quotes.length ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journey Roadmap */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>YOUR JOURNEY</p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Follow the path to mindfulness</p>
        </div>

        <div style={{ position: 'relative', background: 'rgba(255,255,255,0.5)', borderRadius: 24, padding: '20px 16px', border: '1px solid rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
          {/* SVG S-curve path */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 300 520">
            <defs>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.7" />
                <stop offset="25%" stopColor="#6366F1" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#749F82" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#E07A5F" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <path
              d="M220 40 C270 80, 30 100, 80 160 C130 220, 270 230, 220 290 C170 350, 30 360, 80 410 C130 460, 260 470, 220 510"
              stroke="url(#roadGrad)" strokeWidth="3" fill="none" strokeDasharray="8 5" strokeLinecap="round"
            />
          </svg>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {JOURNEY_STEPS.map((step, index) => {
              const status = getStatusForStep(step);
              const isCompleted = status.completed;
              const isLocked = isSequenceLocked(index);
              const isRight = index % 2 === 0;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepPress(step, index)}
                  style={{
                    display: 'flex',
                    flexDirection: isRight ? 'row' : 'row-reverse',
                    alignItems: 'center',
                    gap: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    opacity: isLocked ? 0.5 : 1,
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  {/* Circle node */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCompleted ? '#749F82' : step.bgColor,
                      border: isCompleted ? 'none' : `3px solid ${step.color}`,
                      boxShadow: isCompleted ? '0 4px 14px rgba(116,159,130,0.4)' : `0 4px 14px ${step.color}22`,
                      transition: 'all 0.3s',
                    }}
                  >
                    {isCompleted ? (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isLocked ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    ) : (
                      step.icon(step.color)
                    )}
                  </div>

                  {/* Label card */}
                  <div
                    style={{
                      flex: 1,
                      background: isCompleted ? '#ECFDF5' : '#fff',
                      borderRadius: 16,
                      padding: '10px 16px',
                      border: `1px solid ${isCompleted ? '#749F82' : 'rgba(0,0,0,0.06)'}`,
                      textAlign: isRight ? 'left' : 'right',
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: isCompleted ? '#749F82' : step.color, marginBottom: 2 }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 11, color: isCompleted ? '#64C59A' : isLocked ? '#94A3B8' : '#636E72' }}>
                      {isCompleted ? 'Completed ✓' : isLocked ? 'Locked' : step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      <PopupModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </div>
  );
}
