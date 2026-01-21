import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, ReduceMotion } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { MeditationIllustration } from '../../components/MeditationIllustration';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { AUTH_ENDPOINTS } from '../../config/api';
import { Notification, NotificationType } from '../../components/Notification';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Notification State
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Animation Values
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    useEffect(() => {
        // Simple Fade In
        fadeAnim.value = withTiming(1, { duration: 800, reduceMotion: ReduceMotion.System });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp), reduceMotion: ReduceMotion.System });
    }, []);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type);
        setNotificationMessage(message);
        setNotificationVisible(true);
    };

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showNotification('error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showNotification('error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.SIGNUP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: name }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Signup failed');
            }

            console.log('Signup Successful:', result);

            // Save name locally for greeting
            await AsyncStorage.setItem('userName', name);

            setLoading(false);
            showNotification('success', 'Account created! Please verify your email.');

            setTimeout(() => {
                navigation.navigate('OtpVerification', { email });
            }, 1000);

        } catch (error: any) {
            console.error('Signup Error:', error.message);
            showNotification('error', error.message || 'Signup failed');
            setLoading(false);
        }
    };

    // Simple Animated Styles
    const headerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const illustrationStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const panelStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decoration */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.6} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Title */}
                    <Animated.View style={headerStyle}>
                        <Text style={styles.headerText}>MindFlow</Text>
                    </Animated.View>

                    {/* Illustration - Centered (Smaller for Signup to fit inputs) */}
                    <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
                        <MeditationIllustration width={width * 0.5} height={width * 0.5} />
                    </Animated.View>

                    {/* Bottom Panel Form */}
                    <Animated.View style={[styles.bottomPanel, panelStyle]}>
                        <Text style={styles.panelTitle}>NEW ACCOUNT</Text>
                        <Text style={styles.panelSubtitle}>START YOUR JOURNEY</Text>

                        <View style={styles.formContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#90A4AE"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#90A4AE"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#90A4AE"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#90A4AE"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                <Text style={styles.signupButtonText}>{loading ? 'CREATING...' : 'SIGN UP'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchButton}>
                                <Text style={styles.switchText}>ALREADY HAVE AN ACCOUNT?</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>

            <Notification
                type={notificationType}
                message={notificationMessage}
                visible={notificationVisible}
                onHide={() => setNotificationVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9',
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#636E72',
        letterSpacing: 2,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    bottomPanel: {
        backgroundColor: '#E3F2FD', // Soft Blue
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
        flex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    panelTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
        letterSpacing: 2,
        marginBottom: 5,
    },
    panelSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        letterSpacing: 1,
        marginBottom: 30,
    },
    formContainer: {
        width: '100%',
        gap: 15,
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    input: {
        fontSize: 16,
        color: '#2D3436',
    },
    signupButton: {
        backgroundColor: '#95C27E', // Green matches "OR SIGN UP" style from reference
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#95C27E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        marginTop: 10,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    switchButton: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    switchText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
        textDecorationLine: 'underline',
    },
});
