import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { API_URL } from '../config/api';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { JourneyIcons } from '../components/JourneyIcons';
import {
    YogaSmall,
    QuoteIcon,
    BreathingCircles,
} from '../components/DashboardIllustrations';

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
];

// Roadmap steps configuration
const JOURNEY_STEPS = [
    { id: 1, title: 'Daily Sliders', subtitle: 'Track your mood', route: 'DailySliders', Icon: JourneyIcons.Sun, color: '#F59E0B', bgColor: '#FEF3C7' },
    { id: 2, title: 'Weekly Whispers', subtitle: 'Reflect weekly', route: 'WeeklyWhispers', Icon: JourneyIcons.Microphone, color: '#8B5CF6', bgColor: '#EDE9FE' },
    { id: 3, title: 'Thrive Tracker', subtitle: 'Monitor growth', route: 'ThriveTracker', Icon: JourneyIcons.Chart, color: '#10B981', bgColor: '#D1FAE5' },
    { id: 4, title: 'Stress Snapshot', subtitle: 'Capture stress', route: 'StressSnapshot', Icon: JourneyIcons.StressCamera, color: '#EF4444', bgColor: '#FEE2E2' },
    { id: 5, title: 'Mindful Mirror', subtitle: 'Self-reflection', route: 'MindfulMirror', Icon: JourneyIcons.Mirror, color: '#6366F1', bgColor: '#E0E7FF' },
];

