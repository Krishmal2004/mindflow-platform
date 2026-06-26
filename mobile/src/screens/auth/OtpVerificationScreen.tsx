import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Dimensions, ScrollView,
    NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { VerifyIllustration } from '../../components/VerifyIllustration';
import { Notification, NotificationType } from '../../components/Notification';
import { AUTH_ENDPOINTS } from '../../config/api';
import { getPostAuthRoute } from '../../lib/postAuthRoute';

const { width, height } = Dimensions.get('window');
const CODE_LENGTH = 8;

// Each box width: full panel content width minus gaps, divided by 8
// Panel is full width, paddingHorizontal 24 each side → content = width - 48
// 8 boxes with 7 gaps of 6px → boxW = (width - 48 - 7*6) / 8
const BOX_W = Math.floor((width - 48 - 42) / 8);
const BOX_H = Math.round(BOX_W * 1.22);   // taller than wide so digits never clip

type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

// ── Wave (same as Login/Signup) ────────────────────────────────────────────────
function PanelWave() {
    const h = 90; const w = width;
    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
            style={{ position: 'absolute', bottom: 0, left: 0 }} pointerEvents="none">
            <Defs>
                <SvgGradient id="vwg" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0"   stopColor="#A7D7C5" stopOpacity="1" />
                    <Stop offset="0.5" stopColor="#7FD9D1" stopOpacity="1" />
                    <Stop offset="1"   stopColor="#63C9D9" stopOpacity="1" />
                </SvgGradient>
            </Defs>
            <Path d={`M0 ${h*0.4} C${w*0.25} ${h*0.1} ${w*0.5} ${h*0.7} ${w*0.75} ${h*0.3} C${w*0.88} ${h*0.1} ${w} ${h*0.4} ${w} ${h*0.4} L${w} ${h} L0 ${h} Z`} fill="url(#vwg)" opacity={0.22} />
            <Path d={`M0 ${h*0.6} C${w*0.22} ${h*0.35} ${w*0.5} ${h*0.82} ${w*0.72} ${h*0.5} C${w*0.86} ${h*0.3} ${w} ${h*0.58} ${w} ${h*0.58} L${w} ${h} L0 ${h} Z`} fill="url(#vwg)" opacity={0.14} />
        </Svg>
    );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function OtpVerificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<OtpScreenRouteProp>();
    const email = route.params?.email || '';

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    const shakeAnim   = useSharedValue(0);
    const fadeAnim    = useSharedValue(0);
    const scaleAnim   = useSharedValue(0.9);
    const panelAnim   = useSharedValue(0);

    useEffect(() => {
        fadeAnim.value  = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
        panelAnim.value = withTiming(1, { duration: 800 });
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }, []);

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

    // ── Box handlers ──────────────────────────────────────────────────────────
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
            if (result.session?.access_token) await AsyncStorage.setItem('authToken', result.session.access_token);
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

    const headerStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const illusStyle  = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const panelStyle  = useAnimatedStyle(() => ({ opacity: panelAnim.value }));
    const boxesStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAnim.value }] }));

    const filledCount = digits.filter(Boolean).length;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background leaves */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.6} color={Colors.primary} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <Animated.View style={[styles.logoBlock, headerStyle]}>
                        <View style={styles.logoRow}>
                            <Text style={styles.logoThin}>Mind</Text>
                            <Text style={styles.logoBold}>Flow</Text>
                        </View>
                        <View style={styles.taglineRow}>
                            <View style={styles.taglineDot} />
                            <Text style={styles.tagline}>Find your inner peace</Text>
                            <View style={styles.taglineDot} />
                        </View>
                    </Animated.View>

                    {/* Illustration */}
                    <Animated.View style={[styles.illusContainer, illusStyle]}>
                        <VerifyIllustration width={width * 0.52} height={width * 0.46} />
                    </Animated.View>

                    {/* Blue panel */}
                    <Animated.View style={[styles.bottomPanel, panelStyle]}>
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
                            <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 44,
    },
    // Logo
    logoBlock: { alignItems: 'center', marginBottom: 4 },
    logoRow: { flexDirection: 'row', alignItems: 'baseline' },
    logoThin: { fontSize: 30, fontWeight: '300', color: '#3A3A3A', letterSpacing: 2 },
    logoBold: { fontSize: 30, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7FD9D1', opacity: 0.80 },
    tagline: { fontSize: 10, color: '#7A8285', letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
    // Illustration
    illusContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    // Panel
    bottomPanel: {
        backgroundColor: '#E3F2FD',
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingBottom: 104,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
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
