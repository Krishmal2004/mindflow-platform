import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';

import { API_URL } from '../../config/api';
import { apiFetch, clearApiCache, getAuthToken } from '../../lib/apiClient';
import { formatUtcMonthDay } from '../../lib/dateFormat';
import { useConfirmExitOnBack } from '../../lib/useConfirmExitOnBack';
import { Colors as GlobalColors } from '../../constants/colors';
import { StressIllustration } from '../../components/MeditationIllustration';
import { PopupModal } from '../../components/PopupModal';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { PanelWave } from '../../components/PanelWave';
import { FrequencyMeter } from '../../components/ScaleIcons';
const Colors = {
    ...GlobalColors,
    primary: '#E07A5F',
};
const THEME_BG = '#FFF4F2';

const { width } = Dimensions.get('window');

const PSS_QUESTIONS = [
    "Been upset because of something that happened unexpectedly?",
    "Felt that you were unable to control the important things in your life?",
    "Felt nervous and \"stressed\"?",
    "Felt confident about your ability to handle your personal problems?",
    "Felt that things were going your way?",
    "Found that you could not cope with all the things that you had to do?",
    "Been able to control irritations in your life?",
    "Felt that you were on top of things?",
    "Been angered because of things that were outside of your control?",
    "Felt difficulties were piling up so high that you could not overcome them?"
];

const SCALE_OPTIONS = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Almost Never' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Fairly Often' },
    { value: 5, label: 'Very Often' }
];

