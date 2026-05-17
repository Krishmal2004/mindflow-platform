import type { ReactElement } from 'react';

// Journey SVG Icons — Web version matching mobile/src/components/JourneyIcons.tsx

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const JourneyIcons = {
  Sun: ({ size = 24, color = '#F59E0B', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCD34D" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5" fill="url(#sunGrad)" />
      <path d="M12 1V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21V23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4.22 4.22L5.64 5.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18.36 18.36L19.78 19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M1 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M21 12H23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4.22 19.78L5.64 18.36" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  Microphone: ({ size = 24, color = '#8B5CF6', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="micGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="url(#micGrad)" />
      <path d="M5 10V11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Chart: ({ size = 24, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M18 20V10" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20V4" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 20V14" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  StressCamera: ({ size = 24, color = '#EF4444', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="camGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F87171" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <path d="M23 19C23 19.53 22.79 20.04 22.41 20.41C22.04 20.79 21.53 21 21 21H3C2.47 21 1.96 20.79 1.59 20.41C1.21 20.04 1 19.53 1 19V8C1 7.47 1.21 6.96 1.59 6.59C1.96 6.21 2.47 6 3 6H7L9 3H15L17 6H21C21.53 6 22.04 6.21 22.41 6.59C22.79 6.96 23 7.47 23 8V19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="13" r="2" fill="url(#camGrad)" />
    </svg>
  ),

  Mirror: ({ size = 24, color = '#6366F1', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="10" r="8" stroke={color} strokeWidth="2" fill="rgba(99, 102, 241, 0.1)" />
      <path d="M12 18V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M15 7L14 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),

  // Breathing Circles for Meditation card
  BreathingCircles: ({ size = 60, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className}>
      <circle cx="30" cy="30" r="28" stroke="#A1C4FD" strokeWidth="1.5" opacity="0.3" />
      <circle cx="30" cy="30" r="20" stroke="#A1C4FD" strokeWidth="1.5" opacity="0.5" />
      <circle cx="30" cy="30" r="12" stroke="#A1C4FD" strokeWidth="2" opacity="0.7" />
      <circle cx="30" cy="30" r="5" fill="#A1C4FD" opacity="0.6" />
    </svg>
  ),

  // Yoga Pose
  YogaPose: ({ size = 60, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className}>
      <circle cx="30" cy="14" r="5" fill="#C2E9FB" />
      <path d="M30 20V35" stroke="#C2E9FB" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 28L30 24L40 28" stroke="#C2E9FB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 45L30 35L38 45" stroke="#C2E9FB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // Quote icon for the mindfulness card
  QuoteIcon: ({ size = 28, color = 'rgba(255,255,255,0.3)', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  ),
};

// Emotion SVG Icons — Replacing Unicode Emojis
// Each returns a set of 5 icons for scale 1-5

const makeFace = (expression: string, size: number) => {
  // Simple SVG face generator
  const faces: Record<string, ReactElement> = {
    // Mood faces (1=Bad, 5=Good)
    'mood-1': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEE2E2" stroke="#FECACA" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#EF4444"/>
        <circle cx="24" cy="14" r="2" fill="#EF4444"/>
        <path d="M11 25C13 22 23 22 25 25" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 25)" />
      </svg>
    ),
    'mood-2': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#F59E0B"/>
        <circle cx="24" cy="14" r="2" fill="#F59E0B"/>
        <path d="M12 24C14 22 22 22 24 24" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 24)" />
      </svg>
    ),
    'mood-3': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#6B7280"/>
        <circle cx="24" cy="14" r="2" fill="#6B7280"/>
        <line x1="12" y1="23" x2="24" y2="23" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'mood-4': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#D1FAE5" stroke="#A7F3D0" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#10B981"/>
        <circle cx="24" cy="14" r="2" fill="#10B981"/>
        <path d="M12 22C14 25 22 25 24 22" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'mood-5': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>
        <circle cx="12" cy="13" r="2" fill="#059669"/>
        <circle cx="24" cy="13" r="2" fill="#059669"/>
        <path d="M10 21C13 26 23 26 26 21" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),

    // Stress faces (1=Low/Calm, 5=High/Tense)
    'stress-1': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#D1FAE5" stroke="#A7F3D0" strokeWidth="1"/>
        <path d="M11 13C11.5 12 12.5 12 13 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M23 13C23.5 12 24.5 12 25 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 22C14 25 22 25 24 22" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'stress-2': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#ECFDF5" stroke="#D1FAE5" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#34D399"/>
        <circle cx="24" cy="14" r="2" fill="#34D399"/>
        <path d="M13 22C15 24 21 24 23 22" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'stress-3': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#6B7280"/>
        <circle cx="24" cy="14" r="2" fill="#6B7280"/>
        <line x1="12" y1="23" x2="24" y2="23" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'stress-4': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#F59E0B"/>
        <circle cx="24" cy="14" r="2" fill="#F59E0B"/>
        <path d="M13 25C15 22 21 22 23 25" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 25)"/>
      </svg>
    ),
    'stress-5': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEE2E2" stroke="#FECACA" strokeWidth="1"/>
        <circle cx="12" cy="13" r="2" fill="#EF4444"/>
        <circle cx="24" cy="13" r="2" fill="#EF4444"/>
        <path d="M11 25C13 21 23 21 25 25" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 25)"/>
        <line x1="9" y1="9" x2="13" y2="11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="27" y1="9" x2="23" y2="11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),

    // Sleep faces (1=Poor, 5=Great)
    'sleep-1': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#F3E8FF" stroke="#E9D5FF" strokeWidth="1"/>
        <line x1="10" y1="14" x2="14" y2="14" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
        <line x1="22" y1="14" x2="26" y2="14" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
        <path d="M13 25C15 22 21 22 23 25" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 25)"/>
      </svg>
    ),
    'sleep-2': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="1"/>
        <circle cx="12" cy="14" r="1.5" fill="#8B5CF6"/>
        <circle cx="24" cy="14" r="1.5" fill="#8B5CF6"/>
        <path d="M14 24C15.5 22 20.5 22 22 24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 24)"/>
      </svg>
    ),
    'sleep-3': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#6B7280"/>
        <circle cx="24" cy="14" r="2" fill="#6B7280"/>
        <line x1="12" y1="23" x2="24" y2="23" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'sleep-4': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#3B82F6"/>
        <circle cx="24" cy="14" r="2" fill="#3B82F6"/>
        <path d="M12 22C14 25 22 25 24 22" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'sleep-5': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1"/>
        <circle cx="12" cy="13" r="2" fill="#2563EB"/>
        <circle cx="24" cy="13" r="2" fill="#2563EB"/>
        <path d="M10 21C13 26 23 26 26 21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
        <text x="26" y="10" fontSize="8" fill="#2563EB" fontWeight="bold">Z</text>
      </svg>
    ),

    // Relaxation faces (1=Tense, 5=Calm)
    'relax-1': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEE2E2" stroke="#FECACA" strokeWidth="1"/>
        <circle cx="12" cy="13" r="2" fill="#EF4444"/>
        <circle cx="24" cy="13" r="2" fill="#EF4444"/>
        <path d="M11 25C13 21 23 21 25 25" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 25)"/>
      </svg>
    ),
    'relax-2': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#F59E0B"/>
        <circle cx="24" cy="14" r="2" fill="#F59E0B"/>
        <path d="M13 24C15 22 21 22 23 24" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" transform="rotate(180 18 24)"/>
      </svg>
    ),
    'relax-3': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="12" cy="14" r="2" fill="#6B7280"/>
        <circle cx="24" cy="14" r="2" fill="#6B7280"/>
        <line x1="12" y1="23" x2="24" y2="23" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'relax-4': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#ECFDF5" stroke="#D1FAE5" strokeWidth="1"/>
        <path d="M10 13C10.5 12 13.5 12 14 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 13C22.5 12 25.5 12 26 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 22C14 25 22 25 24 22" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'relax-5': (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>
        <path d="M10 13C10.5 12 13.5 12 14 13" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 13C22.5 12 25.5 12 26 13" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 21C13 26 23 26 26 21" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  return faces[expression] || null;
};

export const EmotionIcons = {
  mood: (level: number, size = 36) => makeFace(`mood-${level}`, size),
  stress: (level: number, size = 36) => makeFace(`stress-${level}`, size),
  sleep: (level: number, size = 36) => makeFace(`sleep-${level}`, size),
  relaxation: (level: number, size = 36) => makeFace(`relax-${level}`, size),
};
