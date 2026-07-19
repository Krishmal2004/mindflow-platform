import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { apiFetch } from '../../lib/apiClient';
import { Colors } from '../../constants/colors';
import { ScreenHeader } from '../../components/ScreenHeader';
import { JourneyIcons } from '../../components/JourneyIcons';
import { PanelWave } from '../../components/PanelWave';
import { ABOUT_ME_ACCENT, ABOUT_ME_ACCENT_TINT, AboutMeData, EMPTY_ABOUT_ME_DATA, panelStyles } from './shared';

const AboutMeIllustration = require('../../../assets/aboutMe.png') as number;

// Capped at 400 (its natural size) but shrinks on screens narrower than ~470px wide
// (400 / 0.85) — the old fixed 400x278 box bled past the edge on narrower phones
// regardless of device width.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_WIDTH = Math.min(400, SCREEN_WIDTH * 0.85);
const ILLUSTRATION_HEIGHT = ILLUSTRATION_WIDTH * (278 / 400);

// Read-only summary of a completed About Me profile, styled like the Front
// screen: the same illustration above the same rounded blue panel, with the
// three info sections listed inside it as one scrollable page instead of a
// separate plain-background layout. Redirects back to Front if the profile
// somehow isn't complete yet (e.g. a stale link), since there's nothing to
// show here otherwise.
export default function AboutMeViewScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AboutMeData>(EMPTY_ABOUT_ME_DATA);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                try {
                    setLoading(true);
                    const { ok, data: profile } = await apiFetch<Record<string, any>>('/api/profile/about-me', { force: true });
                    if (cancelled) return;

                    if (ok && profile?.is_completed) {
                        setData({ ...EMPTY_ABOUT_ME_DATA, ...profile, age: profile.age ? Number(profile.age) : null });
                    } else {
                        navigation.replace('AboutMe');
                    }
                } catch (error) {
                    console.log('Error fetching about me', error);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();
            return () => { cancelled = true; };
        }, [navigation])
    );

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
            <ScreenHeader title="About Me" onBack={goBack} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[panelStyles.content, panelStyles.contentFullHeight]}>
                <View style={panelStyles.introWrap}>
                    <View style={panelStyles.introIllustrationWrap}>
                        <Image source={AboutMeIllustration} style={styles.illustration} resizeMode="contain" />
                    </View>

                    <View style={[panelStyles.introPanel, { paddingBottom: 28 + insets.bottom }]}>
                        <Text style={panelStyles.introPanelTitle}>YOUR PROFILE</Text>
                        <Text style={panelStyles.introPanelSubtitle}>PROFILE COMPLETED</Text>

                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={24} color={ABOUT_ME_ACCENT} />
                            <Text style={styles.successBannerText}>Thanks for sharing your profile</Text>
                        </View>

                        {/* Card 1: Academic Profile */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Academic width={18} height={18} color={ABOUT_ME_ACCENT} />
                                </View>
                                <Text style={styles.cardHeaderText}>Academic Profile</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>University ID</Text>
                                    <Text style={styles.infoFieldValue}>{data.university_id || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Education Level</Text>
                                    <Text style={styles.infoFieldValue}>{data.education_level || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Faculty</Text>
                                    <Text style={styles.infoFieldValue}>{data.faculty || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Major / Field of Study</Text>
                                    <Text style={styles.infoFieldValue}>{data.major_field_of_study || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Card 2: Personal Profile */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Person width={18} height={18} color={ABOUT_ME_ACCENT} />
                                </View>
                                <Text style={styles.cardHeaderText}>Personal Profile</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Age</Text>
                                    <Text style={styles.infoFieldValue}>{data.age?.toString() || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Living Situation</Text>
                                    <Text style={styles.infoFieldValue}>{data.living_situation || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Cultural Background</Text>
                                    <Text style={styles.infoFieldValue}>{data.cultural_background || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Family Background</Text>
                                    <Text style={styles.infoFieldValueText}>{data.family_background || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Card 3: Interests & MindFlow Journey */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Star width={18} height={18} color={ABOUT_ME_ACCENT} />
                                </View>
                                <Text style={styles.cardHeaderText}>Interests & Experience</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Hobbies & Interests</Text>
                                    <Text style={styles.infoFieldValueText}>{data.hobbies_interests || 'None Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Personal Goals</Text>
                                    <Text style={styles.infoFieldValueText}>{data.personal_goals || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Previous Experience</Text>
                                    <Text style={styles.infoFieldValueText}>{data.why_mindflow || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Room below the last card so PanelWave (bottom: 0 of the panel) has space to show instead of butting straight up against the card. */}
                        <View style={styles.cardsEndSpacer} />

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
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        width: '100%',
        gap: 12,
    },
    successBannerText: {
        flex: 1,
        color: Colors.textPrimary,
        fontWeight: '700',
        fontSize: 14,
    },
    cardsEndSpacer: {
        height: 35,
    },
    groupedCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: Colors.surfaceMuted,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderColor: Colors.surfaceMuted,
        gap: 12,
    },
    cardHeaderIconContainer: {
        backgroundColor: ABOUT_ME_ACCENT_TINT,
        padding: 8,
        borderRadius: 10,
    },
    cardHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    cardBody: {
        padding: 20,
    },
    infoField: {
        marginVertical: 4,
    },
    infoFieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    infoFieldValue: {
        fontSize: 15,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    infoFieldValueText: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '500',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceMuted,
        marginVertical: 12,
    },
});
