import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { LeavesDecoration, MeditationIllustration } from '@/components/Illustrations';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
        {/* Leaves decoration */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', opacity: 0.6, pointerEvents: 'none', overflow: 'hidden' }} className="animate-fade-in">
          <LeavesDecoration width={400} height={400} color="#749F82" />
        </div>

        {/* Header */}
        <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)', textAlign: 'center', zIndex: 1 }} className="animate-enter">
          <p style={{ fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 3, textTransform: 'uppercase' }}>MindFlow</p>
        </div>

        {/* Illustration */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px 0', zIndex: 1, marginTop: -40 }}
          className="animate-enter"
        >
          <div style={{ width: 'min(70vw, 280px)', height: 'min(70vw, 280px)', filter: 'drop-shadow(0 20px 40px rgba(116,159,130,0.3))' }}>
            <MeditationIllustration width={280} height={249} />
          </div>
        </div>

        {/* Bottom panel */}
        <div
          style={{
            width: '100%',
            background: '#FFFFFF',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            padding: '28px 24px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
            boxShadow: '0 -6px 16px rgba(0,0,0,0.05)',
            zIndex: 1,
          }}
          className="animate-enter"
        >
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>WELCOME</p>
          <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#2D3436', letterSpacing: 1, marginBottom: 8 }}>START YOUR JOURNEY</p>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#636E72', lineHeight: 1.6, marginBottom: 24 }}>
            Join the MindFlow research study and discover the path to mindfulness and wellbeing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: 16, background: '#749F82', color: '#fff',
                border: 'none', borderRadius: 30, fontSize: 16, fontWeight: 700,
                letterSpacing: 1, cursor: 'pointer', boxShadow: '0 4px 12px rgba(116,159,130,0.4)',
              }}
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                width: '100%', padding: 16, background: 'transparent', color: '#749F82',
                border: '1.5px solid #749F82', borderRadius: 30, fontSize: 16, fontWeight: 700,
                letterSpacing: 1, cursor: 'pointer',
              }}
            >
              OR SIGN UP
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
