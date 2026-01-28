import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../../constants/colors';
import { API_URL } from '../../config/api';
import { StressIcons, MoodIcons, SleepIcons, RelaxationIcons } from '../../components/EmotionIcons';

const { width } = Dimensions.get('window');

const PRACTICE_TYPES = [
    'Breathing Exercise',
    'Body Scan',
    'Walking Meditation',
    'Guided Meditation',
    'Mindful Movement',
    'Journaling',
    'Other'
];

const STRESS_FACTORS = [
    'Health', 'Sleep', 'Exercise', 'Food', 'Work',
    'Family', 'Friends', 'Money', 'Weather', 'Travel'
];

const SLEEP_TIMES = [
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
    '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM'
];

const WAKE_TIMES = [
    '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM',
    '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'
];

export default function DailySlidersScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Mindfulness practice state
    const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
    const [practiceDuration, setPracticeDuration] = useState('');
    const [selectedPractices, setSelectedPractices] = useState<string[]>([]);

    // Form state
    const [stressLevel, setStressLevel] = useState<number | null>(null);
    const [moodLevel, setMoodLevel] = useState<number | null>(null);
    const [sleepQuality, setSleepQuality] = useState<number | null>(null);
    const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
    const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
    const [sleepStart, setSleepStart] = useState<string | null>(null);
    const [wakeUp, setWakeUp] = useState<string | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkDailyStatus();
    }, []);

    const getAuthToken = async () => {
        return await AsyncStorage.getItem('authToken');
    };

    const checkDailyStatus = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/api/roadmap/daily/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.completed) {
                    setAlreadySubmitted(true); // Keep local state just in case, but redirect
                    navigation.replace('CompleteTask', {
                        title: 'Great Job Today!',
                        message: 'You have successfully done the Daily Task. See you tomorrow again!',
                        historyData: data.history
                    });
                }
            }
        } catch (error) {
            console.log('Status check failed, proceeding with form');
        } finally {
            setLoading(false);
        }
    };

    const toggleFactor = (factor: string) => {
        setSelectedFactors(prev =>
            prev.includes(factor)
                ? prev.filter(f => f !== factor)
                : [...prev, factor]
        );
    };

    const togglePractice = (practice: string) => {
        setSelectedPractices(prev =>
            prev.includes(practice)
                ? prev.filter(p => p !== practice)
                : [...prev, practice]
        );
    };

    const getCompletionProgress = () => {
        let completed = 0;
        let total = 7;

        if (mindfulnessPractice !== null) {
            if (mindfulnessPractice === 'no') {
                completed++;
            } else if (practiceDuration && selectedPractices.length > 0) {
                completed++;
            }
        }
        if (stressLevel !== null) completed++;
        if (moodLevel !== null) completed++;
        if (selectedFactors.length > 0) completed++;
        if (sleepStart && wakeUp) completed++;
        if (sleepQuality !== null) completed++;
        if (relaxationLevel !== null) completed++;

        return Math.round((completed / total) * 100);
    };

    const handleSubmit = async () => {
        if (mindfulnessPractice === null || stressLevel === null || moodLevel === null ||
            sleepQuality === null || selectedFactors.length === 0 || !sleepStart || !wakeUp) {
            Alert.alert('Incomplete', 'Please fill in all required fields');
            return;
        }

        if (mindfulnessPractice === 'yes' && (!practiceDuration || selectedPractices.length === 0)) {
            Alert.alert('Incomplete', 'Please enter practice duration and what you practiced');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await getAuthToken();

            if (!token) {
                Alert.alert('Session Expired', 'Please login again to continue.', [
                    {
                        text: 'OK', onPress: () => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        })
                    }
                ]);
                return;
            }

            const response = await fetch(`${API_URL}/api/roadmap/daily`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mindfulness_practice: mindfulnessPractice,
                    practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
                    practice_log: mindfulnessPractice === 'yes' ? selectedPractices.join(', ') : null,
                    stress_level: stressLevel,
                    mood: moodLevel,
                    sleep_quality: sleepQuality,
                    relaxation_level: relaxationLevel,
                    feelings: selectedFactors.join(','),
                    sleep_start_time: sleepStart,
                    wake_up_time: wakeUp
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Submission failed');
            }

            const data = await response.json();

            navigation.replace('CompleteTask', {
                title: 'Great Job Today!',
                message: 'You have successfully done the Daily Task. See you tomorrow again!',
                historyData: data.history
            });

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
                <View style={styles.loadingContainer}>
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
                    <Text style={styles.title}>Daily Sliders</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#64C59A" />
                    </View>
                    <Text style={styles.successTitle}>Great Job Today!</Text>
                    <Text style={styles.successText}>You've completed your daily entry.</Text>
                    <Text style={styles.successText}>See you tomorrow!</Text>

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Daily Sliders</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{getCompletionProgress()}%</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. Mindfulness Practice */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconCircle}>
                            <Ionicons name="flower-outline" size={24} color="#667eea" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Mindfulness Practice</Text>
                            <Text style={styles.sectionSubtitle}>Did you practice mindfulness today?</Text>
                        </View>
                    </View>
                    <View style={styles.yesNoRow}>
                        <TouchableOpacity
                            style={[
                                styles.yesNoButton,
                                mindfulnessPractice === 'yes' && styles.yesButtonSelected
                            ]}
                            onPress={() => setMindfulnessPractice('yes')}
                        >
                            <Ionicons
                                name={mindfulnessPractice === 'yes' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                size={24}
                                color={mindfulnessPractice === 'yes' ? '#FFFFFF' : '#64C59A'}
                            />
                            <Text style={[
                                styles.yesNoText,
                                mindfulnessPractice === 'yes' && styles.yesNoTextSelected
                            ]}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.yesNoButton,
                                mindfulnessPractice === 'no' && styles.noButtonSelected
                            ]}
                            onPress={() => setMindfulnessPractice('no')}
                        >
                            <Ionicons
                                name={mindfulnessPractice === 'no' ? 'close-circle' : 'close-circle-outline'}
                                size={24}
                                color={mindfulnessPractice === 'no' ? '#FFFFFF' : '#EF4444'}
                            />
                            <Text style={[
                                styles.yesNoText,
                                mindfulnessPractice === 'no' && styles.yesNoTextSelected
                            ]}>No</Text>
                        </TouchableOpacity>
                    </View>

                    {mindfulnessPractice === 'yes' && (
                        <View style={styles.practiceDetails}>
                            <Text style={styles.practiceLabel}>Duration (minutes)</Text>
                            <TextInput
                                style={styles.durationInput}
                                placeholder="e.g., 10"
                                placeholderTextColor="#94A3B8"
                                value={practiceDuration}
                                onChangeText={setPracticeDuration}
                                keyboardType="numeric"
                            />

                            <Text style={[styles.practiceLabel, { marginTop: 16 }]}>What did you practice?</Text>
                            <View style={styles.practiceGrid}>
                                {PRACTICE_TYPES.map((practice) => (
                                    <TouchableOpacity
                                        key={practice}
                                        style={[
                                            styles.practiceChip,
                                            selectedPractices.includes(practice) && styles.practiceChipSelected
                                        ]}
                                        onPress={() => togglePractice(practice)}
                                    >
                                        <Text style={[
                                            styles.practiceChipText,
                                            selectedPractices.includes(practice) && styles.practiceChipTextSelected
                                        ]}>
                                            {practice}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* 2. Stress Level */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="flash-outline" size={24} color="#EF4444" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Stress Level</Text>
                            <Text style={styles.sectionSubtitle}>How stressed do you feel? (1-5)</Text>
                        </View>
                    </View>
                    <View style={styles.emojiRow}>
                        {StressIcons.map((IconComponent, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.emojiButton,
                                    stressLevel === index + 1 && styles.emojiButtonSelected
                                ]}
                                onPress={() => setStressLevel(index + 1)}
                            >
                                <IconComponent size={36} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.scaleLabels}>
                        <Text style={styles.scaleText}>Low</Text>
                        <Text style={styles.scaleText}>High</Text>
                    </View>
                </View>

                {/* 3. Mood Level */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="happy-outline" size={24} color="#64C59A" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Mood Level</Text>
                            <Text style={styles.sectionSubtitle}>How is your mood today? (1-5)</Text>
                        </View>
                    </View>
                    <View style={styles.emojiRow}>
                        {MoodIcons.map((IconComponent, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.emojiButton,
                                    moodLevel === index + 1 && styles.emojiButtonSelected
                                ]}
                                onPress={() => setMoodLevel(index + 1)}
                            >
                                <IconComponent size={36} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.scaleLabels}>
                        <Text style={styles.scaleText}>Bad</Text>
                        <Text style={styles.scaleText}>Good</Text>
                    </View>
                </View>

                {/* 4. Influencing Factors */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="pricetag-outline" size={24} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Influencing Factors</Text>
                            <Text style={styles.sectionSubtitle}>What affected your mood today?</Text>
                        </View>
                    </View>
                    <View style={styles.factorsGrid}>
                        {STRESS_FACTORS.map((factor) => (
                            <TouchableOpacity
                                key={factor}
                                style={[
                                    styles.factorChip,
                                    selectedFactors.includes(factor) && styles.factorChipSelected
                                ]}
                                onPress={() => toggleFactor(factor)}
                            >
                                <Text style={[
                                    styles.factorText,
                                    selectedFactors.includes(factor) && styles.factorTextSelected
                                ]}>
                                    {factor}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 5. Sleep Schedule */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="time-outline" size={24} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Sleep Schedule</Text>
                            <Text style={styles.sectionSubtitle}>When did you sleep and wake up?</Text>
                        </View>
                    </View>

                    <Text style={styles.timeLabel}>Sleep Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                        {SLEEP_TIMES.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={[
                                    styles.timeChip,
                                    sleepStart === time && styles.timeChipSelected
                                ]}
                                onPress={() => setSleepStart(time)}
                            >
                                <Text style={[
                                    styles.timeChipText,
                                    sleepStart === time && styles.timeChipTextSelected
                                ]}>
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.timeLabel, { marginTop: 16 }]}>Wake Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                        {WAKE_TIMES.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={[
                                    styles.timeChip,
                                    wakeUp === time && styles.timeChipSelected
                                ]}
                                onPress={() => setWakeUp(time)}
                            >
                                <Text style={[
                                    styles.timeChipText,
                                    wakeUp === time && styles.timeChipTextSelected
                                ]}>
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 6. Sleep Quality */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="moon-outline" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Sleep Quality</Text>
                            <Text style={styles.sectionSubtitle}>How well did you sleep? (1-5)</Text>
                        </View>
                    </View>
                    <View style={styles.emojiRow}>
                        {SleepIcons.map((IconComponent, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.emojiButton,
                                    sleepQuality === index + 1 && styles.emojiButtonSelected
                                ]}
                                onPress={() => setSleepQuality(index + 1)}
                            >
                                <IconComponent size={36} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.scaleLabels}>
                        <Text style={styles.scaleText}>Poor</Text>
                        <Text style={styles.scaleText}>Great</Text>
                    </View>
                </View>

                {/* 7. This Week's Recording */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#FCE7F3' }]}>
                            <Ionicons name="headset-outline" size={24} color="#EC4899" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>This Week's Recording</Text>
                            <Text style={styles.sectionSubtitle}>Listen to today's guided session</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.recordingCard}>
                        <View style={styles.recordingIcon}>
                            <Ionicons name="play-circle" size={48} color={Colors.primary} />
                        </View>
                        <View style={styles.recordingInfo}>
                            <Text style={styles.recordingTitle}>Guided Breathing</Text>
                            <Text style={styles.recordingDuration}>10 min session</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* 8. Relaxation Level */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="leaf-outline" size={24} color="#059669" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Relaxation Level</Text>
                            <Text style={styles.sectionSubtitle}>How relaxed do you feel? (1-5)</Text>
                        </View>
                    </View>
                    <View style={styles.emojiRow}>
                        {RelaxationIcons.map((IconComponent, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.emojiButton,
                                    relaxationLevel === index + 1 && styles.emojiButtonSelected
                                ]}
                                onPress={() => setRelaxationLevel(index + 1)}
                            >
                                <IconComponent size={36} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.scaleLabels}>
                        <Text style={styles.scaleText}>Tense</Text>
                        <Text style={styles.scaleText}>Calm</Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Daily Check-in</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
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
        backgroundColor: Colors.primary,
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
    section: {
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    // Yes/No buttons
    yesNoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    yesNoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    yesButtonSelected: {
        backgroundColor: '#64C59A',
        borderColor: '#64C59A',
    },
    noButtonSelected: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    yesNoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    yesNoTextSelected: {
        color: '#FFFFFF',
    },
    // Practice details
    practiceDetails: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    practiceLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8,
    },
    durationInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    practiceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    practiceChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    practiceChipSelected: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    practiceChipText: {
        fontSize: 13,
        color: '#475569',
    },
    practiceChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    // Emoji buttons
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    emojiButton: {
        width: (width - 80) / 5 - 8,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiButtonSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    scaleText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    // Factors
    factorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    factorChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    factorChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    factorText: {
        fontSize: 13,
        color: '#475569',
    },
    factorTextSelected: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    // Time chips
    timeLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8,
    },
    timeScroll: {
        marginHorizontal: -4,
    },
    timeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timeChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    timeChipText: {
        fontSize: 13,
        color: '#475569',
    },
    timeChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    // Recording card
    recordingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recordingIcon: {
        marginRight: 16,
    },
    recordingInfo: {
        flex: 1,
    },
    recordingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    recordingDuration: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    // Submit
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
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
    // Success
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
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    successText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    homeButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        marginTop: 32,
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
