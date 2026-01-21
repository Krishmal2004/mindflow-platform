import React from 'react';
import Svg, { Circle, Path, G, Ellipse } from 'react-native-svg';

interface EmotionIconProps {
    size?: number;
    color?: string;
}

// ===== STRESS LEVEL ICONS (1-5, Low to High) =====

export const StressLevel1 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#10B981" />
        <Circle cx="26" cy="16" r="2.5" fill="#10B981" />
        <Path d="M12 25 Q20 32, 28 25" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const StressLevel2 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#ECFDF5" stroke="#34D399" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#34D399" />
        <Circle cx="26" cy="16" r="2.5" fill="#34D399" />
        <Path d="M13 25 Q20 29, 27 25" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const StressLevel3 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#FBBF24" />
        <Circle cx="26" cy="16" r="2.5" fill="#FBBF24" />
        <Path d="M13 26 L27 26" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const StressLevel4 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEE2E2" stroke="#F87171" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#F87171" />
        <Circle cx="26" cy="16" r="2.5" fill="#F87171" />
        <Path d="M13 28 Q20 24, 27 28" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const StressLevel5 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        <Ellipse cx="14" cy="15" rx="3" ry="4" fill="#EF4444" />
        <Ellipse cx="26" cy="15" rx="3" ry="4" fill="#EF4444" />
        <Path d="M12 29 Q20 22, 28 29" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Sweat drop */}
        <Path d="M30 12 Q32 8, 34 12 Q32 14, 30 12" fill="#60A5FA" />
    </Svg>
);

// ===== MOOD LEVEL ICONS (1-5, Bad to Good) =====

export const MoodLevel1 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#3B82F6" />
        <Circle cx="26" cy="16" r="2.5" fill="#3B82F6" />
        <Path d="M12 29 Q20 22, 28 29" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Tear */}
        <Ellipse cx="14" cy="22" rx="1.5" ry="2.5" fill="#60A5FA" />
    </Svg>
);

export const MoodLevel2 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#6366F1" />
        <Circle cx="26" cy="16" r="2.5" fill="#6366F1" />
        <Path d="M13 27 Q20 24, 27 27" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const MoodLevel3 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#F59E0B" />
        <Circle cx="26" cy="16" r="2.5" fill="#F59E0B" />
        <Path d="M13 26 L27 26" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const MoodLevel4 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#10B981" />
        <Circle cx="26" cy="16" r="2.5" fill="#10B981" />
        <Path d="M13 24 Q20 29, 27 24" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const MoodLevel5 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
        {/* Happy closed eyes */}
        <Path d="M11 16 Q14 13, 17 16" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M23 16 Q26 13, 29 16" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M12 24 Q20 32, 28 24" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

// ===== SLEEP QUALITY ICONS (1-5, Poor to Great) =====

export const SleepLevel1 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#F3E8FF" stroke="#A855F7" strokeWidth="2" />
        {/* Tired droopy eyes */}
        <Path d="M11 17 L17 15" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
        <Path d="M23 15 L29 17" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="14" cy="18" r="2" fill="#A855F7" />
        <Circle cx="26" cy="18" r="2" fill="#A855F7" />
        <Path d="M14 27 Q20 24, 26 27" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
);

export const SleepLevel2 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#8B5CF6" />
        <Circle cx="26" cy="16" r="2.5" fill="#8B5CF6" />
        {/* Yawn mouth */}
        <Ellipse cx="20" cy="26" rx="4" ry="3" fill="#8B5CF6" />
    </Svg>
);

export const SleepLevel3 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#3B82F6" />
        <Circle cx="26" cy="16" r="2.5" fill="#3B82F6" />
        <Path d="M13 26 L27 26" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const SleepLevel4 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#E0F2FE" stroke="#0EA5E9" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#0EA5E9" />
        <Circle cx="26" cy="16" r="2.5" fill="#0EA5E9" />
        <Path d="M13 24 Q20 28, 27 24" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const SleepLevel5 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#CFFAFE" stroke="#06B6D4" strokeWidth="2" />
        {/* Peaceful closed eyes */}
        <Path d="M11 16 Q14 14, 17 16" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M23 16 Q26 14, 29 16" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M13 24 Q20 30, 27 24" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Star sparkle */}
        <Path d="M32 8 L33 10 L35 10 L33.5 11.5 L34 14 L32 12.5 L30 14 L30.5 11.5 L29 10 L31 10 Z" fill="#FBBF24" />
    </Svg>
);

// ===== RELAXATION LEVEL ICONS (1-5, Tense to Calm) =====

export const RelaxationLevel1 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        {/* Worried eyebrows */}
        <Path d="M10 12 L16 14" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <Path d="M24 14 L30 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="14" cy="17" r="2.5" fill="#EF4444" />
        <Circle cx="26" cy="17" r="2.5" fill="#EF4444" />
        <Path d="M14 28 Q20 23, 26 28" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
);

export const RelaxationLevel2 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#F59E0B" />
        <Circle cx="26" cy="16" r="2.5" fill="#F59E0B" />
        <Path d="M13 27 Q20 24, 27 27" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
);

export const RelaxationLevel3 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#E0F2FE" stroke="#0EA5E9" strokeWidth="2" />
        <Circle cx="14" cy="16" r="2.5" fill="#0EA5E9" />
        <Circle cx="26" cy="16" r="2.5" fill="#0EA5E9" />
        <Path d="M13 26 L27 26" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const RelaxationLevel4 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
        {/* Relaxed half-closed eyes */}
        <Path d="M11 16 Q14 15, 17 16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M23 16 Q26 15, 29 16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M13 24 Q20 28, 27 24" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
);

export const RelaxationLevel5 = ({ size = 40 }: EmotionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
        {/* Zen closed eyes */}
        <Path d="M11 16 Q14 14, 17 16" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M23 16 Q26 14, 29 16" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M13 24 Q20 30, 27 24" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Lotus petals around */}
        <Path d="M6 20 Q8 18, 6 16" stroke="#059669" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
        <Path d="M34 20 Q32 18, 34 16" stroke="#059669" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
    </Svg>
);

// Export arrays for easy mapping
export const StressIcons = [StressLevel1, StressLevel2, StressLevel3, StressLevel4, StressLevel5];
export const MoodIcons = [MoodLevel1, MoodLevel2, MoodLevel3, MoodLevel4, MoodLevel5];
export const SleepIcons = [SleepLevel1, SleepLevel2, SleepLevel3, SleepLevel4, SleepLevel5];
export const RelaxationIcons = [RelaxationLevel1, RelaxationLevel2, RelaxationLevel3, RelaxationLevel4, RelaxationLevel5];
