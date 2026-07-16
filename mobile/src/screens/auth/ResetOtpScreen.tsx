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
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { VerifyIllustration } from '../../components/VerifyIllustration';
import { Notification, NotificationType } from '../../components/Notification';
import { PanelWave } from '../../components/PanelWave';
import { LogoBlock } from '../../components/LogoBlock';
import { AUTH_ENDPOINTS } from '../../config/api';
import { StrengthLevel, getStrength, STRENGTH_LABEL, STRENGTH_COLOR } from '../../lib/validation';

const { width, height } = Dimensions.get('window');
const CODE_LENGTH = 8;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Box width: panel content width (screen width minus 48 for horizontal padding) minus 7 gaps of 6px, divided across 8 boxes.
const BOX_W = Math.floor((width - 48 - 42) / 8);
const BOX_H = Math.round(BOX_W * 1.22);

type ResetOtpRouteProp = RouteProp<RootStackParamList, 'ResetOtp'>;

// Step 2 of the OTP-based password reset flow — same 8-digit-box visual language as
// OtpVerificationScreen (signup email verification), extended with a new-password step
// since confirming a reset also requires setting the new password in the same call.
export default function ResetOtpScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ResetOtpRouteProp>();
    const email = route.params?.email || '';
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    const shakeAnim = useSharedValue(0);
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);
    const panelAnim = useSharedValue(0);

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
        fadeAnim.value = withTiming(1, { duration: 800 });
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
            withTiming(0, { duration: 60 }),
        );
    };

    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
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
        }
    };

    const handleClear = () => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
    };

    const handleResend = async () => {
        if (!email || resendCooldown > 0) return;
        try {
            const response = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
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

    const strength = getStrength(newPassword);

    const handleConfirmReset = async () => {
        const code = digits.join('');
        if (code.length !== CODE_LENGTH) {
            triggerShake();
            showNotification('error', `Please enter all ${CODE_LENGTH} digits`);
            return;
        }
        if (!newPassword || newPassword.length < 8) {
            showNotification('error', 'Password must be at least 8 characters');
            return;
        }
        if (strength < 2) {
            showNotification('error', 'Password is too weak — add numbers or symbols');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.CONFIRM_RESET, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: code, newPassword }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Password reset failed');
            showNotification('success', 'Password Reset Successfully!');
            // Pop both this screen and ForgotPassword, landing back on whichever
            // screen started the flow (Login, or Profile via MainTabs).
            setTimeout(() => navigation.pop(2), 1200);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Password reset failed';
            triggerShake();
            showNotification('error', msg);
            setLoading(false);
        }
    };

    const headerStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const illusStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const panelStyle = useAnimatedStyle(() => ({ opacity: panelAnim.value }));
    const boxesStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAnim.value }] }));

    const filledCount = digits.filter(Boolean).length;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

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
                    <View style={{ height: headerHeight }} />

                    <Animated.View
                        style={[styles.bottomPanel, panelStyle, { minHeight: height - headerHeight, paddingBottom: insets.bottom }]}
                    >
                        <Text style={styles.panelLabel}>VERIFICATION</Text>
                        <Text style={styles.panelTitle}>RESET PASSWORD</Text>

                        <Text style={styles.instructionText}>
                            We sent an 8-digit code to:{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>

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

                        <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center', paddingRight: 12, marginTop: 4 }]}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="New Password"
                                placeholderTextColor="#90A4AE"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                                editable={!loading}
                                onFocus={() => handleFocus(320)}
                            />
                            <TouchableOpacity onPress={() => setShowNew(p => !p)} style={{ padding: 4 }}>
                                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={22} color="#90A4AE" />
                            </TouchableOpacity>
                        </View>

                        {newPassword.length > 0 && (
                            <View style={styles.strengthRow}>
                                <View style={styles.strengthBars}>
                                    {([1, 2, 3, 4] as StrengthLevel[]).map(l => (
                                        <View key={l} style={[styles.strengthBar, { backgroundColor: strength >= l ? STRENGTH_COLOR[strength] : '#E0E6ED' }]} />
                                    ))}
                                </View>
                                {strength > 0 && (
                                    <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                                        {STRENGTH_LABEL[strength]}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center', paddingRight: 12 }]}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Confirm New Password"
                                placeholderTextColor="#90A4AE"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                                editable={!loading}
                                onFocus={() => handleFocus(380)}
                                returnKeyType="done"
                                onSubmitEditing={handleConfirmReset}
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={{ padding: 4 }}>
                                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#90A4AE" />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && (
                            <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#2E7D32' : '#EF5350' }]}>
                                {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[styles.verifyButton, (loading || filledCount < CODE_LENGTH) && styles.verifyButtonDisabled]}
                            onPress={handleConfirmReset}
                            disabled={loading || filledCount < CODE_LENGTH}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>RESET PASSWORD</Text>
                            )}
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

                        <PanelWave />
                    </Animated.View>

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
    illusContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
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
    boxRow: {
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 8,
        width: '100%',
    },
    box: {
        width: BOX_W,
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
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
        marginBottom: 14,
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
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        width: '100%',
        marginBottom: 10,
    },
    input: { fontSize: 16, color: '#2D3436' },
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 10, width: '100%', paddingHorizontal: 4 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '700', width: 48, textAlign: 'right' },
    matchText: { fontSize: 11, marginTop: -6, marginBottom: 10, fontWeight: '500', alignSelf: 'flex-start', paddingLeft: 16 },
    verifyButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        width: '100%',
        marginTop: 6,
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
