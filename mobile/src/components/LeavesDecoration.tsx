import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
    color?: string;
}

interface LeafProps {
    x: number;
    y: number;
    scale: number;
    rotate: number;
    opacity: number;
    color: string;
}

const DetailedLeaf = ({ x, y, scale, rotate, opacity, color }: LeafProps) => {
    const colorId = color.replace('#', '');
    return (
        <G transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
            {/* Left half blade */}
            <Path
                d="M0,100 C30,70 60,40 100,0 C100,0 80,60 50,110 C35,135 15,145 0,150 Z"
                fill={`url(#leafGrad1_${colorId})`}
            />
            {/* Right half blade */}
            <Path
                d="M0,100 C-30,70 -60,40 -100,0 C-100,0 -80,60 -50,110 C-35,135 -15,145 0,150 Z"
                fill={`url(#leafGrad2_${colorId})`}
            />
            {/* Main vein stem */}
            <Path
                d="M0,150 C0,110 0,60 0,0"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
                fill="none"
            />
            {/* Side veins - right side */}
            <Path d="M0,120 Q15,105 25,95" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,90 Q25,75 40,60" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,60 Q30,45 50,30" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,30 Q20,20 35,10" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            
            {/* Side veins - left side */}
            <Path d="M0,120 Q-15,105 -25,95" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,90 Q-25,75 -40,60" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,60 Q-30,45 -50,30" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
            <Path d="M0,30 Q-20,20 -35,10" stroke={color} strokeWidth="0.8" opacity="0.4" fill="none" />
        </G>
    );
};

export const LeavesDecoration = ({ width = 400, height = 400, color = '#749F82' }: Props) => {
    const colorId = color.replace('#', '');
    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" fill="none" style={{ position: 'absolute' }}>
            <Defs>
                <LinearGradient id={`leafGrad1_${colorId}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={color} stopOpacity="0.45" />
                    <Stop offset="1" stopColor={color} stopOpacity="0.05" />
                </LinearGradient>
                <LinearGradient id={`leafGrad2_${colorId}`} x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor={color} stopOpacity="0.35" />
                    <Stop offset="1" stopColor={color} stopOpacity="0.02" />
                </LinearGradient>
            </Defs>

            {/* Main stem of the branch */}
            <Path
                d="M400,0 C330,60 250,110 180,180 C110,250 80,320 60,400"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.10"
                fill="none"
            />

            {/* Detailed leaves along the stem */}
            <DetailedLeaf x={330} y={60} rotate={-45} scale={0.7} opacity={0.2} color={color} />
            <DetailedLeaf x={270} y={110} rotate={-75} scale={0.65} opacity={0.22} color={color} />
            <DetailedLeaf x={290} y={140} rotate={-15} scale={0.6} opacity={0.18} color={color} />
            <DetailedLeaf x={210} y={180} rotate={-80} scale={0.55} opacity={0.24} color={color} />
            <DetailedLeaf x={230} y={210} rotate={-10} scale={0.5} opacity={0.2} color={color} />
            <DetailedLeaf x={140} y={250} rotate={-85} scale={0.48} opacity={0.25} color={color} />
            <DetailedLeaf x={160} y={280} rotate={-5} scale={0.42} opacity={0.22} color={color} />
            <DetailedLeaf x={80} y={350} rotate={-90} scale={0.35} opacity={0.2} color={color} />

            {/* Subtle Floating Leaves in other areas */}
            <DetailedLeaf x={50} y={80} rotate={35} scale={0.38} opacity={0.12} color={color} />
            <DetailedLeaf x={320} y={300} rotate={-120} scale={0.45} opacity={0.1} color={color} />
        </Svg>
    );
};
