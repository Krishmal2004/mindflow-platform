import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Dimensions, ScrollView, NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { AUTH_ENDPOINTS } from '../../config/api';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { Notification, NotificationType } from '../../components/Notification';
import { getPostAuthRoute } from '../../lib/postAuthRoute';

const { width, height } = Dimensions.get('window');
const CODE_LENGTH = 8;

type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export default function OtpVerificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<OtpScreenRouteProp>();
    const email = route.params?.email || '';

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Notification
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Shake animation for invalid code
    const shakeAnim = useSharedValue(0);

    // Fade / scale
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
        // Focus first box on mount
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }, []);

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type);
        setNotificationMessage(message);
        setNotificationVisible(true);
    };

    const triggerShake = () => {
        shakeAnim.value = withSequence(
            withTiming(-8, { duration: 60 }),
            withTiming(8, { duration: 60 }),
            withTiming(-6, { duration: 60 }),
            withTiming(6, { duration: 60 }),
            withTiming(0, { duration: 60 }),
        );
    };

    // ── Box change handler ────────────────────────────────────────────────────
    const handleChange = (text: string, index: number) => {
        // Accept only single digit
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);

        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 8 digits are filled
        if (digit && index === CODE_LENGTH - 1) {
            const code = next.join('');
            if (code.length === CODE_LENGTH) {
                submitCode(code);
            }
        }
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (digits[index]) {
                // Clear current box
                const next = [...digits];
                next[index] = '';
                setDigits(next);
            } else if (index > 0) {
                // Move to previous box and clear it
                const next = [...digits];
                next[index - 1] = '';
                setDigits(next);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    // ── Paste support: if user pastes 8 chars into any box ───────────────────
    const handlePaste = (text: string, _index: number) => {
        const clean = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
        if (clean.length === CODE_LENGTH) {
            setDigits(clean.split(''));
            inputRefs.current[CODE_LENGTH - 1]?.focus();
            submitCode(clean);
        }
    };

    // ── Verify ────────────────────────────────────────────────────────────────
    const submitCode = async (code: string) => {
        if (loading) return;
        if (code.length !== CODE_LENGTH) {
            triggerShake();
            showNotification('error', `Please enter all ${CODE_LENGTH} digits`);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.VERIFY_OTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: code, type: 'signup' }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Verification failed');

            showNotification('success', 'Email Verified Successfully!');

            if (result.session?.access_token) {
                await AsyncStorage.setItem('authToken', result.session.access_token);
            }
            await AsyncStorage.setItem('isLoggedIn', 'true');
            if (result.user?.user_metadata?.full_name) {
                await AsyncStorage.setItem('userName', result.user.user_metadata.full_name);
            }

            const dest = await getPostAuthRoute();
            setTimeout(() => navigation.reset({ index: 0, routes: [{ name: dest }] }), 1000);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Verification failed';
            triggerShake();
            showNotification('error', msg);
            // Clear boxes on failure so user can try again
            setDigits(Array(CODE_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
            setLoading(false);
        }
    };

    const handleVerifyPress = () => {
        submitCode(digits.join(''));
    };

    const handleClear = () => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
    };

    // ── Resend ────────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (!email || resendCooldown > 0) return;
        try {
            const response = await fetch(AUTH_ENDPOINTS.RESEND_OTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'signup' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to resend code');
            showNotification('success', 'New code sent to ' + email);
            setResendCooldown(60);
            setDigits(Array(CODE_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (error: unknown) {
            showNotification('error', error instanceof Error ? error.message : 'Failed to resend code');
        }
    };

    // ── Animated styles ───────────────────────────────────────────────────────
    const headerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const panelStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

    const boxesStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeAnim.value }],
    }));

    const filledCount = digits.filter(Boolean).length;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.5} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Animated.View style={headerStyle}>
                        <Text style={styles.headerText}>MindFlow</Text>
                    </Animated.View>

                    <Animated.View style={[styles.card, panelStyle]}>
                        <Text style={styles.panelTitle}>VERIFICATION</Text>
                        <Text style={styles.panelSubtitle}>ENTER CODE</Text>

                        <Text style={styles.instructionText}>
                            We sent an 8-digit code to:{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>

                        {/* 8-digit boxes */}
                        <Animated.View style={[styles.boxRow, boxesStyle]}>
                            {digits.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={ref => { inputRefs.current[i] = ref; }}
                                    style={[
                                        styles.box,
                                        digit ? styles.boxFilled : null,
                                        i === 3 ? styles.boxGap : null, // visual gap between groups of 4
                                    ]}
                                    value={digit}
                                    onChangeText={text => {
                                        // Support paste via onChangeText receiving multi-char
                                        if (text.length > 1) { handlePaste(text, i); return; }
                                        handleChange(text, i);
                                    }}
                                    onKeyPress={e => handleKeyPress(e, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    caretHidden
                                    editable={!loading}
                                    accessibilityLabel={`Digit ${i + 1}`}
                                />
                            ))}
                        </Animated.View>

                        {/* Progress hint + Clear */}
                        <View style={styles.progressRow}>
                            <Text style={styles.progressText}>
                                {filledCount < CODE_LENGTH
                                    ? `${filledCount} / ${CODE_LENGTH} digits entered`
                                    : 'All digits entered'}
                            </Text>
                            {filledCount > 0 && !loading && (
                                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                                    <Text style={styles.clearText}>Clear</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.verifyButton, (loading || filledCount < CODE_LENGTH) && styles.verifyButtonDisabled]}
                            onPress={handleVerifyPress}
                            disabled={loading || filledCount < CODE_LENGTH}
                        >
                            <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resendCooldown > 0}
                            style={styles.resendButton}
                        >
                            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                                {resendCooldown > 0 ? `RESEND IN ${resendCooldown}s` : 'RESEND CODE'}
                            </Text>
                        </TouchableOpacity>
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
    container: { flex: 1, backgroundColor: '#F6F8F9' },
    decorationContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerText: {
        fontSize: 24, fontWeight: 'bold', color: '#636E72',
        marginBottom: 36, letterSpacing: 2, textTransform: 'uppercase',
    },
    card: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
    },
    panelTitle: {
        fontSize: 12, fontWeight: '600', color: '#95C27E',
        letterSpacing: 1.5, marginBottom: 6,
    },
    panelSubtitle: {
        fontSize: 22, fontWeight: 'bold', color: '#2D3436', marginBottom: 16,
    },
    instructionText: {
        fontSize: 13, color: '#636E72',
        textAlign: 'center', marginBottom: 28, lineHeight: 22,
    },
    emailText: { fontWeight: 'bold', color: '#2D3436' },

    // Digit boxes
    boxRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 8,
    },
    box: {
        width: (width * 0.9 - 56 - 7 * 8) / 8,
        aspectRatio: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#CBD5E0',
        backgroundColor: '#F7FAFC',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    boxFilled: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FFF4',
    },
    boxGap: {
        marginRight: 8, // extra gap after 4th digit to visually split into groups
    },

    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
        marginBottom: 20,
        paddingHorizontal: 2,
    },
    progressText: {
        fontSize: 11, color: '#90A4AE',
    },
    clearButton: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },
    clearText: {
        fontSize: 11, color: '#EF5350', fontWeight: '700',
    },
    verifyButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30, paddingVertical: 15,
        alignItems: 'center', width: '100%',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
    },
    verifyButtonDisabled: { opacity: 0.55 },
    buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    resendButton: { paddingVertical: 14, alignItems: 'center' },
    resendText: { color: '#95C27E', fontWeight: '600', fontSize: 14, letterSpacing: 0.5 },
    resendDisabled: { color: '#B2BEC3' },
});
