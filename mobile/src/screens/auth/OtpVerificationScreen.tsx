
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { AUTH_ENDPOINTS } from '../../config/api';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { Notification, NotificationType } from '../../components/Notification';

const { width, height } = Dimensions.get('window');

type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export default function OtpVerificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<OtpScreenRouteProp>();

    // Default to empty string if param is missing, though type says it's required
    const email = route.params?.email || '';

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // Notification State
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Animation
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    }, []);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type);
        setNotificationMessage(message);
        setNotificationVisible(true);
    };

    const handleVerifyParams = async (token: string) => {
        if (token.length !== 6) return; // Wait for 6 digits

        // Auto-submit could go here if desired, but button is safer
    };

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            showNotification('error', 'Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.VERIFY_OTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp, type: 'signup' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Verification failed');
            }

            console.log('OTP Verified:', result);

            showNotification('success', 'Email Verified Successfully!');

            // Save session
            if (result.session && result.session.access_token) {
                await AsyncStorage.setItem('authToken', result.session.access_token);
            }
            await AsyncStorage.setItem('isLoggedIn', 'true');
            if (result.user && result.user.user_metadata && result.user.user_metadata.full_name) {
                await AsyncStorage.setItem('userName', result.user.user_metadata.full_name);
            }

            // Navigate to Main App
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }, 1000);

        } catch (error: any) {
            console.error('OTP Verification Error:', error.message);
            showNotification('error', error.message || 'Verification failed');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            const response = await fetch(AUTH_ENDPOINTS.RESEND_OTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'signup' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to resend code');
            }
            showNotification('success', 'Code resent to ' + email);
        } catch (error: any) {
            showNotification('error', error.message || 'Failed to resend code');
        }
    };

    // Styles
    const headerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const panelStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.5} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={headerStyle}>
                        <Text style={styles.headerText}>MindFlow</Text>
                    </Animated.View>

                    <Animated.View style={[styles.bottomPanel, panelStyle]}>
                        <Text style={styles.panelTitle}>VERIFICATION</Text>
                        <Text style={styles.panelSubtitle}>ENTER CODE</Text>

                        <Text style={styles.instructionText}>
                            We sent a 6-digit code to: {'\n'}
                            <Text style={{ fontWeight: 'bold' }}>{email}</Text>
                        </Text>

                        <View style={styles.formContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="000000"
                                    placeholderTextColor="#90A4AE"
                                    value={otp}
                                    onChangeText={(text) => {
                                        setOtp(text);
                                        handleVerifyParams(text);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                                <Text style={styles.resendText}>RESEND CODE</Text>
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
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',
        paddingTop: 80,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#636E72',
        marginBottom: 40,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    bottomPanel: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 40, // Space from bottom
    },
    panelTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#95C27E', // Accent Green
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    panelSubtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 20,
    },
    instructionText: {
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    formContainer: {
        width: '100%',
        gap: 15,
    },
    inputWrapper: {
        backgroundColor: '#F0F4F8',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    input: {
        fontSize: 24,
        color: '#2D3436',
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
    },
    verifyButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    resendButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    resendText: {
        color: '#95C27E',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});
