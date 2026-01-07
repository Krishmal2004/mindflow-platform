import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        // Breathing Animation
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Pulse Opacity
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500 }),
                withTiming(0.5, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FDFC', '#E8F5F1']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.content}>
                <Animated.View style={[styles.circle, animatedStyle]}>
                    <LinearGradient
                        colors={['#A8E6CF', '#64C59A']}
                        style={styles.innerCircle}
                    />
                </Animated.View>

                <Animated.View entering={FadeIn.duration(1000).delay(300)}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleThin}>Mind</Text>
                        <Text style={styles.titleBold}>Flow</Text>
                    </View>
                </Animated.View>

                <Animated.Text style={[styles.subtitle, textStyle]}>
                    Enterprise Edition
                </Animated.Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.version}>v2.0.0 (Alpha)</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.2,
        marginBottom: -80, // Overlap effect
    },
    innerCircle: {
        flex: 1,
        borderRadius: 60,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
    },
    titleThin: {
        fontSize: 42,
        fontWeight: '300',
        color: '#2E8A66',
        letterSpacing: 1,
    },
    titleBold: {
        fontSize: 42,
        fontWeight: '700',
        color: '#1B5E45',
        letterSpacing: 1,
    },
    subtitle: {
        marginTop: 10,
        fontSize: 14,
        color: '#64C59A',
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    version: {
        fontSize: 12,
        color: '#aaa',
    }
});
