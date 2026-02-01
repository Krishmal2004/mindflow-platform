import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
}

export const LeavesDecoration = ({ width = 400, height = 400 }: Props) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" fill="none" style={{ position: 'absolute' }}>
            <Defs>
                <LinearGradient id="leafGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#A7F3D0" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#34D399" stopOpacity="0.2" />
                </LinearGradient>
                <LinearGradient id="leafGrad2" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor="#6EE7B7" stopOpacity="0.6" />
                    <Stop offset="1" stopColor="#059669" stopOpacity="0.1" />
                </LinearGradient>
            </Defs>

            {/* Main Decorative Group - Top Right */}
            <G transform="translate(100, -20) rotate(15)">
                {/* Large Background Leaf */}
                <Path
                    d="M200,50 Q280,10 320,80 T350,200 Q320,280 200,300 T80,200 Q50,100 200,50 Z"
                    fill="url(#leafGrad1)"
                    opacity="0.5"
                    transform="scale(1.2)"
                />

                {/* Medium Detailed Leaf */}
                <Path
                    d="M220,80 Q290,120 280,180 T200,280 Q140,240 160,150 T220,80 Z"
                    fill="url(#leafGrad2)"
                    opacity="0.7"
                />

                {/* Accent Leaf Curve */}
                <Path
                    d="M220,80 Q255,130 250,180"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    fill="none"
                />
            </G>

            {/* Subtle Floating Leaves */}
            <G transform="translate(50, 50)">
                <Path
                    d="M50,0 Q80,20 70,60 T30,80 Q0,60 10,20 T50,0 Z"
                    fill="#34D399"
                    opacity="0.3"
                />
            </G>
            <G transform="translate(300, 250) rotate(-45)">
                <Path
                    d="M50,0 Q80,20 70,60 T30,80 Q0,60 10,20 T50,0 Z"
                    fill="#6EE7B7"
                    opacity="0.2"
                />
            </G>
        </Svg>
    );
};
