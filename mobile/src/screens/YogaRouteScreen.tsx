import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors } from '../constants/colors';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

interface YogaPose {
    name: string;
    sanskrit: string;
    duration: number; // in seconds
    instructions: string[];
    benefit: string;
    icon: string;
}

const YOGA_POSES: YogaPose[] = [
    {
        name: "Child's Pose",
        sanskrit: "Balasana",
        duration: 60,
        instructions: [
            "Kneel on the floor, touch your big toes together.",
            "Sit on your heels, then separate your knees about hip-width.",
            "Lay your torso down between your thighs.",
            "Stretch your arms forward with palms flat on the mat.",
            "Rest your forehead gently on the ground and breathe deeply."
        ],
        benefit: "Soothes the nervous system and gently releases tension in the back and shoulders.",
        icon: "leaf"
    },
    {
        name: "Cat-Cow Stretch",
        sanskrit: "Marjaryasana",
        duration: 60,
        instructions: [
            "Start on your hands and knees in a tabletop position.",
            "Inhale: Arch your back, drop your belly, and look up (Cow).",
            "Exhale: Round your spine up to the ceiling, pull chin to chest (Cat).",
            "Flow between the two poses following your breath rhythm."
        ],
        benefit: "Warms up the spine, improves posture, and coordinates breathing with movement.",
        icon: "repeat"
    },
    {
        name: "Downward Facing Dog",
        sanskrit: "Adho Mukha Svanasana",
        duration: 45,
        instructions: [
            "From tabletop, tuck your toes and lift your knees.",
            "Push your hips back and upward, straightening your legs.",
            "Press firmly through your palms, fingers spread wide.",
            "Keep your neck relaxed and gaze toward your toes.",
            "Pedal your heels down gently to stretch your calves."
        ],
        benefit: "Energizes the body, strengthens arms and shoulders, and stretches the hamstrings.",
        icon: "triangle"
    },
    {
        name: "Warrior II",
        sanskrit: "Virabhadrasana II",
        duration: 45,
        instructions: [
            "Stand with feet wide apart (about 3-4 feet).",
            "Turn your right foot out 90 degrees, left foot slightly in.",
            "Raise arms parallel to the floor, palms down.",
            "Bend your right knee, keeping it stacked directly over your ankle.",
            "Look out over your right fingers and breathe steadily."
        ],
        benefit: "Builds stamina, opens the chest and hips, and cultivates mental focus.",
        icon: "flash"
    },
    {
        name: "Corpse Pose",
        sanskrit: "Savasana",
        duration: 90,
        instructions: [
            "Lie flat on your back, feet relaxing open to the sides.",
            "Place arms slightly away from your body, palms facing up.",
            "Close your eyes, soften your jaw, and let your body feel heavy.",
            "Release all control over your breath.",
            "Observe the quiet stillness inside."
        ],
        benefit: "Triggers deep physical relaxation, calms the mind, and integrates the yoga practice.",
        icon: "sunny"
    }
];

