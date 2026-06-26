import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '@/lib/auth';
import { getPostAuthRoute } from '@/lib/postAuthRoute';
import appLogo from '@/assets/app-icon.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#749F82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password'); return; }
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
          setError('Please verify your email before logging in.');
          setTimeout(() => navigate('/verify-otp', { state: { email } }), 1400);
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
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputBox = (focused: boolean): React.CSSProperties => ({
    background: focused ? '#FFFFFF' : '#FAFBFC',
    borderRadius: 16,
    padding: '0 16px',
    height: 54,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: `1.5px solid ${focused ? 'rgba(116,159,130,0.6)' : '#DFE6E9'}`,
    boxShadow: focused ? '0 0 0 3px rgba(116,159,130,0.12), 0 2px 8px rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 16,
    color: '#2D3436',
    background: 'transparent',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Decorative leaves */}
      <div aria-hidden style={{ position: 'absolute', top: 0, right: 0, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <ellipse cx="165" cy="55" rx="88" ry="66" fill="#749F82" transform="rotate(-30 165 55)" />
          <ellipse cx="200" cy="135" rx="66" ry="50" fill="#749F82" transform="rotate(20 200 135)" />
        </svg>
      </div>

      {/* Top illustration area — shrinks when keyboard opens via dvh */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'max(env(safe-area-inset-top, 0px), 40px)', paddingBottom: 24, zIndex: 1, minHeight: 180 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#749F82', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20 }}>MindFlow</p>
        <img
          src={appLogo}
          alt="MindFlow"
          style={{ width: 'min(52vw, 180px)', height: 'min(52vw, 180px)', objectFit: 'contain', filter: 'drop-shadow(0 12px 28px rgba(116,159,130,0.3))' }}
        />
      </div>

      {/* Bottom panel */}
      <div style={{
        background: '#E3F2FD',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: '28px 22px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
        zIndex: 1,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#749F82', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>WELCOME BACK</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#2D3436', letterSpacing: 0.5 }}>Login to Continue</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div style={inputBox(emailFocused)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={emailFocused ? '#749F82' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              placeholder="Email Address"
              autoCapitalize="none"
              autoComplete="email"
              enterKeyHint="next"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={inputBox(pwFocused)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pwFocused ? '#749F82' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              ref={passwordRef}
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              enterKeyHint="go"
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 54, background: loading ? '#9EC4A8' : '#749F82', color: '#fff', border: 'none',
              borderRadius: 30, fontSize: 15, fontWeight: 700, letterSpacing: 1.5, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(116,159,130,0.4)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {loading ? <><Spinner /> LOGGING IN...</> : 'LOG IN'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              height: 54, background: 'transparent', color: '#749F82', border: '1.5px solid rgba(116,159,130,0.5)',
              borderRadius: 30, fontSize: 15, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer',
            }}
          >
            CREATE AN ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}
