import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuth } from '@/lib/auth';
import { getPostAuthRoute } from '@/lib/postAuthRoute';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const NUM_BOXES = 8;

const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-6px); }
  30%, 70% { transform: translateX(6px); }
}
`;

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [digits, setDigits] = useState<string[]>(Array(NUM_BOXES).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleChange = (index: number, value: string) => {
    const last = value.slice(-1);
    if (last && !/\d/.test(last)) return;
    const next = [...digits];
    next[index] = last;
    setDigits(next);
    if (last && index < NUM_BOXES - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, NUM_BOXES);
    if (text.length >= NUM_BOXES) {
      const next = text.split('').slice(0, NUM_BOXES);
      setDigits(next);
      inputRefs.current[NUM_BOXES - 1]?.focus();
    }
  };

  const clearAll = () => {
    setDigits(Array(NUM_BOXES).fill(''));
    inputRefs.current[0]?.focus();
  };

  const submitCode = async () => {
    const code = digits.join('');
    if (code.length < NUM_BOXES) { setError('Please enter all 8 digits'); triggerShake(); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, type: 'signup' }),
      });
      const data = await res.json() as {
        error?: string;
        user?: { display_name?: string };
        session?: { access_token: string };
      };
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      const userName = data.user?.display_name || email.split('@')[0];
      setAuth(data.session!.access_token, userName);
      const route = await getPostAuthRoute();
      navigate(route, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' }),
      });
      startCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    }
  };

  const hasAnyDigit = digits.some(d => d !== '');

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <style>{shakeKeyframes}</style>

      {/* Leaves */}
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <ellipse cx="150" cy="50" rx="80" ry="60" fill="#749F82" transform="rotate(-30 150 50)" />
          <ellipse cx="180" cy="120" rx="60" ry="45" fill="#749F82" transform="rotate(20 180 120)" />
        </svg>
      </div>

      {/* Top */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)', zIndex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#636E72', letterSpacing: 3, textTransform: 'uppercase' }}>MindFlow</p>
        <div style={{ marginTop: 32, width: 80, height: 80, borderRadius: 40, background: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#749F82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.79 9.11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.68 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.54c1.07 1.9 2.55 3.38 4.45 4.45l1.9-1.02a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.2v1.72z" />
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#2D3436', marginTop: 16 }}>Verify Your Email</p>
        <p style={{ fontSize: 13, color: '#636E72', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, marginTop: 8, padding: '0 24px' }}>
          Enter the 8-digit code sent to<br />
          <strong style={{ color: '#2D3436' }}>{email}</strong>
        </p>
      </div>

      {/* Bottom panel */}
      <div style={{
        flex: 1,
        background: '#E3F2FD',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: '32px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        zIndex: 1,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* OTP boxes */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 8,
            animation: shaking ? 'shake 0.6s ease' : 'none',
          }}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 36,
                  height: 48,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: `2px solid ${d ? '#749F82' : '#DFE6E9'}`,
                  background: d ? '#E6F4EA' : '#fff',
                  color: '#2D3436',
                  outline: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              />
              {i === 3 && <div style={{ width: 12 }} />}
            </div>
          ))}
        </div>

        {/* Clear button */}
        {hasAnyDigit && (
          <button
            onClick={clearAll}
            style={{ background: '#FEE2E2', color: '#EF5350', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
          >
            Clear
          </button>
        )}

        {error && (
          <div style={{ background: '#FEE2E2', color: '#EF5350', borderRadius: 12, padding: '10px 16px', fontSize: 13, marginBottom: 12, width: '100%', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={submitCode}
          disabled={loading}
          style={{
            width: '100%', padding: 16, background: '#749F82', color: '#fff',
            border: 'none', borderRadius: 30, fontSize: 16, fontWeight: 700,
            letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, marginBottom: 16,
          }}
        >
          {loading ? 'VERIFYING...' : 'VERIFY CODE'}
        </button>

        <button
          onClick={resendCode}
          disabled={resendCooldown > 0}
          style={{
            background: 'none', border: 'none', color: resendCooldown > 0 ? '#B2BEC3' : '#749F82',
            fontSize: 14, fontWeight: 600, cursor: resendCooldown > 0 ? 'default' : 'pointer',
          }}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}
