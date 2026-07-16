import React, { useRef, useEffect, memo } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface Props {
    isCG: boolean;
    w: number;
    h: number;
}

// Canonical leaf silhouette: pointed tip at top, rounded lobed base — drawn once,
// then reused at different positions/rotations/scales via <G transform>.
const LEAF_BODY = 'M0,0 C-7,-2 -9,-10 -3,-16 C-1,-18 1,-18 3,-16 C9,-10 7,-2 0,0 Z';
const LEAF_MIDRIB = 'M0,-1 Q1.4,-9 0,-16.5';
const LEAF_VEINS = [
    'M0,-4.5 Q-3.5,-6 -5.5,-9.5',
    'M0,-4.5 Q3.5,-6 5.5,-9.5',
];

// Canonical gull-wing bird glyph, wingtips at the baseline, apex dipping up at center.
const BIRD_PATH = 'M-7,0 Q-3.5,-5.5 0,0 Q3.5,-5.5 7,0';

type LeafSpec = { x: number; y: number; rotate: number; scale: number; secondary?: boolean; opacity: number };
type BirdSpec = { x: number; y: number; scale: number; opacity: number; secondary?: boolean };

// Trimmed to 3 leaves / 5 birds — enough to read as a scene without over-rendering.
const LEAVES: LeafSpec[] = [
    { x: 10, y: 30, rotate: -18, scale: 1.15, opacity: 0.13 },
    { x: 92, y: 74, rotate: 158, scale: 1.05, secondary: true, opacity: 0.13 },
    { x: 6, y: 63, rotate: -34, scale: 0.8, opacity: 0.1 },
];

const BIRDS: BirdSpec[] = [
    { x: 52, y: 19, scale: 1.15, opacity: 0.22 },
    { x: 41, y: 24, scale: 1, opacity: 0.2 },
    { x: 63, y: 24, scale: 1, opacity: 0.2 },
    { x: 32, y: 29.5, scale: 0.8, opacity: 0.16 },
    { x: 72, y: 29.5, scale: 0.8, opacity: 0.16 },
];

function RoadmapBgDecorImpl({ isCG, w, h }: Props) {
    const colorPrimary = isCG ? '#D97706' : '#749F82';
    const colorSecondary = isCG ? '#F59E0B' : '#7FD9D1';

    // Two looping animation drivers (down from three — the ring "breathing" pulse
    // was the least visible of the three and isn't worth a perpetual native loop).
    const swayValue = useRef(new Animated.Value(0)).current;
    const hoverValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Organic wind sway for drifting leaves
        Animated.loop(
            Animated.sequence([
                Animated.timing(swayValue, { toValue: 1, duration: 5500, useNativeDriver: true }),
                Animated.timing(swayValue, { toValue: -1, duration: 5500, useNativeDriver: true }),
            ])
        ).start();

        // Flutter/hover shift for birds
        Animated.loop(
            Animated.sequence([
                Animated.timing(hoverValue, { toValue: 1, duration: 3800, useNativeDriver: true }),
                Animated.timing(hoverValue, { toValue: -1, duration: 3800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const leafRotation = swayValue.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
    const leafTranslateY = swayValue.interpolate({ inputRange: [-1, 1], outputRange: [-2.5, 2.5] });
    const birdTranslateY = hoverValue.interpolate({ inputRange: [-1, 1], outputRange: [-3.5, 3.5] });
    const birdTranslateX = hoverValue.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {/* ── Layer 1: Static wind currents + sunrise/ripple glow (no animation) ── */}
            <Svg width={w} height={h} viewBox="0 0 100 100" style={StyleSheet.absoluteFillObject}>
                <Path d="M -5 16 Q 25 6, 50 25 T 105 22" stroke={colorSecondary} strokeWidth="0.8" strokeDasharray="4 6" fill="none" opacity={0.18} />
                <Path d="M -5 75 Q 35 65, 60 85 T 105 78" stroke={colorPrimary} strokeWidth="0.6" strokeDasharray="3 5" fill="none" opacity={0.15} />

                {/* Top-right sunrise */}
                <Circle cx="86" cy="16" r="22" stroke={colorSecondary} strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity={0.12} />
                <Circle cx="86" cy="16" r="14" fill={colorSecondary} opacity={0.1} />
                <Circle cx="86" cy="16" r="8" fill={colorPrimary} opacity={0.08} />

                {/* Bottom-left water ripple */}
                <Circle cx="10" cy="85" r="28" stroke={colorPrimary} strokeWidth="0.6" strokeDasharray="4 4" fill="none" opacity={0.1} />
                <Circle cx="10" cy="85" r="16" fill={colorSecondary} opacity={0.08} />
            </Svg>

            {/* ── Layer 2: Drifting botanical leaves (sway) ── */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: leafRotation }, { translateY: leafTranslateY }] }]}>
                <Svg width={w} height={h} viewBox="0 0 100 100" style={StyleSheet.absoluteFillObject}>
                    {LEAVES.map((leaf, i) => {
                        const color = leaf.secondary ? colorSecondary : colorPrimary;
                        return (
                            <G key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}>
                                <Path d={LEAF_BODY} fill={color} opacity={leaf.opacity} />
                                <Path d={LEAF_MIDRIB} stroke={color} strokeWidth={0.6} fill="none" opacity={leaf.opacity + 0.05} />
                                {LEAF_VEINS.map((vein, vi) => (
                                    <Path key={vi} d={vein} stroke={color} strokeWidth={0.4} fill="none" opacity={leaf.opacity} />
                                ))}
                            </G>
                        );
                    })}
                </Svg>
            </Animated.View>

            {/* ── Layer 3: Small flock of birds (hover) ── */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: birdTranslateY }, { translateX: birdTranslateX }] }]}>
                <Svg width={w} height={h} viewBox="0 0 100 100" style={StyleSheet.absoluteFillObject}>
                    {BIRDS.map((bird, i) => (
                        <Path
                            key={i}
                            d={BIRD_PATH}
                            transform={`translate(${bird.x} ${bird.y}) scale(${bird.scale})`}
                            stroke={bird.secondary ? colorSecondary : colorPrimary}
                            strokeWidth={1.1}
                            fill="none"
                            strokeLinecap="round"
                            opacity={bird.opacity}
                        />
                    ))}
                </Svg>
            </Animated.View>
        </View>
    );
}

export const RoadmapBgDecor = memo(RoadmapBgDecorImpl);
export default RoadmapBgDecor;
