import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Keyboard, LayoutAnimation, UIManager, ActivityIndicator } from 'react-native';
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
import { Notification, NotificationType } from '../../components/Notification';
import { PanelWave } from '../../components/PanelWave';
import { LogoBlock } from '../../components/LogoBlock';
import { getPostAuthRoute } from '../../lib/postAuthRoute';
import { AUTH_ENDPOINTS } from '../../config/api';
import { setAuthToken } from '../../lib/apiClient';

const { width, height } = Dimensions.get('window');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}



export default function LoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const passwordRef = useRef<TextInput>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
 
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);
 
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
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

        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardVisible(true);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: headerHeight + activeOffsetRef.current, animated: true });
            }, 100);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setKeyboardVisible(false);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        });
        return () => { showSubscription.remove(); hideSubscription.remove(); };
    }, [headerHeight, keyboardVisible]);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type); setNotificationMessage(message); setNotificationVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) { showNotification('error', 'Please enter both email and password'); return; }
        if (!EMAIL_RE.test(email)) { showNotification('error', 'Enter a valid email address'); return; }
        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (!response.ok) {
                if (result.error && result.error.includes('Email not confirmed')) {
                    showNotification('error', 'Please verify your email first.');
                    setTimeout(() => navigation.navigate('OtpVerification', { email }), 1500);
                } else {
                    throw new Error(result.error || 'Login failed');
                }
                setLoading(false); return;
            }
            if (result.user && result.user.display_name) {
                await AsyncStorage.setItem('userName', result.user.display_name);
            } else {
                await AsyncStorage.setItem('userName', email.split('@')[0]);
            }
            await AsyncStorage.setItem('isLoggedIn', 'true');
            if (result.session && result.session.access_token) {
                await setAuthToken(result.session.access_token);
            } else if (result.token) {
                await setAuthToken(result.token);
            }
            setLoading(false);
            showNotification('success', 'Welcome back!');
            const route = await getPostAuthRoute();
            setTimeout(() => navigation.replace(route), 1000);
        } catch (error: any) {
            console.error('Login Error:', error.message);
            setLoading(false);
            showNotification('error', error.message || 'Invalid credentials');
        }
    };

    const headerStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const illustrationStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const panelStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

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

                <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
                    <MeditationIllustration
                        width={width * 0.70}
                        height={width * 0.70}
                        color={Colors.primary}
                    />
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

                    {/* Bottom panel with wave inside */}
                    <Animated.View 
                        style={[styles.bottomPanel, panelStyle, { minHeight: height - headerHeight, paddingBottom: insets.bottom }]}
                    >
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
                                    onFocus={() => handleFocus(0)}
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                />
                            </View>

                            <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center', paddingRight: 12 }]}>
                                <TextInput
                                    ref={passwordRef}
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Password"
                                    placeholderTextColor="#90A4AE"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => handleFocus(80)}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ padding: 4 }}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#90A4AE" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginButton, loading && { opacity: 0.6 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.loginButtonText}>LOG IN</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.switchButton}>
                                <Text style={styles.switchText}>OR SIGN UP</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Wave decoration at bottom of panel */}
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
    keyboardView: { flex: 1 },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 0,
    },
    scrollContent: { flexGrow: 1, alignItems: 'center' },
    illustrationContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    bottomPanel: {
        backgroundColor: '#E3F2FD',
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingBottom: 104,   // extra space for wave
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        overflow: 'hidden',   // clip wave inside panel
    },
    panelTitle: { fontSize: 14, fontWeight: '600', color: '#636E72', letterSpacing: 2, marginBottom: 5 },
    panelSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', letterSpacing: 1, marginBottom: 20 },
    formContainer: { width: '100%', gap: 12 },
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
    },
    input: { fontSize: 16, color: '#2D3436' },
    loginButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        marginTop: 5,
    },
    loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    switchButton: {
        backgroundColor: '#95C27E',
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#95C27E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    switchText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
