import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../types/navigation';
import { MeditationIllustration, ThriveIllustration, StressIllustration, MirrorIllustration, VoiceRecordingIllustration } from '../components/MeditationIllustration';
import { JourneyIcons } from '../components/JourneyIcons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin either side of the card
const SLIDE_WIDTH = width; // each page is a full-width viewport so the card recenters per slide

// Deep royal-blue backdrop + soft blue / warm yellow accents — a deliberate
// departure from the app's sage-green theme, scoped to this screen only.
const DEEP_BLUE = '#141B4D';
const DEEP_BLUE_LIGHT = '#232C72';
const ACCENT_BLUE = '#4C6FFF';
const ACCENT_YELLOW = '#FFC93C';
const HEADING_COLOR = '#161B33';
const BODY_GRAY = '#6B7280';

// One slide per real roadmap step (see DashboardScreen's ROADMAP_STEPS) — same
// icons and accent colors as the in-app journey, so onboarding previews the
// exact 5-step path the participant will walk through rather than a generic pitch.
const SLIDES = [
    {
        key: 'daily',
        title: 'Daily Check-ins',
        desc: 'Track your mood, stress, and sleep in just a minute a day, then unwind with short guided sessions.',
        color: '#D97706',
        RoadmapIcon: JourneyIcons.Sun,
        Illustration: (size: number) => <MeditationIllustration width={size} height={size * 0.9} />,
    },
    {
        key: 'voice',
        title: 'Weekly Voice Journal',
        desc: 'A short reading captures your vocal wellbeing patterns over time.',
        color: '#6366F1',
        RoadmapIcon: JourneyIcons.Microphone,
        Illustration: (size: number) => <VoiceRecordingIllustration width={size} height={size * 0.9} color="INDIGO" />,
    },
    {
        key: 'thrive',
        title: 'Thrive Tracker',
        desc: 'A quick wellbeing check-in every two weeks using the WEMWBS-14 scale.',
        color: '#749F82',
        RoadmapIcon: JourneyIcons.Chart,
        Illustration: (size: number) => <ThriveIllustration width={size} height={size * 0.9} />,
    },
    {
        key: 'stress',
        title: 'Stress Snapshot',
        desc: 'See how your perceived stress shifts over the month with the PSS-10 scale.',
        color: '#E07A5F',
        RoadmapIcon: JourneyIcons.StressCamera,
        Illustration: (size: number) => <StressIllustration width={size} height={size * 0.9} color="CORAL" />,
    },
    {
        key: 'mindful',
        title: 'Mindful Mirror',
        desc: 'Reflect on your mindfulness habits each month using the FFMQ-15 scale.',
        color: '#0D9488',
        RoadmapIcon: JourneyIcons.Mirror,
        Illustration: (size: number) => <MirrorIllustration width={size} height={size * 0.9} color="TEAL" />,
    },
];

// Premium, minimal onboarding: deep royal-blue backdrop with a centered white
// rounded card per slide (illustration, heading, description) and fixed
// pagination + CTA below it — distinct from the auth screens' light panel
// language on purpose, since this is the very first, brand-setting impression.
export default function OnboardingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = useRef<ScrollView>(null);

    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.94);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 700 });
        scaleAnim.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    }, []);

    const handleContinue = async () => {
        await AsyncStorage.setItem('alreadyLaunched', 'true');
        navigation.replace('Login');
    };

    const handleNext = () => {
        if (activeSlide === SLIDES.length - 1) {
            handleContinue();
            return;
        }
        goToSlide(activeSlide + 1);
    };

    const handleSlideScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
        setActiveSlide(Math.max(0, Math.min(SLIDES.length - 1, index)));
    };

    const goToSlide = (index: number) => {
        carouselRef.current?.scrollTo({ x: index * SLIDE_WIDTH, animated: true });
        setActiveSlide(index);
    };

    const cardStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));

    const isLast = activeSlide === SLIDES.length - 1;

    return (
        <LinearGradient
            colors={[DEEP_BLUE_LIGHT, DEEP_BLUE]}
            style={styles.container}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
        >
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* Soft decorative glows for a polished, fintech-style backdrop */}
            <View pointerEvents="none" style={[styles.glowYellow, { top: insets.top + 40 }]} />
            <View pointerEvents="none" style={[styles.glowBlue, { bottom: 120 }]} />

            <View style={[styles.topBar, { paddingTop: insets.top > 0 ? insets.top + 8 : 24 }]}>
                <TouchableOpacity onPress={handleContinue} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={SLIDE_WIDTH}
                onMomentumScrollEnd={handleSlideScrollEnd}
                style={styles.carousel}
            >
                {SLIDES.map((slide) => (
                    <View key={slide.key} style={[styles.slidePage, { width: SLIDE_WIDTH }]}>
                        <Animated.View style={[styles.card, cardStyle]}>
                            <View style={styles.illustrationWrap}>
                                {slide.Illustration(CARD_WIDTH * 0.56)}
                            </View>
                            <Text style={styles.heading}>{slide.title}</Text>
                            <Text style={styles.description}>{slide.desc}</Text>
                        </Animated.View>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 28 }]}>
                {/* Mini roadmap stepper — mirrors the in-app 5-step journey path,
                    doubling as pagination so the preview and the real thing match. */}
                <View style={styles.roadmapRow}>
                    {SLIDES.map((slide, i) => {
                        const reached = i <= activeSlide;
                        const isActive = i === activeSlide;
                        const Icon = slide.RoadmapIcon;
                        return (
                            <React.Fragment key={slide.key}>
                                {i > 0 && (
                                    <View
                                        style={[
                                            styles.roadmapLine,
                                            reached && { backgroundColor: ACCENT_BLUE, opacity: 0.9 },
                                        ]}
                                    />
                                )}
                                <TouchableOpacity
                                    onPress={() => goToSlide(i)}
                                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                >
                                    <View
                                        style={[
                                            styles.roadmapNode,
                                            { backgroundColor: reached ? `${slide.color}26` : 'rgba(255,255,255,0.08)' },
                                            isActive && { borderColor: slide.color, borderWidth: 2 },
                                        ]}
                                    >
                                        <Icon width={16} height={16} color={reached ? slide.color : 'rgba(255,255,255,0.35)'} />
                                    </View>
                                </TouchableOpacity>
                            </React.Fragment>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.continueButton} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.continueButtonText}>{isLast ? 'GET STARTED' : 'NEXT'}</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    glowYellow: {
        position: 'absolute',
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: ACCENT_YELLOW,
        opacity: 0.12,
    },
    glowBlue: {
        position: 'absolute',
        left: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: ACCENT_BLUE,
        opacity: 0.18,
    },
    topBar: { alignItems: 'flex-end', paddingHorizontal: 24, zIndex: 1 },
    skipText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
    carousel: { flex: 1 },
    slidePage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingTop: 32,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
        elevation: 18,
    },
    illustrationWrap: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    heading: {
        fontSize: 22,
        fontWeight: '800',
        color: HEADING_COLOR,
        textAlign: 'center',
        letterSpacing: 0.2,
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: BODY_GRAY,
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: 4,
    },
    footer: { alignItems: 'center', paddingHorizontal: 24, zIndex: 1 },
    roadmapRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
    roadmapNode: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roadmapLine: { width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
    continueButton: {
        width: '100%',
        backgroundColor: ACCENT_YELLOW,
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: ACCENT_YELLOW,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    continueButtonText: { color: DEEP_BLUE, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
});
