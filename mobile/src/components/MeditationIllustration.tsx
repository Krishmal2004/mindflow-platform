import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, Ellipse, Rect, Filter, FeGaussianBlur, FeOffset, FeFlood, FeComposite, FeMerge, FeMergeNode } from 'react-native-svg';

interface IllustrationProps {
    width?: number;
    height?: number;
}

// 1. Meditation Illustration (Default / General)
export const MeditationIllustration = ({ width = 300, height = 300 }: IllustrationProps) => {
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

// 2. Thrive Illustration (Mindful Person with Sun/Growth) - From ThriveTrackerScreen
export const ThriveIllustration = ({ width: w = 280, height: h = 280 }: IllustrationProps) => (
    <Svg width={w} height={h} viewBox="0 0 400 400" fill="none">
        <Defs>
            <LinearGradient id="thriveGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#10B981" />
                <Stop offset="1" stopColor="#059669" />
            </LinearGradient>
            <LinearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FCD34D" />
                <Stop offset="1" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="hairGrad" x1="150" y1="50" x2="350" y2="150" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#1E293B" />
                <Stop offset="1" stopColor="#0F172A" />
            </LinearGradient>
        </Defs>

        {/* Background decorative circles (Greenish for growth) */}
        <Circle cx="200" cy="200" r="180" fill="#D1FAE5" opacity="0.3" />
        <Circle cx="200" cy="200" r="150" fill="#A7F3D0" opacity="0.3" />

        {/* Sun in background */}
        <Circle cx="320" cy="80" r="40" fill="url(#sunGrad)" opacity="0.8" />
        <Circle cx="320" cy="80" r="50" stroke="#FCD34D" strokeWidth="2" opacity="0.4" />

        {/* Person (Calm/Thriving) */}
        <G transform="translate(100, 80) scale(0.5)">
            {/* Body */}
            <Ellipse cx="200" cy="380" rx="80" ry="30" fill="#10B981" />
            <Path
                d="M140 380 L160 260 C180 240, 220 240, 240 260 L260 380 Z"
                fill="#10B981"
            />

            {/* Arms - Open/Welcoming gesture */}
            <Path
                d="M160 280 L100 240 L80 220"
                stroke="#10B981" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
            <Path
                d="M240 280 L300 240 L320 220"
                stroke="#10B981" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />

            {/* Hands */}
            <Circle cx="80" cy="220" r="20" fill="#F3D2C1" />
            <Circle cx="320" cy="220" r="20" fill="#F3D2C1" />

            {/* Neck */}
            <Rect x="180" y="200" width="40" height="60" fill="#F3D2C1" />

            {/* Head */}
            <Circle cx="200" cy="160" r="60" fill="#F3D2C1" />

            {/* Hair */}
            <Path
                d="M140 160 C140 80, 260 80, 260 160 C260 140, 300 100, 280 150 L260 160"
                fill="url(#hairGrad)"
            />

            {/* Eyes (Closed/Peaceful) */}
            <Path d="M170 150 Q180 155, 190 150" stroke="#1E293B" strokeWidth="3" fill="none" />
            <Path d="M210 150 Q220 155, 230 150" stroke="#1E293B" strokeWidth="3" fill="none" />

            {/* Smile */}
            <Path d="M180 180 Q200 195, 220 180" stroke="#1E293B" strokeWidth="3" fill="none" />
        </G>

        {/* Small leaves/nature elements floating */}
        <Path d="M300 200 Q320 180, 340 200 Q320 220, 300 200" fill="#10B981" opacity="0.6" transform="rotate(30, 320, 200)" />
        <Path d="M60 200 Q80 180, 100 200 Q80 220, 60 200" fill="#10B981" opacity="0.6" transform="rotate(-30, 80, 200)" />
    </Svg>
);

// 3. Stress Illustration (Calm/Balancing) - From StressSnapshotScreen
export const StressIllustration = ({ width: w = 280, height: h = 280 }: IllustrationProps) => (
    <Svg width={w} height={h} viewBox="0 0 400 400" fill="none">
        <Defs>
            <LinearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3B82F6" />
                <Stop offset="1" stopColor="#2563EB" />
            </LinearGradient>
            <LinearGradient id="calmGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#60A5FA" />
                <Stop offset="1" stopColor="#93C5FD" />
            </LinearGradient>
            <LinearGradient id="hairGrad" x1="150" y1="50" x2="350" y2="150" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#1E293B" />
                <Stop offset="1" stopColor="#0F172A" />
            </LinearGradient>
        </Defs>

        {/* Background decorative circles (Blueish/Calm) */}
        <Circle cx="200" cy="200" r="180" fill="#DBEAFE" opacity="0.3" />
        <Circle cx="200" cy="200" r="150" fill="#BFDBFE" opacity="0.3" />

        {/* Floating Rocks / Balance stones */}
        <Ellipse cx="330" cy="100" rx="30" ry="15" fill="#94A3B8" opacity="0.6" />
        <Ellipse cx="330" cy="75" rx="20" ry="10" fill="#64748B" opacity="0.6" />
        <Ellipse cx="330" cy="55" rx="15" ry="8" fill="#475569" opacity="0.6" />

        {/* Person (Meditating/Balancing) */}
        <G transform="translate(100, 80) scale(0.5)">
            {/* Body - Seated pose */}
            <Path
                d="M100 380 Q200 420, 300 380 L280 280 Q200 260, 120 280 Z"
                fill="#3B82F6"
            />

            {/* Chest/Torso */}
            <Rect x="140" y="240" width="120" height="100" rx="20" fill="#3B82F6" />

            {/* Arms - Resting on knees */}
            <Path
                d="M140 260 C100 280, 80 320, 60 360"
                stroke="#3B82F6" strokeWidth="25" strokeLinecap="round" fill="none"
            />
            <Path
                d="M260 260 C300 280, 320 320, 340 360"
                stroke="#3B82F6" strokeWidth="25" strokeLinecap="round" fill="none"
            />

            {/* Hands */}
            <Circle cx="60" cy="360" r="20" fill="#F3D2C1" />
            <Circle cx="340" cy="360" r="20" fill="#F3D2C1" />

            {/* Neck */}
            <Rect x="180" y="200" width="40" height="50" fill="#F3D2C1" />

            {/* Head */}
            <Circle cx="200" cy="160" r="60" fill="#F3D2C1" />

            {/* Hair */}
            <Path
                d="M140 160 C140 80, 260 80, 260 160 C260 140, 300 100, 280 150 L260 160"
                fill="url(#hairGrad)"
            />

            {/* Eyes (Closed) */}
            <Path d="M170 160 Q180 165, 190 160" stroke="#1E293B" strokeWidth="3" fill="none" />
            <Path d="M210 160 Q220 165, 230 160" stroke="#1E293B" strokeWidth="3" fill="none" />
        </G>

        {/* Calm waves at bottom */}
        <Path d="M50 350 Q100 330, 150 350 T250 350 T350 350" stroke="#60A5FA" strokeWidth="4" fill="none" opacity="0.5" />
        <Path d="M70 370 Q120 350, 170 370 T270 370 T370 370" stroke="#60A5FA" strokeWidth="4" fill="none" opacity="0.3" />
    </Svg>
);

// 4. Mirror Illustration (Reflection/Self-Awareness) - Mirror with Reflection (Blue Theme)
export const MirrorIllustration = ({ width: w = 280, height: h = 280 }: IllustrationProps) => (
    <Svg width={w} height={h} viewBox="0 0 400 400" fill="none">
        <Defs>
            <LinearGradient id="mirrorFrameGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#1E3A8A" />
                <Stop offset="1" stopColor="#1E40AF" />
            </LinearGradient>
            <LinearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#EFF6FF" />
                <Stop offset="1" stopColor="#DBEAFE" />
            </LinearGradient>
            <LinearGradient id="reflectionGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#60A5FA" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#3B82F6" stopOpacity="0.1" />
            </LinearGradient>
        </Defs>

        {/* Background Aura/Glow */}
        <Circle cx="200" cy="200" r="180" fill="#DBEAFE" opacity="0.3" />
        <Circle cx="200" cy="200" r="150" fill="#BFDBFE" opacity="0.3" />

        {/* Mirror Frame */}
        <Rect x="100" y="60" width="200" height="280" rx="40" stroke="url(#mirrorFrameGrad)" strokeWidth="12" fill="#F8FAFC" />

        {/* Mirror Glass */}
        <Rect x="110" y="70" width="180" height="260" rx="32" fill="url(#glassGrad)" />

        {/* Reflection Glint/Shine */}
        <Path d="M130 90 L270 90 L130 230 Z" fill="#FFFFFF" opacity="0.3" />

        {/* Reflected Person (Silhouette/Abstract) */}
        <G transform="translate(140, 110) scale(0.65)">
            {/* Head */}
            <Circle cx="90" cy="90" r="45" fill="#3B82F6" opacity="0.6" />

            {/* Shoulders/Body */}
            <Path
                d="M 20 220 Q 90 160 160 220 L 160 320 L 20 320 Z"
                fill="#3B82F6"
                opacity="0.4"
            />

            {/* "Real" Person Hint (Looking into mirror?) - Subtle outline behind/around */}
            {/* <Circle cx="90" cy="90" r="48" stroke="#1E3A8A" strokeWidth="2" opacity="0.2" fill="none"/> */}
        </G>

        {/* Decorative sparkles */}
        <Circle cx="320" cy="100" r="6" fill="#FCD34D" />
        <Circle cx="305" cy="85" r="4" fill="#FCD34D" opacity="0.6" />

    </Svg>
);

// 5. Voice Recording Illustration - From WeeklyWhispersScreen
export const VoiceRecordingIllustration = ({ width: w = 280, height: h = 280 }: IllustrationProps) => (
    <Svg width={w} height={h} viewBox="0 0 400 400" fill="none">
        <Defs>
            <LinearGradient id="voiceGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8B5CF6" />
                <Stop offset="1" stopColor="#6D28D9" />
            </LinearGradient>
            <LinearGradient id="hairGrad" x1="150" y1="50" x2="350" y2="150" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#1E293B" />
                <Stop offset="1" stopColor="#0F172A" />
            </LinearGradient>
        </Defs>

        {/* Background decorative circles */}
        <Circle cx="200" cy="200" r="180" fill="#EDE9FE" opacity="0.3" />
        <Circle cx="200" cy="200" r="150" fill="#DDD6FE" opacity="0.3" />

        {/* Sound wave circles */}
        <Circle cx="200" cy="200" r="120" stroke="#8B5CF6" strokeWidth="2" opacity="0.2" fill="none" />
        <Circle cx="200" cy="200" r="100" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" fill="none" />
        <Circle cx="200" cy="200" r="80" stroke="#8B5CF6" strokeWidth="2" opacity="0.4" fill="none" />

        {/* Person speaking */}
        <G transform="translate(100, 80) scale(0.5)">
            {/* Body */}
            <Ellipse cx="200" cy="380" rx="80" ry="30" fill="#8B5CF6" />
            <Path
                d="M140 380 L160 260 C180 240, 220 240, 240 260 L260 380 Z"
                fill="#8B5CF6"
            />

            {/* Arms - speaking gesture */}
            <Path
                d="M160 280 L100 250 L80 280"
                stroke="#8B5CF6" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
            <Path
                d="M240 280 L300 250 L320 280"
                stroke="#8B5CF6" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />

            {/* Hands */}
            <Circle cx="80" cy="280" r="20" fill="#F3D2C1" />
            <Circle cx="320" cy="280" r="20" fill="#F3D2C1" />

            {/* Neck */}
            <Rect x="180" y="200" width="40" height="60" fill="#F3D2C1" />

            {/* Head */}
            <Circle cx="200" cy="160" r="60" fill="#F3D2C1" />

            {/* Hair */}
            <Path
                d="M140 160 C140 80, 260 80, 260 160 C260 140, 300 100, 280 150 L260 160"
                fill="url(#hairGrad)"
            />

            {/* Eyes */}
            <Circle cx="175" cy="150" r="8" fill="#1E293B" />
            <Circle cx="225" cy="150" r="8" fill="#1E293B" />
            <Circle cx="177" cy="148" r="3" fill="#FFFFFF" />
            <Circle cx="227" cy="148" r="3" fill="#FFFFFF" />

            {/* Open mouth (speaking) */}
            <Ellipse cx="200" cy="190" rx="20" ry="15" fill="#1E293B" />
            <Path d="M180 185 Q200 195, 220 185" fill="#EF4444" />
        </G>

        {/* Sound waves from mouth */}
        <Path d="M270 200 Q285 195, 270 190" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6" />
        <Path d="M280 200 Q300 192, 280 184" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.5" />
        <Path d="M290 200 Q315 188, 290 176" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.4" />

        {/* Microphone icon at bottom */}
        <G transform="translate(340, 320)">
            <Circle cx="0" cy="0" r="30" fill="url(#voiceGrad)" />
            <Rect x="-8" y="-20" width="16" height="25" rx="8" fill="#FFFFFF" />
            <Path d="M-15 0 Q-15 15, 0 20 Q15 15, 15 0" stroke="#FFFFFF" strokeWidth="3" fill="none" />
            <Path d="M0 20 L0 30" stroke="#FFFFFF" strokeWidth="3" />
            <Path d="M-8 30 L8 30" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </G>
    </Svg>
);
