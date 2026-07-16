import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const JourneyIcons = {
    // Microphone Icon for Weekly Whispers
    Microphone: ({ width = 40, height = 40, color = "#8B5CF6" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="micGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#A78BFA" stopOpacity="1" />
                    <Stop offset="1" stopColor="#7C3AED" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Rect x="9" y="3" width="6" height="11" rx="3" fill="url(#micGrad)" />
            <Path d="M5 10V11C5 14.866 8.13401 18 12 18V18C15.866 18 19 14.866 19 11V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 18V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),

    // Sun/Energy Icon for Daily Sliders
    Sun: ({ width = 40, height = 40, color = "#F59E0B" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FCD34D" stopOpacity="1" />
                    <Stop offset="1" stopColor="#F59E0B" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Circle cx="12" cy="12" r="5" fill="url(#sunGrad)" />
            <Path d="M12 1V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 21V23" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M4.22 4.22L5.64 5.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M18.36 18.36L19.78 19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M1 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M21 12H23" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M4.22 19.78L5.64 18.36" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),

    // Chart Icon for Thrive Tracker
    Chart: ({ width = 40, height = 40, color = "#749F82" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#94BCA1" stopOpacity="1" />
                    <Stop offset="1" stopColor="#749F82" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Path d="M18 20V10" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 20V4" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 20V14" stroke="url(#chartGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),

    // Stress/Camera Icon
    StressCamera: ({ width = 40, height = 40, color = "#EF4444" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="camGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#F87171" stopOpacity="1" />
                    <Stop offset="1" stopColor="#DC2626" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="12" cy="13" r="2" fill="url(#camGrad)" />
        </Svg>
    ),

    // Mindful Mirror
    Mirror: ({ width = 42, height = 42, color = "#6366F1" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="mirrorGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#818CF8" stopOpacity="1" />
                    <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Circle cx="12" cy="10" r="8" stroke={color} strokeWidth="2" fill="rgba(99, 102, 241, 0.1)" />
            <Path d="M12 18V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 6V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <Path d="M15 7L14 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </Svg>
    ),

    // --- About Me Icons ---

    // University/Education (Graduation Cap)
    Academic: ({ width = 24, height = 24, color = "#64748B" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M22 10V6M2 10L12 5L22 10L12 15L2 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 12V17C6 17.5 7.5 19 12 19C16.5 19 18 17.5 18 17V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),

    // Age/Identity (Person)
    Person: ({ width = 24, height = 24, color = "#64748B" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),

    // Hobbies (Star)
    Star: ({ width = 24, height = 24, color = "#64748B" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
};
