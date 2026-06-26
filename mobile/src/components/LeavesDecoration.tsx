import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
    color?: string;
}

export const LeavesDecoration = ({ width = 400, height = 400, color = '#7EA889' }: Props) => {
    const mint  = '#7FD9D1';
    const green2 = '#98C67A';

    return (
        <Svg width={width} height={height} viewBox="0 0 400 400" fill="none" style={{ position: 'absolute' }}>
            <Defs>
                {/* Main sage leaf */}
                <LinearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={color}  stopOpacity="0.55" />
                    <Stop offset="1" stopColor={color}  stopOpacity="0.08" />
                </LinearGradient>
                <LinearGradient id="lg1b" x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={color}  stopOpacity="0.40" />
                    <Stop offset="1" stopColor={color}  stopOpacity="0.04" />
                </LinearGradient>
                {/* Mint accent leaf */}
                <LinearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={mint}   stopOpacity="0.50" />
                    <Stop offset="1" stopColor={mint}   stopOpacity="0.06" />
                </LinearGradient>
                <LinearGradient id="lg2b" x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={mint}   stopOpacity="0.35" />
                    <Stop offset="1" stopColor={mint}   stopOpacity="0.03" />
                </LinearGradient>
                {/* Green accent */}
                <LinearGradient id="lg3" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={green2} stopOpacity="0.45" />
                    <Stop offset="1" stopColor={green2} stopOpacity="0.06" />
                </LinearGradient>
                {/* Radial glow for dot clusters */}
                <RadialGradient id="rg1" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={mint}  stopOpacity="0.35" />
                    <Stop offset="1" stopColor={mint}  stopOpacity="0"    />
                </RadialGradient>
                <RadialGradient id="rg2" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={color} stopOpacity="0.30" />
                    <Stop offset="1" stopColor={color} stopOpacity="0"    />
                </RadialGradient>
            </Defs>

            {/* ── Main sweeping branch ── */}
            <Path
                d="M 395 5 C 330 55 260 100 195 168 C 135 230 95 310 62 395"
                stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.12" fill="none"
            />
            {/* Secondary side branch */}
            <Path
                d="M 260 105 C 240 88 218 70 200 55"
                stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.09" fill="none"
            />
            <Path
                d="M 155 215 C 130 195 105 185 80 178"
                stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.08" fill="none"
            />

            {/* ── Large leaf — top right corner ── */}
            <G transform="translate(340, 52) rotate(-42) scale(0.78)" opacity={0.22}>
                <Path d="M0,0 C28,28 48,70 30,105 C12,140 -20,130 -30,100 C-40,70 -28,28 0,0 Z" fill="url(#lg1)" />
                <Path d="M0,0 C-28,28 -48,70 -30,105 C-12,140 20,130 30,100 C40,70 28,28 0,0 Z" fill="url(#lg1b)" />
                <Path d="M0,105 C0,70 0,35 0,0" stroke={color} strokeWidth="1.4" opacity="0.55" fill="none" strokeLinecap="round" />
                <Path d="M0,82 Q18,68 28,55" stroke={color} strokeWidth="0.7" opacity="0.35" fill="none" />
                <Path d="M0,55 Q22,42 35,28" stroke={color} strokeWidth="0.7" opacity="0.35" fill="none" />
                <Path d="M0,82 Q-18,68 -28,55" stroke={color} strokeWidth="0.7" opacity="0.35" fill="none" />
                <Path d="M0,55 Q-22,42 -35,28" stroke={color} strokeWidth="0.7" opacity="0.35" fill="none" />
            </G>

            {/* ── Mint-tinted leaf — mid-upper right ── */}
            <G transform="translate(278, 108) rotate(-68) scale(0.62)" opacity={0.24}>
                <Path d="M0,0 C22,22 38,58 24,88 C10,118 -16,110 -24,84 C-32,58 -22,22 0,0 Z" fill="url(#lg2)" />
                <Path d="M0,0 C-22,22 -38,58 -24,88 C-10,118 16,110 24,84 C32,58 22,22 0,0 Z" fill="url(#lg2b)" />
                <Path d="M0,88 C0,55 0,28 0,0" stroke={mint} strokeWidth="1.1" opacity="0.45" fill="none" strokeLinecap="round" />
                <Path d="M0,65 Q16,52 24,40" stroke={mint} strokeWidth="0.6" opacity="0.30" fill="none" />
                <Path d="M0,65 Q-16,52 -24,40" stroke={mint} strokeWidth="0.6" opacity="0.30" fill="none" />
            </G>

            {/* ── Small round leaf — beside branch ── */}
            <G transform="translate(298, 140) rotate(-18) scale(0.50)" opacity={0.20}>
                <Path d="M0,0 C18,18 28,48 16,72 C4,96 -12,88 -18,66 C-24,44 -18,18 0,0 Z" fill="url(#lg3)" />
                <Path d="M0,0 C-18,18 -28,48 -16,72 C-4,96 12,88 18,66 C24,44 18,18 0,0 Z" fill="url(#lg3)" />
                <Path d="M0,72 C0,44 0,22 0,0" stroke={green2} strokeWidth="1" opacity="0.40" fill="none" strokeLinecap="round" />
            </G>

            {/* ── Large elegant leaf — center-left ── */}
            <G transform="translate(212, 182) rotate(-78) scale(0.70)" opacity={0.26}>
                <Path d="M0,0 C26,26 44,66 28,100 C12,134 -18,124 -28,96 C-38,68 -26,26 0,0 Z" fill="url(#lg1)" />
                <Path d="M0,0 C-26,26 -44,66 -28,100 C-12,134 18,124 28,96 C38,68 26,26 0,0 Z" fill="url(#lg1b)" />
                <Path d="M0,100 C0,62 0,30 0,0" stroke={color} strokeWidth="1.3" opacity="0.50" fill="none" strokeLinecap="round" />
                <Path d="M0,76 Q20,62 30,48" stroke={color} strokeWidth="0.65" opacity="0.32" fill="none" />
                <Path d="M0,50 Q22,38 34,22" stroke={color} strokeWidth="0.65" opacity="0.32" fill="none" />
                <Path d="M0,76 Q-20,62 -30,48" stroke={color} strokeWidth="0.65" opacity="0.32" fill="none" />
                <Path d="M0,50 Q-22,38 -34,22" stroke={color} strokeWidth="0.65" opacity="0.32" fill="none" />
            </G>

            {/* ── Slim elongated leaf — right of center ── */}
            <G transform="translate(228, 210) rotate(-10) scale(0.45)" opacity={0.19}>
                <Path d="M0,0 C10,20 14,52 6,80 C2,94 -4,92 -8,78 C-14,58 -10,20 0,0 Z" fill="url(#lg2)" />
                <Path d="M0,0 C-10,20 -14,52 -6,80 C-2,94 4,92 8,78 C14,58 10,20 0,0 Z" fill="url(#lg2b)" />
                <Path d="M0,80 C0,50 0,25 0,0" stroke={mint} strokeWidth="0.9" opacity="0.38" fill="none" strokeLinecap="round" />
            </G>

            {/* ── Mint leaf — lower path ── */}
            <G transform="translate(145, 253) rotate(-84) scale(0.58)" opacity={0.27}>
                <Path d="M0,0 C22,22 36,58 22,88 C8,118 -14,108 -22,82 C-30,56 -22,22 0,0 Z" fill="url(#lg2)" />
                <Path d="M0,0 C-22,22 -36,58 -22,88 C-8,118 14,108 22,82 C30,56 22,22 0,0 Z" fill="url(#lg2b)" />
                <Path d="M0,88 C0,55 0,28 0,0" stroke={mint} strokeWidth="1.1" opacity="0.45" fill="none" strokeLinecap="round" />
                <Path d="M0,64 Q18,50 26,36" stroke={mint} strokeWidth="0.6" opacity="0.28" fill="none" />
                <Path d="M0,64 Q-18,50 -26,36" stroke={mint} strokeWidth="0.6" opacity="0.28" fill="none" />
            </G>

            {/* ── Small leaf at side branch end ── */}
            <G transform="translate(163, 278) rotate(-6) scale(0.40)" opacity={0.22}>
                <Path d="M0,0 C16,16 24,44 14,66 C4,88 -10,80 -14,60 C-18,40 -16,16 0,0 Z" fill="url(#lg3)" />
                <Path d="M0,0 C-16,16 -24,44 -14,66 C-4,88 10,80 14,60 C18,40 16,16 0,0 Z" fill="url(#lg3)" />
                <Path d="M0,66 C0,40 0,20 0,0" stroke={green2} strokeWidth="0.8" opacity="0.35" fill="none" strokeLinecap="round" />
            </G>

            {/* ── Tiny floating leaf — upper left ── */}
            <G transform="translate(52, 82) rotate(32) scale(0.35)" opacity={0.15}>
                <Path d="M0,0 C14,14 20,38 12,58 C4,78 -8,70 -12,52 C-16,34 -14,14 0,0 Z" fill="url(#lg1)" />
                <Path d="M0,0 C-14,14 -20,38 -12,58 C-4,78 8,70 12,52 C16,34 14,14 0,0 Z" fill="url(#lg1b)" />
                <Path d="M0,58 C0,36 0,18 0,0" stroke={color} strokeWidth="0.7" opacity="0.30" fill="none" strokeLinecap="round" />
            </G>

            {/* ── Floating leaf — lower right ── */}
            <G transform="translate(322, 302) rotate(-118) scale(0.42)" opacity={0.13}>
                <Path d="M0,0 C16,16 26,44 14,68 C2,90 -12,82 -16,60 C-20,38 -16,16 0,0 Z" fill="url(#lg2)" />
                <Path d="M0,0 C-16,16 -26,44 -14,68 C-2,90 12,82 16,60 C20,38 16,16 0,0 Z" fill="url(#lg2b)" />
                <Path d="M0,68 C0,42 0,21 0,0" stroke={mint} strokeWidth="0.7" opacity="0.25" fill="none" strokeLinecap="round" />
            </G>

            {/* ── Birds (Q-curve silhouettes) ── */}
            {/* Bird cluster 1 — upper area */}
            <Path d="M 148 38 Q 155 28 162 38" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.14} />
            <Path d="M 164 35 Q 171 25 178 35" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.14} />
            <Path d="M 180 42 Q 186 33 192 42" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.11} />

            {/* Bird cluster 2 — middle */}
            <Path d="M 48 158 Q 54 148 60 158" stroke={mint} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={0.12} />
            <Path d="M 61 155 Q 67 145 73 155" stroke={mint} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={0.12} />

            {/* Bird cluster 3 — right side */}
            <Path d="M 352 178 Q 358 169 364 178" stroke={green2} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.10} />
            <Path d="M 365 176 Q 370 167 376 176" stroke={green2} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.10} />

            {/* ── Pollen / sparkle dots ── */}
            <Circle cx={386} cy={92}  r={3.5} fill={mint}   opacity={0.18} />
            <Circle cx={370} cy={105} r={2}   fill={color}  opacity={0.14} />
            <Circle cx={395} cy={118} r={2.5} fill={mint}   opacity={0.15} />
            <Circle cx={115} cy={155} r={2.8} fill={green2} opacity={0.16} />
            <Circle cx={104} cy={168} r={1.8} fill={color}  opacity={0.12} />
            <Circle cx={126} cy={170} r={2}   fill={mint}   opacity={0.13} />
            <Circle cx={30}  cy={230} r={3}   fill={color}  opacity={0.14} />
            <Circle cx={44}  cy={242} r={2}   fill={mint}   opacity={0.11} />
            <Circle cx={242} cy={348} r={2.5} fill={green2} opacity={0.12} />
            <Circle cx={256} cy={358} r={1.8} fill={color}  opacity={0.10} />

            {/* ── Glow halos behind two leaf clusters ── */}
            <Circle cx={212} cy={182} r={28} fill="url(#rg2)" />
            <Circle cx={145} cy={253} r={24} fill="url(#rg1)" />
        </Svg>
    );
};
