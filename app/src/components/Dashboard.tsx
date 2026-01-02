import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Alert, ImageBackground, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Circle, Pattern } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

const MINDFULNESS_TIPS = [
  "Take a moment to breathe deeply. Notice how your body feels right now, without judgment.",
  "Pause and observe one thing you can see, hear, and feel in this moment.",
  "Let go of yesterday and tomorrow. This moment is all that exists.",
  "Smile gently — even a small one changes your brain chemistry.",
  "Wherever you are, be there completely.",
  "Your breath is your anchor. Return to it whenever you feel lost.",
  "You don't need to fix anything right now. Just notice.",
  "Every exhale is a letting go.",
  "You are exactly where you need to be.",
  "This too shall pass. Breathe through it."
];

const CONTROL_FACTS = [
  "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.",
  "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
  "Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.",
  "A day on Venus is longer than a year on Venus.",
  "Bananas are curved because they grow towards the sun.",
  "The first computer bug was a real moth found in a Harvard Mark II computer in 1947.",
  "Water covers about 71% of the Earth's surface, but oceans hold 96.5% of all water.",
  "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes.",
  "Oxford University is older than the Aztec Empire.",
  "There are more stars in the universe than grains of sand on all the Earth's beaches.",
];

const CalmBackground = () => (
  <ImageBackground
    source={{ uri: 'https://example.com/subtle-zen-pattern.png' }}
    style={StyleSheet.absoluteFillObject}
    resizeMode="repeat"
    imageStyle={{ opacity: 0.05 }}
  />
);

