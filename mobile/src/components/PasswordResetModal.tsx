import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, Dimensions, ScrollView,
    TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform,
    NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AUTH_ENDPOINTS } from '../config/api';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StrengthLevel = 0 | 1 | 2 | 3 | 4;
function getStrength(pwd: string): StrengthLevel {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return Math.min(s, 4) as StrengthLevel;
}
const STRENGTH_LABEL: Record<StrengthLevel, string> = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
const STRENGTH_COLOR: Record<StrengthLevel, string> = {
    0: '#E0E6ED', 1: '#EF5350', 2: '#FFA726', 3: '#66BB6A', 4: '#2E7D32',
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    // When the caller already knows the account email (Profile), it's shown read-only.
    // When it doesn't (Login, pre-auth), the user types it in on step 1.
    initialEmail?: string;
    emailEditable?: boolean;
}

// OTP-based "forgot password" wizard: request a code by email, then confirm the code
// alongside a new password. Shared by ProfileScreen (known, read-only email) and
// LoginScreen (unauthenticated — the user must type their email in).
export function PasswordResetModal({ visible, onClose, onSuccess, initialEmail = '', emailEditable = false }: Props) {
    const [resetStep, setResetStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState(initialEmail);
    const [step1Error, setStep1Error] = useState('');

    const [sendingCode, setSendingCode] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pwError, setPwError] = useState('');

    // Reset the wizard to a clean state each time it's opened.
    useEffect(() => {
        if (visible) {
            setResetStep(1);
            setEmail(initialEmail);
            setStep1Error('');
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setNewPassword('');
            setConfirmPassword('');
            setPwError('');
            setResendCooldown(0);
        }
    }, [visible, initialEmail]);

    const startCooldown = () => {
        setResendCooldown(60);
        const tick = setInterval(() => {
            setResendCooldown(c => {
                if (c <= 1) { clearInterval(tick); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleSendCode = async () => {
        setStep1Error('');
        if (!email) { setStep1Error('Please enter your email address.'); return; }
        if (emailEditable && !EMAIL_RE.test(email)) { setStep1Error('Enter a valid email address.'); return; }

        setSendingCode(true);
        try {
            const res = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to send code');
            startCooldown();
            setResetStep(2);
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
        } catch (e: unknown) {
            setStep1Error(e instanceof Error ? e.message : 'Failed to send code');
        } finally {
            setSendingCode(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || !email) return;
        setSendingCode(true);
        try {
            const res = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to resend');
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
            startCooldown();
        } catch (e: unknown) {
            setPwError(e instanceof Error ? e.message : 'Failed to resend code');
        } finally {
            setSendingCode(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        if (text.length > 1) {
            const clean = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
            if (clean.length === OTP_LENGTH) {
                setOtpDigits(clean.split(''));
                otpRefs.current[OTP_LENGTH - 1]?.focus();
                return;
            }
        }
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (otpDigits[index]) {
                const next = [...otpDigits];
                next[index] = '';
                setOtpDigits(next);
            } else if (index > 0) {
                const next = [...otpDigits];
                next[index - 1] = '';
                setOtpDigits(next);
                otpRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleConfirmReset = async () => {
        setPwError('');
        const otp = otpDigits.join('');
        if (otp.length < OTP_LENGTH) { setPwError('Please enter all 8 digits of the code.'); return; }
        if (!newPassword) { setPwError('New password is required.'); return; }
        if (newPassword.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
        if (getStrength(newPassword) < 2) { setPwError('Password is too weak — add numbers or symbols.'); return; }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }

        setSubmitting(true);
        try {
            const res = await fetch(AUTH_ENDPOINTS.CONFIRM_RESET, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp, newPassword }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Password reset failed');
            onClose();
            onSuccess();
        } catch (e: unknown) {
            setPwError(e instanceof Error ? e.message : 'Password reset failed');
        } finally {
            setSubmitting(false);
        }
    };

    const otpFilled = otpDigits.filter(Boolean).length;
    const strength = getStrength(newPassword);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.resetSheet}>
                    <View style={styles.resetHeader}>
                        <View style={styles.resetHeaderLeft}>
                            {resetStep === 2 && (
                                <TouchableOpacity onPress={() => setResetStep(1)} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="arrow-back" size={20} color={Colors.iconMuted} />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.resetTitle}>
                                {resetStep === 1 ? 'Reset Password' : 'Enter New Password'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={22} color={Colors.iconMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.stepRow}>
                        {([1, 2] as const).map(s => (
                            <View key={s} style={[styles.stepDot, resetStep >= s && styles.stepDotActive]} />
                        ))}
                    </View>

                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {resetStep === 1 && (
                            <View style={styles.resetBody}>
                                <View style={[styles.resetIconCircle, { backgroundColor: '#E6F4EA' }]}>
                                    <Ionicons name="mail-outline" size={30} color={Colors.primary} />
                                </View>
                                <Text style={styles.resetSubtitle}>
                                    {"We'll send an 8-digit verification code to:"}
                                </Text>

                                {emailEditable ? (
                                    <View style={styles.emailInputWrapper}>
                                        <Ionicons name="at" size={16} color={Colors.primary} />
                                        <TextInput
                                            style={styles.emailInput}
                                            placeholder="Your account email"
                                            placeholderTextColor="#90A4AE"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            editable={!sendingCode}
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.emailBox}>
                                        <Ionicons name="at" size={16} color={Colors.primary} />
                                        <Text style={styles.emailBoxText}>{email}</Text>
                                    </View>
                                )}

                                <Text style={styles.resetHint}>
                                    Enter the code along with your new password on the next step.
                                </Text>

                                {step1Error ? (
                                    <View style={styles.errorBox}>
                                        <Ionicons name="alert-circle-outline" size={14} color="#EF5350" />
                                        <Text style={styles.errorText}>{step1Error}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    style={[styles.primaryBtn, sendingCode && styles.primaryBtnDisabled]}
                                    onPress={handleSendCode}
                                    disabled={sendingCode}
                                    activeOpacity={0.8}
                                >
                                    {sendingCode
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.primaryBtnText}>SEND CODE</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        )}

                        {resetStep === 2 && (
                            <View style={styles.resetBody}>
                                <Text style={styles.fieldLabel}>Verification Code</Text>
                                <Text style={styles.resetHint} numberOfLines={2}>
                                    Check <Text style={{ fontWeight: '700', color: '#2D3436' }}>{email}</Text> for your 8-digit code.
                                </Text>

                                <View style={styles.otpRow}>
                                    {otpDigits.map((digit, i) => (
                                        <TextInput
                                            key={i}
                                            ref={ref => { otpRefs.current[i] = ref; }}
                                            style={[
                                                styles.otpBox,
                                                digit ? styles.otpBoxFilled : null,
                                                i === 3 ? styles.otpBoxGap : null,
                                            ]}
                                            value={digit}
                                            onChangeText={t => handleOtpChange(t, i)}
                                            onKeyPress={e => handleOtpKeyPress(e, i)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            selectTextOnFocus
                                            caretHidden
                                            editable={!submitting}
                                            accessibilityLabel={`Digit ${i + 1}`}
                                        />
                                    ))}
                                </View>

                                <View style={styles.otpFooterRow}>
                                    <Text style={styles.otpCount}>{otpFilled} / {OTP_LENGTH}</Text>
                                    {otpFilled > 0 && (
                                        <TouchableOpacity onPress={() => {
                                            setOtpDigits(Array(OTP_LENGTH).fill(''));
                                            setTimeout(() => otpRefs.current[0]?.focus(), 50);
                                        }}>
                                            <Text style={styles.clearOtpText}>Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>New Password</Text>
                                <View style={styles.pwWrapper}>
                                    <TextInput
                                        style={styles.pwInput}
                                        placeholder="At least 8 characters"
                                        placeholderTextColor="#90A4AE"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showNew}
                                        editable={!submitting}
                                    />
                                    <TouchableOpacity onPress={() => setShowNew(p => !p)} style={styles.eyeBtn}>
                                        <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={22} color="#90A4AE" />
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

                                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
                                <View style={styles.pwWrapper}>
                                    <TextInput
                                        style={styles.pwInput}
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="#90A4AE"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirm}
                                        editable={!submitting}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
                                        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={22} color="#90A4AE" />
                                    </TouchableOpacity>
                                </View>
                                {confirmPassword.length > 0 && (
                                    <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#2E7D32' : '#EF5350' }]}>
                                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </Text>
                                )}

                                {pwError ? (
                                    <View style={styles.errorBox}>
                                        <Ionicons name="alert-circle-outline" size={14} color="#EF5350" />
                                        <Text style={styles.errorText}>{pwError}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    style={[styles.primaryBtn, (submitting || otpFilled < OTP_LENGTH) && styles.primaryBtnDisabled, { marginTop: 20 }]}
                                    onPress={handleConfirmReset}
                                    disabled={submitting || otpFilled < OTP_LENGTH}
                                    activeOpacity={0.8}
                                >
                                    {submitting
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.primaryBtnText}>RESET PASSWORD</Text>
                                    }
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleResendCode}
                                    disabled={resendCooldown > 0 || sendingCode}
                                    style={styles.resendBtn}
                                >
                                    <Text style={[styles.resendText, (resendCooldown > 0 || sendingCode) && styles.resendDisabled]}>
                                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

    resetSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        width: '100%',
        maxHeight: '92%',
        paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24,
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
    },
    resetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    resetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backBtn: { padding: 4 },
    resetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
    stepRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight },
    stepDotActive: { backgroundColor: Colors.primary },
    resetBody: { gap: 4 },
    resetIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
    resetSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    emailBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F0FFF4', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
        borderWidth: 1, borderColor: '#C2E7CD', alignSelf: 'center', marginTop: 8,
    },
    emailBoxText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
    emailInputWrapper: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F7FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
        borderWidth: 1.5, borderColor: Colors.borderLight, marginTop: 8, width: '100%',
    },
    emailInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 10 },
    resetHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, textAlign: 'center', marginVertical: 8 },
    primaryBtn: {
        backgroundColor: Colors.primary, borderRadius: 30, paddingVertical: 16,
        alignItems: 'center', marginTop: 8,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: Colors.surface, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

    fieldLabel: { fontSize: 12, fontWeight: '800', color: Colors.iconMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    otpRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
    otpBox: {
        width: (width - 48 - 56 - 7 * 6) / 8,
        aspectRatio: 1,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD5E0',
        backgroundColor: '#F7FAFC',
        textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary,
    },
    otpBoxFilled: { borderColor: Colors.primary, backgroundColor: '#F0FFF4' },
    otpBoxGap: { marginRight: 6 },
    otpFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingHorizontal: 2 },
    otpCount: { fontSize: 11, color: '#90A4AE' },
    clearOtpText: { fontSize: 11, color: '#EF5350', fontWeight: '700', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },

    pwWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F7FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: Colors.borderLight,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    pwInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
    eyeBtn: { paddingLeft: 8 },
    matchText: { fontSize: 11, marginTop: 4, fontWeight: '500' },

    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '700', width: 48, textAlign: 'right' },

    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginTop: 10 },
    errorText: { fontSize: 12, color: '#EF5350', flex: 1, lineHeight: 18 },

    resendBtn: { paddingVertical: 12, alignItems: 'center' },
    resendText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
    resendDisabled: { color: Colors.textPlaceholder },
});
