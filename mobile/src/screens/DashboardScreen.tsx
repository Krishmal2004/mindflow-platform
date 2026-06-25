import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { apiFetch } from '../lib/apiClient';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { JourneyIcons } from '../components/JourneyIcons';
import { PopupModal } from '../components/PopupModal';
import { QuoteIcon } from '../components/DashboardIllustrations';

const { width } = Dimensions.get('window');

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList>;

// Mindfulness quotes
const MINDFULNESS_QUOTES = [
    { text: "Breathe in peace, breathe out stress.", author: "Unknown" },
    { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
    { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn" },
    { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
    { text: "Be where you are, not where you think you should be.", author: "Unknown" },
    { text: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle" },
    { text: "You can't stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
    { text: "Wherever you are, be there totally.", author: "Eckhart Tolle" },
    { text: "Smile, breathe, and go slowly.", author: "Thich Nhat Hanh" },
    { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
    { text: "Mindfulness isn't difficult, we just need to remember to do it.", author: "Sharon Salzberg" },
    { text: "The little things? The little moments? They aren't little.", author: "Jon Kabat-Zinn" },
    { text: "Each morning we are born again. What we do today is what matters most.", author: "Buddha" },
    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
    { text: "Nothing ever exists entirely alone; everything is in relation to everything else.", author: "Buddha" },
    { text: "Your breath is your anchor to the present moment.", author: "Unknown" },
    { text: "Letting go gives us freedom, and freedom is the only condition for happiness.", author: "Thich Nhat Hanh" },
    { text: "Self-compassion is simply giving the same kindness to ourselves that we would give to others.", author: "Christopher Germer" },
];

// Non-mindfulness trivia for the control group (.cg) — kept separate from MINDFULNESS_QUOTES
// since that group's dashboard must not show mindfulness-themed content.
const FUN_FACTS = [
    { text: "Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible.", author: "Fun Fact" },
    { text: "Octopuses have three hearts and blue blood.", author: "Fun Fact" },
    { text: "A bolt of lightning is about five times hotter than the surface of the sun.", author: "Fun Fact" },
    { text: "Bananas are berries, but strawberries technically aren't.", author: "Fun Fact" },
    { text: "The Eiffel Tower can grow more than 6 inches taller in summer due to heat expansion.", author: "Fun Fact" },
    { text: "There are more stars in the universe than grains of sand on every beach on Earth.", author: "Fun Fact" },
    { text: "A group of flamingos is called a 'flamboyance'.", author: "Fun Fact" },
    { text: "The shortest war in history lasted just 38 minutes.", author: "Fun Fact" },
    { text: "Sharks are older than trees — they've been around for roughly 400 million years.", author: "Fun Fact" },
    { text: "Wombat poop is cube-shaped.", author: "Fun Fact" },
    { text: "The Great Wall of China isn't actually visible from space with the naked eye.", author: "Fun Fact" },
    { text: "A single fluffy cloud can weigh more than a million pounds.", author: "Fun Fact" },
    { text: "Sea otters hold hands while sleeping so they don't drift apart.", author: "Fun Fact" },
    { text: "One species of jellyfish can effectively live forever.", author: "Fun Fact" },
    { text: "Venus is the only planet in our solar system that spins clockwise.", author: "Fun Fact" },
    { text: "A day on Venus is longer than its entire year.", author: "Fun Fact" },
    { text: "Cows form close friendships and get stressed when separated from their best friend.", author: "Fun Fact" },
    { text: "The unicorn is Scotland's national animal.", author: "Fun Fact" },
    { text: "Butterflies can taste with their wings.", author: "Fun Fact" },
    { text: "Most of a cat's day — about 70% of its life — is spent sleeping.", author: "Fun Fact" },
];

// Roadmap steps configuration
const JOURNEY_STEPS = [
    { id: 1, title: 'Daily Sliders', subtitle: 'Daily check-in (Resets 12 AM)', route: 'DailySliders', Icon: JourneyIcons.Sun, color: '#D97706', bgColor: '#FFFBEB', statusKey: 'daily' },
    { id: 2, title: 'Weekly Whispers', subtitle: 'Weekly voice journal (Once a week)', route: 'WeeklyWhispers', Icon: JourneyIcons.Microphone, color: '#6366F1', bgColor: '#EEF2FF', statusKey: 'weekly' },
    { id: 3, title: 'Thrive Tracker', subtitle: 'Wellbeing tracker (Last 2 weeks)', route: 'ThriveTracker', Icon: JourneyIcons.Chart, color: '#749F82', bgColor: '#E6F4EA', statusKey: 'thrive' },
    { id: 4, title: 'Stress Snapshot', subtitle: 'Perceived stress (Last 1 month)', route: 'StressSnapshot', Icon: JourneyIcons.StressCamera, color: '#E07A5F', bgColor: '#FFF4F2', statusKey: 'stress' },
    { id: 5, title: 'Mindful Mirror', subtitle: 'Mindfulness check (Last 1 month)', route: 'MindfulMirror', Icon: JourneyIcons.Mirror, color: '#0D9488', bgColor: '#F0FDFA', statusKey: 'mindful' },
];

interface RoadmapNodeProps {
    id: number;
    title: string;
    subtitle: string;
    route: string;
    Icon: any;
    color: string;
    bgColor: string;
    completed: boolean;
    locked: boolean;
    nextReset: Date | null;
    isActive: boolean;
    pulseAnim: Animated.Value;
    top: number;
    left?: number;
    right?: number;
    onPressLocked?: (isTimeLocked: boolean, nextReset: Date | null) => void;
}

const RoadmapNode = ({
    id,
    title,
    subtitle,
    route,
    Icon,
    color,
    bgColor,
    completed,
    locked,
    nextReset,
    isActive,
    pulseAnim,
    top,
    left,
    right,
    onPressLocked,
}: RoadmapNodeProps) => {
    const navigation = useNavigation<DashboardNavProp>();
    
    let statusText = subtitle;
    if (completed) {
        if (id === 1) {
            statusText = 'Next: Tomorrow';
        } else if (id === 2 && nextReset) {
            statusText = `Next: ${nextReset.toLocaleDateString(undefined, { weekday: 'short' })}`;
        } else if (id > 2 && nextReset) {
            statusText = `Next: ${nextReset.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        } else {
            statusText = 'Completed';
        }
    } else if (locked) {
        statusText = 'Locked';
    }

    const handlePress = () => {
        if (!locked) {
            navigation.navigate(route as any);
        } else if (onPressLocked) {
            onPressLocked(completed, nextReset);
        }
    };

    const isRightNode = right !== undefined;

    return (
        <TouchableOpacity
            style={[
                styles.mapNode,
                { top },
                isRightNode ? { right } : { left },
                { flexDirection: isRightNode ? 'row-reverse' : 'row' }
            ]}
            onPress={handlePress}
            activeOpacity={locked ? 0.8 : 0.7}
        >
            {/* Circle Badge Wrapper */}
            <View style={styles.circleWrapper}>
                {isActive && !completed && (
                    <Animated.View style={[
                        styles.pulseCircle,
                        {
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseAnim.interpolate({
                                inputRange: [1, 1.2],
                                outputRange: [0.4, 0]
                            }),
                            borderColor: color,
                        }
                    ]} />
                )}
                
                <View style={[
                    styles.nodeCircle,
                    id === 5 && styles.nodeCircleLarge,
                    completed ? {
                        backgroundColor: color,
                        borderColor: color,
                        shadowColor: color,
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        borderWidth: 0,
                    } : {
                        backgroundColor: locked ? '#F1F5F9' : bgColor,
                        borderColor: locked ? '#CBD5E1' : color
                    }
                ]}>
                    {completed ? (
                        <Ionicons name="checkmark" size={id === 5 ? 30 : 26} color="#FFFFFF" />
                    ) : locked ? (
                        <Ionicons name="lock-closed" size={id === 5 ? 24 : 20} color="#94A3B8" />
                    ) : (
                        <Icon width={id === 5 ? 32 : 28} height={id === 5 ? 32 : 28} color={color} />
                    )}
                </View>
                
                {/* Step Index Badge */}
                <View style={[
                    styles.stepNumberBadge,
                    { backgroundColor: locked ? '#94A3B8' : color }
                ]}>
                    <Text style={styles.stepNumberText}>{id}</Text>
                </View>
            </View>

            {/* Glassmorphic Label Info */}
            <View style={[
                styles.nodeLabel,
                completed ? {
                    borderWidth: 1,
                    borderColor: color,
                    backgroundColor: bgColor,
                } : (locked ? styles.nodeLabelLocked : null),
                isActive && !completed ? {
                    borderColor: color,
                    borderWidth: 1.5,
                    backgroundColor: '#FFFFFF',
                    shadowColor: color,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 3,
                } : null,
                { alignItems: isRightNode ? 'flex-end' : 'flex-start' }
            ]}>
                <Text style={[
                    styles.nodeLabelText,
                    { color: locked ? '#64748B' : color }
                ]}>
                    {title}
                </Text>
                <Text style={[
                    styles.nodeSubtext,
                    completed && { color: color, fontWeight: '700' },
                    locked && { color: '#94A3B8' }
                ]}>
                    {statusText}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function DashboardScreen() {
    const [userName, setUserName] = useState('User');
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [statuses, setStatuses] = useState<any>({});
    const [researchGroup, setResearchGroup] = useState('');
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const getStatus = (key: string) => {
        const s = statuses[key];
        if (!s) return { completed: false, locked: false, nextReset: null };

        const now = new Date();
        const nextReset = s.nextReset ? new Date(s.nextReset) : null;
        const locked = s.completed && nextReset && nextReset > now;

        return { completed: s.completed, locked, nextReset };
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const handleNodeLockedPress = (nodeTitle: string, isTimeLocked: boolean, nextReset: Date | null) => {
        if (isTimeLocked && nextReset) {
            const timeString = nextReset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = nextReset.toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const isTomorrow = nextReset.toDateString() === tomorrow.toDateString();
            const dateText = isTomorrow ? 'Tomorrow' : `on ${dateString}`;
            
            setModalTitle('Session Completed');
            setModalMessage(
                `You have completed ${nodeTitle}!\n\nIt will unlock again ${dateText} at ${timeString}.\n\nThank you!`
            );
        } else {
            // Sequence locked
            const nextStep = JOURNEY_STEPS.find(step => step.id === activeStepId);
            const completedSteps = JOURNEY_STEPS.filter(step => step.id < activeStepId).map(step => step.title);
            
            let completedText = '';
            if (completedSteps.length === 0) {
                completedText = 'no sessions yet';
            } else if (completedSteps.length === 1) {
                completedText = completedSteps[0];
            } else {
                completedText = completedSteps.slice(0, -1).join(', ') + ' and ' + completedSteps[completedSteps.length - 1];
            }
            
            const nextText = nextStep ? nextStep.title : 'all steps';
            setModalTitle('Session Locked');
            setModalMessage(
                `You have completed ${completedText}.\n\nNext, you have ${nextText} to complete.\n\nThank you!`
            );
        }
        setModalVisible(true);
    };

    const renderNode = (stepIndex: number, top: number, left?: number, right?: number) => {
        const step = JOURNEY_STEPS[stepIndex];
        const status = getStatus(step.statusKey);
        
        // Sequence lock: locked if the first incomplete step is before this one
        const isSequenceLocked = activeStepId > 0 && step.id > activeStepId;
        const isNodeLocked = status.locked || isSequenceLocked;
        
        return (
            <RoadmapNode
                key={step.id}
                {...step}
                {...status}
                locked={isNodeLocked}
                isActive={activeStepId === step.id}
                pulseAnim={pulseAnim}
                top={top}
                left={left}
                right={right}
                onPressLocked={(timeLocked, reset) => handleNodeLockedPress(step.title, timeLocked, reset)}
            />
        );
    };

    useFocusEffect(
        useCallback(() => {
            const checkStatuses = async () => {
                try {
                    const [statusRes, summaryRes] = await Promise.all([
                        apiFetch<Record<string, { completed: boolean; nextReset?: string }>>('/api/journey/status'),
                        apiFetch<{ group: string }>('/api/dashboard/summary'),
                    ]);
                    if (statusRes.ok && statusRes.data) setStatuses(statusRes.data);
                    if (summaryRes.ok && summaryRes.data) setResearchGroup(summaryRes.data.group || '');
                } catch (error) {
                    console.log('Dashboard status check failed:', error);
                }
            };
            checkStatuses();
        }, [])
    );

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedName = await AsyncStorage.getItem('userName');
                if (storedName) {
                    setUserName(storedName);
                }
            } catch {
                // ignore
            }
        };
        loadUser();
        registerForPushNotificationsAsync();
    }, []);

    // Pulsing active node ring
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1.0,
                    duration: 1200,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    // Rotate quotes/facts every 20 seconds (whichever card is showing for this group)
    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % MINDFULNESS_QUOTES.length);
                setCurrentFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    // Get index of the first incomplete step
    const getActiveStepId = () => {
        for (let i = 0; i < JOURNEY_STEPS.length; i++) {
            const status = getStatus(JOURNEY_STEPS[i].statusKey);
            if (!status.completed) {
                return JOURNEY_STEPS[i].id;
            }
        }
        return 0; // all completed
    };

    const currentQuote = MINDFULNESS_QUOTES[currentQuoteIndex];
    const currentFact = FUN_FACTS[currentFactIndex];
    const isControlGroup = researchGroup === 'cg';
    const mapWidth = width - 48;
    const mapHeight = 520;
    const activeStepId = getActiveStepId();

    // Exact center coordinates calculation for the connecting path
    const cx1 = mapWidth - 52;
    const cy1 = 62;

    const cx2 = 52;
    const cy2 = 162;

    const cx3 = mapWidth - 52;
    const cy3 = 262;

    const cx4 = 52;
    const cy4 = 362;

    const cx5 = mapWidth - 52;
    const cy5 = 462;

    const pathD = `M ${cx1} ${cy1} ` +
                  `C ${mapWidth * 0.4} ${cy1}, ${mapWidth * 0.6} ${cy2}, ${cx2} ${cy2} ` +
                  `C ${mapWidth * 0.6} ${cy2}, ${mapWidth * 0.4} ${cy3}, ${cx3} ${cy3} ` +
                  `C ${mapWidth * 0.4} ${cy3}, ${mapWidth * 0.6} ${cy4}, ${cx4} ${cy4} ` +
                  `C ${mapWidth * 0.6} ${cy4}, ${mapWidth * 0.4} ${cy5}, ${cx5} ${cy5}`;

    return (
        <LinearGradient
            colors={['#F0FDF4', '#F8FAFC', '#FFFFFF']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar style="dark" />

            {/* Top Leaves Decoration */}
            <View style={styles.topDecoration}>
                <LeavesDecoration width={width} height={width} color={Colors.primary} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greetingText}>HELLO, {userName.toUpperCase()} !</Text>
                    <Text style={styles.questionText}>
                        {isControlGroup ? <>WHAT WOULD YOU{'\n'}LIKE TO DO?</> : <>READY FOR YOUR{'\n'}MINDFUL MOMENT?</>}
                    </Text>
                </View>

                {/* Daily Thoughts card: mindfulness quotes for the experimental group,
                    non-mindfulness fun facts (in orange) for the control group (.cg) — this
                    group must not see mindfulness-themed content. */}
                {isControlGroup ? (
                    <View style={styles.thoughtsCard}>
                        <LinearGradient
                            colors={['#D9A675', '#C2875A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.thoughtsGradient}
                        >
                            <View style={styles.quoteIconContainer}>
                                <QuoteIcon size={28} color="rgba(255,255,255,0.3)" />
                            </View>
                            <Animated.View style={[styles.thoughtsContent, { opacity: fadeAnim }]}>
                                <Text style={styles.thoughtsText}>{currentFact.text}</Text>
                                <Text style={styles.thoughtsAuthor}>— {currentFact.author}</Text>
                            </Animated.View>
                            <View style={styles.thoughtsIndicator}>
                                {FUN_FACTS.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            index === currentFactIndex && styles.dotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </LinearGradient>
                    </View>
                ) : (
                    <View style={styles.thoughtsCard}>
                        <LinearGradient
                            colors={['#94BCA1', '#749F82']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.thoughtsGradient}
                        >
                            <View style={styles.quoteIconContainer}>
                                <QuoteIcon size={28} color="rgba(255,255,255,0.3)" />
                            </View>
                            <Animated.View style={[styles.thoughtsContent, { opacity: fadeAnim }]}>
                                <Text style={styles.thoughtsText}>&quot;{currentQuote.text}&quot;</Text>
                                <Text style={styles.thoughtsAuthor}>— {currentQuote.author}</Text>
                            </Animated.View>
                            <View style={styles.thoughtsIndicator}>
                                {MINDFULNESS_QUOTES.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            index === currentQuoteIndex && styles.dotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Journey Roadmap Section - Vertical Curved Map */}
                <View style={styles.roadmapSection}>
                    <View style={styles.roadmapHeader}>
                        <Text style={styles.roadmapTitle}>YOUR JOURNEY</Text>
                        <Text style={styles.roadmapSubtitle}>Follow the path to mindfulness</Text>
                    </View>

                    <View style={[styles.mapContainer, { height: mapHeight }]}>
                        {/* SVG Path Background */}
                        <Svg
                            width={mapWidth}
                            height={mapHeight}
                            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                            style={styles.mapSvg}
                        >
                            <Defs>
                                <SvgLinearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#D97706" stopOpacity="0.8" />
                                    <Stop offset="0.25" stopColor="#6366F1" stopOpacity="0.8" />
                                    <Stop offset="0.5" stopColor="#749F82" stopOpacity="0.8" />
                                    <Stop offset="0.75" stopColor="#E07A5F" stopOpacity="0.8" />
                                    <Stop offset="1" stopColor="#0D9488" stopOpacity="0.8" />
                                </SvgLinearGradient>
                            </Defs>
                            
                            {/* Curved background glow path */}
                            <Path
                                d={pathD}
                                stroke="url(#pathGrad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                opacity="0.12"
                                fill="none"
                            />
                            
                            {/* Curved connecting path connecting all nodes */}
                            <Path
                                d={pathD}
                                stroke="url(#pathGrad)"
                                strokeWidth="3.5"
                                fill="none"
                                strokeDasharray="8 6"
                                strokeLinecap="round"
                            />
                        </Svg>

                        {renderNode(0, 30, undefined, 24)}
                        {renderNode(1, 130, 24)}
                        {renderNode(2, 230, undefined, 24)}
                        {renderNode(3, 330, 24)}
                        {renderNode(4, 430, undefined, 24)}
                    </View>
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={{ height: 100 }} />

            </ScrollView>

            <PopupModal
                visible={modalVisible}
                type="info"
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topDecoration: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 0,
    },
    scrollContent: {
        paddingTop: 80,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        zIndex: 1,
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        lineHeight: 34,
    },
    // Mindfulness Thoughts
    thoughtsCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#749F82',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    thoughtsGradient: {
        padding: 24,
        minHeight: 150,
    },
    quoteIconContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    thoughtsContent: {
        flex: 1,
        justifyContent: 'center',
    },
    thoughtsText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontStyle: 'italic',
        lineHeight: 24,
        marginBottom: 12,
    },
    thoughtsAuthor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    thoughtsIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 18,
    },
    // Roadmap Section
    roadmapSection: {
        marginBottom: 20,
    },
    roadmapHeader: {
        marginBottom: 16,
    },
    roadmapTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    roadmapSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    // Map Container
    mapContainer: {
        position: 'relative',
        borderRadius: 24,
        overflow: 'visible',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    mapSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    // Map Nodes
    mapNode: {
        position: 'absolute',
        alignItems: 'center',
        gap: 12,
    },
    circleWrapper: {
        position: 'relative',
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseCircle: {
        position: 'absolute',
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        backgroundColor: 'transparent',
    },
    nodeCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: '#FFFFFF',
    },
    nodeCircleCompleted: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        borderWidth: 0,
    },
    nodeCircleLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    stepNumberBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    nodeLabel: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        minWidth: 120,
    },
    nodeLabelCompleted: {
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: '#E6F4EA',
    },
    nodeLabelLocked: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        opacity: 0.7,
    },
    nodeLabelActive: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
        shadowColor: Colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    nodeLabelText: {
        fontSize: 13,
        fontWeight: '700',
    },
    nodeSubtext: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 2,
    },
});
