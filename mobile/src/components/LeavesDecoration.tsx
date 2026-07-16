import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
    color?: string;
}

export const LeavesDecoration = ({ width = 400, height = 400, color = '#7EA889' }: Props) => {
    // Calming ambient color palette tokens
    const softSage = color; // primary sage color
    const softAmber = '#FDF4E5'; // soft sunlight
    const softMint = '#E6FAF6';  // soft mint water

    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" style={{ position: 'absolute' }} pointerEvents="none">
            <Defs>
                {/* Top-Right Sage Glow */}
                <RadialGradient id="sageGlowGrad" cx="95%" cy="5%" rx="75%" ry="75%">
                    <Stop offset="0%" stopColor={softSage} stopOpacity="0.20" />
                    <Stop offset="50%" stopColor={softSage} stopOpacity="0.08" />
                    <Stop offset="100%" stopColor={softSage} stopOpacity="0" />
                </RadialGradient>

                {/* Left-Center Soft Mint Glow */}
                <RadialGradient id="mintGlowGrad" cx="5%" cy="35%" rx="65%" ry="65%">
                    <Stop offset="0%" stopColor={softMint} stopOpacity="0.50" />
                    <Stop offset="60%" stopColor={softMint} stopOpacity="0.18" />
                    <Stop offset="100%" stopColor={softMint} stopOpacity="0" />
                </RadialGradient>

                {/* Bottom-Right Warm Amber Glow */}
                <RadialGradient id="amberGlowGrad" cx="90%" cy="80%" rx="80%" ry="80%">
                    <Stop offset="0%" stopColor={softAmber} stopOpacity="0.45" />
                    <Stop offset="60%" stopColor={softAmber} stopOpacity="0.15" />
                    <Stop offset="100%" stopColor={softAmber} stopOpacity="0" />
                </RadialGradient>
            </Defs>

            {/* Render soft, blurred mesh layer fields */}
            <Rect x="0" y="0" width="400" height="400" fill="url(#sageGlowGrad)" />
            <Rect x="0" y="0" width="400" height="400" fill="url(#mintGlowGrad)" />
            <Rect x="0" y="0" width="400" height="400" fill="url(#amberGlowGrad)" />
        </Svg>
    );
};
export default LeavesDecoration;
