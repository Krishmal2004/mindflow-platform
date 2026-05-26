import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Animated,
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

type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'completed';

export default function BreathingInhalerScreen() {
    const navigation = useNavigation();

    // Breathing configuration: 4s inhale, 7s hold, 8s exhale
    const INHALE_DURATION = 4000;
    const HOLD_DURATION = 7000;
    const EXHALE_DURATION = 8000;
    const TOTAL_CYCLES = 4; // Standard set is 4 cycles

    // States
    const [phase, setPhase] = useState<BreathingPhase>('idle');
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(1);

    // Animation values
    const bubbleScale = useRef(new Animated.Value(1)).current;
    const instructionOpacity = useRef(new Animated.Value(1)).current;

    // Timer refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timers
    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, []);

    const clearTimers = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    // Trigger subtle haptics
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
            console.log('Haptics not available', e);
        }
    };

    // Control breathing cycle flow
    const runBreathingCycle = (cycleNum: number) => {
        if (cycleNum > TOTAL_CYCLES) {
            setPhase('completed');
            triggerHaptic('success');
            // Scale bubble back to normal
            Animated.spring(bubbleScale, {
                toValue: 1,
                tension: 40,
                friction: 8,
                useNativeDriver: true
            }).start();
            return;
        }

        setCurrentCycle(cycleNum);

        // PHASE 1: INHALE (4 seconds)
        setPhase('inhale');
        setSecondsLeft(4);
        triggerHaptic('medium');

        // Animate bubble growth
        Animated.timing(bubbleScale, {
            toValue: 2.2,
            duration: INHALE_DURATION,
            useNativeDriver: true
        }).start();

        // Start countdown
        startCountdown(4);

        // Queue HOLD
        timeoutRef.current = setTimeout(() => {
            // PHASE 2: HOLD (7 seconds)
            setPhase('hold');
            setSecondsLeft(7);
            triggerHaptic('medium');

            // Keep scale constant
            startCountdown(7);

            // Queue EXHALE
            timeoutRef.current = setTimeout(() => {
                // PHASE 3: EXHALE (8 seconds)
                setPhase('exhale');
                setSecondsLeft(8);
                triggerHaptic('light');

                // Animate bubble shrink
                Animated.timing(bubbleScale, {
                    toValue: 1,
                    duration: EXHALE_DURATION,
                    useNativeDriver: true
                }).start();

                startCountdown(8);

                // Queue NEXT CYCLE
                timeoutRef.current = setTimeout(() => {
                    runBreathingCycle(cycleNum + 1);
                }, EXHALE_DURATION);

            }, HOLD_DURATION);

        }, INHALE_DURATION);
    };

    const startCountdown = (durationSeconds: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        let countdown = durationSeconds;
        intervalRef.current = setInterval(() => {
            countdown -= 1;
            if (countdown >= 0) {
                setSecondsLeft(countdown);
            }
            if (countdown <= 0) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 1000);
    };

    const handleStart = () => {
        clearTimers();
        runBreathingCycle(1);
    };

    const handleStop = () => {
        clearTimers();
        setPhase('idle');
        setCurrentCycle(1);
        setSecondsLeft(0);
        Animated.spring(bubbleScale, {
            toValue: 1,
            useNativeDriver: true
        }).start();
    };

    // UI Helper variables
    const getInstructionText = () => {
        switch (phase) {
            case 'inhale':
                return 'Breathe in slowly...';
            case 'hold':
                return 'Hold your breath...';
            case 'exhale':
                return 'Exhale fully...';
            case 'completed':
                return 'Well done!';
            case 'idle':
            default:
                return 'Find a comfortable seat.';
        }
    };

    const getInstructionSubtext = () => {
        switch (phase) {
            case 'inhale':
                return 'Fill your lungs with clean energy';
            case 'hold':
                return 'Keep calm and feel the stillness';
            case 'exhale':
                return 'Release all stress and tension';
            case 'completed':
                return 'You completed the breathing cycle';
            case 'idle':
            default:
                return 'Tap Start to begin 4-7-8 breathing';
        }
    };

    const getPhaseColor = () => {
        switch (phase) {
            case 'inhale':
                return '#E0F2FE'; // Soft blue
            case 'hold':
                return '#EDE9FE'; // Soft purple
            case 'exhale':
                return '#E6F4EA'; // Soft green (success accent)
            default:
                return '#FFFFFF';
        }
    };

    const getPhaseBorderColor = () => {
        switch (phase) {
            case 'inhale':
                return '#0284C7';
            case 'hold':
                return '#8B5CF6';
            case 'exhale':
                return Colors.primary;
            default:
                return '#DFE6E9';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Breathing Guide</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            <View style={styles.content}>
                {phase !== 'idle' && phase !== 'completed' && (
                    <Text style={styles.cycleLabel}>Cycle {currentCycle} of {TOTAL_CYCLES}</Text>
                )}

                {/* Animated breathing bubble */}
                <View style={styles.bubbleOuterContainer}>
                    <Animated.View style={[
                        styles.breathingBubble,
                        {
                            transform: [{ scale: bubbleScale }],
                            backgroundColor: getPhaseColor(),
                            borderColor: getPhaseBorderColor()
                        }
                    ]}>
                        {phase !== 'idle' && phase !== 'completed' && (
                            <View style={styles.timerCircle}>
                                <Text style={styles.timerValueText}>{secondsLeft}</Text>
                                <Text style={styles.timerSecText}>sec</Text>
                            </View>
                        )}
                        {phase === 'idle' && (
                            <Ionicons name="flower-outline" size={48} color={Colors.primary} />
                        )}
                        {phase === 'completed' && (
                            <Ionicons name="checkmark-done" size={48} color={Colors.primary} />
                        )}
                    </Animated.View>
                </View>

                {/* Instruction texts */}
                <View style={styles.instructionContainer}>
                    <Text style={styles.phaseTitleText}>{getInstructionText()}</Text>
                    <Text style={styles.phaseSubtext}>{getInstructionSubtext()}</Text>
                </View>

                {/* Info Guide Card */}
                {phase === 'idle' && (
                    <View style={styles.guideCard}>
                        <View style={styles.guideRow}>
                            <View style={[styles.stepDot, { backgroundColor: '#0284C7' }]}><Text style={styles.stepNum}>4s</Text></View>
                            <Text style={styles.guideText}>Inhale through your nose</Text>
                        </View>
                        <View style={styles.guideRow}>
                            <View style={[styles.stepDot, { backgroundColor: '#8B5CF6' }]}><Text style={styles.stepNum}>7s</Text></View>
                            <Text style={styles.guideText}>Hold your breath comfortably</Text>
                        </View>
                        <View style={styles.guideRow}>
                            <View style={[styles.stepDot, { backgroundColor: Colors.primary }]}><Text style={styles.stepNum}>8s</Text></View>
                            <Text style={styles.guideText}>Exhale fully through mouth</Text>
                        </View>
                    </View>
                )}

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    {phase === 'idle' || phase === 'completed' ? (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStart}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.startButtonText}>
                                {phase === 'completed' ? 'Practice Again' : 'Start Session'}
                            </Text>
                            <Ionicons name="play" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.stopButton}
                            onPress={handleStop}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.stopButtonText}>Stop Exercise</Text>
                            <Ionicons name="square" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    cycleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    bubbleOuterContainer: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    breathingBubble: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    timerCircle: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerValueText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3436',
    },
    timerSecText: {
        fontSize: 10,
        color: '#636E72',
        fontWeight: '600',
    },
    instructionContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 80,
    },
    phaseTitleText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3436',
        textAlign: 'center',
        marginBottom: 8,
    },
    phaseSubtext: {
        fontSize: 15,
        color: '#636E72',
        textAlign: 'center',
        fontWeight: '500',
    },
    guideCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        gap: 12,
    },
    guideRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNum: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    guideText: {
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '600',
    },
    controlsContainer: {
        width: '100%',
        alignItems: 'center',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 36,
        borderRadius: 30,
        width: '100%',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF7675',
        paddingVertical: 18,
        paddingHorizontal: 36,
        borderRadius: 30,
        width: '100%',
        shadowColor: '#FF7675',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    stopButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
