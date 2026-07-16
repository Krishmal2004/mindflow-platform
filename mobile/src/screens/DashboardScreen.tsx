import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { apiFetch } from '../lib/apiClient';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { JourneyIcons } from '../components/JourneyIcons';
import { PopupModal } from '../components/PopupModal';
import { LogoBlock } from '../components/LogoBlock';


const { width } = Dimensions.get('window');

const EgGroupImage = require('../../assets/egGroup.png') as number;
const CgGroupImage = require('../../assets/cgGroup.png') as number;

// Sampled directly from egGroup.png's own palette (most common non-white pixels),
// so the experimental-group (.ex) Dashboard accent visually matches its illustration
// instead of reusing the generic brand green.
const EG_BLUE = '#466FB5';       // mid blue — icon/illustration accent
const EG_BLUE_DARK = '#214081'; // deep navy — label/author text
const EG_BLUE_LIGHT = '#C4D2EC'; // pale blue — card border/tint

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList>;

// Circular progress indicator, Samsung Health-style — a plain track ring plus a colored
// progress arc drawn via strokeDasharray/strokeDashoffset around the same circle.
function ProgressRing({ size = 88, strokeWidth = 9, progress, color }: { size?: number; strokeWidth?: number; progress: number; color: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
    return (
        <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#EEF1EF" strokeWidth={strokeWidth} fill="none" />
            <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={color} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                rotation={-90}
                originX={size / 2}
                originY={size / 2}
            />
        </Svg>
    );
}

// Group illustration: a plain themed image per research arm, no decoration around it.
function BreathingIllustration({ isControlGroup }: { isControlGroup: boolean }) {
    return (
        <View style={styles.illustrationContainer}>
            <Image
                source={isControlGroup ? CgGroupImage : EgGroupImage}
                style={styles.groupIllustrationImage}
                resizeMode="contain"
            />
        </View>
    );
}

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
    { text: "Sharks are older than trees - they've been around for roughly 400 million years.", author: "Fun Fact" },
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
    { text: "Most of a cat's day - about 70% of its life — is spent sleeping.", author: "Fun Fact" },
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
                        backgroundColor: locked ? Colors.surfaceMuted : bgColor,
                        borderColor: locked ? '#CBD5E1' : color
                    }
                ]}>
                    {completed ? (
                        <Ionicons name="checkmark" size={id === 5 ? 30 : 26} color={Colors.surface} />
                    ) : locked ? (
                        <Ionicons name="lock-closed" size={id === 5 ? 24 : 20} color={Colors.textMuted} />
                    ) : (
                        <Icon width={id === 5 ? 32 : 28} height={id === 5 ? 32 : 28} color={color} />
                    )}
                </View>

                {/* Step Index Badge */}
                <View style={[
                    styles.stepNumberBadge,
                    { backgroundColor: locked ? Colors.textMuted : color }
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
                    backgroundColor: Colors.surface,
                    shadowColor: color,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 3,
                } : null,
                { alignItems: isRightNode ? 'flex-end' : 'flex-start' }
            ]}>
                <Text style={[
                    styles.nodeLabelText,
                    { color: locked ? Colors.iconMuted : color }
                ]}>
                    {title}
                </Text>
                <Text style={[
                    styles.nodeSubtext,
                    completed && { color: color, fontWeight: '700' },
                    locked && { color: Colors.textMuted }
                ]}>
                    {statusText}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function DashboardScreen() {
    const navigation = useNavigation<DashboardNavProp>();
    const insets = useSafeAreaInsets();

    const [userName, setUserName] = useState('User');
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [statuses, setStatuses] = useState<any>({});
    const [researchGroup, setResearchGroup] = useState('');
    const [summaryLoaded, setSummaryLoaded] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const mountFade = useRef(new Animated.Value(0)).current;
    const mountScale = useRef(new Animated.Value(0.96)).current;

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

        // All nodes locked until researcher assigns a group
        if (isUnassigned) {
            return (
                <RoadmapNode
                    key={step.id}
                    {...step}
                    completed={false}
                    locked={true}
                    nextReset={null}
                    isActive={false}
                    pulseAnim={pulseAnim}
                    top={top}
                    left={left}
                    right={right}
                    onPressLocked={() => {
                        setModalTitle('Group Not Yet Assigned');
                        setModalMessage('Your researcher has not assigned you to a study group yet.\n\nData entry will be available once your Research ID is set.\n\nIn the meantime, please complete your About Me profile.');
                        setModalVisible(true);
                    }}
                />
            );
        }

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
                    setSummaryLoaded(true);
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
        Animated.parallel([
            Animated.timing(mountFade, { toValue: 1, duration: 750, useNativeDriver: true }),
            Animated.timing(mountScale, { toValue: 1, duration: 750, useNativeDriver: true }),
        ]).start();
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
    const isUnassigned = summaryLoaded && researchGroup === '';
    const mapWidth = width - 48;
    const mapHeight = 520;
    const activeStepId = getActiveStepId();

    const completedCount = isUnassigned ? 0 : JOURNEY_STEPS.filter(s => getStatus(s.statusKey).completed).length;
    const journeyProgress = completedCount / JOURNEY_STEPS.length;

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
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top > 0 ? insets.top : 0 }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Header: logo block + premium greeting card ── */}
                <Animated.View style={[styles.header, { opacity: mountFade }]}>
                    <LogoBlock />

                    {/* Centered Hero Illustration & Greeting */}
                    <View style={styles.greetingHeaderBlock}>
                        <BreathingIllustration isControlGroup={isControlGroup} />
                        <Text style={styles.greetingText}>Hello, {userName}</Text>
                        <Text style={styles.questionText}>
                            {isUnassigned
                                ? <>Welcome to{'\n'}MindFlow</>
                                : isControlGroup
                                    ? <>What would you{'\n'}like to do today?</>
                                    : <>Ready for your{'\n'}mindful moment?</>}
                        </Text>
                    </View>
                </Animated.View>

                {/* Pending-assignment banner — shown only when no research group is set */}
                {isUnassigned && (
                    <View style={styles.pendingBanner}>
                        <View style={styles.pendingIconCircle}>
                            <Ionicons name="time-outline" size={22} color="#D97706" />
                        </View>
                        <View style={styles.pendingBannerBody}>
                            <Text style={styles.pendingBannerTitle}>Waiting for Group Assignment</Text>
                            <Text style={styles.pendingBannerSub}>
                                Your researcher will assign your study group shortly. Data entry is locked until then.
                            </Text>
                            <TouchableOpacity
                                style={styles.pendingAboutMeBtn}
                                onPress={() => navigation.navigate('AboutMe')}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="document-text-outline" size={14} color="#D97706" />
                                <Text style={styles.pendingAboutMeBtnText}>Complete About Me Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── Quote / Fun Fact card — minimal premium styling ── */}
                {!isUnassigned && (
                    <View style={[
                        styles.quoteCard,
                        isControlGroup ? styles.quoteCardControl : styles.quoteCardEx,
                    ]}>
                        <View style={styles.quoteHeader}>
                            <Ionicons
                                name={isControlGroup ? 'bulb-outline' : 'sparkles-outline'}
                                size={15}
                                color={isControlGroup ? '#D97706' : EG_BLUE}
                            />
                            <Text style={[
                                styles.quoteLabelText,
                                { color: isControlGroup ? '#B45309' : EG_BLUE_DARK }
                            ]}>
                                {isControlGroup ? 'Daily Fun Fact' : "Today's Inspiration"}
                            </Text>
                        </View>

                        {/* Animated quote / fact text */}
                        <Animated.View style={[styles.quoteBody, { opacity: fadeAnim }]}>
                            <Text style={styles.quoteText}>
                                {isControlGroup ? currentFact.text : `“${currentQuote.text}”`}
                            </Text>
                            <Text style={[
                                styles.quoteAuthor,
                                { color: isControlGroup ? '#B45309' : EG_BLUE_DARK }
                            ]}>
                                — {isControlGroup ? currentFact.author : currentQuote.author}
                            </Text>
                        </Animated.View>
                    </View>
                )}

                {/* Journey Section — restored progressRingHero + winding roadmap */}
                <View style={styles.roadmapSection}>
                    <Text style={styles.roadmapTitle}>YOUR JOURNEY</Text>
                    <Text style={styles.roadmapSubtitle}>Follow the path to mindfulness</Text>

                    <View style={styles.progressHero}>
                        <View style={styles.progressRingWrap}>
                            <ProgressRing progress={journeyProgress} color={Colors.primary} />
                            <View style={styles.progressRingCenter}>
                                <Text style={styles.progressRingValue}>{completedCount}/{JOURNEY_STEPS.length}</Text>
                            </View>
                        </View>
                        <View style={styles.progressHeroBody}>
                            <Text style={styles.progressHeroTitle}>
                                {completedCount === JOURNEY_STEPS.length ? 'All caught up' : 'Keep going'}
                            </Text>
                            <Text style={styles.progressHeroSubtitle}>
                                {isUnassigned
                                    ? 'Activities unlock once your group is assigned.'
                                    : completedCount === JOURNEY_STEPS.length
                                        ? 'You’ve completed every activity in its current window.'
                                        : `${JOURNEY_STEPS.length - completedCount} activit${JOURNEY_STEPS.length - completedCount === 1 ? 'y' : 'ies'} left to complete.`}
                            </Text>
                        </View>
                    </View>

                    {/* Winding Roadmap Pathway */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    pageDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
        alignItems: 'flex-end',
    },
    scrollContent: {
        paddingTop: 0,
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
        color: Colors.iconMuted,
        letterSpacing: 0.8,
        marginTop: 16,
        marginBottom: 6,
        textAlign: 'center',
    },
    greetingHeaderBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        marginBottom: 8,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        lineHeight: 30,
        letterSpacing: -0.4,
        textAlign: 'center',
    },
    illustrationContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    groupIllustrationImage: {
        width: 188,
        height: 138,
    },
    // ── Premium Quote / Fact Card ──
    quoteCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    quoteCardEx: {
        backgroundColor: '#FAFBFE',
        borderColor: EG_BLUE_LIGHT,
    },
    quoteCardControl: {
        backgroundColor: '#FCFAF6',
        borderColor: '#F7EAD0',
    },
    quoteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    quoteLabelText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    quoteBody: {
        marginTop: 2,
    },
    quoteText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#374151',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    quoteAuthor: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Roadmap Section
    roadmapSection: {
        marginBottom: 20,
    },
    roadmapTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#B0BFCA',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    roadmapSubtitle: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
        marginBottom: 16,
    },
    // Progress ring hero
    progressHero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#F1F8F4',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
    },
    progressRingWrap: {
        width: 88,
        height: 88,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    progressHeroBody: {
        flex: 1,
    },
    progressHeroTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 3,
    },
    progressHeroSubtitle: {
        fontSize: 12,
        color: Colors.iconMuted,
        lineHeight: 17,
    },
    // Map Container
    mapContainer: {
        position: 'relative',
        overflow: 'visible',
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
        backgroundColor: Colors.surface,
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
        borderColor: Colors.surface,
    },
    stepNumberText: {
        color: Colors.surface,
        fontSize: 9,
        fontWeight: 'bold',
    },
    nodeLabel: {
        backgroundColor: Colors.surface,
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
        backgroundColor: Colors.primaryTint,
    },
    nodeLabelLocked: {
        backgroundColor: '#F8FAFC',
        borderColor: Colors.borderLight,
        borderWidth: 1,
        opacity: 0.7,
    },
    nodeLabelActive: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
        backgroundColor: Colors.surface,
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
        color: Colors.textMuted,
        marginTop: 2,
    },
    // Pending-assignment banner
    pendingBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#FDE68A',
        padding: 16,
        marginBottom: 20,
        gap: 12,
        alignItems: 'flex-start',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    pendingIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    pendingBannerBody: {
        flex: 1,
        gap: 4,
    },
    pendingBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
    },
    pendingBannerSub: {
        fontSize: 12,
        color: '#B45309',
        lineHeight: 18,
    },
    pendingAboutMeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 8,
        backgroundColor: '#FEF3C7',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    pendingAboutMeBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
    },
});
