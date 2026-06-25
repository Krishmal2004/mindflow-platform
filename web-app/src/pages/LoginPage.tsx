import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '@/lib/auth';
import { getPostAuthRoute } from '@/lib/postAuthRoute';
import appLogo from '@/assets/app-icon.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as {
        error?: string;
        user?: { display_name?: string };
        session?: { access_token: string };
      };
      if (!res.ok) {
        if (data.error?.includes('Email not confirmed')) {
          setError('Please verify your email first.');
          setTimeout(() => navigate('/verify-otp', { state: { email } }), 1200);
        } else {
          throw new Error(data.error || 'Login failed');
        }
        return;
      }
      const userName = data.user?.display_name || email.split('@')[0];
      setAuth(data.session!.access_token, userName);
      const route = await getPostAuthRoute();
      navigate(route, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Leaves bg */}
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <ellipse cx="150" cy="50" rx="80" ry="60" fill="#749F82" transform="rotate(-30 150 50)" />
          <ellipse cx="180" cy="120" rx="60" ry="45" fill="#749F82" transform="rotate(20 180 120)" />
        </svg>
      </div>

      {/* Top area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)', zIndex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>MindFlow</p>
        <img
          src={appLogo}
          alt="MindFlow"
          style={{
            width: 'min(60vw, 220px)',
            height: 'min(60vw, 220px)',
            objectFit: 'contain',
            filter: 'drop-shadow(0 12px 28px rgba(116,159,130,0.25))',
          }}
        />
      </div>

      {/* Bottom panel */}
      <div style={{
        background: '#E3F2FD',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: '28px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        zIndex: 1,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>WELCOME BACK</p>
        <p style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#2D3436', letterSpacing: 1, marginBottom: 20 }}>LOGIN TO CONTINUE</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 30, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="Email Address"
              autoCapitalize="none"
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: '#2D3436', background: 'transparent' }}
            />
          </div>
          <div style={{ background: '#fff', borderRadius: 30, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center' }}>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#2D3436', background: 'transparent' }}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', color: '#749F82', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && (
            <div style={{ background: '#FEE2E2', color: '#EF5350', borderRadius: 12, padding: '10px 16px', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 16, background: '#749F82', color: '#fff', border: 'none',
              borderRadius: 30, fontSize: 16, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', marginTop: 4, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: 16, background: '#95C27E', color: '#fff', border: 'none',
              borderRadius: 30, fontSize: 16, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
            }}
          >
            OR SIGN UP
          </button>
        </form>
      </div>
    </div>
  );
}
