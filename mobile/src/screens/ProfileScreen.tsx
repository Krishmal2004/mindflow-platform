import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal, Dimensions,
    TextInput, KeyboardAvoidingView, Platform,
    NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { apiFetch, clearAuthStorage } from '../lib/apiClient';
import { PopupModal } from '../components/PopupModal';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { AUTH_ENDPOINTS } from '../config/api';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 8;

// ── Password strength (same logic as SignupScreen) ─────────────────────────
type StrengthLevel = 0 | 1 | 2 | 3 | 4;
function getStrength(pwd: string): StrengthLevel {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8)           s++;
    if (/[A-Z]/.test(pwd))         s++;
    if (/[0-9]/.test(pwd))         s++;
    if (/[^A-Za-z0-9]/.test(pwd))  s++;
    return Math.min(s, 4) as StrengthLevel;
}
const STRENGTH_LABEL: Record<StrengthLevel, string> = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
const STRENGTH_COLOR: Record<StrengthLevel, string> = {
    0: '#E0E6ED', 1: '#EF5350', 2: '#FFA726', 3: '#66BB6A', 4: '#2E7D32',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<{
        username: string; research_id: string | null; email: string | null;
    } | null>(null);

    // ── Modals ───────────────────────────────────────────────────────────────
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ── Password-reset wizard ─────────────────────────────────────────────
    const [resetVisible, setResetVisible] = useState(false);
    const [resetStep, setResetStep] = useState<1 | 2>(1);

    // Step 1
    const [sendingCode, setSendingCode] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 2 — OTP boxes
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const otpRefs = useRef<(TextInput | null)[]>([]);

    // Step 2 — new password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pwError, setPwError] = useState('');

    // ── Data ──────────────────────────────────────────────────────────────
    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const fetchProfile = async () => {
        try {
            const { ok, data } = await apiFetch<{
                username: string; research_id: string | null; email: string | null;
            }>('/api/profile');
            if (ok && data) setProfileData(data);
        } catch (e) {
            console.log('Error fetching profile', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Sign-out ──────────────────────────────────────────────────────────
    const handleSignOut = async () => {
        try {
            await clearAuthStorage();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch {
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    // ── Reset-password helpers ────────────────────────────────────────────
    const openResetModal = () => {
        setResetStep(1);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setNewPassword('');
        setConfirmPassword('');
        setPwError('');
        setResetVisible(true);
    };

    const closeResetModal = () => {
        setResetVisible(false);
        setResendCooldown(0);
    };

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
        if (!profileData?.email) return;
        setSendingCode(true);
        try {
            const res = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profileData.email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to send code');
            startCooldown();
            setResetStep(2);
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
        } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send code');
        } finally {
            setSendingCode(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || !profileData?.email) return;
        setSendingCode(true);
        try {
            const res = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profileData.email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to resend');
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
            startCooldown();
        } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to resend code');
        } finally {
            setSendingCode(false);
        }
    };

    // OTP box handlers
    const handleOtpChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        // Paste support
        if (text.length > 1) {
            const clean = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
            if (clean.length === OTP_LENGTH) {
                setOtpDigits(clean.split(''));
                otpRefs.current[OTP_LENGTH - 1]?.focus();
                return;
            }
        }
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number,
    ) => {
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
                body: JSON.stringify({ email: profileData?.email, token: otp, newPassword }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Password reset failed');
            closeResetModal();
            setShowSuccessModal(true);
        } catch (e: unknown) {
            setPwError(e instanceof Error ? e.message : 'Password reset failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Derived
    const otpFilled = otpDigits.filter(Boolean).length;
    const strength = getStrength(newPassword);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>My Account</Text>
                    <Text style={styles.subtitle}>Manage your profile & security</Text>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Profile Hero */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={50} color={Colors.primary} />
                    </View>
                    <Text style={styles.userName}>{profileData?.username || 'Mindful User'}</Text>
                    <Text style={styles.userEmail}>{profileData?.email || 'No email on file'}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="person-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoValue}>{profileData?.username || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="id-card-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Research ID</Text>
                                {profileData?.research_id ? (
                                    <Text style={styles.infoValue}>{profileData.research_id}</Text>
                                ) : (
                                    <View style={styles.pendingRow}>
                                        <Ionicons name="time-outline" size={13} color="#D97706" />
                                        <Text style={styles.pendingText}>Researchers will add you shortly</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{profileData?.email || 'Not set'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionButton, { marginTop: 16 }]}
                        onPress={() => navigation.navigate('AboutMe')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E6F4EA' }]}>
                                <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.actionText}>About Me Questionnaire</Text>
                                <Text style={styles.actionSubtext}>View or update your details</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { marginBottom: 12 }]}
                        onPress={openResetModal}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E6F4EA' }]}>
                                <Ionicons name="lock-closed-outline" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.actionText}>Reset Password</Text>
                                <Text style={styles.actionSubtext}>Verify via a one-time code</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={() => setShowSignOutModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                            </View>
                            <View>
                                <Text style={styles.dangerText}>Sign Out from Device</Text>
                                <Text style={styles.dangerSubText}>Log out safely</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Sign Out Modal ── */}
            <Modal visible={showSignOutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertModal}>
                        <View style={styles.alertIconCircle}>
                            <Ionicons name="log-out" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Sign Out?</Text>
                        <Text style={styles.alertMessage}>You will need to log in again to access your account.</Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity style={styles.alertCancel} onPress={() => setShowSignOutModal(false)} activeOpacity={0.7}>
                                <Text style={styles.alertCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.alertConfirm} onPress={handleSignOut} activeOpacity={0.7}>
                                <Text style={styles.alertConfirmText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Reset Password Modal ── */}
            <Modal visible={resetVisible} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.resetSheet}>
                        {/* Header */}
                        <View style={styles.resetHeader}>
                            <View style={styles.resetHeaderLeft}>
                                {resetStep === 2 && (
                                    <TouchableOpacity onPress={() => setResetStep(1)} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name="arrow-back" size={20} color="#64748B" />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.resetTitle}>
                                    {resetStep === 1 ? 'Reset Password' : 'Enter New Password'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeResetModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="close" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Step indicators */}
                        <View style={styles.stepRow}>
                            {([1, 2] as const).map(s => (
                                <View key={s} style={[styles.stepDot, resetStep >= s && styles.stepDotActive]} />
                            ))}
                        </View>

                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                            {/* ── STEP 1: send code ── */}
                            {resetStep === 1 && (
                                <View style={styles.resetBody}>
                                    <View style={[styles.resetIconCircle, { backgroundColor: '#E6F4EA' }]}>
                                        <Ionicons name="mail-outline" size={30} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.resetSubtitle}>
                                        We'll send an 8-digit verification code to:
                                    </Text>
                                    <View style={styles.emailBox}>
                                        <Ionicons name="at" size={16} color={Colors.primary} />
                                        <Text style={styles.emailBoxText}>{profileData?.email}</Text>
                                    </View>
                                    <Text style={styles.resetHint}>
                                        Enter the code along with your new password on the next step.
                                    </Text>
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

                            {/* ── STEP 2: OTP + new password ── */}
                            {resetStep === 2 && (
                                <View style={styles.resetBody}>
                                    {/* OTP section */}
                                    <Text style={styles.fieldLabel}>Verification Code</Text>
                                    <Text style={styles.resetHint} numberOfLines={2}>
                                        Check <Text style={{ fontWeight: '700', color: '#2D3436' }}>{profileData?.email}</Text> for your 8-digit code.
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

                                    {/* New password */}
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
                                            <Text style={styles.eyeText}>{showNew ? 'Hide' : 'Show'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Strength bar */}
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

                                    {/* Confirm password */}
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
                                            <Text style={styles.eyeText}>{showConfirm ? 'Hide' : 'Show'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {confirmPassword.length > 0 && (
                                        <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#2E7D32' : '#EF5350' }]}>
                                            {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                        </Text>
                                    )}

                                    {/* Error */}
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

            {/* ── Success Modal ── */}
            <PopupModal
                visible={showSuccessModal}
                type="success"
                title="Password Updated"
                message="Your password has been changed successfully. Use it next time you log in."
                buttonText="Done"
                onClose={() => setShowSuccessModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8F9' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8F9' },
    headerContainer: { paddingVertical: 12, paddingHorizontal: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#2D3436', marginBottom: 4 },
    subtitle: { fontSize: 15, color: '#636E72' },
    content: { paddingTop: 20, paddingBottom: 120 },

    profileCard: {
        marginHorizontal: 24, backgroundColor: '#FFFFFF', borderRadius: 30,
        paddingVertical: 28, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 4, marginBottom: 8,
    },
    avatarCircle: {
        width: 84, height: 84, borderRadius: 42, backgroundColor: '#E6F4EA',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 3, borderColor: '#C2E7CD',
    },
    userName: { fontSize: 22, fontWeight: '800', color: '#2D3436' },
    userEmail: { fontSize: 14, color: Colors.primary, marginTop: 4, fontWeight: '600' },

    section: { marginTop: 24, paddingHorizontal: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 4 },

    infoCard: {
        backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#2D3436', fontWeight: '700' },
    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    pendingText: { fontSize: 13, color: '#D97706', fontWeight: '600', fontStyle: 'italic' },

    actionButton: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2,
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 15, fontWeight: '700', color: '#2D3436' },
    actionSubtext: { fontSize: 12, color: '#636E72', marginTop: 2 },
    dangerButton: { marginTop: 0, borderWidth: 1.5, borderColor: '#FEE2E2' },
    dangerText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
    dangerSubText: { fontSize: 12, color: '#F87171', marginTop: 2 },

    // Sign-out modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    alertModal: {
        backgroundColor: '#FFFFFF', borderRadius: 30, padding: 28, width: '85%', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    },
    alertIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    alertTitle: { fontSize: 20, fontWeight: '800', color: '#2D3436', marginBottom: 8 },
    alertMessage: { fontSize: 15, color: '#636E72', textAlign: 'center', marginBottom: 28, lineHeight: 22, fontWeight: '500' },
    alertActions: { flexDirection: 'row', gap: 12, width: '100%' },
    alertCancel: { flex: 1, paddingVertical: 16, backgroundColor: '#F1F5F9', borderRadius: 30, alignItems: 'center' },
    alertCancelText: { fontSize: 16, fontWeight: '700', color: '#636E72' },
    alertConfirm: { flex: 1, paddingVertical: 16, backgroundColor: '#EF4444', borderRadius: 30, alignItems: 'center' },
    alertConfirmText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Reset password sheet
    resetSheet: {
        backgroundColor: '#FFFFFF',
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
    resetTitle: { fontSize: 18, fontWeight: '800', color: '#2D3436' },
    stepRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    stepDotActive: { backgroundColor: Colors.primary },
    resetBody: { gap: 4 },
    resetIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
    resetSubtitle: { fontSize: 14, color: '#636E72', textAlign: 'center', lineHeight: 22 },
    emailBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F0FFF4', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
        borderWidth: 1, borderColor: '#C2E7CD', alignSelf: 'center', marginTop: 8,
    },
    emailBoxText: { fontSize: 14, fontWeight: '700', color: '#2D3436' },
    resetHint: { fontSize: 12, color: '#94A3B8', lineHeight: 18, textAlign: 'center', marginVertical: 8 },
    primaryBtn: {
        backgroundColor: Colors.primary, borderRadius: 30, paddingVertical: 16,
        alignItems: 'center', marginTop: 8,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

    // OTP in modal
    fieldLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    otpRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
    otpBox: {
        width: (width - 48 - 56 - 7 * 6) / 8,
        aspectRatio: 1,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD5E0',
        backgroundColor: '#F7FAFC',
        textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#2D3436',
    },
    otpBoxFilled: { borderColor: Colors.primary, backgroundColor: '#F0FFF4' },
    otpBoxGap: { marginRight: 6 },
    otpFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingHorizontal: 2 },
    otpCount: { fontSize: 11, color: '#90A4AE' },
    clearOtpText: { fontSize: 11, color: '#EF5350', fontWeight: '700', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },

    // Password fields
    pwWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F7FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    pwInput: { flex: 1, fontSize: 15, color: '#2D3436' },
    eyeBtn: { paddingLeft: 8 },
    eyeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
    matchText: { fontSize: 11, marginTop: 4, fontWeight: '500' },

    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '700', width: 48, textAlign: 'right' },

    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginTop: 10 },
    errorText: { fontSize: 12, color: '#EF5350', flex: 1, lineHeight: 18 },

    resendBtn: { paddingVertical: 12, alignItems: 'center' },
    resendText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
    resendDisabled: { color: '#B2BEC3' },
});
