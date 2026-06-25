import { useState } from 'react';
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

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const strength = getStrength(password);
  const passwordsMatch = password.length > 0 && confirmPw.length > 0 && password === confirmPw;
  const passwordsMismatch = confirmPw.length > 0 && password !== confirmPw;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (strength < 2) errs.password = 'Password is too weak';
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

  const fieldStyle = {
    background: '#fff',
    borderRadius: 30,
    padding: '14px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 4,
  };

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    color: '#2D3436',
    background: 'transparent',
    width: '100%',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Leaves */}
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <ellipse cx="150" cy="50" rx="80" ry="60" fill="#749F82" transform="rotate(-30 150 50)" />
          <ellipse cx="180" cy="120" rx="60" ry="45" fill="#749F82" transform="rotate(20 180 120)" />
        </svg>
      </div>

      {/* Top area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)', zIndex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>MindFlow</p>
        <img src={appLogo} alt="MindFlow" style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(116,159,130,0.25))' }} />
      </div>

      {/* Bottom panel */}
      <div style={{
        flex: 1,
        background: '#E3F2FD',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: '28px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        zIndex: 1,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        marginTop: 20,
        overflowY: 'auto',
      }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>JOIN US</p>
        <p style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#2D3436', letterSpacing: 1, marginBottom: 20 }}>CREATE YOUR ACCOUNT</p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Full Name */}
          <div style={fieldStyle}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
              placeholder="Full Name"
              style={inputStyle}
            />
          </div>
          {errors.name && <p style={{ color: '#EF5350', fontSize: 12, marginLeft: 16, marginBottom: 4 }}>{errors.name}</p>}

          {/* Email */}
          <div style={{ ...fieldStyle, marginTop: 8 }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="Email Address"
              autoCapitalize="none"
              style={inputStyle}
            />
          </div>
          {errors.email && <p style={{ color: '#EF5350', fontSize: 12, marginLeft: 16, marginBottom: 4 }}>{errors.email}</p>}

          {/* Password */}
          <div style={{ ...fieldStyle, marginTop: 8 }}>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', color: '#749F82', fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {/* Strength meter */}
          {password.length > 0 && (
            <div style={{ marginLeft: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : '#E0E6ED', transition: 'background 0.3s' }} />
                ))}
              </div>
              {strength > 0 && <p style={{ fontSize: 11, color: STRENGTH_COLOR[strength], fontWeight: 600 }}>{STRENGTH_LABEL[strength]}</p>}
              <div style={{ fontSize: 11, color: '#636E72', marginTop: 2 }}>
                {password.length < 8 && <span>• At least 8 chars </span>}
                {!/[A-Z]/.test(password) && <span>• Uppercase </span>}
                {!/[0-9]/.test(password) && <span>• Number </span>}
                {!/[^A-Za-z0-9]/.test(password) && <span>• Special char</span>}
              </div>
            </div>
          )}
          {errors.password && <p style={{ color: '#EF5350', fontSize: 12, marginLeft: 16, marginBottom: 4 }}>{errors.password}</p>}

          {/* Confirm Password */}
          <div style={{ ...fieldStyle, marginTop: 8 }}>
            <input
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', color: '#749F82', fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              {showConfirm ? 'Hide' : 'Show'}
            </button>
            {passwordsMatch && <span style={{ color: '#66BB6A', fontSize: 18, marginLeft: 8 }}>✓</span>}
            {passwordsMismatch && <span style={{ color: '#EF5350', fontSize: 18, marginLeft: 8 }}>✗</span>}
          </div>
          {errors.confirmPw && <p style={{ color: '#EF5350', fontSize: 12, marginLeft: 16, marginBottom: 4 }}>{errors.confirmPw}</p>}

          {apiError && (
            <div style={{ background: '#FEE2E2', color: '#EF5350', borderRadius: 12, padding: '10px 16px', fontSize: 13, marginTop: 8 }}>
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 16, background: '#749F82', color: '#fff', border: 'none',
              borderRadius: 30, fontSize: 16, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', marginTop: 16, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              padding: 16, background: 'transparent', color: '#749F82', border: '2px solid #749F82',
              borderRadius: 30, fontSize: 16, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
            }}
          >
            ALREADY HAVE AN ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}
