import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../types/navigation';

import { API_URL } from '../../config/api';
import { Colors as GlobalColors } from '../../constants/colors';
import { StressIllustration } from '../../components/MeditationIllustration';
import { PopupModal } from '../../components/PopupModal';
import { LeavesDecoration } from '../../components/LeavesDecoration';
const Colors = {
    ...GlobalColors,
    primary: '#E07A5F',
};
const THEME_BG = '#FFF4F2';

const { width } = Dimensions.get('window');

const PSS_QUESTIONS = [
    "been upset because of something that happened unexpectedly?",
    "felt that you were unable to control the important things in your life?",
    "felt nervous and \"stressed\"?",
    "felt confident about your ability to handle your personal problems?",
    "felt that things were going your way?",
    "found that you could not cope with all the things that you had to do?",
    "been able to control irritations in your life?",
    "felt that you were on top of things?",
    "been angered because of things that were outside of your control?",
    "felt difficulties were piling up so high that you could not overcome them?"
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
    const startTimeRef = useRef<number | null>(null);

    // State
    const [currentStep, setCurrentStep] = useState<'intro' | 'questionnaire'>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [nextReset, setNextReset] = useState<Date | null>(null);

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
    }, []);

    const getAuthToken = async () => {
        return await AsyncStorage.getItem('authToken');
    };

    const checkStatus = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/api/roadmap/stress/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.completed) {
                    navigation.replace('CompleteTask', {
                        title: 'Great Job!',
                        message: 'You have successfully completed the Stress Snapshot. See you in 1 month!',
                        buttonText: 'Back to Journey'
                    });
                    return;
                }
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

    const handleSelect = (value: number) => {
        setAnswers(prev => ({
            ...prev,
            [`q${currentQuestionIndex + 1}`]: value
        }));

        // Small delay for smooth transition feel, auto advance to next question
        if (currentQuestionIndex < PSS_QUESTIONS.length - 1) {
            setTimeout(() => {
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

            showPopup('success', 'Response Saved!', 'Thank you for tracking your stress levels today.', () => {
                navigation.replace('CompleteTask', {
                    title: 'Great Job!',
                    message: 'You have successfully completed the Stress Snapshot. See you in 1 month!',
                    buttonText: 'Back to Journey'
                });
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
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} color={Colors.primary} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Stress Snapshot</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Response Saved!</Text>
                    <Text style={styles.successText}>Thank you for tracking your stress levels today.</Text>
                    {nextReset && (
                        <Text style={[styles.successText, { marginTop: 8, fontWeight: '700', color: Colors.primary }]}>
                            Next reset: {nextReset.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.homeButtonText}>Back to Journey</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // INTRO SCREEN
    if (currentStep === 'intro') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} color={Colors.primary} />
                <PopupModal
                    visible={popup.visible}
                    type={popup.type}
                    title={popup.title}
                    message={popup.message}
                    onClose={hidePopup}
                    onConfirm={popup.onConfirm}
                />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Stress Snapshot</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.illustrationContainer}>
                        <StressIllustration width={width * 0.63} height={width * 0.63} color={Colors.primary} />
                    </View>

                    <Text style={styles.introTitle}>Perceived Stress</Text>
                    <Text style={styles.introSubtitle}>Monthly Assessment (PSS-10)</Text>

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
                </ScrollView>
            </SafeAreaView>
        );
    }

    const currentQuestionText = PSS_QUESTIONS[currentQuestionIndex];
    const isCurrentQuestionAnswered = answers[`q${currentQuestionIndex + 1}`] !== undefined;

    // QUESTIONNAIRE SCREEN
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} color={Colors.primary} />
            <PopupModal
                visible={popup.visible}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onClose={hidePopup}
                onConfirm={popup.onConfirm}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (currentQuestionIndex > 0) {
                            setCurrentQuestionIndex(prev => prev - 1);
                        } else {
                            setCurrentStep('intro');
                        }
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

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${((currentQuestionIndex + 1) / PSS_QUESTIONS.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressStepText}>Question {currentQuestionIndex + 1} of {PSS_QUESTIONS.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.instructionText}>
                    In the last month, how often have you...
                </Text>

                <View style={styles.questionCard}>
                    <Text style={styles.questionNumberText}>Question {currentQuestionIndex + 1}</Text>
                    <Text style={styles.questionText}>{currentQuestionText}</Text>

                    <View style={styles.optionsContainer}>
                        {SCALE_OPTIONS.map((option) => {
                            const isSelected = answers[`q${currentQuestionIndex + 1}`] === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        isSelected && styles.optionButtonSelected
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        isSelected && styles.radioCircleSelected
                                    ]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Bottom Navigation */}
                <View style={styles.navigationRow}>
                    {currentQuestionIndex > 0 ? (
                        <TouchableOpacity
                            style={styles.navButtonSecondary}
                            onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
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
                            onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
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
    instructionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#636E72',
        marginBottom: 20,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30, // Standardized bottom panel/card curves
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
        minHeight: 320,
    },
    questionNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 24,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 30, // Premium rounded pill
        backgroundColor: '#F6F8F9',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    optionButtonSelected: {
        backgroundColor: THEME_BG,
        borderColor: Colors.primary,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#94A3B8',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    optionText: {
        fontSize: 15,
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
        marginTop: 20,
        gap: 12,
    },
    navButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#DFE6E9',
        backgroundColor: '#FFFFFF',
    },
    navButtonTextSecondary: {
        fontSize: 16,
        fontWeight: '600',
        color: '#636E72',
    },
    navButtonPrimary: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        backgroundColor: Colors.primary,
    },
    navButtonTextPrimary: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        backgroundColor: Colors.primary, // Sage green for submission
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    submitButtonText: {
        fontSize: 16,
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
    // Intro styles
    introContent: {
        padding: 24,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 15,
        color: '#636E72',
        marginBottom: 28,
        textAlign: 'center',
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
