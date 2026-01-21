import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
}

export const MeditationIllustration = ({ width = 300, height = 300 }: Props) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" fill="none">
            <Defs>
                <LinearGradient id="hair_grad" x1="150" y1="50" x2="350" y2="150" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#1E293B" />
                    <Stop offset="1" stopColor="#0F172A" />
                </LinearGradient>
            </Defs>

            {/* Background - Stylized Leaves */}
            <G opacity="0.8">
                {/* Left Leaf */}
                <Path
                    d="M50 250 C 20 200, 80 100, 150 150"
                    stroke="#749F82"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />
                <Path d="M50 250 L 30 230 M60 235 L 40 215 M70 220 L 50 200" stroke="#749F82" strokeWidth="3" strokeLinecap="round" />

                {/* Right Leaf */}
                <Path
                    d="M350 250 C 380 200, 320 100, 250 150"
                    stroke="#749F82"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />
                <Path d="M350 250 L 370 230 M340 235 L 360 215 M330 220 L 350 200" stroke="#749F82" strokeWidth="3" strokeLinecap="round" />
            </G>

            {/* Person */}
            <G transform="translate(100, 80) scale(0.5)">
                {/* Legs (Lotus Position) */}
                <Path
                    d="M100 400 C 50 400, 0 350, 50 320 C 100 290, 300 290, 350 320 C 400 350, 350 400, 300 400 Z"
                    fill="#334155" // Dark pants
                />

                {/* Torso (Blue Shirt) */}
                <Path
                    d="M100 330 L 120 180 C 120 180, 280 180, 280 180 L 300 330 C 300 330, 200 360, 100 330 Z"
                    fill="#60A5FA" // Light Blue
                />

                {/* Arms */}
                <Path
                    d="M120 180 L 80 250 L 180 280"
                    stroke="#60A5FA" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                    d="M280 180 L 320 250 L 220 280"
                    stroke="#60A5FA" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Hands (Anjali Mudra) */}
                <Path
                    d="M180 280 L 200 230 L 220 280 Z"
                    fill="#F3D2C1" // Skin
                />

                {/* Neck */}
                <Path d="M180 180 L 180 150 L 220 150 L 220 180 Z" fill="#F3D2C1" />

                {/* Head */}
                <Circle cx="200" cy="120" r="50" fill="#F3D2C1" />

                {/* Hair - Flowing Right */}
                <Path
                    d="M150 120 C 150 50, 250 50, 250 120 C 250 120, 350 50, 400 100 C 400 150, 300 200, 250 150 L 250 120 Z"
                    fill="url(#hair_grad)"
                />

                {/* Face Features */}
                {/* Eyes (Closed) */}
                <Path d="M180 120 Q 190 125, 200 120" stroke="#8B5E3C" strokeWidth="2" fill="none" />
                <Path d="M220 120 Q 210 125, 200 120" stroke="#8B5E3C" strokeWidth="2" fill="none" />

                {/* Mouth (Smile) */}
                <Path d="M190 140 Q 200 145, 210 140" stroke="#8B5E3C" strokeWidth="2" fill="none" />
            </G>
        </Svg>
    );
};
