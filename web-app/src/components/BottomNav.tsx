import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'rgba(15,155,113,0.12)' : 'none'} stroke={active ? '#0F9B71' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/journey',
    label: 'Journey',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'rgba(15,155,113,0.12)' : 'none'} stroke={active ? '#0F9B71' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'rgba(15,155,113,0.12)' : 'none'} stroke={active ? '#0F9B71' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'You',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'rgba(15,155,113,0.12)' : 'none'} stroke={active ? '#0F9B71' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="mf-bottomnav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 -10px 30px rgba(15,155,113,0.06), 0 -1px 0 rgba(15,155,113,0.04)',
        height: 76,
      }}
    >
      {/* Decorative Horizontal SVG Wave ribbon flowing behind the icons */}
      <svg
        viewBox="0 0 480 76"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <path
          d="M0 36 C120 18, 240 54, 360 36 C420 27, 450 32, 480 36"
          fill="none"
          stroke="rgba(15,155,113,0.10)"
          strokeWidth="2"
        />
        <path
          d="M0 42 C100 24, 220 50, 340 42 C400 38, 440 42, 480 39"
          fill="none"
          stroke="rgba(15,155,113,0.05)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Tab buttons */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '100%',
          padding: '0 8px',
          zIndex: 1,
        }}
      >
        {TABS.map(tab => {
          const active =
            pathname === tab.path ||
            (tab.path === '/dashboard' && pathname.startsWith('/dashboard'));

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
                padding: '6px 0 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Active dot indicator at the top of active tab */}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: -1,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#0F9B71',
                    boxShadow: '0 0 6px rgba(15,155,113,0.6)',
                    zIndex: 2,
                  }}
                />
              )}

              {/* Capsule background pill behind the icon */}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    width: 48,
                    height: 32,
                    borderRadius: 16,
                    background: '#E7F9F1',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Icon container */}
              <span style={{ position: 'relative', zIndex: 1, lineHeight: 0, padding: '5px 0' }}>
                {tab.icon(active)}
              </span>

              {/* Label */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0F9B71' : '#6B7280',
                  letterSpacing: 0.1,
                  position: 'relative',
                  zIndex: 1,
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
