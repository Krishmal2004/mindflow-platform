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

export const YogaSmall = ({ width = 100, height = 80 }) => (
    <Svg width={width} height={height} viewBox="0 0 100 80" fill="none">
        {/* Simple person in yoga pose */}
        <Circle cx="70" cy="20" r="8" fill="#334155" />
        <Path d="M40 70 L 50 40 L 70 40 L 60 30" stroke="#60A5FA" strokeWidth="4" fill="none" />
        <Path d="M40 70 L 30 50" stroke="#334155" strokeWidth="4" />
        <Path d="M70 40 L 85 30" stroke="#60A5FA" strokeWidth="4" />
    </Svg>
);

export const LeafIcon = ({ color = "#FFFFFF" }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M12 21C12 21 17 16 17 11C17 7.5 14.5 5 12 5C9.5 5 7 7.5 7 11C7 16 12 21 12 21Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 5V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
