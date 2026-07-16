import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Dimensions, ScrollView,
    NativeSyntheticEvent, TextInputKeyPressEventData, Keyboard, LayoutAnimation, UIManager, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { VerifyIllustration } from '../../components/VerifyIllustration';
import { Notification, NotificationType } from '../../components/Notification';
import { PanelWave } from '../../components/PanelWave';
import { LogoBlock } from '../../components/LogoBlock';
import { AUTH_ENDPOINTS } from '../../config/api';
import { getPostAuthRoute } from '../../lib/postAuthRoute';
import { setSession } from '../../lib/apiClient';

const { width, height } = Dimensions.get('window');
const CODE_LENGTH = 8;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Box width: panel content width (screen width minus 48 for horizontal padding) minus 7 gaps of 6px, divided across 8 boxes.
const BOX_W = Math.floor((width - 48 - 42) / 8);
const BOX_H = Math.round(BOX_W * 1.22);   // taller than wide so digits never clip

type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

// Wave (same as Login/Signup)


// Screen
export default function OtpVerificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<OtpScreenRouteProp>();
    const email = route.params?.email || '';
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    const shakeAnim   = useSharedValue(0);
    const fadeAnim    = useSharedValue(0);
    const scaleAnim   = useSharedValue(0.9);
    const panelAnim   = useSharedValue(0);

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);
    const activeOffsetRef = useRef(0);

    const handleFocus = (offset: number) => {
        activeOffsetRef.current = offset;
        if (keyboardVisible) {
            scrollRef.current?.scrollTo({ y: headerHeight + offset, animated: true });
        }
    };

    useEffect(() => {
        fadeAnim.value  = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
        panelAnim.value = withTiming(1, { duration: 800 });

        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            const kh = e.endCoordinates.height;
            setKeyboardHeight(kh);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardVisible(true);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: headerHeight + activeOffsetRef.current, animated: true });
            }, 100);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardVisible(false);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        });

        setTimeout(() => inputRefs.current[0]?.focus(), 300);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [headerHeight, keyboardVisible]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type); setNotificationMessage(message); setNotificationVisible(true);
    };

    const triggerShake = () => {
        shakeAnim.value = withSequence(
            withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
            withTiming(-6, { duration: 60 }), withTiming(6, { duration: 60 }),
            withTiming(0,  { duration: 60 }),
        );
    };

    // Box handlers
    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
        if (digit && index === CODE_LENGTH - 1 && next.join('').length === CODE_LENGTH) {
            submitCode(next.join(''));
        }
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (digits[index]) {
                const next = [...digits]; next[index] = ''; setDigits(next);
            } else if (index > 0) {
                const next = [...digits]; next[index - 1] = ''; setDigits(next);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (text: string) => {
        const clean = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
        if (clean.length === CODE_LENGTH) {
            setDigits(clean.split(''));
            inputRefs.current[CODE_LENGTH - 1]?.focus();
            submitCode(clean);
        }
    };

    // Verify
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
            if (result.session?.access_token) await setSession(result.session);
            await AsyncStorage.setItem('isLoggedIn', 'true');
            if (result.user?.user_metadata?.full_name) await AsyncStorage.setItem('userName', result.user.user_metadata.full_name);
            const dest = await getPostAuthRoute();
            setTimeout(() => navigation.reset({ index: 0, routes: [{ name: dest }] }), 1000);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Verification failed';
            triggerShake();
            showNotification('error', msg);
            setDigits(Array(CODE_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
            setLoading(false);
        }
    };

    const handleVerifyPress = () => submitCode(digits.join(''));

    const handleClear = () => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
    };

    // Resend
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

    const headerStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const illusStyle  = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const panelStyle  = useAnimatedStyle(() => ({ opacity: panelAnim.value }));
    const boxesStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAnim.value }] }));

    const filledCount = digits.filter(Boolean).length;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* Fixed Background Header (doesn't move) */}
            <View 
                pointerEvents="none"
                onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                style={[styles.fixedHeader, { paddingTop: insets.top > 0 ? insets.top + 5 : 24 }]}
            >
                <Animated.View style={headerStyle}>
                    <LogoBlock />
                </Animated.View>

                <Animated.View style={[styles.illusContainer, illusStyle]}>
                    <VerifyIllustration width={width * 0.55} height={width * 0.49} />
                </Animated.View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {/* Spacer matching fixed header height */}
                    <View style={{ height: headerHeight }} />

                    {/* Blue panel */}
                    <Animated.View 
                        style={[styles.bottomPanel, panelStyle, { minHeight: height - headerHeight, paddingBottom: insets.bottom }]}
                    >
                        <Text style={styles.panelLabel}>VERIFICATION</Text>
                        <Text style={styles.panelTitle}>ENTER CODE</Text>

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
                                        focusedIndex === i ? styles.boxFocused : null,
                                        i === 3 ? styles.boxGap : null,
                                    ]}
                                    value={digit}
                                    onChangeText={text => {
                                        if (text.length > 1) { handlePaste(text); return; }
                                        handleChange(text, i);
                                    }}
                                    onKeyPress={e => handleKeyPress(e, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    caretHidden
                                    editable={!loading}
                                    accessibilityLabel={`Digit ${i + 1}`}
                                    onFocus={() => { setFocusedIndex(i); handleFocus(0); }}
                                    onBlur={() => setFocusedIndex(null)}
                                />
                            ))}
                        </Animated.View>

                        {/* Progress + Clear */}
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

                        {/* VERIFY button */}
                        <TouchableOpacity
                            style={[styles.verifyButton, (loading || filledCount < CODE_LENGTH) && styles.verifyButtonDisabled]}
                            onPress={handleVerifyPress}
                            disabled={loading || filledCount < CODE_LENGTH}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>VERIFY</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend */}
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resendCooldown > 0}
                            style={styles.resendButton}
                        >
                            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                                {resendCooldown > 0 ? `RESEND IN ${resendCooldown}s` : 'RESEND CODE'}
                            </Text>
                        </TouchableOpacity>

                        {/* Wave */}
                        <PanelWave />
                    </Animated.View>
                    
                    {/* Bottom spacer to allow scrolling the card to the top */}
                    <View style={{ height: keyboardHeight }} />
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
    keyboardView: { flex: 1 },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 0,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
    },
    // Illustration
    illusContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    // Panel
    bottomPanel: {
        backgroundColor: '#E3F2FD',
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 20,
        paddingBottom: 0,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        overflow: 'hidden',
    },
    panelLabel: { fontSize: 12, fontWeight: '600', color: '#636E72', letterSpacing: 2, marginBottom: 4 },
    panelTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', letterSpacing: 1, marginBottom: 12 },
    instructionText: {
        fontSize: 13, color: '#636E72',
        textAlign: 'center', marginBottom: 20, lineHeight: 22,
    },
    emailText: { fontWeight: 'bold', color: '#2D3436' },
    // Digit boxes
    boxRow: {
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 8,
        width: '100%',
    },
    box: {
        width:  BOX_W,
        height: BOX_H,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#CBD5E0',
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        includeFontPadding: false,
        padding: 0,
    },
    boxFilled: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FFF4',
    },
    boxFocused: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    boxGap: { marginRight: 8 },
    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
        marginBottom: 18,
        paddingHorizontal: 2,
    },
    progressText: { fontSize: 11, color: '#90A4AE' },
    clearButton: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },
    clearText: { fontSize: 11, color: '#EF5350', fontWeight: '700' },
    // Buttons
    verifyButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        width: '100%',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 5,
        elevation: 4,
    },
    verifyButtonDisabled: { opacity: 0.55 },
    buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    resendButton: { paddingVertical: 14, alignItems: 'center' },
    resendText: { color: '#95C27E', fontWeight: '600', fontSize: 14, letterSpacing: 0.5 },
    resendDisabled: { color: '#B2BEC3' },
});
