import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

interface Props {
    width?: number;
    height?: number;
}

/**
 * "Email Verified" illustration — an open envelope with a floating check,
 * surrounded by sparkle dots. Used on the OTP verification screen.
 */
export function VerifyIllustration({ width = 200, height = 180 }: Props) {
    return (
        <Svg width={width} height={height} viewBox="0 0 200 180" fill="none">
            <Defs>
                <RadialGradient id="vi_bg" cx="50%" cy="50%" r="52%">
                    <Stop offset="0"   stopColor="#7FD9D1" stopOpacity="0.20" />
                    <Stop offset="0.6" stopColor="#7EA889" stopOpacity="0.08" />
                    <Stop offset="1"   stopColor="#EAF4FF" stopOpacity="0"    />
                </RadialGradient>
                <LinearGradient id="vi_env" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#A7D7C5" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#7EA889" stopOpacity="0.80" />
                </LinearGradient>
                <LinearGradient id="vi_flap" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7FD9D1" stopOpacity="0.90" />
                    <Stop offset="1" stopColor="#A7D7C5" stopOpacity="0.70" />
                </LinearGradient>
                <LinearGradient id="vi_paper" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF"  stopOpacity="1.00" />
                    <Stop offset="1" stopColor="#EAF7F0"  stopOpacity="0.95" />
                </LinearGradient>
                <LinearGradient id="vi_check" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#7EA889" stopOpacity="1" />
                    <Stop offset="1" stopColor="#98C67A" stopOpacity="1" />
                </LinearGradient>
                <RadialGradient id="vi_shadow" cx="50%" cy="100%" r="50%">
                    <Stop offset="0" stopColor="#A7D7C5" stopOpacity="0.25" />
                    <Stop offset="1" stopColor="#A7D7C5" stopOpacity="0"    />
                </RadialGradient>
            </Defs>

            {/* Background glow */}
            <Circle cx={100} cy={90} r={85} fill="url(#vi_bg)" />

            {/* Ground shadow */}
            <Circle cx={100} cy={158} r={36} fill="url(#vi_shadow)" />

            {/* ── Envelope body ── */}
            {/* Back panel */}
            <Rect x={28} y={72} width={144} height={92} rx={10} fill="url(#vi_env)" />

            {/* Open flap (triangle, pointing up-open) */}
            <Path
                d="M 28 72 L 100 38 L 172 72 Z"
                fill="url(#vi_flap)"
            />
            {/* Flap inner shadow line */}
            <Path
                d="M 28 72 L 100 38 L 172 72"
                stroke="#7EA889" strokeWidth="1" opacity={0.25} fill="none"
            />

            {/* Envelope bottom-left fold */}
            <Path d="M 28 164 L 88 118" stroke="#7EA889" strokeWidth="1" opacity={0.20} fill="none" />
            {/* Envelope bottom-right fold */}
            <Path d="M 172 164 L 112 118" stroke="#7EA889" strokeWidth="1" opacity={0.20} fill="none" />

            {/* ── Letter / paper rising out of envelope ── */}
            <Rect x={62} y={44} width={76} height={72} rx={7} fill="url(#vi_paper)" />
            {/* Paper lines */}
            <Path d="M 74 62 H 126" stroke="#A7D7C5" strokeWidth="2" strokeLinecap="round" opacity={0.50} />
            <Path d="M 74 74 H 126" stroke="#A7D7C5" strokeWidth="2" strokeLinecap="round" opacity={0.40} />
            <Path d="M 74 86 H 108" stroke="#A7D7C5" strokeWidth="2" strokeLinecap="round" opacity={0.35} />

            {/* ── Check mark circle ── */}
            <Circle cx={118} cy={98} r={18} fill="url(#vi_check)" />
            <Circle cx={118} cy={98} r={18} stroke="#FFFFFF" strokeWidth={1.5} fill="none" opacity={0.35} />
            {/* Check tick */}
            <Path
                d="M 110 98 L 116 104 L 128 90"
                stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            />

            {/* ── Floating sparkle dots ── */}
            <Circle cx={38}  cy={56}  r={4}   fill="#7FD9D1" opacity={0.55} />
            <Circle cx={26}  cy={72}  r={2.5} fill="#98C67A" opacity={0.42} />
            <Circle cx={48}  cy={40}  r={2.5} fill="#7EA889" opacity={0.38} />
            <Circle cx={162} cy={52}  r={4}   fill="#7FD9D1" opacity={0.52} />
            <Circle cx={174} cy={68}  r={2.5} fill="#A7D7C5" opacity={0.42} />
            <Circle cx={152} cy={38}  r={2}   fill="#98C67A" opacity={0.38} />
            <Circle cx={22}  cy={118} r={2.8} fill="#A7D7C5" opacity={0.30} />
            <Circle cx={178} cy={116} r={2.8} fill="#7FD9D1" opacity={0.30} />

            {/* ── Cross sparkles ── */}
            <Path d="M 38 38 V 30" stroke="#7FD9D1" strokeWidth={1.8} strokeLinecap="round" opacity={0.45} />
            <Path d="M 34 34 H 42"  stroke="#7FD9D1" strokeWidth={1.8} strokeLinecap="round" opacity={0.45} />
            <Path d="M 162 36 V 28" stroke="#98C67A" strokeWidth={1.8} strokeLinecap="round" opacity={0.42} />
            <Path d="M 158 32 H 166" stroke="#98C67A" strokeWidth={1.8} strokeLinecap="round" opacity={0.42} />
        </Svg>
    );
}
