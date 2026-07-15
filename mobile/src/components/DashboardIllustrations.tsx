import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const LeafIcon = ({ size = 24, color = "#FFFFFF" }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
