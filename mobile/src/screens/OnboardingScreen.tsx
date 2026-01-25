import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { MeditationIllustration } from '../components/MeditationIllustration';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const fadeAnim = useSharedValue(0);
    const slideAnim = useSharedValue(50);
    const imageScale = useSharedValue(0.8);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        // Removed withDelay wrapper here as per previous fix
        slideAnim.value = withTiming(0, { duration: 800 });
        imageScale.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) }));
    }, []);

    const handleLogin = async () => {
        await AsyncStorage.setItem('alreadyLaunched', 'true');
        navigation.replace('Login');
    };

    const handleSignup = async () => {
        await AsyncStorage.setItem('alreadyLaunched', 'true');
        navigation.replace('Signup');
    };

    const headerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateY: slideAnim.value }],
    }));

    const illustrationStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: imageScale.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateY: slideAnim.value }],
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decoration */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.6} />
            </View>

            {/* Header */}
            <Animated.View style={[styles.header, headerStyle]}>
                <Text style={styles.headerText}>MindFlow</Text>
            </Animated.View>

            {/* Illustration */}
            <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
                <MeditationIllustration width={width * 0.9} height={width * 0.9} />
            </Animated.View>

            {/* Bottom Content Panel */}
            <Animated.View style={[styles.bottomPanel, animatedContentStyle]}>
                <Text style={styles.welcomeTitle}>WELCOME</Text>
                <Text style={styles.welcomeSubtitle}>START YOUR JOURNEY</Text>
                <Text style={styles.description}>
                    Discover mindfulness, reduce stress, and find your balance with daily guided sessions.
                </Text>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.8}>
                        <Text style={styles.primaryButtonText}>LOG IN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleSignup} activeOpacity={0.8}>
                        <Text style={styles.secondaryButtonText}>OR SIGN UP</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    header: {
        marginTop: 60,
        marginBottom: 10,
        zIndex: 1,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginTop: -40,
    },
    imageWrapper: {
        width: width * 0.9,
        height: width * 0.9,
        justifyContent: 'center',
        alignItems: 'center',
        // Optional: Add soft glow/backdrop
    },
    image: {
        width: '100%',
        height: '100%',
    },
    bottomPanel: {
        backgroundColor: '#E3F2FD', // Soft Blue background
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingVertical: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    welcomeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    buttonGroup: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    secondaryButton: {
        backgroundColor: '#95C27E',
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#95C27E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
