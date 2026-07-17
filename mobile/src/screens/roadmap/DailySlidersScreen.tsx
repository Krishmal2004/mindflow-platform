import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';

import { Colors as GlobalColors } from '../../constants/colors';
import { API_URL } from '../../config/api';
import { apiFetch, clearApiCache, getAuthToken } from '../../lib/apiClient';
import { StressIcons, SleepIcons, RelaxationIcons } from '../../components/EmotionIcons';
import { PopupModal } from '../../components/PopupModal';
import { LeavesDecoration } from '../../components/LeavesDecoration';
const Colors = {
    ...GlobalColors,
    primary: '#D97706',
};
const THEME_BG = '#FFFBEB';

const { width } = Dimensions.get('window');

// Fixed 16:9 height for the full-bleed player — doesn't grow/shrink on play so the step layout never jumps.
const VIDEO_HEIGHT = Math.round((width * 9) / 16);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const PRACTICE_LOCATIONS = [
    'At University',
    'Outside University'
];

export const INFLUENCING_FACTORS = [
    {
        label: "Education",
        covers: "Exams, deadlines, lectures, grades, studying.",
        theory: "Performance-related affect."
    },
    {
        label: "Personal",
        covers: "Friends, family, romantic partners, job/work, health, energy level, hobbies, self-care, or unexplained mood.",
        theory: "Interpersonal, occupational, and self-related affect."
    },
    {
        label: "Environment",
        covers: "Weather, noise, living space, commute, crowding, safety.",
        theory: "Contextual stressor impact."
    }
];

const SLEEP_TIMES = [
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM', '3:00 AM', '3:30 AM', '4:00 AM'
];

const WATCH_SYNC_INTERVAL_SECONDS = 5;

const formatWatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const WAKE_TIMES = [
    '2:00 AM', '2:30 AM', '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'
];