export default function Dashboard({ session, onNavigateToAboutMe }: { session: Session; onNavigateToAboutMe: () => void }) {
  const router = useRouter();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [mainQuestionnaireProgress, setMainQuestionnaireProgress] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [researchID, setResearchID] = useState('');
  const [userExtension, setUserExtension] = useState<'ex' | 'cg' | ''>('');
  const [aboutMeCompleted, setAboutMeCompleted] = useState(false);
  const [dailySlidersCount, setDailySlidersCount] = useState(0);
  const [weeklyWhispersCount, setWeeklyWhispersCount] = useState(0);
  const [coreInsightsCount, setCoreInsightsCount] = useState(0);

  const streakProgress = useSharedValue(0);
  const consistencyProgress = useSharedValue(0);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const animatedPropsStreak = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - Math.min(1, streakProgress.value / 100)),
  }));

  const animatedPropsConsistency = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - consistencyProgress.value / 100),
  }));

  useEffect(() => {
    const tipsLength = userExtension === 'ex' ? MINDFULNESS_TIPS.length : CONTROL_FACTS.length;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tipsLength);
    }, 60000);
    return () => clearInterval(interval);
  }, [userExtension]);

  useEffect(() => {
    fetchResearchID();
    fetchUserProgress();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProgress();
    setRefreshing(false);
  };

  const fetchResearchID = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('researchID')
        .eq('id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.researchID) {
        setResearchID(data.researchID);
        if (data.researchID.endsWith('.ex')) setUserExtension('ex');
        else if (data.researchID.endsWith('.cg')) setUserExtension('cg');
      }
    } catch (error) {
      console.error('Error fetching research ID:', error);
    }
  };

  const fetchUserProgress = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: streakData } = await supabase
        .from('daily_sliders')
        .select('created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      let currentStreak = 0;
      if (streakData && streakData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const entryDates = new Set(streakData.map(entry => {
          const d = new Date(entry.created_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }));
        let checkDate = new Date(today);
        while (entryDates.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { count: totalCount } = await supabase
        .from('daily_sliders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', sixMonthsAgo.toISOString());

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: recentCount } = await supabase
        .from('daily_sliders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const consistencyPercentage = recentCount ? Math.min(100, Math.round((recentCount / 30) * 100)) : 0;

      const { data: voiceRecordings } = await supabase
        .from('voice_recordings')
        .select('created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', sixMonthsAgo.toISOString());

      const uniqueWeeks = new Set(voiceRecordings?.map(a => {
        const d = new Date(a.created_at);
        const [year, week] = getWeekNumber(d);
        return `${year}-W${week.toString().padStart(2, '0')}`;
      }) || []);

      const weeklyProgressPercentage = uniqueWeeks.size ? Math.min(100, Math.round((uniqueWeeks.size / 26) * 100)) : 0;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { count: mainCount } = await supabase
        .from('main_questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('submitted_at', oneYearAgo.toISOString());

      const mainProgress = mainCount ? Math.min(100, Math.round((mainCount / 4) * 100)) : 0;

      setStreak(currentStreak);
      setCompleted(totalCount || 0);
      setConsistency(consistencyPercentage);
      setWeeklyProgress(weeklyProgressPercentage);
      setMainQuestionnaireProgress(mainProgress);
      setDailySlidersCount(totalCount || 0);
      setWeeklyWhispersCount(uniqueWeeks.size); // This now reflects voice recordings
      setCoreInsightsCount(mainCount || 0);

      streakProgress.value = withTiming(currentStreak > 10 ? 100 : currentStreak * 10, { duration: 1000 });
      consistencyProgress.value = withTiming(consistencyPercentage, { duration: 1000 });
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  function getWeekNumber(d: Date): [number, number] {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
  }

  const handleSignOut = async () => {
    setShowAccountModal(false);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert("Error", error.message);
            else router.replace('/');
          } catch (error: any) {
            Alert.alert("Error", error.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const tipsArray = userExtension === 'ex' ? MINDFULNESS_TIPS : CONTROL_FACTS;
  const currentTip = tipsArray[currentTipIndex % tipsArray.length];

  return (
    <View style={styles.container}>
      <CalmBackground />
      <LinearGradient
        colors={['#F8FDFC', '#E8F5F1']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, styles.mindText]}>Mind</Text>
          <Text style={[styles.headerTitle, styles.flowText]}>Flow</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={styles.avatarButton}>
          <Image source={require('../../assets/images/user.png')} style={styles.avatarImage} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {userExtension && (
          <Animated.View entering={FadeIn.duration(1000)}>
            <LinearGradient
              colors={userExtension === 'ex' ? ['#3bcc97ff', '#2E8A66'] : ['#9B6B35', '#7A5424']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tipCard}
            >
              <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100" opacity={0.08}>
                <Pattern id="pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <Circle cx="10" cy="10" r="2" fill="#fff" />
                </Pattern>
                <Circle cx="50" cy="50" r="50" fill="url(#pattern)" />
              </Svg>
              <View style={styles.tipHeader}>
                <View style={styles.tipIconCircle}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d={userExtension === 'ex'
                        ? "M12 2L13.09 8.26L22 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L2 9.27L10.91 8.26L12 2Z"
                        : "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"}
                      stroke="#fff"
                      strokeWidth="1.5"
                      fill={userExtension === 'ex' ? "#A8E6CF" : "#FFD580"}
                    />
                  </Svg>
                </View>
                <Text style={styles.tipLabel}>
                  {userExtension === 'ex' ? 'Daily Mindfulness Tip' : 'Fascinating Fact'}
                </Text>
              </View>
              <Text style={styles.tipText}>{currentTip}</Text>
              <View style={styles.tipDots}>
                {tipsArray.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === currentTipIndex % tipsArray.length && styles.activeDot]}
                  />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Your Journey Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/progress')}>
              <Text style={styles.viewAllText}>Explore More</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M9 18L15 12L9 6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Progress Circles */}
          <View style={styles.enhancedProgressGrid}>
            <View style={styles.enhancedProgressItem}>
              <View style={styles.circularProgressContainer}>
                <Svg width="160" height="160" viewBox="0 0 160 160">
                  <Circle cx="80" cy="80" r="70" stroke="#E8F5F1" strokeWidth="12" fill="none" />
                  <AnimatedCircle
                    cx="80" cy="80" r="70" stroke="#64C59A" strokeWidth="12" fill="none"
                    strokeDasharray="440" strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    animatedProps={animatedPropsStreak}
                  />
                  <Circle cx="80" cy="80" r="50" fill="#F8FDFC" />
                </Svg>
                <View style={styles.progressCenter}>
                  <Text style={styles.enhancedProgressNumber}>{streak}</Text>
                  <Text style={styles.enhancedProgressLabel}>Day Streak</Text>
                </View>
              </View>
              <View style={styles.progressDetail}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2L13.09 8.26L22 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L2 9.27L10.91 8.26L12 2Z" stroke="#64C59A" strokeWidth="2" />
                </Svg>
                <Text style={styles.progressDetailText}>Keep it up!</Text>
              </View>
            </View>

            <View style={styles.enhancedProgressItem}>
              <View style={styles.circularProgressContainer}>
                <Svg width="160" height="160" viewBox="0 0 160 160">
                  <Circle cx="80" cy="80" r="70" stroke="#E8F5F1" strokeWidth="12" fill="none" />
                  <AnimatedCircle
                    cx="80" cy="80" r="70" stroke="#4CAF85" strokeWidth="12" fill="none"
                    strokeDasharray="440" strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    animatedProps={animatedPropsConsistency}
                  />
                  <Circle cx="80" cy="80" r="50" fill="#F8FDFC" />
                </Svg>
                <View style={styles.progressCenter}>
                  <Text style={styles.enhancedProgressNumber}>{consistency}%</Text>
                  <Text style={styles.enhancedProgressLabel}>Consistency</Text>
                </View>
              </View>
              <View style={styles.progressDetail}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M9 12L11 14L15 10" stroke="#4CAF85" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="12" cy="12" r="10" stroke="#4CAF85" strokeWidth="2" />
                </Svg>
                <Text style={styles.progressDetailText}>Monthly Goal</Text>
              </View>
            </View>
          </View>

          {/* Journey Summary Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.journeySummaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryTitle}>Journey Summary</Text>
                <Text style={styles.summarySubtitle}>6-Month Progress</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="#64C59A">
                  <Path d="M12 1L15.09 8.26L23 9.27L17 14.14L18.18 22.02L12 18.77L5.82 22.02L7 14.14L1 9.27L8.91 8.26L12 1Z" />
                </Svg>
                <Text style={styles.summaryBadgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.summaryStatsGrid}>
              <View style={styles.summaryStatCard}>
                <View style={styles.statIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M8 6H21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
                    <Path d="M8 12H21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
                    <Path d="M8 18H21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
                    <Circle cx="3" cy="6" r="2" fill="#64C59A" />
                    <Circle cx="3" cy="12" r="2" fill="#64C59A" />
                    <Circle cx="3" cy="18" r="2" fill="#64C59A" />
                  </Svg>
                </View>
                <Text style={styles.summaryStatValue}>{completed}</Text>
                <Text style={styles.summaryStatLabel}>Daily Entries</Text>
              </View>

              <View style={styles.summaryStatCard}>
                <View style={styles.statIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M19 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V6C21 4.9 20.1 4 19 4Z" stroke="#64C59A" strokeWidth="2" />
                    <Path d="M16 2V6" stroke="#64C59A" strokeWidth="2" />
                    <Path d="M8 2V6" stroke="#64C59A" strokeWidth="2" />
                  </Svg>
                </View>
                <Text style={styles.summaryStatValue}>{Math.floor((weeklyProgress * 26) / 100)}</Text>
                <Text style={styles.summaryStatLabel}>Weekly Voice</Text>
              </View>

              <View style={styles.summaryStatCard}>
                <View style={styles.statIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#64C59A" strokeWidth="2" />
                    <Path d="M12 6V12L16 16" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.summaryStatValue}>{Math.floor((mainQuestionnaireProgress * 4) / 100)}</Text>
                <Text style={styles.summaryStatLabel}>Deep Dives</Text>
              </View>
            </View>

            <View style={styles.summaryFooter}>
              <View style={styles.summaryFooterDot} />
              <Text style={styles.summaryFooterText}>Updated just now</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Roadmap Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.roadmapSection}>
          <LinearGradient
            colors={['#F8FDFC', '#E8F5F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 32, paddingHorizontal: 20, paddingVertical: 32, marginHorizontal: 12 }}
          >
            <Text style={styles.roadmapSectionTitle}>Your Mindfulness Path</Text>
            <Text style={styles.roadmapSectionSubtitle}>Navigate your wellness journey</Text>

            <View style={styles.roadmapPathContainer}>
              <View style={styles.roadmapStartMarker} />
              <View style={styles.roadmapMapPath} />
              <View style={styles.roadmapCards}>
                {/* 1. About Me*/}
                <Animated.View entering={FadeIn.delay(100).duration(600)} style={[styles.roadmapCardWrapper, styles.roadmapCardWrapperLeft]}>
                  <LinearGradient
                    colors={aboutMeCompleted ? ['#64C59A', '#4CAF85'] : ['#fff', '#F8FDFC']}
                    style={styles.roadmapCardInner}
                  >
                    <TouchableOpacity onPress={onNavigateToAboutMe} activeOpacity={0.8}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, aboutMeCompleted && styles.roadmapMarkerCompleted]}>
                          {aboutMeCompleted ? (
                            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                              <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          ) : (
                            <Text style={styles.roadmapMarkerNumber}>1</Text>
                          )}
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={[styles.roadmapCardTitle, aboutMeCompleted && styles.roadmapCardTitleCompleted]}>
                            About Me
                          </Text>
                          <Text style={styles.roadmapCardFrequency}>Onboarding        • 1 time</Text>
                          <Text style={[styles.roadmapCardDescription, aboutMeCompleted && styles.roadmapCardDescriptionCompleted]}>
                            Set up your profile
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>

                {/* 2. Daily Sliders */}
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={[styles.roadmapCardWrapper, styles.roadmapCardWrapperRight]}>
                  <View style={styles.roadmapCardInnerDefault}>
                    <TouchableOpacity onPress={() => router.push('/daily-sliders')} activeOpacity={0.8}>
                      <View style={styles.roadmapCardContent}>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={styles.roadmapCardTitle}>Daily Sliders</Text>
                          <Text style={styles.roadmapCardFrequency}>Everyday • {dailySlidersCount} entries</Text>
                          <Text style={styles.roadmapCardDescription}>Track mood & mindfulness</Text>
                        </View>
                        <View style={[styles.roadmapMarker, dailySlidersCount > 0 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, dailySlidersCount > 0 && styles.roadmapMarkerNumberCompleted]}>2</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* 3. Weekly Whispers */}
                <Animated.View entering={FadeIn.delay(300).duration(600)} style={[styles.roadmapCardWrapper, styles.roadmapCardWrapperLeft]}>
                  <View style={styles.roadmapCardInnerDefault}>
                    <TouchableOpacity onPress={() => router.push('/weekly-whispers')} activeOpacity={0.8}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, weeklyWhispersCount > 0 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, weeklyWhispersCount > 0 && styles.roadmapMarkerNumberCompleted]}>3</Text>
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={styles.roadmapCardTitle}>Weekly Whispers</Text>
                          <Text style={styles.roadmapCardFrequency}>Weekly • {weeklyWhispersCount} submissions</Text>
                          <Text style={styles.roadmapCardDescription}>Reflect deeply</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* 4. Core Insights */}
                <Animated.View entering={FadeIn.delay(400).duration(600)} style={[styles.roadmapCardWrapper, styles.roadmapCardWrapperRight]}>
                  <View style={styles.roadmapCardInnerDefault}>
                    <TouchableOpacity onPress={() => router.push('/main-questionnaire')} activeOpacity={0.8}>
                      <View style={styles.roadmapCardContent}>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={styles.roadmapCardTitle}>Core Insights</Text>
                          <Text style={styles.roadmapCardFrequency}>Quarterly • {coreInsightsCount}/4 done</Text>
                          <Text style={styles.roadmapCardDescription}>Full assessments</Text>
                        </View>
                        <View style={[styles.roadmapMarker, coreInsightsCount >= 4 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, coreInsightsCount >= 4 && styles.roadmapMarkerNumberCompleted]}>4</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Account Modal */}
      <Modal visible={showAccountModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAccountModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalRow} onPress={() => { setShowAccountModal(false); router.push('/account'); }}>
              <Image source={require('../../assets/images/user.png')} style={styles.modalIcon} />
              <Text style={styles.modalText}>Manage Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalRow, styles.logoutRow]} onPress={handleSignOut}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#EF4444" strokeWidth="2" />
                <Path d="M16 17L20 12L16 7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                <Path d="M20 12H8" stroke="#EF4444" strokeWidth="2" />
              </Svg>
              <Text style={[styles.modalText, styles.logoutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 64, paddingBottom: 20 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  mindText: { color: '#3bcc97ff' },
  flowText: { color: '#2E8A66' },
  headerTitle: { fontSize: 36, fontWeight: '900', letterSpacing: 0.5 },
  avatarButton: { padding: 0, borderRadius: 40, overflow: 'hidden' },
  avatarImage: { width: 64, height: 64, resizeMode: 'cover', borderRadius: 40 },
  tipCard: { marginHorizontal: 28, marginTop: 24, borderRadius: 40, padding: 36, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 28, elevation: 20, overflow: 'hidden' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  tipIconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tipLabel: { color: '#fff', fontSize: 16, fontWeight: '700', opacity: 0.95 },
  tipText: { color: '#fff', fontSize: 20, lineHeight: 32, fontWeight: '500', textAlign: 'center', opacity: 0.95 },
  tipDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 6 },
  activeDot: { backgroundColor: '#fff', width: 28 },
  section: { paddingHorizontal: 28, marginTop: 36 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', opacity: 0.9 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: { fontSize: 17, color: '#64C59A', fontWeight: '700', marginRight: 10 },
  enhancedProgressGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 32 },
  enhancedProgressItem: { width: '48%', alignItems: 'center', marginBottom: 20 },
  circularProgressContainer: { position: 'relative', marginBottom: 16 },
  progressCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  enhancedProgressNumber: { fontSize: 36, fontWeight: '900', color: '#2E8A66' },
  enhancedProgressLabel: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '600' },
  progressDetail: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  progressDetailText: { fontSize: 13, color: '#2E8A66', fontWeight: '600', marginLeft: 8 },
  journeySummaryCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  summarySubtitle: { fontSize: 14, color: '#888', marginTop: 4, fontWeight: '500' },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, gap: 6 },
  summaryBadgeText: { color: '#64C59A', fontSize: 13, fontWeight: '700' },
  summaryStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  summaryStatCard: { flex: 1, backgroundColor: '#F8FDFC', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E8F5F1' },
  statIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8F5F1', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  summaryStatValue: { fontSize: 26, fontWeight: '800', color: '#2E8A66', marginBottom: 4 },
  summaryStatLabel: { fontSize: 12, color: '#888', textAlign: 'center', fontWeight: '600' },
  summaryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  summaryFooterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#64C59A', marginRight: 8 },
  summaryFooterText: { fontSize: 13, color: '#64C59A', fontWeight: '600' },

  // Roadmap Styles
  roadmapSection: { marginHorizontal: 16, marginVertical: 32 },
  roadmapSectionTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  roadmapSectionSubtitle: { fontSize: 16, color: '#777', marginBottom: 32, fontWeight: '500' },
  roadmapPathContainer: { position: 'relative', paddingVertical: 40 },
  roadmapMapPath: { position: 'absolute', left: width / 2 - 2.5,  top: 0, bottom: 80, width: 5, backgroundColor: '#A8E6CF', borderRadius: 5},
  roadmapStartMarker: {position: 'absolute',left: width / 2 - 10,top: 0,width: 20,height: 20,borderRadius: 100,backgroundColor: '#64C59A',borderWidth: 4,borderColor: '#A8E6CF',shadowColor: '#64C59A',shadowOffset: { width: 0, height: 0 },shadowOpacity: 0.4,shadowRadius: 12,elevation: 12,zIndex: 10,},
  roadmapCards: { position: 'relative' },
  roadmapCardWrapper: { marginVertical:32},
  roadmapCardWrapperLeft: { alignSelf: 'flex-start', width: '95%', maxWidth: 340 },
  roadmapCardWrapperRight: { alignSelf: 'flex-end', width: '95%', maxWidth: 340 },
  roadmapCardInner: { borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 12 },
  roadmapCardInnerDefault: { borderRadius: 28, overflow: 'hidden',  backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8F5F1', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 12},
  roadmapCardContent: { padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roadmapMarker: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F5F1', borderWidth: 4, borderColor: '#A8E6CF', justifyContent: 'center', alignItems: 'center', shadowColor: '#64C59A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  roadmapMarkerCompleted: { backgroundColor: '#64C59A', borderColor: '#4CAF85' },
  roadmapMarkerNumber: { fontSize: 26, fontWeight: '800', color: '#64C59A' },
  roadmapMarkerNumberCompleted: { color: '#fff' },
  roadmapCardDetails: { flex: 1, paddingHorizontal: 16 },
  roadmapCardTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  roadmapCardTitleCompleted: { color: '#fff' },
  roadmapCardFrequency: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8, letterSpacing: 0.8 },
  roadmapCardDescription: { fontSize: 15, color: '#666', lineHeight: 22 },
  roadmapCardDescriptionCompleted: { color: 'rgba(255,255,255,0.9)' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 48 },
  modalHandle: { width: 60, height: 6, backgroundColor: '#eee', borderRadius: 3, alignSelf: 'center', marginBottom: 28 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  modalIcon: { width: 44, height: 44, resizeMode: 'contain' },
  logoutRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 32 },
  modalText: { marginLeft: 20, fontSize: 19, color: '#333', fontWeight: '600' },
  logoutText: { color: '#EF4444', fontWeight: '700' },
});