export default function YogaRouteScreen() {
    const navigation = useNavigation();

    // Routine State
    const [screenState, setScreenState] = useState<'intro' | 'session' | 'complete'>('intro');
    const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timer
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Active Timer Hook
    useEffect(() => {
        if (isPlaying && secondsLeft > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        handlePoseFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, secondsLeft]);

    const handlePoseFinish = () => {
        setIsPlaying(false);
        triggerHaptic('success');

        // Check if last pose
        if (currentPoseIndex === YOGA_POSES.length - 1) {
            setScreenState('complete');
        }
    };

    const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
        try {
            if (type === 'light') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else if (type === 'medium') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else if (type === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            console.log('Haptics failed', e);
        }
    };

    const startRoutine = () => {
        triggerHaptic('medium');
        setCurrentPoseIndex(0);
        setSecondsLeft(YOGA_POSES[0].duration);
        setScreenState('session');
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        triggerHaptic('light');
        setIsPlaying(prev => !prev);
    };

    const handleNext = () => {
        triggerHaptic('light');
        if (currentPoseIndex < YOGA_POSES.length - 1) {
            const nextIndex = currentPoseIndex + 1;
            setCurrentPoseIndex(nextIndex);
            setSecondsLeft(YOGA_POSES[nextIndex].duration);
            setIsPlaying(true);
        } else {
            setScreenState('complete');
            triggerHaptic('success');
        }
    };

    const handlePrevious = () => {
        triggerHaptic('light');
        if (currentPoseIndex > 0) {
            const prevIndex = currentPoseIndex - 1;
            setCurrentPoseIndex(prevIndex);
            setSecondsLeft(YOGA_POSES[prevIndex].duration);
            setIsPlaying(true);
        }
    };

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    };

    // INTRO SCREEN
    if (screenState === 'intro') {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} />

                <SafeAreaView edges={['top']} style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yoga Flow</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>

                <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.illustrationContainer}>
                        <View style={styles.yogaIconCircle}>
                            <Ionicons name="body" size={72} color={Colors.primary} />
                        </View>
                    </View>

                    <Text style={styles.introTitle}>Mindful Yoga Route</Text>
                    <Text style={styles.introSubtitle}>5 Relaxing Poses • 5 Minutes</Text>

                    <View style={styles.introCard}>
                        <View style={styles.introIconRow}>
                            <View style={[styles.introIconCircle, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="options-outline" size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.introCardTitle}>Routine Outline</Text>
                        </View>
                        <Text style={styles.introCardText}>
                            A slow-paced, grounding routine. Focus on stretching, breathing, and tuning into body sensations. Suitable for all skill levels.
                        </Text>

                        <View style={styles.poseOutlineList}>
                            {YOGA_POSES.map((pose, i) => (
                                <View key={pose.name} style={styles.poseOutlineRow}>
                                    <Text style={styles.poseOutlineNum}>{i + 1}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.poseOutlineName}>{pose.name}</Text>
                                        <Text style={styles.poseOutlineSub}>{pose.sanskrit}</Text>
                                    </View>
                                    <Text style={styles.poseOutlineTime}>{pose.duration}s</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.goButton}
                        onPress={startRoutine}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.goButtonText}>Begin Flow</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // COMPLETE SCREEN
    if (screenState === 'complete') {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <LeavesDecoration width={width} height={width} />

                <SafeAreaView edges={['top']} style={styles.header}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.headerTitle}>Yoga Flow</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>

                <View style={styles.completeContent}>
                    <View style={styles.successIconOuter}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.completeTitle}>Routine Completed!</Text>
                    <Text style={styles.completeSubtitle}>You successfully completed today's Yoga Flow.</Text>

                    <View style={styles.summaryCard}>
                        <Ionicons name="heart" size={28} color="#FF7675" style={{ marginBottom: 8 }} />
                        <Text style={styles.summaryTitle}>Mindful Connection</Text>
                        <Text style={styles.summaryText}>
                            Integrating physical movement with mindful awareness is a powerful way to ground yourself in the present moment, release stored stress, and quiet the mind.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.completeHomeButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.completeHomeButtonText}>Back to Journey</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ACTIVE SESSION SCREEN
    const currentPose = YOGA_POSES[currentPoseIndex];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        triggerHaptic('light');
                        setScreenState('intro');
                    }}
                >
                    <Ionicons name="close" size={24} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Active Flow</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>Pose {currentPoseIndex + 1}/{YOGA_POSES.length}</Text>
                </View>
            </SafeAreaView>

            {/* Overall Routine Progress Line */}
            <View style={styles.progressWrapper}>
                <View style={styles.progressBarBg}>
                    <View style={[
                        styles.progressBarFill,
                        { width: `${((currentPoseIndex + 1) / YOGA_POSES.length) * 100}%` }
                    ]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.sessionContent} showsVerticalScrollIndicator={false}>

                {/* Pose Display Card */}
                <View style={styles.poseCard}>
                    <View style={styles.poseIconHeader}>
                        <View style={[styles.poseIconCircle, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name={currentPose.icon as any} size={28} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.poseNameText}>{currentPose.name}</Text>
                            <Text style={styles.poseSanskritText}>{currentPose.sanskrit}</Text>
                        </View>
                    </View>

                    {/* Active Timer Display */}
                    <View style={styles.timerDisplayContainer}>
                        <Text style={styles.timerCountdownText}>{formatTime(secondsLeft)}</Text>
                        <Text style={styles.timerStateLabel}>{isPlaying ? 'Hold the pose' : 'Paused'}</Text>
                    </View>

                    {/* Benefit Banner */}
                    <View style={styles.benefitContainer}>
                        <Ionicons name="sparkles-outline" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.benefitText}>{currentPose.benefit}</Text>
                    </View>
                </View>

                {/* Alignment Instructions */}
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsHeadingText}>Instructions</Text>
                    {currentPose.instructions.map((step, idx) => (
                        <View key={idx} style={styles.stepRow}>
                            <View style={styles.stepIndexCircle}>
                                <Text style={styles.stepIndexText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Controls */}
                <View style={styles.sessionControlsRow}>
                    {/* Previous Button */}
                    <TouchableOpacity
                        style={[
                            styles.controlNavBtn,
                            currentPoseIndex === 0 && styles.controlNavBtnDisabled
                        ]}
                        disabled={currentPoseIndex === 0}
                        onPress={handlePrevious}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="play-back" size={24} color={currentPoseIndex === 0 ? '#B2BEC3' : '#636E72'} />
                    </TouchableOpacity>

                    {/* Play/Pause Button */}
                    <TouchableOpacity
                        style={[
                            styles.playPauseBtn,
                            { backgroundColor: isPlaying ? '#FF7675' : Colors.primary }
                        ]}
                        onPress={handlePlayPause}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Next/Skip Button */}
                    <TouchableOpacity
                        style={styles.controlNavBtn}
                        onPress={handleNext}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="play-forward" size={24} color="#636E72" />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    progressBadge: {
        backgroundColor: '#E6F4EA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    progressWrapper: {
        paddingHorizontal: 24,
        marginTop: 4,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    introContent: {
        padding: 24,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    yogaIconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        textAlign: 'center',
        marginBottom: 6,
    },
    introSubtitle: {
        fontSize: 15,
        color: '#636E72',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 24,
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 32,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    introIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    introCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    introCardText: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
        marginBottom: 16,
    },
    poseOutlineList: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap: 12,
    },
    poseOutlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    poseOutlineNum: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        width: 20,
    },
    poseOutlineName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    poseOutlineSub: {
        fontSize: 12,
        color: '#94A3B8',
    },
    poseOutlineTime: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636E72',
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
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        gap: 10,
    },
    goButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sessionContent: {
        padding: 20,
        gap: 16,
    },
    poseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    poseIconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 16,
    },
    poseIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    poseNameText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
    },
    poseSanskritText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    timerDisplayContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    timerCountdownText: {
        fontSize: 64,
        fontWeight: '800',
        color: '#2D3436',
        letterSpacing: 2,
    },
    timerStateLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 1.5,
        color: Colors.primary,
        marginTop: 4,
    },
    benefitContainer: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        padding: 12,
        gap: 8,
    },
    benefitText: {
        fontSize: 13,
        color: '#2D3436',
        flex: 1,
        lineHeight: 18,
        fontWeight: '500',
    },
    instructionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
        gap: 12,
    },
    instructionsHeadingText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    stepIndexCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepIndexText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#636E72',
    },
    stepText: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
        lineHeight: 20,
        fontWeight: '500',
    },
    sessionControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginTop: 8,
    },
    controlNavBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    controlNavBtnDisabled: {
        backgroundColor: '#F1F5F9',
    },
    playPauseBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    completeContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    successIconOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
    },
    completeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 8,
        textAlign: 'center',
    },
    completeSubtitle: {
        fontSize: 15,
        color: '#636E72',
        textAlign: 'center',
        marginBottom: 32,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 36,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
        lineHeight: 22,
    },
    completeHomeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 36,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    completeHomeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