// Local (not UTC) day key, scoping this client-side draft to "today" from the participant's own perspective, distinct from the backend's UTC entry_date boundary.
const DAILY_DRAFT_KEY = 'dailySlidersDraft';
const todayDraftKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function DailySlidersScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Wizard navigation state
    const [currentStep, setCurrentStep] = useState(0); // 0 = Calm(before)/Stress/Factor, 1 = Sleep, 2 = Video, 3 = Practice, 4 = Calm(after)

    // Mindfulness practice state
    const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
    const [practiceDuration, setPracticeDuration] = useState('');
    const [practiceLocation, setPracticeLocation] = useState<string | null>(null);

    // Video state
    const [weeklyVideoId, setWeeklyVideoId] = useState<string | null>(null);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [userGroup, setUserGroup] = useState<string>('');
    const unsyncedSecondsRef = useRef(0);

    // Form state
    const [stressLevel, setStressLevel] = useState<number | null>(null);
    const [calmBefore, setCalmBefore] = useState<number | null>(null);
    const [calmAfter, setCalmAfter] = useState<number | null>(null);
    const [sleepQuality, setSleepQuality] = useState<number | null>(null);
    const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
    const [sleepStart, setSleepStart] = useState<string | null>(null);
    const [wakeUp, setWakeUp] = useState<string | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    // Guards the draft-persist effect below from firing before restoreDraft() has run once on mount.
    const [draftRestored, setDraftRestored] = useState(false);

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
        checkDailyStatus();
        fetchWeeklyVideo();
        restoreDraft();
    }, []);

    // Restores whatever was last saved for today, so a backgrounded/killed app mid-wizard doesn't lose everything answered so far.
    const restoreDraft = async () => {
        try {
            const raw = await AsyncStorage.getItem(DAILY_DRAFT_KEY);
            if (raw) {
                const draft = JSON.parse(raw);
                if (draft.dateKey === todayDraftKey()) {
                    if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
                    if (draft.mindfulnessPractice !== undefined) setMindfulnessPractice(draft.mindfulnessPractice);
                    if (draft.practiceDuration !== undefined) setPracticeDuration(draft.practiceDuration);
                    if (draft.practiceLocation !== undefined) setPracticeLocation(draft.practiceLocation);
                    if (draft.stressLevel !== undefined) setStressLevel(draft.stressLevel);
                    if (draft.calmBefore !== undefined) setCalmBefore(draft.calmBefore);
                    if (draft.calmAfter !== undefined) setCalmAfter(draft.calmAfter);
                    if (draft.sleepQuality !== undefined) setSleepQuality(draft.sleepQuality);
                    if (draft.selectedFactor !== undefined) setSelectedFactor(draft.selectedFactor);
                    if (draft.sleepStart !== undefined) setSleepStart(draft.sleepStart);
                    if (draft.wakeUp !== undefined) setWakeUp(draft.wakeUp);
                } else {
                    // Stale draft from a previous day — today's entry is a fresh form.
                    await AsyncStorage.removeItem(DAILY_DRAFT_KEY);
                }
            }
        } catch (error) {
            console.log('Failed to restore daily check-in draft', error);
        } finally {
            setDraftRestored(true);
        }
    };

    // Exiting via the header close button discards whatever's been entered so far — draft
    // resume is only meant to survive an accidental app close/kill, not an intentional exit.
    // Navigates first so the screen unmounts (cancelling the debounced draft-save timer)
    // before the draft is cleared, or that timer could re-write it right after removal.
    const handleBack = () => {
        navigation.goBack();
        AsyncStorage.removeItem(DAILY_DRAFT_KEY).catch(error => {
            console.log('Failed to clear daily check-in draft', error);
        });
    };

    const fetchWeeklyVideo = async () => {
        try {
            const { ok, data } = await apiFetch<{ youtube_id?: string }>('/api/roadmap/weekly/video');
            if (ok && data?.youtube_id) {
                setWeeklyVideoId(data.youtube_id);
            }
        } catch (error) {
            console.log('Failed to fetch weekly video', error);
        }
    };

    const checkDailyStatus = async () => {
        try {
            const { ok, data } = await apiFetch<{ group?: string; completed?: boolean; videoPlaySeconds?: number }>('/api/roadmap/daily/status');

            if (ok && data) {
                if (data.group) {
                    setUserGroup(data.group);
                }
                if (data.completed) {
                    await AsyncStorage.removeItem(DAILY_DRAFT_KEY);
                    navigation.replace('CompleteTask', {
                        title: 'Great Job Today!',
                        message: 'You have successfully done the Daily Task. See you tomorrow again!',
                        isDaily: true,
                        themeColor: Colors.primary,
                        themeBgGrad: [THEME_BG, '#FFF9F0', '#FFFFFF']
                    });
                } else if (data.videoPlaySeconds) {
                    setWatchedSeconds(data.videoPlaySeconds);
                }
            }
        } catch {
            console.log('Status check failed, proceeding with form');
            // Fail closed: if we can't confirm the research group, treat this session as
            // control-group rather than leaving it at '' (which every `=== 'cg'` gate below
            // treats as experimental) — the alternative risks showing and submitting real
            // mindfulness-practice answers for a participant we can't actually confirm is .ex.
            setUserGroup('cg');
        } finally {
            setLoading(false);
        }
    };

    const flushWatchProgress = async (seconds: number) => {
        if (seconds <= 0) return;
        try {
            const token = await getAuthToken();
            if (!token) return;
            await fetch(`${API_URL}/api/roadmap/daily/video-progress`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ seconds })
            });
        } catch (error) {
            console.log('Failed to sync video progress', error);
        }
    };

    // Tracks watch time only while the video step is visible and actively playing; flushes to the backend every few seconds so a closed app loses little progress.
    useEffect(() => {
        if (currentStep !== 2 || !weeklyVideoId || !isVideoPlaying) return;

        const interval = setInterval(() => {
            setWatchedSeconds(prev => prev + 1);
            unsyncedSecondsRef.current += 1;
            if (unsyncedSecondsRef.current >= WATCH_SYNC_INTERVAL_SECONDS) {
                const toSync = unsyncedSecondsRef.current;
                unsyncedSecondsRef.current = 0;
                flushWatchProgress(toSync);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (unsyncedSecondsRef.current > 0) {
                const toSync = unsyncedSecondsRef.current;
                unsyncedSecondsRef.current = 0;
                flushWatchProgress(toSync);
            }
        };
    }, [currentStep, weeklyVideoId, isVideoPlaying]);

    // Debounced draft save, skipped until restoreDraft() has run once so it can't clobber a just-restored draft with blank state.
    useEffect(() => {
        if (!draftRestored) return;
        const draft = {
            dateKey: todayDraftKey(),
            currentStep,
            mindfulnessPractice,
            practiceDuration,
            practiceLocation,
            stressLevel,
            calmBefore,
            calmAfter,
            sleepQuality,
            selectedFactor,
            sleepStart,
            wakeUp,
        };
        const t = setTimeout(() => {
            AsyncStorage.setItem(DAILY_DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
        }, 300);
        return () => clearTimeout(t);
    }, [
        draftRestored, currentStep, mindfulnessPractice, practiceDuration, practiceLocation,
        stressLevel, calmBefore, calmAfter, sleepQuality, selectedFactor, sleepStart, wakeUp,
    ]);

    const handleVideoStateChange = (state: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsVideoPlaying(state === 'playing');
    };

    const handleVideoError = (error: string) => {
        setIsVideoPlaying(false);
        console.log('YouTube player error', error);
        const videoType = userGroup === 'cg' ? 'weekly watch' : 'guided session';
        showPopup('error', 'Video Unavailable', `This ${videoType} video can't be played right now. You can skip ahead to the sliders.`);
    };

    const toggleFactor = (factor: string) => {
        setSelectedFactor(prev => prev === factor ? null : factor);
    };

    // Check if the current step is valid to proceed
    const isStepValid = () => {
        switch (currentStep) {
            case 0:
                return calmBefore !== null && stressLevel !== null && selectedFactor !== null;
            case 1:
                return sleepStart !== null && wakeUp !== null && sleepQuality !== null;
            case 2:
                // Watch time is tracked for analytics only; the user is not required to watch before continuing.
                return true;
            case 3:
                if (mindfulnessPractice === null) return false;
                if (mindfulnessPractice === 'yes') {
                    return practiceDuration.trim() !== '' && parseInt(practiceDuration, 10) >= 5 && practiceLocation !== null;
                }
                return true;
            case 4:
                return calmAfter !== null;
            default:
                return false;
        }
    };

    const getStepDisplayNumber = () => {
        if (userGroup === 'cg') {
            if (currentStep === 0) return 1;
            if (currentStep === 1) return 2;
            if (currentStep === 2) return 3;
            if (currentStep === 4) return 4;
        }
        return currentStep + 1;
    };

    const getStepTotalCount = () => {
        return userGroup === 'cg' ? 4 : 5;
    };

    const getCompletionProgress = () => {
        let completed = 0;
        const total = userGroup === 'cg' ? 6 : 7;

        if (userGroup !== 'cg' && mindfulnessPractice !== null) {
            if (mindfulnessPractice === 'no') {
                completed++;
            } else if (practiceDuration && practiceLocation !== null) {
                completed++;
            }
        }
        if (stressLevel !== null) completed++;
        if (calmBefore !== null) completed++;
        if (selectedFactor) completed++;
        if (sleepStart && wakeUp) completed++;
        if (sleepQuality !== null) completed++;
        if (calmAfter !== null) completed++;

        return Math.round((completed / total) * 100);
    };

    const handleSubmit = async () => {
        if (!isStepValid()) {
            showPopup('warning', 'Incomplete', 'Please fill in all fields on this screen to complete your check-in.');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await getAuthToken();

            if (!token) {
                showPopup('error', 'Session Expired', 'Please login again to continue.', () => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                });
                return;
            }

            const response = await fetch(`${API_URL}/api/roadmap/daily`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mindfulness_practice: userGroup === 'cg' ? null : mindfulnessPractice,
                    practice_duration: userGroup === 'cg' ? null : (mindfulnessPractice === 'yes' ? parseInt(practiceDuration, 10) : null),
                    practice_location: userGroup === 'cg' ? null : (mindfulnessPractice === 'yes' ? practiceLocation : null),
                    stress_level: stressLevel,
                    calm_before: calmBefore,
                    calm_after: calmAfter,
                    sleep_quality: sleepQuality,
                    feelings: selectedFactor,
                    sleep_start_time: sleepStart,
                    wake_up_time: wakeUp
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Submission failed');
            }

            await AsyncStorage.removeItem(DAILY_DRAFT_KEY);
            clearApiCache('/api/roadmap/daily');
            clearApiCache('/api/journey');

            navigation.replace('CompleteTask', {
                title: 'Great Job Today!',
                message: 'You have successfully done the Daily Task. See you tomorrow again!',
                isDaily: true,
                themeColor: Colors.primary,
                themeBgGrad: [THEME_BG, '#FFF9F0', '#FFFFFF']
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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const nextStep = () => {
        if (isStepValid()) {
            if (currentStep === 2 && userGroup === 'cg') {
                setCurrentStep(4); // Skip step 3 (practice) for control group
            } else {
                setCurrentStep(prev => Math.min(prev + 1, 4));
            }
        } else {
            showPopup('warning', 'Incomplete Section', 'Please answer the current questions before moving forward.');
        }
    };

    const prevStep = () => {
        if (currentStep === 4 && userGroup === 'cg') {
            setCurrentStep(2); // Skip step 3 (practice) going backward
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <PopupModal
                visible={popup.visible}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onClose={hidePopup}
                onConfirm={popup.onConfirm}
                themeColor={Colors.primary}
            />

            {/* Background leaves */}
            <LeavesDecoration width={width} height={width} color={Colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Daily Check-in</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{getCompletionProgress()}%</Text>
                </View>
            </View>

            {/* Step Progress Line */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.round((getStepDisplayNumber() / getStepTotalCount()) * 100)}%` }]} />
                </View>
                <Text style={styles.stepIndicator}>Step {getStepDisplayNumber()} of {getStepTotalCount()}</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* STEP 0: Calm (Before), Stress Level & Primary Influencing Factor */}
                {currentStep === 0 && (
                    <View style={styles.wizardCard}>
                        {/* Calm (before) */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: THEME_BG }]}>
                                    <Ionicons name="leaf-outline" size={24} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Right now I feel calm</Text>
                                    <Text style={styles.sectionSubtitle}>Select the response that best matches how much you agree</Text>
                                </View>
                            </View>

                            <View style={styles.emojiRow}>
                                {RelaxationIcons.map((IconComponent, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.emojiButton,
                                            calmBefore === index + 1 && styles.emojiButtonSelected
                                        ]}
                                        onPress={() => setCalmBefore(index + 1)}
                                        activeOpacity={0.7}
                                    >
                                        <IconComponent size={36} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.scaleLabels}>
                                <Text style={styles.scaleText}>Strongly Disagree (1)</Text>
                                <Text style={styles.scaleText}>Strongly Agree (5)</Text>
                            </View>
                        </View>

                        {/* Stress */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="flash-outline" size={24} color="#EF4444" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Stress Level</Text>
                                    <Text style={styles.sectionSubtitle}>Select the emoji that matches your stress level today</Text>
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
                                        activeOpacity={0.7}
                                    >
                                        <IconComponent size={36} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.scaleLabels}>
                                <Text style={styles.scaleText}>Peaceful (1)</Text>
                                <Text style={styles.scaleText}>Highly Stressed (5)</Text>
                            </View>
                        </View>

                        {/* Factor */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="pricetag-outline" size={24} color="#F59E0B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Primary Influencing Factor</Text>
                                    <Text style={styles.sectionSubtitle}>Select the single factor that mostly affected your mood today</Text>
                                </View>
                            </View>

                            <View style={{ gap: 10 }}>
                                {INFLUENCING_FACTORS.map((item) => {
                                    const isSelected = selectedFactor === item.label;
                                    return (
                                        <TouchableOpacity
                                            key={item.label}
                                            style={[
                                                styles.factorChip,
                                                isSelected && styles.factorChipSelected
                                            ]}
                                            onPress={() => toggleFactor(item.label)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <Text style={[
                                                    styles.factorText,
                                                    isSelected && styles.factorTextSelected
                                                ]}>
                                                    {item.label}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                                )}
                                            </View>
                                            <Text style={[styles.factorDesc, isSelected && styles.factorDescSelected]}>
                                                {item.covers}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 1: Sleep Schedule */}
                {currentStep === 1 && (
                    <View style={styles.wizardCard}>
                        {/* Sleep quality */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                                    <Ionicons name="moon-outline" size={24} color="#3B82F6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Sleep Quality</Text>
                                    <Text style={styles.sectionSubtitle}>Rate the quality of your sleep last night</Text>
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
                                        activeOpacity={0.7}
                                    >
                                        <IconComponent size={36} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.scaleLabels}>
                                <Text style={styles.scaleText}>Restless (1)</Text>
                                <Text style={styles.scaleText}>Refreshed (5)</Text>
                            </View>
                        </View>

                        {/* Sleep Times */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: THEME_BG }]}>
                                    <Ionicons name="time-outline" size={24} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Sleep Schedule</Text>
                                    <Text style={styles.sectionSubtitle}>Select your approximate sleep and wake times</Text>
                                </View>
                            </View>

                            <Text style={styles.timeSectionLabel}>Approximate bedtime</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll} contentContainerStyle={{ paddingVertical: 4 }}>
                                {SLEEP_TIMES.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        style={[
                                            styles.timeChip,
                                            sleepStart === time && styles.timeChipSelected
                                        ]}
                                        onPress={() => setSleepStart(time)}
                                        activeOpacity={0.7}
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

                            <Text style={[styles.timeSectionLabel, { marginTop: 16 }]}>Approximate wake time</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll} contentContainerStyle={{ paddingVertical: 4 }}>
                                {WAKE_TIMES.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        style={[
                                            styles.timeChip,
                                            wakeUp === time && styles.timeChipSelected
                                        ]}
                                        onPress={() => setWakeUp(time)}
                                        activeOpacity={0.7}
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
                    </View>
                )}

                {/* STEP 2: Guided Video Session */}
                {currentStep === 2 && (
                    <View style={styles.wizardCard}>
                        {weeklyVideoId && (
                            <View style={[styles.videoWrapper, { height: VIDEO_HEIGHT }]}>
                                <YoutubePlayer
                                    height={VIDEO_HEIGHT}
                                    videoId={weeklyVideoId}
                                    play={isVideoPlaying}
                                    onChangeState={handleVideoStateChange}
                                    onError={handleVideoError}
                                    webViewProps={{
                                        allowsInlineMediaPlayback: true,
                                        mediaPlaybackRequiresUserAction: false,
                                    }}
                                />
                            </View>
                        )}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: THEME_BG }]}>
                                    <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>{userGroup === 'cg' ? 'Weekly Watch' : 'Guided Session'}</Text>
                                    <Text style={styles.sectionSubtitle}>
                                        {userGroup === 'cg'
                                            ? "Take a moment to watch today's weekly video"
                                            : "Take a moment to listen to today's audio guide"}
                                    </Text>
                                </View>
                            </View>

                            {!weeklyVideoId && (
                                <View style={styles.recordingCard}>
                                    <View style={styles.recordingIcon}>
                                        <Ionicons name="headset" size={48} color="#CBD5E1" />
                                    </View>
                                    <View style={styles.recordingInfo}>
                                        <Text style={styles.recordingTitle}>
                                            {userGroup === 'cg' ? 'No weekly watch today' : 'No guided session today'}
                                        </Text>
                                        <Text style={styles.recordingDuration}>You can skip directly to sliders</Text>
                                    </View>
                                </View>
                            )}
                            {weeklyVideoId && (
                                <Text style={styles.watchProgressText}>
                                    {watchedSeconds === 0 && !isVideoPlaying
                                        ? userGroup === 'cg'
                                            ? "Press play above to start today's weekly watch"
                                            : "Press play above to start today's guided session"
                                        : userGroup === 'cg'
                                            ? `Watching weekly watch — ${formatWatchTime(watchedSeconds)} watched`
                                            : `Watching guided session — ${formatWatchTime(watchedSeconds)} watched`}
                                </Text>
                            )}
                            <Text style={styles.stepTip}>
                                {userGroup === 'cg'
                                    ? 'Tip: You can watch the weekly video first, then tap next to begin your mindfulness practice.'
                                    : 'Tip: You can watch the session video first, then tap next to begin your mindfulness practice.'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* STEP 3: Mindfulness Practice */}
                {currentStep === 3 && (
                    <View style={styles.wizardCard}>
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: '#E0E7FF' }]}>
                                    <Ionicons name="flower-outline" size={24} color="#6366F1" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Mindfulness Practice</Text>
                                    <Text style={styles.sectionSubtitle}>Did you spend time practicing mindfulness today?</Text>
                                </View>
                            </View>

                            <View style={styles.yesNoRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.yesNoButton,
                                        mindfulnessPractice === 'yes' && styles.yesButtonSelected
                                    ]}
                                    onPress={() => setMindfulnessPractice('yes')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={mindfulnessPractice === 'yes' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                        size={22}
                                        color={mindfulnessPractice === 'yes' ? '#FFFFFF' : Colors.primary}
                                    />
                                    <Text style={[
                                        styles.yesNoText,
                                        mindfulnessPractice === 'yes' && styles.yesNoTextSelected
                                    ]}>Yes, I did</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.yesNoButton,
                                        mindfulnessPractice === 'no' && styles.noButtonSelected
                                    ]}
                                    onPress={() => setMindfulnessPractice('no')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={mindfulnessPractice === 'no' ? 'close-circle' : 'close-circle-outline'}
                                        size={22}
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
                                    <Text style={styles.practiceLabel}>Practice Duration (minutes)</Text>
                                    <TextInput
                                        style={styles.durationInput}
                                        placeholder="Min. 5 minutes (e.g. 15)"
                                        placeholderTextColor="#94A3B8"
                                        value={practiceDuration}
                                        onChangeText={setPracticeDuration}
                                        keyboardType="numeric"
                                        returnKeyType="done"
                                    />

                                    <Text style={[styles.practiceLabel, { marginTop: 20 }]}>Where did you practice?</Text>
                                    <View style={styles.practiceGrid}>
                                        {PRACTICE_LOCATIONS.map((location) => {
                                            const isSelected = practiceLocation === location;
                                            return (
                                                <TouchableOpacity
                                                    key={location}
                                                    style={[
                                                        styles.practiceChip,
                                                        isSelected && styles.practiceChipSelected
                                                    ]}
                                                    onPress={() => setPracticeLocation(location)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[
                                                        styles.practiceChipText,
                                                        isSelected && styles.practiceChipTextSelected
                                                    ]}>
                                                        {location}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* STEP 4: Calm (After) */}
                {currentStep === 4 && (
                    <View style={styles.wizardCard}>
                        {/* Calm (after) */}
                        <View style={styles.samsungPanel}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconCircle, { backgroundColor: THEME_BG }]}>
                                    <Ionicons name="leaf-outline" size={24} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Right now I feel calm</Text>
                                    <Text style={styles.sectionSubtitle}>Select the response that best matches how much you agree</Text>
                                </View>
                            </View>

                            <View style={styles.emojiRow}>
                                {RelaxationIcons.map((IconComponent, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.emojiButton,
                                            calmAfter === index + 1 && styles.emojiButtonSelected
                                        ]}
                                        onPress={() => setCalmAfter(index + 1)}
                                        activeOpacity={0.7}
                                    >
                                        <IconComponent size={36} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.scaleLabels}>
                                <Text style={styles.scaleText}>Strongly Disagree (1)</Text>
                                <Text style={styles.scaleText}>Strongly Agree (5)</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Navigation Controls inside Wizard */}
                <View style={styles.navigationRow}>
                    {currentStep > 0 ? (
                        <TouchableOpacity
                            style={styles.backStepButton}
                            onPress={prevStep}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
                            <Text style={styles.backStepButtonText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}

                    {currentStep < 4 ? (
                        <TouchableOpacity
                            style={[
                                styles.nextStepButton,
                                !isStepValid() && styles.nextStepButtonDisabled
                            ]}
                            onPress={nextStep}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.nextStepButtonText}>Next Step</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.submitStepButton,
                                (isSubmitting || !isStepValid()) && styles.submitStepButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !isStepValid()}
                            activeOpacity={0.7}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitStepButtonText}>Finish & Save</Text>
                                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9', // Soft cream backdrop
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
    progressBarContainer: {
        paddingHorizontal: 24,
        marginBottom: 12,
        alignItems: 'center',
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
    stepIndicator: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 6,
    },
    content: {
        padding: 20,
    },
    wizardCard: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        minHeight: 300,
    },
    samsungPanel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        lineHeight: 16,
    },
    yesNoRow: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 10,
    },
    yesNoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30, // Premium rounded pill
        backgroundColor: '#F1F5F9',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    yesButtonSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    noButtonSelected: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    yesNoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    yesNoTextSelected: {
        color: '#FFFFFF',
    },
    practiceDetails: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    practiceLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    durationInput: {
        backgroundColor: '#F6F8F9',
        borderRadius: 30, // Consistent rounded styling
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D3436',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    practiceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    practiceChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 30, // Rounded pill
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    practiceChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    practiceChipText: {
        fontSize: 13,
        color: '#475569',
    },
    practiceChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    emojiButton: {
        width: (width - 88) / 5 - 6,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F8F9',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiButtonSelected: {
        backgroundColor: THEME_BG,
        borderColor: Colors.primary,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    scaleText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    factorChip: {
        width: '100%',
        padding: 16,
        backgroundColor: '#F6F8F9',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    factorChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    factorText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
    },
    factorTextSelected: {
        color: '#FFFFFF',
    },
    factorDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    factorDescSelected: {
        color: '#E6F4EA',
    },
    timeSectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    timeScroll: {
        marginHorizontal: -4,
    },
    timeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 30, // Rounded pill
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
        fontWeight: '600',
    },
    // Bleeds past `content`'s 20px padding so the player runs edge-to-edge — wider and more
    // immersive than a boxed-in card — with square corners to match the bleed, sitting above
    // the info card rather than inside it.
    videoWrapper: {
        marginHorizontal: -20,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    recordingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F8F9',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: 16,
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
        color: '#2D3436',
    },
    recordingDuration: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    watchProgressText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    stepTip: {
        fontSize: 11,
        fontStyle: 'italic',
        color: '#94A3B8',
        lineHeight: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    navigationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    backStepButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30, // Matching corner radius
        borderWidth: 1.5,
        borderColor: '#DFE6E9',
        backgroundColor: '#FFFFFF',
    },
    backStepButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#636E72',
    },
    nextStepButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30, // Consistent with primary button style
        backgroundColor: Colors.primary,
    },
    nextStepButtonDisabled: {
        backgroundColor: '#DFE6E9',
        opacity: 0.7,
    },
    nextStepButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    submitStepButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        backgroundColor: Colors.primary, // Sage green highlight
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    submitStepButtonDisabled: {
        backgroundColor: '#DFE6E9',
        opacity: 0.7,
    },
    submitStepButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
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
