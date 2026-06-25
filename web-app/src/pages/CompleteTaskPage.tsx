import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  title?: string;
  message?: string;
  buttonText?: string;
  isDaily?: boolean;
}

export default function CompleteTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const title = state.title || 'Task Complete!';
  const message = state.message || 'You have completed this task successfully.';
  const buttonText = state.buttonText || 'Back to Dashboard';
  const isDaily = state.isDaily ?? false;

  const color = isDaily ? '#D97706' : '#749F82';
  const bgColor = isDaily ? '#FFFBEB' : '#F0FDF4';

  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    const t = setTimeout(() => setScale(1), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 28,
        padding: 40,
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        transform: `scale(${scale})`,
        transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Animated checkmark circle */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          background: `${color}15`,
          border: `4px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'bounceIn 0.6s ease',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <style>{`
          @keyframes bounceIn {
            0% { transform: scale(0.5); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); }
          }
        `}</style>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D3436', marginBottom: 12 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.7, marginBottom: 32 }}>{message}</p>

        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          style={{
            width: '100%',
            padding: 16,
            background: color,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
