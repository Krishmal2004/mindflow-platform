import React from 'react';
import Svg, { Path, Circle, G, Ellipse, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
}

/**
 * "New Journey" illustration for the signup screen.
 * A blooming plant with layered leaves and a lotus-style flower,
 * surrounded by floating sparkles — representing growth and new beginnings.
 */
export function SignupIllustration({ width = 220, height = 210 }: Props) {
    const W = 220; const H = 210;
    const cx = W / 2;        // 110
    const flowerY = 72;      // bloom center Y
    const stemBase = H - 18; // 192

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} fill="none">
            <Defs>
                {/* Background glow */}
                <RadialGradient id="si_bg" cx="50%" cy="45%" r="52%">
                    <Stop offset="0"   stopColor="#7FD9D1" stopOpacity="0.18" />
                    <Stop offset="0.6" stopColor="#7EA889" stopOpacity="0.08" />
                    <Stop offset="1"   stopColor="#EAF4FF" stopOpacity="0"    />
                </RadialGradient>
                {/* Ground glow */}
                <RadialGradient id="si_ground" cx="50%" cy="100%" r="50%">
                    <Stop offset="0" stopColor="#A7D7C5" stopOpacity="0.30" />
                    <Stop offset="1" stopColor="#A7D7C5" stopOpacity="0"    />
                </RadialGradient>
                {/* Outer petals */}
                <LinearGradient id="si_petal_o" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#98C67A" stopOpacity="0.85" />
                    <Stop offset="1" stopColor="#7EA889" stopOpacity="0.55" />
                </LinearGradient>
                {/* Inner petals */}
                <LinearGradient id="si_petal_i" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7FD9D1" stopOpacity="0.90" />
                    <Stop offset="1" stopColor="#63C9D9" stopOpacity="0.60" />
                </LinearGradient>
                {/* Center circle */}
                <RadialGradient id="si_center" cx="50%" cy="50%" r="50%">
                    <Stop offset="0"   stopColor="#FFFFFF"  stopOpacity="0.95" />
                    <Stop offset="0.5" stopColor="#A7D7C5"  stopOpacity="0.80" />
                    <Stop offset="1"   stopColor="#7FD9D1"  stopOpacity="0.65" />
                </RadialGradient>
                {/* Big leaf gradient */}
                <LinearGradient id="si_leaf_l" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#98C67A" stopOpacity="0.80" />
                    <Stop offset="1" stopColor="#7EA889" stopOpacity="0.45" />
                </LinearGradient>
                <LinearGradient id="si_leaf_r" x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7EA889" stopOpacity="0.80" />
                    <Stop offset="1" stopColor="#A7D7C5" stopOpacity="0.45" />
                </LinearGradient>
                {/* Small leaf */}
                <LinearGradient id="si_leaf_s" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7FD9D1" stopOpacity="0.75" />
                    <Stop offset="1" stopColor="#7EA889" stopOpacity="0.40" />
                </LinearGradient>
                {/* Stem */}
                <LinearGradient id="si_stem" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7EA889" stopOpacity="0.70" />
                    <Stop offset="1" stopColor="#A7D7C5" stopOpacity="0.50" />
                </LinearGradient>
            </Defs>

            {/* ── Large background glow ── */}
            <Circle cx={cx} cy={H * 0.46} r={92} fill="url(#si_bg)" />

            {/* ── Ground mist ── */}
            <Ellipse cx={cx} cy={stemBase + 4} rx={52} ry={10} fill="url(#si_ground)" />

            {/* ── Stem ── */}
            <Path
                d={`M ${cx} ${stemBase} C ${cx - 4} ${stemBase - 30} ${cx + 5} ${stemBase - 60} ${cx} ${flowerY + 28}`}
                stroke="url(#si_stem)" strokeWidth="3.5" strokeLinecap="round"
            />

            {/* ── Big left leaf ── */}
            <Path
                d={`M ${cx} ${stemBase - 52}
                    C ${cx - 18} ${stemBase - 62} ${cx - 44} ${stemBase - 72} ${cx - 50} ${stemBase - 60}
                    C ${cx - 56} ${stemBase - 48} ${cx - 30} ${stemBase - 38} ${cx} ${stemBase - 46} Z`}
                fill="url(#si_leaf_l)"
            />
            {/* Left leaf vein */}
            <Path
                d={`M ${cx} ${stemBase - 48} Q ${cx - 28} ${stemBase - 58} ${cx - 46} ${stemBase - 62}`}
                stroke="#7EA889" strokeWidth="0.8" opacity="0.45" strokeLinecap="round"
            />

            {/* ── Big right leaf ── */}
            <Path
                d={`M ${cx} ${stemBase - 60}
                    C ${cx + 18} ${stemBase - 70} ${cx + 44} ${stemBase - 80} ${cx + 50} ${stemBase - 68}
                    C ${cx + 56} ${stemBase - 56} ${cx + 30} ${stemBase - 46} ${cx} ${stemBase - 54} Z`}
                fill="url(#si_leaf_r)"
            />
            {/* Right leaf vein */}
            <Path
                d={`M ${cx} ${stemBase - 56} Q ${cx + 28} ${stemBase - 66} ${cx + 46} ${stemBase - 72}`}
                stroke="#7EA889" strokeWidth="0.8" opacity="0.45" strokeLinecap="round"
            />

            {/* ── Mid-left small leaf ── */}
            <Path
                d={`M ${cx} ${flowerY + 52}
                    C ${cx - 14} ${flowerY + 42} ${cx - 32} ${flowerY + 36} ${cx - 34} ${flowerY + 46}
                    C ${cx - 36} ${flowerY + 56} ${cx - 18} ${flowerY + 60} ${cx} ${flowerY + 50} Z`}
                fill="url(#si_leaf_s)"
            />

            {/* ── Mid-right small leaf ── */}
            <Path
                d={`M ${cx} ${flowerY + 48}
                    C ${cx + 14} ${flowerY + 38} ${cx + 32} ${flowerY + 32} ${cx + 34} ${flowerY + 42}
                    C ${cx + 36} ${flowerY + 52} ${cx + 18} ${flowerY + 56} ${cx} ${flowerY + 46} Z`}
                fill="url(#si_leaf_s)"
            />

            {/* ── Outer bloom petals (5 petals, rotated around flower center) ── */}
            {[0, 72, 144, 216, 288].map((deg, i) => (
                <G key={`op${i}`} transform={`translate(${cx}, ${flowerY}) rotate(${deg})`}>
                    <Path
                        d="M 0 0 C -9 -10 -8 -26 0 -32 C 8 -26 9 -10 0 0"
                        fill="url(#si_petal_o)" opacity={0.88}
                    />
                </G>
            ))}

            {/* ── Inner bloom petals (5 petals, offset 36°) ── */}
            {[36, 108, 180, 252, 324].map((deg, i) => (
                <G key={`ip${i}`} transform={`translate(${cx}, ${flowerY}) rotate(${deg})`}>
                    <Path
                        d="M 0 0 C -6 -7 -5 -18 0 -22 C 5 -18 6 -7 0 0"
                        fill="url(#si_petal_i)" opacity={0.92}
                    />
                </G>
            ))}

            {/* ── Bloom center ── */}
            <Circle cx={cx} cy={flowerY} r={9} fill="url(#si_center)" />
            <Circle cx={cx} cy={flowerY} r={5} fill="#FFFFFF" opacity={0.70} />

            {/* ── Floating sparkle dots ── */}
            {/* Top left area */}
            <Circle cx={cx - 42} cy={flowerY - 28} r={3.2} fill="#7FD9D1" opacity={0.55} />
            <Circle cx={cx - 32} cy={flowerY - 44} r={2}   fill="#98C67A" opacity={0.45} />
            <Circle cx={cx - 54} cy={flowerY - 10} r={2.4} fill="#7EA889" opacity={0.38} />
            {/* Top right area */}
            <Circle cx={cx + 42} cy={flowerY - 25} r={3}   fill="#7FD9D1" opacity={0.52} />
            <Circle cx={cx + 28} cy={flowerY - 42} r={2.2} fill="#A7D7C5" opacity={0.45} />
            <Circle cx={cx + 56} cy={flowerY - 8}  r={2}   fill="#98C67A" opacity={0.38} />
            {/* Mid sides */}
            <Circle cx={cx - 60} cy={flowerY + 20} r={2.5} fill="#7FD9D1" opacity={0.32} />
            <Circle cx={cx + 60} cy={flowerY + 18} r={2.5} fill="#7FD9D1" opacity={0.32} />
            {/* Lower area */}
            <Circle cx={cx - 22} cy={flowerY + 62} r={2}   fill="#A7D7C5" opacity={0.28} />
            <Circle cx={cx + 22} cy={flowerY + 60} r={2}   fill="#A7D7C5" opacity={0.28} />

            {/* ── Tiny cross sparkles ── */}
            <Path d={`M ${cx - 48} ${flowerY - 36} V ${flowerY - 28}`} stroke="#7FD9D1" strokeWidth="1.5" opacity={0.40} strokeLinecap="round" />
            <Path d={`M ${cx - 52} ${flowerY - 32} H ${cx - 44}`}      stroke="#7FD9D1" strokeWidth="1.5" opacity={0.40} strokeLinecap="round" />
            <Path d={`M ${cx + 50} ${flowerY - 34} V ${cx - 26}`}      stroke="#98C67A" strokeWidth="1.5" opacity={0.38} strokeLinecap="round" />
            <Path d={`M ${cx + 46} ${flowerY - 30} H ${cx + 54}`}      stroke="#98C67A" strokeWidth="1.5" opacity={0.38} strokeLinecap="round" />
        </Svg>
    );
}
