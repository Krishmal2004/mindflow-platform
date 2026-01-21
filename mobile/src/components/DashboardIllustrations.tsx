import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export const MeditationSmall = ({ width = 100, height = 80 }) => (
    <Svg width={width} height={height} viewBox="0 0 100 80" fill="none">
        {/* Simple person meditating */}
        <Circle cx="50" cy="20" r="10" fill="#334155" />
        <Path d="M30 40 L 70 40 L 60 70 L 40 70 Z" fill="#60A5FA" />
        <Path d="M20 75 Q 50 85, 80 75" stroke="#334155" strokeWidth="3" fill="none" />
    </Svg>
);

export const YogaSmall = ({ width = 100, height = 100 }) => (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
        {/* Background glow circle */}
        <Circle cx="50" cy="50" r="45" fill="#F3E8FF" opacity="0.5" />
        <Circle cx="50" cy="50" r="38" fill="#EDE9FE" opacity="0.6" />

        {/* Decorative sparkles */}
        <Circle cx="20" cy="25" r="2" fill="#A78BFA" opacity="0.6" />
        <Circle cx="80" cy="30" r="1.5" fill="#C4B5FD" opacity="0.7" />
        <Circle cx="15" cy="60" r="1.5" fill="#A78BFA" opacity="0.5" />
        <Circle cx="85" cy="55" r="2" fill="#C4B5FD" opacity="0.6" />

        {/* Person in Tree Pose (Vrikshasana) */}
        {/* Head */}
        <Circle cx="50" cy="22" r="8" fill="#4B5563" />
        {/* Hair bun */}
        <Circle cx="50" cy="15" r="4" fill="#1F2937" />

        {/* Neck */}
        <Path d="M50 30 L50 35" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />

        {/* Body/Torso */}
        <Path d="M50 35 L50 60" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />

        {/* Standing leg */}
        <Path d="M50 60 L50 85" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />

        {/* Bent leg (foot on thigh) */}
        <Path d="M50 55 L40 62 L42 52" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Arms raised in prayer above head */}
        <Path d="M50 38 L38 28 L42 18" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M50 38 L62 28 L58 18" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Hands together */}
        <Path d="M42 18 Q50 12, 58 18" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Ground/mat line */}
        <Path d="M30 88 Q50 92, 70 88" stroke="#C4B5FD" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Decorative lotus petals at base */}
        <Path d="M42 90 Q45 85, 50 90 Q55 85, 58 90" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    </Svg>
);

export const LeafIcon = ({ color = "#FFFFFF" }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M12 21C12 21 17 16 17 11C17 7.5 14.5 5 12 5C9.5 5 7 7.5 7 11C7 16 12 21 12 21Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 5V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Quote icon for mindfulness thoughts
export const QuoteIcon = ({ size = 24, color = "#667eea" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M10 8H6C4.9 8 4 8.9 4 10V14C4 15.1 4.9 16 6 16H10V18C10 19.1 9.1 20 8 20H7C6.45 20 6 20.45 6 21C6 21.55 6.45 22 7 22H8C10.21 22 12 20.21 12 18V10C12 8.9 11.1 8 10 8ZM20 8H16C14.9 8 14 8.9 14 10V14C14 15.1 14.9 16 16 16H20V18C20 19.1 19.1 20 18 20H17C16.45 20 16 20.45 16 21C16 21.55 16.45 22 17 22H18C20.21 22 22 20.21 22 18V10C22 8.9 21.1 8 20 8Z"
            fill={color}
        />
    </Svg>
);

// Advanced breathing visualization with concentric circles
export const BreathingCircles = ({ size = 120, primaryColor = "#667eea", secondaryColor = "#764ba2" }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Outer glow ring */}
        <Circle cx="60" cy="60" r="55" stroke={primaryColor} strokeWidth="1" opacity="0.2" />
        <Circle cx="60" cy="60" r="48" stroke={primaryColor} strokeWidth="1.5" opacity="0.3" />
        <Circle cx="60" cy="60" r="40" stroke={secondaryColor} strokeWidth="2" opacity="0.4" />
        <Circle cx="60" cy="60" r="32" stroke={primaryColor} strokeWidth="2.5" opacity="0.5" />
        <Circle cx="60" cy="60" r="24" stroke={secondaryColor} strokeWidth="3" opacity="0.7" />
        {/* Center circle */}
        <Circle cx="60" cy="60" r="16" fill={primaryColor} opacity="0.9" />
        {/* Inner highlight */}
        <Circle cx="56" cy="56" r="4" fill="#FFFFFF" opacity="0.5" />
    </Svg>
);

// Lotus flower icon for meditation
export const LotusIcon = ({ size = 60, color = "#667eea" }) => (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        {/* Center petal */}
        <Path d="M30 10 C25 20, 25 35, 30 45 C35 35, 35 20, 30 10" fill={color} opacity="0.9" />
        {/* Left petals */}
        <Path d="M30 25 C20 15, 10 20, 8 30 C15 35, 25 30, 30 25" fill={color} opacity="0.7" />
        <Path d="M30 30 C18 25, 5 32, 5 42 C15 42, 25 35, 30 30" fill={color} opacity="0.5" />
        {/* Right petals */}
        <Path d="M30 25 C40 15, 50 20, 52 30 C45 35, 35 30, 30 25" fill={color} opacity="0.7" />
        <Path d="M30 30 C42 25, 55 32, 55 42 C45 42, 35 35, 30 30" fill={color} opacity="0.5" />
        {/* Base */}
        <Path d="M20 48 Q30 55, 40 48" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
);

// Journey step icons
export const SunIcon = ({ size = 24, color = "#F59E0B" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="5" fill={color} />
        <Path d="M12 2V4M12 20V22M4 12H2M22 12H20M6.34 6.34L4.93 4.93M19.07 19.07L17.66 17.66M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

export const CalendarIcon = ({ size = 24, color = "#8B5CF6" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
        <Path d="M3 10H21M8 2V6M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

export const ChartIcon = ({ size = 24, color = "#10B981" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 3V21H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7 14L11 10L15 13L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const CameraIcon = ({ size = 24, color = "#EF4444" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
);

export const MirrorIcon = ({ size = 24, color = "#6366F1" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="5" stroke={color} strokeWidth="2" />
        <Path d="M12 13V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

export const MicIcon = ({ size = 24, color = "#8B5CF6" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 19v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8 23h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