export default function StressSnapshotScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const startTimeRef = useRef<number | null>(null);
    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const questionAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // State
    const [currentStep, setCurrentStep] = useState<'intro' | 'questionnaire'>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [nextReset, setNextReset] = useState<Date | null>(null);

    // Android hardware back would otherwise silently discard in-progress answers.
    const exitWithoutSaving = useCallback(() => navigation.goBack(), [navigation]);
    useConfirmExitOnBack(Object.keys(answers).length > 0, exitWithoutSaving);

    // Popup Modal state
    const [popup, setPopup] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, type: 'info', title: '', message: '' });

    const showPopup = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setPopup({ visible: true, type, title, message, onConfirm });
    };

    const hidePopup = () => {
        setPopup(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        checkStatus();
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        };
    }, []);

    // Fade + slide the question card in on every question change, and ease the progress bar toward its new position.
    useEffect(() => {
        if (currentStep !== 'questionnaire') return;
        questionAnim.setValue(0);
        Animated.timing(questionAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
        Animated.timing(progressAnim, {
            toValue: (currentQuestionIndex + 1) / PSS_QUESTIONS.length,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [currentQuestionIndex, currentStep]);

    const checkStatus = async () => {
        try {
            const { ok, data } = await apiFetch<{ completed: boolean; nextReset?: string }>('/api/roadmap/stress/status');
            if (ok && data?.completed) {
                setAlreadySubmitted(true);
                if (data.nextReset) setNextReset(new Date(data.nextReset));
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        startTimeRef.current = Date.now();
        setCurrentStep('questionnaire');
        setCurrentQuestionIndex(0);
    };

    // Cancels any pending auto-advance before a manual Back/Next tap, or the 250ms timeout could also fire and skip a question.
    const goToQuestion = (index: number) => {
        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
        }
        setCurrentQuestionIndex(index);
    };

    const handleSelect = (value: number) => {
        setAnswers(prev => ({
            ...prev,
            [`q${currentQuestionIndex + 1}`]: value
        }));

        // Auto-advances after a short delay; clears any pending advance first so rapid re-taps reset the timer instead of stacking.
        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
        }

        if (currentQuestionIndex < PSS_QUESTIONS.length - 1) {
            advanceTimeoutRef.current = setTimeout(() => {
                advanceTimeoutRef.current = null;
                setCurrentQuestionIndex(prev => prev + 1);
            }, 250);
        }
    };

    const getProgress = () => {
        const answeredCount = Object.keys(answers).length;
        return Math.round((answeredCount / PSS_QUESTIONS.length) * 100);
    };

    const handleSubmit = async () => {
        // Validate all questions answered
        if (Object.keys(answers).length !== PSS_QUESTIONS.length) {
            showPopup('warning', 'Incomplete', 'Please answer all questions before submitting.');
            return;
        }

        setIsSubmitting(true);
        const duration = startTimeRef.current
            ? Math.round((Date.now() - startTimeRef.current) / 1000)
            : 0;

        try {
            const token = await getAuthToken();

            if (!token) {
                showPopup('error', 'Session Expired', 'Please login again to continue.', () => {
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                });
                return;
            }

            const response = await fetch(`${API_URL}/api/roadmap/stress`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...answers,
                    duration
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Submission failed');
            }

            clearApiCache('/api/roadmap/stress');
            clearApiCache('/api/journey');

            navigation.replace('CompleteTask', {
                title: 'Great Job!',
                message: 'You have successfully completed the Stress Snapshot. See you in 1 month!',
                buttonText: 'Back to Dashboard',
                themeColor: Colors.primary,
                themeBgGrad: [THEME_BG, '#FCEEEB', '#FFFFFF']
            });

        } catch (error: any) {
            console.error('Submit error:', error);
            showPopup('error', 'Error', error.message || 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (alreadySubmitted) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} color={Colors.primary} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Stress Snapshot</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={[styles.successContainer, { paddingBottom: 24 + insets.bottom }]}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Response Saved!</Text>
                    <Text style={styles.successText}>Thank you for tracking your stress levels today.</Text>
                    {nextReset && (
                        <Text style={[styles.successText, { marginTop: 8, fontWeight: '700', color: Colors.primary }]}>
                            Next reset: {formatUtcMonthDay(nextReset)}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('MainTabs')}
                    >
                        <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // INTRO SCREEN
    // INTRO SCREEN — About Me front-page layout: illustration above a rounded
    // panel (in this screen's own iconic terracotta) with a caps label/headline,
    // the instructions card, the Start button, and a bottom wave.
    if (currentStep === 'intro') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} color={Colors.primary} />
                <PopupModal
                    visible={popup.visible}
                    type={popup.type}
                    title={popup.title}
                    message={popup.message}
                    onClose={hidePopup}
                    onConfirm={popup.onConfirm}
                    themeColor={Colors.primary}
                />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Stress Snapshot</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.introWrap}>
                        <View style={styles.illustrationContainer}>
                            <StressIllustration width={width * 0.60} height={width * 0.60} color={Colors.primary} />
                        </View>

                        <View style={[styles.introPanel, { paddingBottom: 28 + insets.bottom }]}>
                            <Text style={styles.introPanelLabel}>PSS-10 ASSESSMENT</Text>
                            <Text style={styles.introPanelHeadline}>PERCEIVED STRESS</Text>

                            <View style={styles.introCard}>
                                <View style={styles.introIconRow}>
                                    <View style={styles.introIconCircle}>
                                        <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.introCardTitle}>Instructions</Text>
                                </View>
                                <Text style={styles.introCardText}>
                                    The questions in this scale ask you about your feelings and thoughts during the last month. You will rate how often you felt or thought a certain way.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.goButton}
                                onPress={handleStart}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.goButtonText}>Start Assessment</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </TouchableOpacity>

                            <PanelWave />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const currentQuestionText = PSS_QUESTIONS[currentQuestionIndex];
    const isCurrentQuestionAnswered = answers[`q${currentQuestionIndex + 1}`] !== undefined;

    // QUESTIONNAIRE SCREEN
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} color={Colors.primary} />
            <PopupModal
                visible={popup.visible}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onClose={hidePopup}
                onConfirm={popup.onConfirm}
                themeColor={Colors.primary}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (advanceTimeoutRef.current) {
                            clearTimeout(advanceTimeoutRef.current);
                            advanceTimeoutRef.current = null;
                        }
                        navigation.navigate('MainTabs');
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Stress Snapshot</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{getProgress()}%</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introWrap}>
                    {/* Top Section on cream background */}
                    <View style={styles.illustrationContainer}>
                        <StressIllustration width={width * 0.22} height={width * 0.22} color={Colors.primary} />
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.progressContainer, { width: '100%', paddingHorizontal: 24, marginBottom: 12 }]}>
                        <View style={styles.progressBarBg}>
                            <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        </View>
                        <Text style={styles.progressStepText}>Question {currentQuestionIndex + 1} of {PSS_QUESTIONS.length}</Text>
                    </View>

                    {/* Bottom Panel (terracotta background) */}
                    <View style={[styles.introPanel, { paddingBottom: 28 + insets.bottom }]}>
                        <Animated.View
                            style={[
                                styles.questionCard,
                                {
                                    opacity: questionAnim,
                                    transform: [{ translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                                },
                            ]}
                        >
                            <View style={styles.questionNumberBadge}>
                                <Text style={styles.questionNumberText}>Question {currentQuestionIndex + 1}</Text>
                            </View>
                            <Text style={styles.questionText}>{currentQuestionText}</Text>

                            <View style={styles.optionsContainer}>
                                {SCALE_OPTIONS.map((option) => {
                                    const isSelected = answers[`q${currentQuestionIndex + 1}`] === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                                            onPress={() => handleSelect(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                            <View style={styles.scaleIconSlot}>
                                                <FrequencyMeter level={option.value} color={Colors.primary} />
                                            </View>
                                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* Bottom Navigation */}
                        <View style={styles.navigationRow}>
                            {currentQuestionIndex > 0 ? (
                                <TouchableOpacity
                                    style={styles.navButtonSecondary}
                                    onPress={() => goToQuestion(currentQuestionIndex - 1)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
                                    <Text style={styles.navButtonTextSecondary}>Back</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flex: 1 }} />
                            )}

                            {currentQuestionIndex < PSS_QUESTIONS.length - 1 ? (
                                <TouchableOpacity
                                    style={[
                                        styles.navButtonPrimary,
                                        !isCurrentQuestionAnswered && styles.navButtonDisabled
                                    ]}
                                    disabled={!isCurrentQuestionAnswered}
                                    onPress={() => goToQuestion(currentQuestionIndex + 1)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.navButtonTextPrimary}>Next</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (!isCurrentQuestionAnswered || isSubmitting) && styles.navButtonDisabled
                                    ]}
                                    disabled={!isCurrentQuestionAnswered || isSubmitting}
                                    onPress={handleSubmit}
                                    activeOpacity={0.7}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitButtonText}>Submit</Text>
                                            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <PanelWave />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9', // Soft cream backdrop
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
    },
    progressBadge: {
        backgroundColor: THEME_BG,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    progressContainer: {
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 8,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    progressStepText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 6,
    },
    content: {
        padding: 20,
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    instructionText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    questionCard: {
        width: '100%',
        zIndex: 1,
    },
    questionNumberBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    questionNumberText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        lineHeight: 22,
    },
    optionsContainer: {
        gap: 7,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    optionButtonSelected: {
        backgroundColor: THEME_BG,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#94A3B8',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.primary,
    },
    scaleIconSlot: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    optionText: {
        fontSize: 13.5,
        color: '#475569',
        flex: 1,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#2D3436',
        fontWeight: '700',
    },
    navigationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 20,
        gap: 12,
        zIndex: 1,
    },
    navButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#DFE6E9',
        backgroundColor: '#FFFFFF',
    },
    navButtonTextSecondary: {
        fontSize: 15,
        fontWeight: '600',
        color: '#636E72',
    },
    navButtonPrimary: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 30,
        backgroundColor: Colors.primary,
    },
    navButtonTextPrimary: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 30,
        backgroundColor: Colors.primary, // Sage green for submission
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    navButtonDisabled: {
        backgroundColor: '#DFE6E9',
        borderColor: '#DFE6E9',
        opacity: 0.6,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: THEME_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#636E72',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    homeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Intro styles — About Me front-page layout: illustration above a rounded panel.
    introContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        flexGrow: 1,
    },
    introWrap: {
        flex: 1,
        marginHorizontal: -24, // cancels introContent's padding so the panel bleeds to the screen edges
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 8,
        alignItems: 'center',
    },
    introPanel: {
        flex: 1,
        backgroundColor: THEME_BG,
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 6,
    },
    introPanelLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636E72',
        letterSpacing: 2,
        marginBottom: 2,
    },
    introPanelHeadline: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2D3436',
        letterSpacing: 1,
        marginBottom: 20,
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    introIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    introCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    introCardText: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
    },
    goButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        marginBottom: 32, // leaves room below the button so PanelWave (bottom: 0 of the panel) isn't covered by it
        zIndex: 1,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        gap: 10,
    },
    goButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});
