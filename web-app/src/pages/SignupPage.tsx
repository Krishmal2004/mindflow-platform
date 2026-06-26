import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import appLogo from '@/assets/app-icon.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_COLOR = ['#E0E6ED', '#EF5350', '#FFA726', '#66BB6A', '#2E7D32'];
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

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

export default function SignupPage() {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const strength = getStrength(password);
  const passwordsMatch = password.length > 0 && confirmPw.length > 0 && password === confirmPw;
  const passwordsMismatch = confirmPw.length > 0 && password !== confirmPw;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (strength < 2) errs.password = 'Password must be stronger (add uppercase, number, or special char)';
    if (!confirmPw) errs.confirmPw = 'Please confirm your password';
    else if (password !== confirmPw) errs.confirmPw = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      navigate('/verify-otp', { state: { email } });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputBox = (field: string): React.CSSProperties => ({
    background: focusedField === field ? '#FFFFFF' : '#FAFBFC',
    borderRadius: 16,
    padding: '0 16px',
    height: 54,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: `1.5px solid ${errors[field] ? '#FECACA' : focusedField === field ? 'rgba(116,159,130,0.6)' : '#DFE6E9'}`,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(116,159,130,0.12)' : errors[field] ? '0 0 0 2px rgba(239,68,68,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    marginBottom: 2,
  });

  const inputStyle: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#2D3436', background: 'transparent', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: 0, right: 0, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <ellipse cx="165" cy="55" rx="88" ry="66" fill="#749F82" transform="rotate(-30 165 55)" />
          <ellipse cx="200" cy="135" rx="66" ry="50" fill="#749F82" transform="rotate(20 200 135)" />
        </svg>
      </div>

      {/* Top brand header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'max(env(safe-area-inset-top, 0px), 28px)', paddingBottom: 16, zIndex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#749F82', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>MindFlow</p>
        <img src={appLogo} alt="MindFlow" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(116,159,130,0.28))' }} />
      </div>

      {/* Scrollable form panel */}
      <div style={{
        flex: 1,
        background: '#E3F2FD',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: '24px 22px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        zIndex: 1,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#749F82', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>JOIN US</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#2D3436', letterSpacing: 0.5 }}>Create Your Account</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Full Name */}
          <div style={inputBox('name')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'name' ? '#749F82' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              value={name} onChange={e => setName(e.target.value)}
              type="text" placeholder="Full Name"
              autoComplete="name" enterKeyHint="next"
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              onKeyDown={e => e.key === 'Enter' && emailRef.current?.focus()}
              style={inputStyle}
            />
          </div>
          {errors.name && <p style={{ color: '#DC2626', fontSize: 12, marginLeft: 4, marginBottom: 6, marginTop: 2 }}>{errors.name}</p>}
          <div style={{ height: 8 }} />

          {/* Email */}
          <div style={inputBox('email')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'email' ? '#749F82' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              ref={emailRef} value={email} onChange={e => setEmail(e.target.value)}
              type="email" inputMode="email" placeholder="Email Address"
              autoCapitalize="none" autoComplete="email" enterKeyHint="next"
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
              style={inputStyle}
            />
          </div>
          {errors.email && <p style={{ color: '#DC2626', fontSize: 12, marginLeft: 4, marginBottom: 6, marginTop: 2 }}>{errors.email}</p>}
          <div style={{ height: 8 }} />

          {/* Password */}
          <div style={inputBox('password')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'password' ? '#749F82' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              ref={passwordRef} value={password} onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'} placeholder="Password"
              autoComplete="new-password" enterKeyHint="next"
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              onKeyDown={e => e.key === 'Enter' && confirmRef.current?.focus()}
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <EyeIcon open={showPw} />
            </button>
          </div>

          {/* Strength bars */}
          {password.length > 0 && (
            <div style={{ marginTop: 6, marginBottom: 4, marginLeft: 2 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : '#DFE6E9', transition: 'background 0.3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  {password.length < 8 && '8+ chars · '}
                  {!/[A-Z]/.test(password) && 'Uppercase · '}
                  {!/[0-9]/.test(password) && 'Number · '}
                  {!/[^A-Za-z0-9]/.test(password) && 'Symbol'}
                </span>
                {strength > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</span>}
              </div>
            </div>
          )}
          {errors.password && <p style={{ color: '#DC2626', fontSize: 12, marginLeft: 4, marginBottom: 6, marginTop: 2 }}>{errors.password}</p>}
          <div style={{ height: 8 }} />

          {/* Confirm Password */}
          <div style={inputBox('confirmPw')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'confirmPw' ? (passwordsMatch ? '#66BB6A' : '#749F82') : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <input
              ref={confirmRef} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password"
              autoComplete="new-password" enterKeyHint="go"
              onFocus={() => setFocusedField('confirmPw')} onBlur={() => setFocusedField(null)}
              style={inputStyle}
            />
            {confirmPw.length > 0 && (
              <span style={{ fontSize: 18, color: passwordsMatch ? '#66BB6A' : '#EF4444', flexShrink: 0 }}>
                {passwordsMatch ? '✓' : '✗'}
              </span>
            )}
            <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {errors.confirmPw && <p style={{ color: '#DC2626', fontSize: 12, marginLeft: 4, marginBottom: 6, marginTop: 2 }}>{errors.confirmPw}</p>}

          {/* API error */}
          {apiError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{apiError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 54, background: loading ? '#9EC4A8' : '#749F82', color: '#fff', border: 'none',
              borderRadius: 30, fontSize: 15, fontWeight: 700, letterSpacing: 1.5,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(116,159,130,0.4)',
            }}
          >
            {loading ? <><Spinner /> CREATING ACCOUNT...</> : 'CREATE ACCOUNT'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              height: 54, background: 'transparent', color: '#749F82', border: '1.5px solid rgba(116,159,130,0.5)',
              borderRadius: 30, fontSize: 15, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', marginTop: 10,
            }}
          >
            ALREADY HAVE AN ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}
