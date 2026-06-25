import { useEffect, useState } from 'react';

type ModalType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const CONFIG: Record<ModalType, { icon: string; color: string; bg: string }> = {
  success: { icon: '✓', color: '#749F82', bg: '#E6F4EA' },
  error:   { icon: '✕', color: '#EF4444', bg: '#FEE2E2' },
  warning: { icon: '!', color: '#F59E0B', bg: '#FEF3C7' },
  info:    { icon: 'i', color: '#8B5CF6', bg: '#EDE9FE' },
};

export function PopupModal({
  visible,
  type,
  title,
  message,
  buttonText = 'OK',
  onClose,
  onConfirm,
}: Props) {
  const [scale, setScale] = useState(0.8);
  const cfg = CONFIG[type];

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setScale(1), 10);
      return () => clearTimeout(t);
    } else {
      setScale(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 28,
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
          transform: `scale(${scale})`,
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: cfg.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28,
            fontWeight: 'bold',
            color: cfg.color,
          }}
        >
          {cfg.icon}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2D3436', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <button
          onClick={() => {
            onClose();
            onConfirm?.();
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: cfg.color,
            color: '#fff',
            border: 'none',
            borderRadius: 30,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
