import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';

interface ScaleIconProps {
    size?: number;
}

// Neutral bar-filled meter for PSS-10: a directional face icon would misleadingly flip meaning across the scale's mixed positive/negative-worded items.
export const FrequencyMeter = ({ level, color }: { level: number; color: string }) => (
    <View style={styles.frequencyMeter}>
        {[1, 2, 3, 4, 5].map((bar) => (
            <View
                key={bar}
                style={[
                    styles.frequencyBar,
                    { height: 6 + bar * 3, backgroundColor: bar <= level ? color : '#E2E8F0' }
                ]}
            />
        ))}
    </View>
);

// Growth icons (seed to full bloom), for Thrive Tracker: every WEMWBS-14 item is positively worded, so a directional icon is safe here unlike PSS-10/FFMQ-15.

export const GrowthLevel1 = ({ size = 40 }: ScaleIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#F1F5E9" stroke="#C4D6B0" strokeWidth="2" />
        <Path d="M12 27 Q20 30, 28 27" stroke="#A8875B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Ellipse cx="20" cy="24" rx="3" ry="2.5" fill="#8B6B3D" />
    </Svg>
);

export const GrowthLevel2 = ({ size = 40 }: ScaleIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#EAF3E1" stroke="#B7D6A0" strokeWidth="2" />
        <Path d="M12 28 Q20 31, 28 28" stroke="#A8875B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M20 28 L20 20" stroke="#8FBF7A" strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="16" cy="19" rx="4" ry="2.5" fill="#8FBF7A" transform="rotate(-25 16 19)" />
    </Svg>
);

export const GrowthLevel3 = ({ size = 40 }: ScaleIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#E3F0D6" stroke="#A8CC8E" strokeWidth="2" />
        <Path d="M12 28 Q20 31, 28 28" stroke="#A8875B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M20 28 L20 15" stroke="#7CB863" strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="15" cy="20" rx="4.5" ry="2.8" fill="#7CB863" transform="rotate(-25 15 20)" />
        <Ellipse cx="25" cy="17" rx="4.5" ry="2.8" fill="#7CB863" transform="rotate(25 25 17)" />
    </Svg>
);

export const GrowthLevel4 = ({ size = 40 }: ScaleIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#D9EBC7" stroke="#8FBF7A" strokeWidth="2" />
        <Path d="M12 28 Q20 31, 28 28" stroke="#A8875B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M20 28 L20 11" stroke="#5FA047" strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="14" cy="21" rx="4.5" ry="2.8" fill="#5FA047" transform="rotate(-25 14 21)" />
        <Ellipse cx="26" cy="18" rx="4.5" ry="2.8" fill="#5FA047" transform="rotate(25 26 18)" />
        <Ellipse cx="15" cy="13" rx="4" ry="2.5" fill="#5FA047" transform="rotate(-20 15 13)" />
    </Svg>
);

export const GrowthLevel5 = ({ size = 40 }: ScaleIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="18" fill="#E6F4EA" stroke="#749F82" strokeWidth="2" />
        <Path d="M12 28 Q20 31, 28 28" stroke="#A8875B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M20 28 L20 14" stroke="#4E8A3D" strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="14" cy="22" rx="4.5" ry="2.8" fill="#4E8A3D" transform="rotate(-25 14 22)" />
        <Ellipse cx="26" cy="19" rx="4.5" ry="2.8" fill="#4E8A3D" transform="rotate(25 26 19)" />
        {/* Blossom */}
        <Circle cx="20" cy="11" r="2.2" fill="#F4A9C7" />
        <Circle cx="16.5" cy="12.5" r="2.2" fill="#F4A9C7" />
        <Circle cx="23.5" cy="12.5" r="2.2" fill="#F4A9C7" />
        <Circle cx="20" cy="14" r="2.2" fill="#F4A9C7" />
        <Circle cx="20" cy="12.2" r="1.6" fill="#FBBF24" />
    </Svg>
);

export const GrowthIcons = [GrowthLevel1, GrowthLevel2, GrowthLevel3, GrowthLevel4, GrowthLevel5];

// Focus ring icons (single point to full awareness), for Mindful Mirror: FFMQ-15 mixes worded directions like PSS-10, so this also stays a neutral intensity indicator.

const FocusRing = ({ size = 40, rings, color }: { size?: number; rings: number; color: string }) => {
    const radii = [4, 8, 12, 16];
    return (
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <Circle cx="20" cy="20" r="18" fill="#F0FDFA" stroke="#CCEAE5" strokeWidth="2" />
            <Circle cx="20" cy="20" r="2.5" fill={color} />
            {radii.map((r, index) => (
                <Circle
                    key={r}
                    cx="20"
                    cy="20"
                    r={r}
                    stroke={index < rings ? color : '#D6E9E6'}
                    strokeWidth="2"
                    fill="none"
                />
            ))}
        </Svg>
    );
};

export const FocusRingLevel1 = (props: ScaleIconProps) => <FocusRing {...props} rings={0} color="#0D9488" />;
export const FocusRingLevel2 = (props: ScaleIconProps) => <FocusRing {...props} rings={1} color="#0D9488" />;
export const FocusRingLevel3 = (props: ScaleIconProps) => <FocusRing {...props} rings={2} color="#0D9488" />;
export const FocusRingLevel4 = (props: ScaleIconProps) => <FocusRing {...props} rings={3} color="#0D9488" />;
export const FocusRingLevel5 = (props: ScaleIconProps) => <FocusRing {...props} rings={4} color="#0D9488" />;

export const FocusRingIcons = [FocusRingLevel1, FocusRingLevel2, FocusRingLevel3, FocusRingLevel4, FocusRingLevel5];

const styles = StyleSheet.create({
    frequencyMeter: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
    },
    frequencyBar: {
        width: 4,
        borderRadius: 2,
    },
});
