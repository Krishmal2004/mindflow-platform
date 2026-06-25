import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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

export const ChartIcon = ({ size = 24, color = "#749F82" }) => (
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
