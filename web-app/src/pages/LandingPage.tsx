import { useNavigate } from 'react-router-dom';
import appLogo from '@/assets/app-icon.png';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
      {/* Leaves decoration */}
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <ellipse cx="150" cy="50" rx="80" ry="60" fill="#749F82" transform="rotate(-30 150 50)" />
          <ellipse cx="180" cy="120" rx="60" ry="45" fill="#749F82" transform="rotate(20 180 120)" />
        </svg>
      </div>

      {/* Header */}
      <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)', textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 3, textTransform: 'uppercase' }}>MindFlow</p>
      </div>

      {/* Illustration */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px 0', zIndex: 1 }}>
        <img
          src={appLogo}
          alt="MindFlow"
          style={{
            width: 'min(70vw, 280px)',
            height: 'min(70vw, 280px)',
            objectFit: 'contain',
            filter: 'drop-shadow(0 20px 40px rgba(116,159,130,0.3))',
          }}
        />
      </div>

      {/* Bottom panel */}
      <div
        style={{
          width: '100%',
          background: '#E3F2FD',
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          padding: '28px 24px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          zIndex: 1,
        }}
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
              width: '100%', padding: 16, background: '#95C27E', color: '#fff',
              border: 'none', borderRadius: 30, fontSize: 16, fontWeight: 700,
              letterSpacing: 1, cursor: 'pointer', boxShadow: '0 4px 12px rgba(149,194,126,0.4)',
            }}
          >
            OR SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
}
