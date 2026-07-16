import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { getUserName } from '@/lib/auth';
import { PopupModal } from '@/components/PopupModal';
import { PageShell } from '@/components/PageShell';
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
    color: '#EA8F00', bgColor: '#FFF6E5', route: '/dashboard/daily',
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
    color: '#3E7BFA', bgColor: '#E8F0FE', route: '/dashboard/weekly',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    id: 'thrive', statusKey: 'thrive', title: 'Thrive Tracker', subtitle: 'WEMWBS wellbeing scale',
    color: '#0F9B71', bgColor: '#E7F9F1', route: '/dashboard/thrive',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'stress', statusKey: 'stress', title: 'Stress Snapshot', subtitle: 'PSS-10 stress assessment',
    color: '#E5573F', bgColor: '#FDEEEB', route: '/dashboard/stress',
    icon: (c) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    id: 'mirror', statusKey: 'mindful', title: 'Mindful Mirror', subtitle: 'FFMQ mindfulness scale',
    color: '#7C5CE0', bgColor: '#F2EEFC', route: '/dashboard/mirror',
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
  const [hasError, setHasError] = useState(false);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  const [modal, setModal] = useState<{
    visible: boolean; type: ModalType; title: string; message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDashboardData = () => {
    setHasError(false);
    setSummaryLoaded(false);
    Promise.all([
      api.getJourneyStatus(),
      api.getDashboardSummary(),
    ]).then(([js, summary]) => {
      setJourneyStatuses(js as JourneyStatusResponse);
      setResearchGroup((summary as DashboardSummary).group || '');
    }).catch((err) => {
      console.error('Dashboard status check failed:', err);
      setHasError(true);
    }).finally(() => {
      setSummaryLoaded(true);
    });
  };

  useEffect(() => {
    loadDashboardData();
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

  // Mirrors mobile DashboardScreen's renderNode: every node is hard-locked until the
  // researcher assigns a research group, regardless of individual step completion state.
  const isNodeLocked = (index: number) => isUnassigned || isSequenceLocked(index);

  const handleStepPress = (step: JourneyStep, index: number) => {
    const status = getStatusForStep(step);

    if (isUnassigned) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
      setModal({
        visible: true, type: 'info', title: 'Group Not Yet Assigned',
        message: 'Your researcher has not assigned you to a study group yet. Data entry will be available once your Research ID is set. In the meantime, please complete your About Me profile.',
      });
      return;
    }
    if (isSequenceLocked(index)) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
      setModal({ visible: true, type: 'info', title: 'Step Locked', message: 'Complete the previous steps to unlock this one.' });
      return;
    }
    if (status.completed && isTimeLocked(step)) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      const reset = status.nextReset ? new Date(status.nextReset).toLocaleDateString() : 'soon';
      setModal({ visible: true, type: 'info', title: 'Already Completed', message: `You have completed this step. It will reset on ${reset}.` });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    navigate(step.route);
  };

  const quotes = researchGroup === 'cg' ? FUN_FACTS : MINDFULNESS_QUOTES;
  const currentQuote = quotes[quoteIndex % quotes.length];
  const showQuoteCard = researchGroup !== '';

  const quoteGradient = researchGroup === 'cg'
    ? 'linear-gradient(135deg, #F59E0B 0%, #EA8F00 100%)'
    : 'linear-gradient(135deg, #0F9B71 0%, #0B7A59 100%)';

  const completedStepsCount = JOURNEY_STEPS.filter((_, index) => {
    const status = getStatusForStep(JOURNEY_STEPS[index]);
    return status.completed && !isUnassigned;
  }).length;
  const completionPercentage = Math.round((completedStepsCount / JOURNEY_STEPS.length) * 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (!summaryLoaded) {
    return (
      <PageShell>
        <div style={{ minHeight: '100vh', background: '#F8FAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#0F9B71', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>Loading your journey...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageShell>
    );
  }

  if (hasError) {
    return (
      <PageShell>
        <div style={{ minHeight: '100vh', background: '#F8FAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <AlertTriangle size={48} color="#E5573F" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D3436', margin: '0 0 8px' }}>Failed to Load Dashboard</h2>
          <p style={{ fontSize: 14, color: '#636E72', margin: '0 0 20px', lineHeight: 1.5 }}>
            We couldn't retrieve your journey progress. Please check your connection and try again.
          </p>
          <button
            onClick={loadDashboardData}
            style={{
              background: '#0F9B71',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15,155,113,0.2)',
            }}
          >
            Try Again
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: researchGroup === 'cg' ? 'linear-gradient(135deg, #FFFDF5 0%, #FFF8EC 50%, #FFFFFF 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #FFFFFF 100%)', paddingBottom: 80 }}>
      {/* CSS Styles for Micro-interactions */}
      <style>{`
        .journey-step-row {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .journey-step-row:active {
          transform: scale(0.98);
        }
        .journey-step-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .journey-step-row:hover .journey-step-card:not(.locked) {
          transform: translateX(4px);
          background-color: #ffffff !important;
          box-shadow: 0 12px 20px rgba(15, 155, 113, 0.08) !important;
          border-color: rgba(15, 155, 113, 0.25) !important;
        }
        .journey-step-card-active {
          animation: activePulse 3s infinite ease-in-out;
        }
        @keyframes activePulse {
          0%, 100% {
            border-color: rgba(15, 155, 113, 0.25);
            box-shadow: 0 4px 20px rgba(15, 155, 113, 0.06);
          }
          50% {
            border-color: rgba(15, 155, 113, 0.5);
            box-shadow: 0 6px 24px rgba(15, 155, 113, 0.12);
          }
        }
        @keyframes activePulseAmber {
          0%, 100% {
            border-color: rgba(217, 119, 6, 0.25);
            box-shadow: 0 4px 20px rgba(217, 119, 6, 0.06);
          }
          50% {
            border-color: rgba(217, 119, 6, 0.5);
            box-shadow: 0 6px 24px rgba(217, 119, 6, 0.12);
          }
        }
      `}</style>

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
            <div style={{ width: 36, height: 36, borderRadius: 18, background: '#0F9B71', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ── JOURNEY/ACTIVITIES — Hero Dashboard Section ── */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px 20px 0', boxSizing: 'border-box' }}>
        <div style={{
          position: 'relative',
          background: isUnassigned ? 'rgba(255,255,255,0.92)' : (researchGroup === 'cg' ? '#FFF8EC' : 'rgba(255,255,255,0.92)'),
          borderRadius: 24,
          padding: '20px 18px',
          border: `1px solid ${researchGroup === 'cg' ? 'rgba(217,119,6,0.12)' : 'rgba(15,155,113,0.1)'}`,
          boxShadow: researchGroup === 'cg' ? '0 10px 30px rgba(217,119,6,0.06)' : '0 10px 30px rgba(15,155,113,0.06)',
          overflow: 'hidden'
        }}>
          {/* Header & Progress Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: researchGroup === 'cg' ? '#92400E' : '#0F9B71', letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
                {researchGroup === 'cg' ? 'YOUR ACTIVITIES' : 'YOUR JOURNEY'}
              </p>
              <p style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, margin: '2px 0 0' }}>
                {researchGroup === 'cg' ? 'Weekly Check-Ins' : 'Mindfulness Roadmap'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{completedStepsCount}/{JOURNEY_STEPS.length} Steps</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: researchGroup === 'cg' ? '#D97706' : '#0F9B71', marginLeft: 6 }}>{completionPercentage}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              background: researchGroup === 'cg'
                ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                : 'linear-gradient(90deg, #10B981, #059669)',
              borderRadius: 3,
              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>

          {/* Timeline Wrapper */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Elegant Vertical Path Tracer Behind Nodes */}
            <div style={{
              position: 'absolute',
              left: 42,
              top: 28,
              bottom: 28,
              width: 3,
              background: '#E2E8F0',
              borderRadius: 1.5,
              zIndex: 1,
            }}>
              <div style={{
                width: '100%',
                height: `${Math.min(100, (completedStepsCount / Math.max(1, JOURNEY_STEPS.length - 1)) * 100)}%`,
                background: researchGroup === 'cg'
                  ? 'linear-gradient(to bottom, #F59E0B, #D97706)'
                  : 'linear-gradient(to bottom, #10B981, #0F9B71)',
                borderRadius: 1.5,
                transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>

            {JOURNEY_STEPS.map((step, index) => {
              const status = getStatusForStep(step);
              const isCompleted = status.completed && !isUnassigned;
              const isLocked = isNodeLocked(index);

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepPress(step, index)}
                  className={`journey-step-row ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                  role="button"
                  aria-label={`Step ${index + 1}: ${step.title}. ${isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Available'}`}
                  aria-disabled={isLocked}
                  aria-describedby={`step-desc-${step.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 4px',
                    opacity: isLocked ? 0.6 : 1,
                    width: '100%',
                    textAlign: 'left',
                    position: 'relative',
                    zIndex: 2,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Circle Timeline Node */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      background: isCompleted
                          ? (researchGroup === 'cg' ? '#D97706' : '#10B981')
                          : isLocked ? '#F1F5F9' : step.bgColor,
                        border: isCompleted ? 'none' : isLocked ? '2px solid #E2E8F0' : `2px solid ${step.color}`,
                        boxShadow: isCompleted ? '0 4px 10px rgba(16,185,129,0.2)' : isLocked ? 'none' : `0 4px 10px ${step.color}15`,
                        color: isCompleted ? '#ffffff' : isLocked ? '#94A3B8' : step.color,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 2,
                      }}
                    >
                      {isCompleted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isLocked ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      ) : (
                        step.icon(step.color)
                      )}
                    </div>
                  </div>

                  {/* Info Card - Left-aligned text fixes screen width alignment */}
                  <div
                    className={`journey-step-card ${index === activeStepIndex ? 'journey-step-card-active' : ''} ${isLocked ? 'locked' : ''}`}
                    id={`step-desc-${step.id}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: isCompleted ? 'rgba(240, 253, 244, 0.5)' : isLocked ? 'rgba(248, 250, 252, 0.4)' : '#ffffff',
                      borderRadius: 16,
                      padding: '12px 16px',
                      border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : index === activeStepIndex ? 'rgba(15, 155, 113, 0.25)' : 'rgba(226, 232, 240, 0.8)'}`,
                      borderLeft: index === activeStepIndex ? `4px solid ${step.color}` : undefined,
                      boxShadow: index === activeStepIndex ? '0 4px 12px rgba(0, 0, 0, 0.02)' : 'none',
                      position: 'relative',
                    }}
                  >
                    {/* Active pulse dot */}
                    {index === activeStepIndex && !isLocked && (
                      <span style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: researchGroup === 'cg' ? '#D97706' : '#10B981',
                        boxShadow: researchGroup === 'cg' ? '0 0 8px #D97706' : '0 0 8px #10B981',
                      }} />
                    )}
                    <p style={{ fontSize: 13, fontWeight: 700, color: isCompleted ? '#065F46' : isLocked ? '#94A3B8' : '#0F172A', margin: 0 }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 11, color: isCompleted ? '#059669' : isLocked ? '#CBD5E1' : '#64748B', margin: '4px 0 0' }}>
                      {isCompleted ? 'Completed ✓' : isLocked ? 'Locked' : step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content below journey panel (hides when scrolling down) */}
      <div style={{
        maxWidth: 430,
        margin: '0 auto',
        padding: '20px 20px 0',
        boxSizing: 'border-box',
        opacity: Math.max(0, 1 - scrollY / 120),
        transform: `translateY(${-Math.min(20, scrollY * 0.15)}px)`,
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
        pointerEvents: scrollY >= 120 ? 'none' : 'auto'
      }}>
        {/* Greeting */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase' }}>{greeting},</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D3436', marginTop: 2 }}>HELLO, {userName.toUpperCase()}!</h1>
        </div>

        {/* Unassigned banner */}
        {isUnassigned && (
          <div style={{ background: '#FFF6E5', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} color="#EA8F00" />
              <div>
                <p style={{ fontWeight: 700, color: '#EA8F00', fontSize: 14 }}>Research Group Pending</p>
                <p style={{ fontSize: 12, color: '#636E72', lineHeight: 1.5 }}>Complete your profile to get assigned to a research group.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/about-me')}
              style={{ background: '#EA8F00', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
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
    </PageShell>
  );
}
