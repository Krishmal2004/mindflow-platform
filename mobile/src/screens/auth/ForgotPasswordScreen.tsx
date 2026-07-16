import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Keyboard, LayoutAnimation, UIManager, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/colors';
import { MeditationIllustration } from '../../components/MeditationIllustration';
import { Notification, NotificationType } from '../../components/Notification';
import { PanelWave } from '../../components/PanelWave';
import { LogoBlock } from '../../components/LogoBlock';
import { AUTH_ENDPOINTS } from '../../config/api';
import { EMAIL_RE } from '../../lib/validation';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ForgotPasswordRouteProp = RouteProp<RootStackParamList, 'ForgotPassword'>;

// Step 1 of the OTP-based password reset flow — same visual language as LoginScreen
// (fixed logo/illustration header, rounded panel with wave). Reachable pre-auth from
// Login (email editable) or from Profile settings (email known, locked).
export default function ForgotPasswordScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ForgotPasswordRouteProp>();
    const locked = route.params?.locked ?? false;
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [email, setEmail] = useState(route.params?.email ?? '');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.9);

    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationType, setNotificationType] = useState<NotificationType>('success');
    const [notificationMessage, setNotificationMessage] = useState('');
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
        return () => { showSubscription.remove(); hideSubscription.remove(); };
    }, [headerHeight, keyboardVisible]);

    const showNotification = (type: NotificationType, message: string) => {
        setNotificationType(type); setNotificationMessage(message); setNotificationVisible(true);
    };

    const handleSendCode = async () => {
        if (!email) { showNotification('error', 'Please enter your email address'); return; }
        if (!EMAIL_RE.test(email)) { showNotification('error', 'Enter a valid email address'); return; }
        setLoading(true);
        try {
            const response = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to send code');
            setLoading(false);
            navigation.navigate('ResetOtp', { email });
        } catch (error: unknown) {
            setLoading(false);
            showNotification('error', error instanceof Error ? error.message : 'Failed to send code');
        }
    };

    const headerStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const illustrationStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
    const panelStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

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
                    <View style={{ height: headerHeight }} />

                    <Animated.View
                        style={[styles.bottomPanel, panelStyle, { minHeight: height - headerHeight, paddingBottom: insets.bottom }]}
                    >
                        <Text style={styles.panelTitle}>RESET PASSWORD</Text>
                        <Text style={styles.panelSubtitle}>WE'LL EMAIL YOU A CODE</Text>

                        <View style={styles.formContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#90A4AE"
                                    value={email}
                                    onChangeText={locked ? undefined : setEmail}
                                    editable={!locked}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => handleFocus(0)}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSendCode}
                                />
                            </View>

                            <Text style={styles.hintText}>
                                Enter the code along with your new password on the next step.
                            </Text>

                            <TouchableOpacity
                                style={[styles.sendButton, loading && { opacity: 0.6 }]}
                                onPress={handleSendCode}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.sendButtonText}>SEND CODE</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.switchButton}>
                                <Text style={styles.switchText}>{locked ? 'CANCEL' : 'BACK TO LOGIN'}</Text>
                            </TouchableOpacity>
                        </View>

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
    scrollContent: { flexGrow: 1, alignItems: 'center' },
    illustrationContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    bottomPanel: {
        backgroundColor: '#E3F2FD',
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingBottom: 104,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        overflow: 'hidden',
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
    hintText: { fontSize: 12, color: '#90A4AE', lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
    sendButton: {
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
    sendButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    switchButton: { paddingVertical: 12, alignItems: 'center' },
    switchText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12, letterSpacing: 1, textDecorationLine: 'underline' },
});
