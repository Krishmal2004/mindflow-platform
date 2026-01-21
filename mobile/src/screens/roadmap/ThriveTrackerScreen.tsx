import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop, Ellipse, Rect } from 'react-native-svg';
import { API_URL } from '../../config/api';
import { Colors } from '../../constants/colors';
import { ThriveIllustration } from '../../components/MeditationIllustration';

const { width } = Dimensions.get('window');

const WEMWBS_QUESTIONS = [
    "I've been feeling optimistic about the future",
    "I've been feeling useful",
    "I've been feeling relaxed",
    "I've been feeling interested in other people",
    "I've had energy to spare",
    "I've been dealing with problems well",
    "I've been thinking clearly",
    "I've been feeling good about myself",
    "I've been feeling close to other people",
    "I've been feeling confident",
    "I've been able to make up my own mind about things",
    "I've been feeling loved",
    "I've been interested in new things",
    "I've been feeling cheerful"
];

const SCALE_OPTIONS = [
    { value: 1, label: 'None of the time' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Some of the time' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'All of the time' }
];



export default function ThriveTrackerScreen() {
    const navigation = useNavigation();
    const startTimeRef = useRef<number | null>(null);

    // State
    const [currentStep, setCurrentStep] = useState<'intro' | 'questionnaire'>('intro');
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const getAuthToken = async () => {
        return await AsyncStorage.getItem('authToken');
    };

    const checkStatus = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/api/roadmap/thrive/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.completed) {
                    setAlreadySubmitted(true);
                }
            }
        } catch (error) {
            console.log('Status check failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        startTimeRef.current = Date.now();
        setCurrentStep('questionnaire');
    };

    const handleSelect = (questionIndex: number, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [`q${questionIndex + 1}`]: value
        }));
    };

    const getProgress = () => {
        const answeredCount = Object.keys(answers).length;
        return Math.round((answeredCount / WEMWBS_QUESTIONS.length) * 100);
    };

    const handleSubmit = async () => {
        // Validate all questions answered
        if (Object.keys(answers).length !== WEMWBS_QUESTIONS.length) {
            Alert.alert('Incomplete', 'Please answer all questions before submitting.');
            return;
        }

        setIsSubmitting(true);
        // Calculate duration if start time was set, otherwise default to 0
        const duration = startTimeRef.current
            ? Math.round((Date.now() - startTimeRef.current) / 1000)
            : 0;

        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/api/roadmap/thrive`, {
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

            setAlreadySubmitted(true);

        } catch (error: any) {
            console.error('Submit error:', error);
            Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Thrive Tracker</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Response Saved!</Text>
                    <Text style={styles.successText}>Thank you for tracking your wellbeing today.</Text>

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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Thrive Tracker</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
                    {/* Large SVG Illustration */}
                    <View style={styles.illustrationContainer}>
                        <ThriveIllustration width={width * 0.75} height={width * 0.75} />
                    </View>

                    {/* Title and Description */}
                    <Text style={styles.introTitle}>Mental Wellbeing</Text>
                    <Text style={styles.introSubtitle}>Warwick-Edinburgh Scale</Text>

                    <View style={styles.introCard}>
                        <View style={styles.introIconRow}>
                            <View style={styles.introIconCircle}>
                                <Ionicons name="analytics-outline" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.introCardTitle}>Instructions</Text>
                        </View>
                        <Text style={styles.introCardText}>
                            Below are some statements about feelings and thoughts. Please select the option that best describes your experience over the last 2 weeks.
                        </Text>
                    </View>

                    {/* Start Button */}
                    <TouchableOpacity
                        style={styles.goButton}
                        onPress={handleStart}
                    >
                        <Text style={styles.goButtonText}>Start Questionnaire</Text>
                        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // QUESTIONNAIRE SCREEN
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setCurrentStep('intro')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Questionnaire</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{getProgress()}%</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.instructionText}>
                    Select one of 'None of the time', 'Rarely', 'Some of the time', 'Often', 'All of the time'
                </Text>

                {WEMWBS_QUESTIONS.map((question, index) => (
                    <View key={index} style={styles.questionCard}>
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        <Text style={styles.questionText}>{question}</Text>

                        <View style={styles.optionsContainer}>
                            {SCALE_OPTIONS.map((option) => {
                                const isSelected = answers[`q${index + 1}`] === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.optionButtonSelected
                                        ]}
                                        onPress={() => handleSelect(index, option.value)}
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
                ))}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Questionnaire</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    progressBadge: {
        backgroundColor: Colors.primary || '#6366F1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    progressText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    instructionText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        lineHeight: 22,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    questionNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary || '#6366F1',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        marginBottom: 20,
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionButtonSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: Colors.primary || '#6366F1',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#94A3B8',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.primary || '#6366F1',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary || '#6366F1',
    },
    optionText: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
    },
    optionTextSelected: {
        color: '#1E293B',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: Colors.primary || '#6366F1',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.primary || '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#F8FAFC',
    },
    successIcon: {
        marginBottom: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    homeButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    homeButtonText: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '600',
    },
    // Intro Screen Styles
    introContent: {
        padding: 24,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 24,
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    introSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    introIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    introCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    introCardText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    goButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 12,
    },
    goButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});
