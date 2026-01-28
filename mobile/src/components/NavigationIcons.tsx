import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const NavigationIcons = {
    Home: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M9 22V12H15V22" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Calendar: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 10H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    History: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M12 8V12L15 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    ),
    User: ({ width = 28, height = 28, color = "#000" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
};
