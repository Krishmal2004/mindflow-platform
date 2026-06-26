import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Dimensions, ScrollView, Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { MeditationIllustration } from '../../components/MeditationIllustration';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { AUTH_ENDPOINTS } from '../../config/api';
import { Notification, NotificationType } from '../../components/Notification';

const { width, height } = Dimensions.get('window');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Password strength ──────────────────────────────────────────────────────────
type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(pwd: string): StrengthLevel {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)                    score++;
    if (/[A-Z]/.test(pwd))                 score++;
    if (/[0-9]/.test(pwd))                 score++;
    if (/[^A-Za-z0-9]/.test(pwd))          score++;
    return Math.min(score, 4) as StrengthLevel;
}

const STRENGTH_LABEL: Record<StrengthLevel, string> = {
    0: '',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
};

const STRENGTH_COLOR: Record<StrengthLevel, string> = {
    0: '#E0E6ED',
    1: '#EF5350',
    2: '#FFA726',
    3: '#66BB6A',
    4: '#2E7D32',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Per-field errors (shown on blur or on submit attempt)
    const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
    const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '' });

    // Notification
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Animations
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 800 });
        scaleAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });

        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    const strength = getStrength(password);

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = (field: keyof typeof errors, value: string, confirmVal?: string) => {
        let msg = '';
        switch (field) {
            case 'name':
                if (!value.trim()) msg = 'Full name is required';
                break;
            case 'email':
                if (!value.trim()) msg = 'Email is required';
                else if (!EMAIL_RE.test(value)) msg = 'Enter a valid email address';
                break;
            case 'password':
                if (!value) msg = 'Password is required';
                else if (value.length < 8) msg = 'Password must be at least 8 characters';
                else if (strength < 2) msg = 'Password is too weak — add numbers or symbols';
                break;
            case 'confirm':
                if (!value) msg = 'Please confirm your password';
                else if (value !== (confirmVal ?? password)) msg = 'Passwords do not match';
                break;
        }
        setErrors(prev => ({ ...prev, [field]: msg }));
        return msg === '';
    };

    const touchField = (field: keyof typeof touched, value: string, extra?: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validate(field, value, extra);
    };

    const allValid = () => {
        const v1 = validate('name', name);
        const v2 = validate('email', email);
        const v3 = validate('password', password);
        const v4 = validate('confirm', confirmPassword, password);
        setTouched({ name: true, email: true, password: true, confirm: true });
        return v1 && v2 && v3 && v4;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSignup = async () => {
        if (!allValid()) return;

        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.SIGNUP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: name }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Signup failed');

            await AsyncStorage.setItem('userName', name);
            setLoading(false);

            setNotificationType('success');
            setNotificationMessage('Account created! Please verify your email.');
            setNotificationVisible(true);

            setTimeout(() => navigation.navigate('OtpVerification', { email }), 1000);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Signup failed';
            setNotificationType('error');
            setNotificationMessage(msg);
            setNotificationVisible(true);
            setLoading(false);
        }
    };

    // ── Animated styles ───────────────────────────────────────────────────────
    const headerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));
    const illustrationStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));
    const panelStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    const inputBorder = (field: keyof typeof errors) =>
        touched[field] && errors[field] ? styles.inputError : {};

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={height * 0.6} color={Colors.primary} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top > 0 ? insets.top + 10 : 40 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={headerStyle}>
                        <Text style={styles.headerText}>MindFlow</Text>
                    </Animated.View>

                    {!keyboardVisible && (
                        <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
                            <MeditationIllustration width={width * 0.42} height={width * 0.42} color={Colors.primary} />
                        </Animated.View>
                    )}

                    <Animated.View style={[styles.bottomPanel, panelStyle]}>
                        <Text style={styles.panelTitle}>NEW ACCOUNT</Text>
                        <Text style={styles.panelSubtitle}>START YOUR JOURNEY</Text>

                        <View style={styles.formContainer}>

                            {/* Full Name */}
                            <View>
                                <View style={[styles.inputWrapper, inputBorder('name')]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor="#90A4AE"
                                        value={name}
                                        onChangeText={v => { setName(v); if (touched.name) validate('name', v); }}
                                        onBlur={() => touchField('name', name)}
                                    />
                                </View>
                                {touched.name && errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                            </View>

                            {/* Email */}
                            <View>
                                <View style={[styles.inputWrapper, inputBorder('email')]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor="#90A4AE"
                                        value={email}
                                        onChangeText={v => { setEmail(v); if (touched.email) validate('email', v); }}
                                        onBlur={() => touchField('email', email)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                    />
                                </View>
                                {touched.email && errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                            </View>

                            {/* Password */}
                            <View>
                                <View style={[styles.inputWrapper, inputBorder('password')]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Password"
                                        placeholderTextColor="#90A4AE"
                                        value={password}
                                        onChangeText={v => { setPassword(v); if (touched.password) validate('password', v); }}
                                        onBlur={() => touchField('password', password)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeButton}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#90A4AE" />
                                    </TouchableOpacity>
                                </View>

                                {/* Strength meter — only visible once user starts typing */}
                                {password.length > 0 && (
                                    <View style={styles.strengthContainer}>
                                        <View style={styles.strengthBars}>
                                            {([1, 2, 3, 4] as StrengthLevel[]).map(level => (
                                                <View
                                                    key={level}
                                                    style={[
                                                        styles.strengthBar,
                                                        { backgroundColor: strength >= level ? STRENGTH_COLOR[strength] : '#E0E6ED' },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        {strength > 0 && (
                                            <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                                                {STRENGTH_LABEL[strength]}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {password.length > 0 && (
                                    <View style={styles.requirementsList}>
                                        <Requirement met={password.length >= 8} label="At least 8 characters" />
                                        <Requirement met={/[A-Z]/.test(password)} label="Uppercase letter" />
                                        <Requirement met={/[0-9]/.test(password)} label="Number" />
                                        <Requirement met={/[^A-Za-z0-9]/.test(password)} label="Special character (!@#…)" />
                                    </View>
                                )}

                                {touched.password && errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                            </View>

                            {/* Confirm Password */}
                            <View>
                                <View style={[styles.inputWrapper, inputBorder('confirm')]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#90A4AE"
                                        value={confirmPassword}
                                        onChangeText={v => { setConfirmPassword(v); if (touched.confirm) validate('confirm', v, password); }}
                                        onBlur={() => touchField('confirm', confirmPassword, password)}
                                        secureTextEntry={!showConfirm}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeButton}>
                                        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={22} color="#90A4AE" />
                                    </TouchableOpacity>
                                </View>
                                {/* Match indicator */}
                                {confirmPassword.length > 0 && (
                                    <Text style={[styles.matchText, { color: confirmPassword === password ? '#2E7D32' : '#EF5350' }]}>
                                        {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </Text>
                                )}
                                {touched.confirm && errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
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

// ── Requirement row ────────────────────────────────────────────────────────────
function Requirement({ met, label }: { met: boolean; label: string }) {
    return (
        <View style={reqStyles.row}>
            <Text style={[reqStyles.dot, { color: met ? '#2E7D32' : '#90A4AE' }]}>{met ? '✓' : '○'}</Text>
            <Text style={[reqStyles.label, { color: met ? '#2E7D32' : '#90A4AE' }]}>{label}</Text>
        </View>
    );
}

const reqStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    dot: { fontSize: 12, fontWeight: 'bold', width: 14 },
    label: { fontSize: 11 },
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8F9' },
    decorationContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 30,
    },
    headerText: {
        fontSize: 16, fontWeight: '600', color: '#636E72',
        letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase',
    },
    illustrationContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    bottomPanel: {
        backgroundColor: '#E3F2FD',
        width: '100%',
        borderTopLeftRadius: 40, borderTopRightRadius: 40,
        paddingTop: 20, paddingBottom: 28, paddingHorizontal: 24,
        alignItems: 'center', flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 10,
    },
    panelTitle: {
        fontSize: 14, fontWeight: '600', color: '#636E72',
        letterSpacing: 2, marginBottom: 5,
    },
    panelSubtitle: {
        fontSize: 18, fontWeight: 'bold', color: '#2D3436',
        letterSpacing: 1, marginBottom: 15,
    },
    formContainer: { width: '100%', gap: 8 },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingHorizontal: 20, paddingVertical: 10,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
        borderWidth: 1.5, borderColor: 'transparent',
    },
    inputError: { borderColor: '#EF5350' },
    input: { flex: 1, fontSize: 16, color: '#2D3436' },
    eyeButton: { paddingLeft: 8 },
    eyeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
    errorText: { color: '#EF5350', fontSize: 11, marginTop: 3, marginLeft: 16 },
    matchText: { fontSize: 11, marginTop: 3, marginLeft: 16, fontWeight: '500' },

    strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, paddingHorizontal: 4 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '700', width: 50, textAlign: 'right' },

    requirementsList: { paddingHorizontal: 4, marginTop: 4, gap: 1 },

    signupButton: {
        backgroundColor: '#95C27E',
        borderRadius: 30, paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#95C27E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 4, marginTop: 6,
    },
    signupButtonDisabled: { opacity: 0.7 },
    signupButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    switchButton: { paddingVertical: 12, alignItems: 'center' },
    switchText: {
        color: Colors.primary, fontWeight: 'bold', fontSize: 12,
        letterSpacing: 1, textDecorationLine: 'underline',
    },
});
