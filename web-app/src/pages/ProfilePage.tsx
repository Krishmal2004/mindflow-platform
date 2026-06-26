import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { clearAuth, getUserName } from '@/lib/auth';
import { PopupModal } from '@/components/PopupModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const NUM_BOXES = 8;

interface Profile { username?: string; research_id?: string; email?: string }

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);

  // Reset password modal state
  const [resetStep, setResetStep] = useState<'closed' | 'step1' | 'step2'>('closed');
  const [resetEmail, setResetEmail] = useState('');
  const [resetDigits, setResetDigits] = useState<string[]>(Array(NUM_BOXES).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  const userName = getUserName();

  useEffect(() => {
    api.getProfile()
      .then(p => setProfile(p as Profile))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate('/', { replace: true });
  };

  const sendResetCode = async () => {
    const emailToUse = resetEmail || profile.email || '';
    if (!emailToUse) { setResetError('No email address found'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setResetStep('step2');
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const confirmReset = async () => {
    const code = resetDigits.join('');
    if (code.length < NUM_BOXES) { setResetError('Enter all 8 digits'); return; }
    if (!newPassword) { setResetError('Enter new password'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const emailToUse = resetEmail || profile.email || '';
      const res = await fetch(`${API_BASE}/api/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, token: code, newPassword }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetStep('closed');
      setPopup({ visible: true, type: 'success', title: 'Password Updated', message: 'Your password has been changed successfully.' });
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetDigit = (index: number, value: string) => {
    const last = value.slice(-1);
    if (last && !/\d/.test(last)) return;
    const next = [...resetDigits];
    next[index] = last;
    setResetDigits(next);
    if (last && index < NUM_BOXES - 1) {
      const el = document.getElementById(`reset-otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleResetKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !resetDigits[index] && index > 0) {
      document.getElementById(`reset-otp-${index - 1}`)?.focus();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: '#749F82', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#749F82', paddingTop: 'env(safe-area-inset-top, 0px)', padding: '20px 20px 40px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.4)', fontSize: 28, fontWeight: 800, color: '#fff' }}>
            {(profile.username || userName).substring(0, 2).toUpperCase()}
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{profile.username || userName}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{profile.email || ''}</p>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '-16px auto 0', padding: '0 16px' }}>
        {/* Research ID card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#636E72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Research ID</p>
          {profile.research_id ? (
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2D3436' }}>{profile.research_id}</p>
          ) : (
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <p style={{ fontSize: 13, color: '#D97706', fontWeight: 500 }}>Researchers will add you to a group shortly.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => navigate('/about-me')}
            style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #F0F0F0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: '#2D3436', fontSize: 14 }}>About Me Profile</p>
                <p style={{ fontSize: 12, color: '#636E72' }}>View and update your profile</p>
              </div>
            </div>
            <span style={{ color: '#94A3B8' }}>›</span>
          </button>

          <button
            onClick={() => { setResetEmail(profile.email || ''); setResetStep('step1'); setResetError(''); }}
            style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔒</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: '#2D3436', fontSize: 14 }}>Reset Password</p>
                <p style={{ fontSize: 12, color: '#636E72' }}>Change your account password</p>
              </div>
            </div>
            <span style={{ color: '#94A3B8' }}>›</span>
          </button>
        </div>

        <button
          onClick={handleSignOut}
          style={{ width: '100%', padding: 16, background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>

      {/* Reset Password Modal - Step 1 */}
      {resetStep === 'step1' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 28, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>Reset Password</h2>
            <p style={{ fontSize: 13, color: '#636E72', marginBottom: 20 }}>We'll send a code to your email address.</p>
            <div style={{ background: '#F6F8F9', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <input
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                type="email"
                placeholder="Email address"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, background: 'transparent', color: '#2D3436' }}
              />
            </div>
            {resetError && <p style={{ color: '#EF5350', fontSize: 12, marginBottom: 8 }}>{resetError}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setResetStep('closed')} style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendResetCode} disabled={resetLoading} style={{ flex: 1, padding: 14, background: '#749F82', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: resetLoading ? 0.6 : 1 }}>
                {resetLoading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal - Step 2 */}
      {resetStep === 'step2' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 28, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>Enter Code</h2>
            <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16 }}>Enter the 8-digit code and your new password.</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {resetDigits.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    id={`reset-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleResetDigit(i, e.target.value)}
                    onKeyDown={e => handleResetKeyDown(i, e)}
                    style={{ width: 32, height: 40, textAlign: 'center', fontSize: 18, fontWeight: 700, border: `2px solid ${d ? '#749F82' : '#DFE6E9'}`, borderRadius: 8, outline: 'none', background: d ? '#E6F4EA' : '#fff' }}
                  />
                  {i === 3 && <div style={{ width: 8 }} />}
                </div>
              ))}
            </div>
            <div style={{ background: '#F6F8F9', borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="New password" style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }} />
            </div>
            <div style={{ background: '#F6F8F9', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm new password" style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }} />
            </div>
            {resetError && <p style={{ color: '#EF5350', fontSize: 12, marginBottom: 8 }}>{resetError}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setResetStep('closed')} style={{ flex: 1, padding: 14, background: '#F6F8F9', color: '#636E72', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmReset} disabled={resetLoading} style={{ flex: 1, padding: 14, background: '#749F82', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: resetLoading ? 0.6 : 1 }}>
                {resetLoading ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

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