export default function DashboardScreen() {
    const navigation = useNavigation<DashboardNavProp>();
    const [userName, setUserName] = useState('Anna');
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [dailyCompleted, setDailyCompleted] = useState(false);
    const [weeklyCompleted, setWeeklyCompleted] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useFocusEffect(
        useCallback(() => {
            const checkStatuses = async () => {
                try {
                    const token = await AsyncStorage.getItem('authToken');
                    if (!token) return;

                    // Check Daily
                    const dailyRes = await fetch(`${API_URL}/api/roadmap/daily/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (dailyRes.ok) {
                        const data = await dailyRes.json();
                        setDailyCompleted(data.completed || data.submitted);
                    }

                    // Check Weekly
                    const weeklyRes = await fetch(`${API_URL}/api/roadmap/weekly/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (weeklyRes.ok) {
                        const data = await weeklyRes.json();
                        setWeeklyCompleted(data.completed || data.submitted);
                    }

                } catch (error) {
                    console.log('Dashboard status check failed');
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
            } catch (e) {
                // ignore
            }
        };
        loadUser();
    }, []);

    // Rotate quotes every 20 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % MINDFULNESS_QUOTES.length);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    const currentQuote = MINDFULNESS_QUOTES[currentQuoteIndex];
    const mapWidth = width - 48;
    const mapHeight = 520;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Top Leaves Decoration */}
            <View style={styles.topDecoration}>
                <LeavesDecoration width={200} height={200} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greetingText}>HELLO, {userName.toUpperCase()} !</Text>
                    <Text style={styles.questionText}>WHAT WOULD YOU{'\n'}LIKE TO DO?</Text>
                </View>

                {/* Daily Mindfulness Thoughts */}
                <View style={styles.thoughtsCard}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.thoughtsGradient}
                    >
                        <View style={styles.quoteIconContainer}>
                            <QuoteIcon size={28} color="rgba(255,255,255,0.3)" />
                        </View>
                        <Animated.View style={[styles.thoughtsContent, { opacity: fadeAnim }]}>
                            <Text style={styles.thoughtsText}>"{currentQuote.text}"</Text>
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

                {/* Mindfulness Sessions */}
                <View style={styles.sectionHeader}>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>MINDFULNESS SESSIONS</Text>
                    </View>
                </View>

                {/* Large Cards */}
                <View style={styles.largeCardsContainer}>
                    {/* Meditation Card */}
                    <TouchableOpacity
                        style={[styles.largeCard, { backgroundColor: '#E3F2FD' }]}
                        onPress={() => navigation.navigate('BreathingInhaler' as any)}
                    >
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>MEDITATION</Text>
                            <Text style={styles.cardSubtitle}>Breathing Exercises</Text>
                            <Text style={styles.cardDescription}>
                                Focus on your breath. Calm your mind. Find inner peace through guided breathing.
                            </Text>
                            <Text style={styles.cardMeta}>5 exercises | 5-10 min</Text>
                        </View>
                        <View style={styles.cardImageContainer}>
                            <BreathingCircles size={90} />
                        </View>
                    </TouchableOpacity>

                    {/* Yoga Card */}
                    <TouchableOpacity
                        style={[styles.largeCard, { backgroundColor: '#F3E5F5' }]}
                        onPress={() => navigation.navigate('YogaRoute' as any)}
                    >
                        <View style={styles.cardImageContainer}>
                            <YogaSmall width={90} height={90} />
                        </View>
                        <View style={[styles.cardTextContainer, { alignItems: 'flex-end' }]}>
                            <Text style={styles.cardTitle}>YOGA</Text>
                            <Text style={styles.cardSubtitle}>Daily Motivation</Text>
                            <Text style={[styles.cardDescription, { textAlign: 'right' }]}>
                                Stretch your body. Energize your mind. Start the day refreshed.
                            </Text>
                            <Text style={styles.cardMeta}>Daily yoga routines</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Journey Roadmap Section - Vertical Map */}
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
                                    <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.4" />
                                    <Stop offset="0.25" stopColor="#8B5CF6" stopOpacity="0.4" />
                                    <Stop offset="0.5" stopColor="#10B981" stopOpacity="0.4" />
                                    <Stop offset="0.75" stopColor="#EF4444" stopOpacity="0.4" />
                                    <Stop offset="1" stopColor="#6366F1" stopOpacity="0.4" />
                                </SvgLinearGradient>
                            </Defs>
                            {/* Curved path connecting all nodes */}
                            <Path
                                d={`M ${mapWidth * 0.75} 50 
                                   C ${mapWidth * 0.9} 100, ${mapWidth * 0.1} 120, ${mapWidth * 0.25} 150
                                   C ${mapWidth * 0.4} 180, ${mapWidth * 0.9} 200, ${mapWidth * 0.75} 250
                                   C ${mapWidth * 0.6} 300, ${mapWidth * 0.1} 300, ${mapWidth * 0.25} 350
                                   C ${mapWidth * 0.4} 400, ${mapWidth * 0.85} 420, ${mapWidth * 0.75} 470`}
                                stroke="url(#pathGrad)"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="8 6"
                                strokeLinecap="round"
                            />
                        </Svg>

                        {/* Node 1: Daily Sliders (Top Right) */}
                        <TouchableOpacity
                            style={[styles.mapNode, { top: 20, right: 20 }]}
                            onPress={() => navigation.navigate('DailySliders')}
                        >
                            <View style={[
                                styles.nodeCircle,
                                {
                                    backgroundColor: dailyCompleted ? '#D1FAE5' : JOURNEY_STEPS[0].bgColor,
                                    borderColor: dailyCompleted ? '#64C59A' : JOURNEY_STEPS[0].color
                                }
                            ]}>
                                {dailyCompleted ? (
                                    <Ionicons name="checkmark" size={28} color="#64C59A" />
                                ) : (
                                    <JourneyIcons.Sun width={28} height={28} color={JOURNEY_STEPS[0].color} />
                                )}
                            </View>
                            <View style={styles.nodeLabel}>
                                <Text style={[
                                    styles.nodeLabelText,
                                    { color: dailyCompleted ? '#64C59A' : JOURNEY_STEPS[0].color }
                                ]}>
                                    Daily Sliders
                                </Text>
                                <Text style={[
                                    styles.nodeSubtext,
                                    dailyCompleted && { color: '#64C59A', fontWeight: '600' }
                                ]}>
                                    {dailyCompleted ? 'Completed' : 'Track mood'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Node 2: Weekly Whispers (Left) */}
                        <TouchableOpacity
                            style={[styles.mapNode, { top: 120, left: 20 }]}
                            onPress={() => navigation.navigate('WeeklyWhispers')}
                        >
                            <View style={[
                                styles.nodeCircle,
                                {
                                    backgroundColor: weeklyCompleted ? '#D1FAE5' : JOURNEY_STEPS[1].bgColor,
                                    borderColor: weeklyCompleted ? '#64C59A' : JOURNEY_STEPS[1].color
                                }
                            ]}>
                                {weeklyCompleted ? (
                                    <Ionicons name="checkmark" size={24} color="#64C59A" />
                                ) : (
                                    <JourneyIcons.Microphone width={24} height={24} color={JOURNEY_STEPS[1].color} />
                                )}
                            </View>
                            <View style={styles.nodeLabel}>
                                <Text style={[
                                    styles.nodeLabelText,
                                    { color: weeklyCompleted ? '#64C59A' : JOURNEY_STEPS[1].color }
                                ]}>
                                    Weekly Whispers
                                </Text>
                                <Text style={[
                                    styles.nodeSubtext,
                                    weeklyCompleted && { color: '#64C59A', fontWeight: '600' }
                                ]}>
                                    {weeklyCompleted ? 'Completed' : 'Reflect weekly'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Node 3: Thrive Tracker (Right) */}
                        <TouchableOpacity
                            style={[styles.mapNode, { top: 220, right: 20 }]}
                            onPress={() => navigation.navigate('ThriveTracker')}
                        >
                            <View style={[styles.nodeCircle, { backgroundColor: JOURNEY_STEPS[2].bgColor, borderColor: JOURNEY_STEPS[2].color }]}>
                                <JourneyIcons.Chart width={28} height={28} color={JOURNEY_STEPS[2].color} />
                            </View>
                            <View style={styles.nodeLabel}>
                                <Text style={[styles.nodeLabelText, { color: JOURNEY_STEPS[2].color }]}>Thrive Tracker</Text>
                                <Text style={styles.nodeSubtext}>Monitor growth</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Node 4: Stress Snapshot (Left) */}
                        <TouchableOpacity
                            style={[styles.mapNode, { top: 320, left: 20 }]}
                            onPress={() => navigation.navigate('StressSnapshot')}
                        >
                            <View style={[styles.nodeCircle, { backgroundColor: JOURNEY_STEPS[3].bgColor, borderColor: JOURNEY_STEPS[3].color }]}>
                                <JourneyIcons.StressCamera width={28} height={28} color={JOURNEY_STEPS[3].color} />
                            </View>
                            <View style={styles.nodeLabel}>
                                <Text style={[styles.nodeLabelText, { color: JOURNEY_STEPS[3].color }]}>Stress Snapshot</Text>
                                <Text style={styles.nodeSubtext}>Capture stress</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Node 5: Mindful Mirror (Right - Final) */}
                        <TouchableOpacity
                            style={[styles.mapNode, { top: 420, right: 20 }]}
                            onPress={() => navigation.navigate('MindfulMirror')}
                        >
                            <View style={[styles.nodeCircle, styles.nodeCircleLarge, { backgroundColor: JOURNEY_STEPS[4].bgColor, borderColor: JOURNEY_STEPS[4].color }]}>
                                <JourneyIcons.Mirror width={32} height={32} color={JOURNEY_STEPS[4].color} />
                            </View>
                            <View style={styles.nodeLabel}>
                                <Text style={[styles.nodeLabelText, { color: JOURNEY_STEPS[4].color }]}>Mindful Mirror</Text>
                                <Text style={styles.nodeSubtext}>Self-reflection</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={{ height: 100 }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        zIndex: 0,
        transform: [{ rotate: '90deg' }]
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
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
    // Section Header
    sectionHeader: {
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    pill: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pillText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    // Large Cards
    largeCardsContainer: {
        marginBottom: 30,
        gap: 20,
    },
    largeCard: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 24,
        minHeight: 160,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardImageContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B4E6D',
        marginBottom: 4,
        letterSpacing: 1,
    },
    cardSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 12,
        lineHeight: 18,
    },
    cardMeta: {
        fontSize: 11,
        fontWeight: '600',
        color: '#667eea',
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
        backgroundColor: '#FAFBFC',
        borderRadius: 24,
        overflow: 'hidden',
    },
    mapSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    // Map Nodes
    mapNode: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    nodeCircleLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
    },
    nodeLabelText: {
        fontSize: 13,
        fontWeight: '600',
    },
    nodeSubtext: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 2,
    },
});
