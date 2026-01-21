import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
}

export const LeavesDecoration = ({ width = 400, height = 400 }: Props) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" fill="none" style={{ position: 'absolute' }}>
            {/* Left Large Leaf */}
            <G opacity="0.6" transform="translate(-20, 100) rotate(-10)">
                <Path d="M0 200 Q 50 100, 150 150 T 250 100" stroke="#749F82" strokeWidth="2" fill="none" />
                <Path d="M150 150 L 130 130" stroke="#749F82" strokeWidth="2" />
                <Path d="M180 140 L 160 120" stroke="#749F82" strokeWidth="2" />
                <Path d="M100 170 L 120 190" stroke="#749F82" strokeWidth="2" />
                <Path d="M50 190 L 70 210" stroke="#749F82" strokeWidth="2" />
                {/* Leaf Shape Fill */}
                <Path d="M0 200 Q 50 50, 150 150 Q 250 250, 0 200 Z" fill="#749F82" opacity="0.2" />
            </G>

            {/* Right Large Leaf */}
            <G opacity="0.6" transform="translate(250, 120) rotate(15)">
                <Path d="M150 200 Q 100 100, 0 150 T -100 100" stroke="#749F82" strokeWidth="2" fill="none" />
                <Path d="M0 150 L 20 130" stroke="#749F82" strokeWidth="2" />
                <Path d="M-40 140 L -20 120" stroke="#749F82" strokeWidth="2" />
                <Path d="M50 170 L 30 190" stroke="#749F82" strokeWidth="2" />
                {/* Leaf Shape Fill */}
                <Path d="M150 200 Q 100 50, 0 150 Q -100 250, 150 200 Z" fill="#749F82" opacity="0.2" />
            </G>
        </Svg>
    );
};
