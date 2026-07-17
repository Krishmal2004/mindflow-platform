import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { apiFetch } from '../../lib/apiClient';
import { Colors } from '../../constants/colors';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PanelWave } from '../../components/PanelWave';
import { ABOUT_ME_ACCENT, panelStyles } from './shared';

const AboutMeIllustration = require('../../../assets/aboutMe.png') as number;

// Capped at 400 (its natural size) but shrinks on screens narrower than ~470px wide
// (400 / 0.85) — the old fixed 400x278 box bled past the edge on narrower phones
// regardless of device width.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_WIDTH = Math.min(400, SCREEN_WIDTH * 0.85);
const ILLUSTRATION_HEIGHT = ILLUSTRATION_WIDTH * (278 / 400);

// Landing/gate screen for the About Me flow: shows why we ask + a "Fill Form"
// CTA, or silently redirects straight to the read-only view if the profile is
// already completed. Registered as the 'AboutMe' route, so every existing
// navigation.navigate('AboutMe') call site keeps working unchanged.
export default function AboutMeFrontScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { ok, data } = await apiFetch<{ is_completed?: boolean }>('/api/profile/about-me');
                if (!cancelled && ok && data?.is_completed) {
                    navigation.replace('AboutMeView');
                    return;
                }
            } catch (error) {
                console.log('Error checking about-me completion', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [navigation]);

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
    };

    if (loading) {
        return (
            <View style={panelStyles.loadingContainer}>
                <ActivityIndicator size="large" color={ABOUT_ME_ACCENT} />
            </View>
        );
    }

    return (
        <View style={panelStyles.container}>
            <StatusBar style="dark" />
            <ScreenHeader title="About Me" subtitle="Your research profile" onBack={goBack} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[panelStyles.content, panelStyles.contentFullHeight]}>
                <View style={panelStyles.introWrap}>
                    <View style={panelStyles.introIllustrationWrap}>
                        <Image source={AboutMeIllustration} style={styles.illustration} resizeMode="contain" />
                    </View>

                    <View style={[panelStyles.introPanel, { paddingBottom: 28 + insets.bottom }]}>
                        <Text style={panelStyles.introPanelTitle}>YOUR PROFILE</Text>
                        <Text style={panelStyles.introPanelSubtitle}>TELL US ABOUT YOURSELF</Text>

                        <View style={panelStyles.introCard}>
                            <View style={styles.introIconRow}>
                                <View style={styles.introIconCircle}>
                                    <Ionicons name="information-circle-outline" size={22} color={ABOUT_ME_ACCENT} />
                                </View>
                                <Text style={styles.introCardTitle}>Why we ask</Text>
                            </View>
                            <Text style={styles.introCardText}>
                                A few questions about your academic and personal background give researchers context
                                for your mindfulness journey. Takes about 3 minutes - you can review it anytime after.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.goButton}
                            onPress={() => navigation.replace('AboutMeQuestionnaire')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.goButtonText}>Fill Form</Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.surface} />
                        </TouchableOpacity>

                        <PanelWave />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    illustration: {
        width: ILLUSTRATION_WIDTH,
        height: ILLUSTRATION_HEIGHT,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    introIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${ABOUT_ME_ACCENT}1A`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    introCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    introCardText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    goButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ABOUT_ME_ACCENT,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        gap: 10,
        zIndex: 1, // sit above PanelWave
        shadowColor: ABOUT_ME_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    goButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.surface,
    },
});
