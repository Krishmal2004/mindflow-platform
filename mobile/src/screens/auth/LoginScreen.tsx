import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image, Keyboard } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { MeditationIllustration } from '../../components/MeditationIllustration';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { Notification, NotificationType } from '../../components/Notification';

const { width, height } = Dimensions.get('window');

import { AUTH_ENDPOINTS } from '../../config/api';

export default function LoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Animation Values
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    // Notification State
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        // Simple Fade In and slight scale up
        fadeAnim.value = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    }, []);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type);
        setNotificationMessage(message);
        setNotificationVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showNotification('error', 'Please enter both email and password');
            return;
        }
        setLoading(true);

        try {
            const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Check for specific error messages
                if (result.error && result.error.includes('Email not confirmed')) {
                    showNotification('error', 'Please verify your email first.');
                    setTimeout(() => navigation.navigate('OtpVerification', { email }), 1500);
                } else {
                    throw new Error(result.error || 'Login failed');
                }
                setLoading(false);
                return;
            }

            // Save display name from backend response
            if (result.user && result.user.display_name) {
                await AsyncStorage.setItem('userName', result.user.display_name);
            } else {
                await AsyncStorage.setItem('userName', email.split('@')[0]);
            }
            // Set persistence flag
            await AsyncStorage.setItem('isLoggedIn', 'true');

            // Save authentication token
            if (result.session && result.session.access_token) {
                await AsyncStorage.setItem('authToken', result.session.access_token);
            } else if (result.token) {
                // Fallback if backend structure differs, though controller shows session.access_token
                await AsyncStorage.setItem('authToken', result.token);
            }

            setLoading(false);
            showNotification('success', 'Welcome back!');
            setTimeout(() => navigation.replace('MainTabs' as any), 1000);

        } catch (error: any) {
            console.error('Login Error:', error.message);
            setLoading(false);
            showNotification('error', error.message || 'Invalid credentials');
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
        // Removed large slide up, just subtle fade in
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

                    {/* Illustration - Centered */}
                    <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
                        <MeditationIllustration width={width * 0.75} height={width * 0.75} />
                    </Animated.View>

                    {/* Bottom Panel Form - Animated Slide Up */}
                    <Animated.View style={[styles.bottomPanel, panelStyle]}>
                        <Text style={styles.panelTitle}>WELCOME BACK</Text>
                        <Text style={styles.panelSubtitle}>LOGIN TO CONTINUE</Text>

                        <View style={styles.formContainer}>
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

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>{loading ? 'LOGGING IN...' : 'LOG IN'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.switchButton}>
                                <Text style={styles.switchText}>OR SIGN UP</Text>
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
        color: '#636E72', // Text Secondary
        letterSpacing: 2,
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
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
        flex: 1, // Take remaining space
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
    loginButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        marginTop: 10,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    switchButton: {
        backgroundColor: '#95C27E', // Light Green
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#95C27E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    switchText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
});
