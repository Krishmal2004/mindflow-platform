// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  ImageBackground,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Pattern } from 'react-native-svg';
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
  "Wombat poop is cube-shaped to prevent it from rolling away.",
  "Strawberries are not berries, but bananas, avocados, and watermelons are.",
  "The national animal of Scotland is the Unicorn.",
  "Sharks existed before trees.",
  "A blue whale's heart is the size of a small car.",
  "An average cumulus cloud weighs about 1.1 million pounds.",
  "Cows can walk up stairs, but their knees cannot bend properly to walk down them.",
  "Space smells like seared steak or hot metal according to astronauts.",
  "Hot water can freeze faster than cold water. This is known as the Mpemba effect.",
  "The longest English word without a vowel is 'rhythms'.",
  "Russia has a larger surface area than Pluto.",
  "If you uncoiled the DNA in your body, it would stretch 10 billion miles.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
  "Glass is not a slow-moving liquid; it is an amorphous solid.",
  "Flamingos are born grey. Their diet of brine shrimp turns them pink.",
  "The 'QWERTY' keyboard was designed to slow down typists so typewriters wouldn't jam.",
  "Babies are born with ~300 bones, but adults have only 206 because some fuse together.",
  "Sunsets on Mars appear blue due to the dust in the atmosphere.",
  "A group of crows is called a 'murder'.",
  "The dot over the letter 'i' or 'j' is called a 'tittle'."
];

// Enhanced Brain Avatar with more mindful, calm design (added subtle glow and patterns)
const BrainAvatar = ({ size = 48 }: { size?: number }) => (
  <View style={[styles.avatarContainer, { width: size + 20, height: size + 20 }]}>
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A8E6CF" />
          <Stop offset="100%" stopColor="#64C59A" />
        </SvgLinearGradient>
        <Pattern id="pattern" patternUnits="userSpaceOnUse" width="20" height="20">
          <Path d="M5 10 C5 5, 15 5, 15 10 C15 15, 5 15, 5 10" fill="none" stroke="#A8E6CF" strokeWidth="0.5" opacity="0.3" />
        </Pattern>
      </Defs>
      <Circle cx="60" cy="60" r="58" fill="url(#grad)" opacity="0.2" />
      <Circle cx="60" cy="60" r="58" fill="url(#pattern)" opacity="0.1" />
      <Path
        d="M60 20 C35 20, 25 40, 30 60 C35 80, 50 95, 60 95 C70 95, 85 80, 90 60 C95 40, 85 20, 60 20 Z"
        stroke="#64C59A"
        strokeWidth="4"
        fill="none"
        opacity="0.8"
      />
      <Path d="M45 40 Q40 55, 45 70 Q40 85, 45 95" stroke="#A8E6CF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      <Path d="M38 45 Q35 60, 38 75 Q35 90, 38 95" stroke="#A8E6CF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <Path d="M75 40 Q80 55, 75 70 Q80 85, 75 95" stroke="#A8E6CF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      <Path d="M82 45 Q85 60, 82 75 Q85 90, 82 95" stroke="#A8E6CF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <Circle cx="60" cy="50" r="10" fill="#A8E6CF" opacity="0.3" />
      <Circle cx="60" cy="50" r="5" fill="#64C59A" />
      <Circle cx="60" cy="65" r="50" stroke="#A8E6CF" strokeWidth="1.5" fill="none" opacity="0.4" />
    </Svg>
  </View>
);

// Custom subtle background pattern component
const CalmBackground = () => (
  <ImageBackground
    source={{ uri: 'https://example.com/subtle-zen-pattern.png' }} // Replace with a real subtle pattern URL or local asset (e.g., waves or leaves)
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
  const [missedDates, setMissedDates] = useState<string[]>([]); // New state for missed dates
  const [totalPossibleDays, setTotalPossibleDays] = useState(0); // New state for total possible days
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const [researchID, setResearchID] = useState(''); // New state for research ID
  const [userExtension, setUserExtension] = useState<'ex' | 'cg' | ''>(''); // New state for user extension
  const [aboutMeCompleted, setAboutMeCompleted] = useState(false); // Track if About Me is done
  const [dailySlidersCount, setDailySlidersCount] = useState(0); // Track daily sliders count
  const [weeklyWhispersCount, setWeeklyWhispersCount] = useState(0); // Track weekly whispers count
  const [coreInsightsCount, setCoreInsightsCount] = useState(0); // Track core insights count

  // Animations for progress
  const streakProgress = useSharedValue(0);
  const consistencyProgress = useSharedValue(0);
  const weeklyProgressAnim = useSharedValue(0);
  const mainProgressAnim = useSharedValue(0);

  // Create animated SVG components
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // Animated props for circles
  const animatedPropsStreak = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - Math.min(1, streakProgress.value / 100)),
  }));

  const animatedPropsConsistency = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - consistencyProgress.value / 100),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % MINDFULNESS_TIPS.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserProgress();
    fetchResearchID();
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
        // Extract extension (.ex or .cg)
        if (data.researchID.endsWith('.ex')) {
          setUserExtension('ex');
        } else if (data.researchID.endsWith('.cg')) {
          setUserExtension('cg');
        }
      }
    } catch (error) {
      console.error('Error fetching research ID:', error);
    }
  };

  const fetchUserProgress = async () => {
    if (!session?.user?.id) return;
    try {
      // Fetch daily sliders streak
      const { data: streakData, error: streakError } = await supabase
        .from('daily_sliders')
        .select('created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (streakError) throw streakError;
      
      // Calculate streak (consecutive days)
      let currentStreak = 0;
      if (streakData && streakData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Create a set of dates with entries
        const entryDates = new Set();
        streakData.forEach(entry => {
          const entryDate = new Date(entry.created_at);
          entryDate.setHours(0, 0, 0, 0);
          entryDates.add(entryDate.getTime());
        });
        // Start from today and count backwards
        let currentDate = new Date(today);
        while (entryDates.has(currentDate.getTime())) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }
      
      // Calculate missed dates and total possible days
      const calculateMissedDates = () => {
        if (streakData && streakData.length > 0) {
          // Find the earliest date in the data
          const earliestDate = new Date(streakData[streakData.length - 1].created_at);
          earliestDate.setHours(0, 0, 0, 0);
          
          // Start from the earliest date to today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Create a set of all dates from earliest to today
          const allDates = new Set<number>();
          const currentDate = new Date(earliestDate);
          while (currentDate <= today) {
            allDates.add(currentDate.getTime());
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Create a set of dates with entries
          const entryDates = new Set<number>();
          streakData.forEach(entry => {
            const entryDate = new Date(entry.created_at);
            entryDate.setHours(0, 0, 0, 0);
            entryDates.add(entryDate.getTime());
          });
          
          // Find missed dates
          const missed: string[] = [];
          allDates.forEach(date => {
            if (!entryDates.has(date)) {
              const dateObj = new Date(date);
              missed.push(dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
          });
          
          setMissedDates(missed);
          setTotalPossibleDays(allDates.size);
        } else {
          setMissedDates([]);
          setTotalPossibleDays(0);
        }
      };
      
      calculateMissedDates();
      
      // Calculate total completed entries in the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { count: totalCount, error: countError } = await supabase
        .from('daily_sliders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', sixMonthsAgo.toISOString());
      if (countError) throw countError;
      
      // For 6-month progress, we want to show actual completed entries
      // But also calculate percentage for visualization
      const maxEntries = 180; // Approx 180 days in 6 months
      const completionCount = totalCount || 0;
      const completionPercentage = totalCount ? Math.min(100, Math.round((totalCount / maxEntries) * 100)) : 0;
      
      // Calculate consistency (percentage of days with entries in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: recentCount, error: recentCountError } = await supabase
        .from('daily_sliders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      if (recentCountError) throw recentCountError;
      const consistencyPercentage = recentCount ? Math.min(100, Math.round((recentCount / 30) * 100)) : 0;
      
      // Fetch weekly questions progress
      const sixMonthsAgoForWeekly = new Date();
      sixMonthsAgoForWeekly.setMonth(sixMonthsAgoForWeekly.getMonth() - 6);
      const { data: weeklyAnswers, error: weeklyError } = await supabase
        .from('weekly_answers')
        .select('submitted_at')
        .eq('user_id', session.user.id)
        .gte('submitted_at', sixMonthsAgoForWeekly.toISOString());
      if (weeklyError) throw weeklyError;
      
      // Count unique weeks with submissions in the last 6 months
      const uniqueWeeks = new Set();
      if (weeklyAnswers) {
        weeklyAnswers.forEach(answer => {
          const date = new Date(answer.submitted_at);
          const [year, week] = getWeekNumber(date);
          uniqueWeeks.add(`${year}-W${week.toString().padStart(2, '0')}`);
        });
      }
      const weeklyCompletionCount = uniqueWeeks.size;
      // Approximate max weeks in 6 months (26 weeks)
      const maxWeeklyEntries = 26;
      const weeklyProgressPercentage = weeklyAnswers ? Math.min(100, Math.round((weeklyCompletionCount / maxWeeklyEntries) * 100)) : 0;
      
      // Fetch main questionnaire progress
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { count: mainQuestionnaireCount, error: mainQuestionnaireError } = await supabase
        .from('main_questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('submitted_at', oneYearAgo.toISOString());
      if (mainQuestionnaireError) throw mainQuestionnaireError;
      
      // For main questionnaire progress, we want to show actual completed entries
      // Assuming a target of 4 main questionnaires per year (one per quarter)
      const maxMainQuestionnaires = 4;
      const mainQuestionnaireCompletionCount = mainQuestionnaireCount || 0;
      const mainQuestionnaireProgressPercentage = mainQuestionnaireCount ?
      Math.min(100, Math.round((mainQuestionnaireCount / maxMainQuestionnaires) * 100)) : 0;
      
      setMainQuestionnaireProgress(mainQuestionnaireProgressPercentage);
      setStreak(currentStreak);
      setCompleted(completionCount);
      setConsistency(consistencyPercentage);
      setWeeklyProgress(weeklyProgressPercentage);
      
      // After setting states, animate with corrected values
      streakProgress.value = withTiming(currentStreak > 10 ? 100 : currentStreak * 10, { duration: 1000 });
      consistencyProgress.value = withTiming(consistencyPercentage, { duration: 1000 });
      weeklyProgressAnim.value = withTiming(weeklyProgressPercentage, { duration: 1000 });
      mainProgressAnim.value = withTiming(mainQuestionnaireProgressPercentage, { duration: 1000 });
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  // Helper function to get week number
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
            if (error) {
              Alert.alert("Error", error.message);
            } else {
              // Navigate to auth screen
              router.replace('/');
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <CalmBackground />
      <LinearGradient
        colors={['#F8FDFC', '#E8F5F1']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Header */}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Daily Mindfulness Tip - Shown only to .ex extension users */}
        {userExtension === 'ex' && (
          <Animated.View entering={FadeIn.duration(1000)}>
            <LinearGradient colors={['#2D6A4F', '#1B4D35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipCard}>
              <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" opacity={0.08}>
                <Pattern id="tipPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <Circle cx="10" cy="10" r="2" fill="#fff" />
                </Pattern>
                <Circle cx="50" cy="50" r="50" fill="url(#tipPattern)" />
              </Svg>
              <View style={styles.tipHeader}>
                <View style={styles.tipIconCircle}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2L13.09 8.26L22 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L2 9.27L10.91 8.26L12 2Z" stroke="#fff" strokeWidth="1.5" fill="#A8E6CF" />
                  </Svg>
                </View>
                <Text style={styles.tipLabel}>Daily Mindfulness Tip</Text>
              </View>
              <Text style={styles.tipText}>{MINDFULNESS_TIPS[currentTipIndex]}</Text>
              <View style={styles.tipDots}>
                {MINDFULNESS_TIPS.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentTipIndex && styles.activeDot]} />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Control Facts Card - Shown only to .cg extension users */}
        {userExtension === 'cg' && (
          <Animated.View entering={FadeIn.duration(1000)}>
            <LinearGradient colors={['#9B6B35', '#7A5424']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipCard}>
              <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" opacity={0.08}>
                <Pattern id="factPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <Circle cx="10" cy="10" r="2" fill="#fff" />
                </Pattern>
                <Circle cx="50" cy="50" r="50" fill="url(#factPattern)" />
              </Svg>
              <View style={styles.tipHeader}>
                <View style={styles.tipIconCircle}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" stroke="#fff" strokeWidth="1.5" fill="#FFD580" />
                  </Svg>
                </View>
                <Text style={styles.tipLabel}>Fascinating Fact</Text>
              </View>
              <Text style={styles.tipText}>{CONTROL_FACTS[currentTipIndex % CONTROL_FACTS.length]}</Text>
              <View style={styles.tipDots}>
                {CONTROL_FACTS.map((_, i) => (
                  <View key={i} style={[styles.dot, i === (currentTipIndex % CONTROL_FACTS.length) && styles.activeDot]} />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        

        {/* Enhanced Your Journey Section */}
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
          
          {/* Enhanced Circular Progress Indicators */}
          <View style={styles.enhancedProgressGrid}>
            {/* Streak Progress with Enhanced Visuals */}
            <View style={styles.enhancedProgressItem}>
              <View style={styles.circularProgressContainer}>
                <Svg width="160" height="160" viewBox="0 0 160 160">
                  <Circle cx="80" cy="80" r="70" stroke="#E8F5F1" strokeWidth="12" fill="none" />
                  <AnimatedCircle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#64C59A"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="440"
                    strokeLinecap="round"
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
            
            {/* Consistency Progress with Enhanced Visuals */}
            <View style={styles.enhancedProgressItem}>
              <View style={styles.circularProgressContainer}>
                <Svg width="160" height="160" viewBox="0 0 160 160">
                  <Circle cx="80" cy="80" r="70" stroke="#E8F5F1" strokeWidth="12" fill="none" />
                  <AnimatedCircle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#4CAF85"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="440"
                    strokeLinecap="round"
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
                <Text style={styles.summaryStatLabel}>Weekly Surveys</Text>
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

        {/* Mindfulness Path - Improved Map-like Roadmap */}
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={[styles.roadmapSection]}>
          <LinearGradient 
            colors={['#F8FDFC', '#E8F5F1']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 32, paddingHorizontal: 20, paddingVertical: 24, marginHorizontal: -4 }}
          >
            <Text style={styles.roadmapSectionTitle}>Your Mindfulness Path</Text>
            <Text style={styles.roadmapSectionSubtitle}>Navigate your wellness journey</Text>

            {/* Map Path Container */}
            <View style={styles.roadmapPathContainer}>
              <View style={[styles.roadmapMapPath, { height: '100%' }]} />
              
              {/* Roadmap Cards */}
              <View style={styles.roadmapCards}>
                {/* Step 1: About Me */}
                <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.roadmapCardWrapper}>
                  <LinearGradient 
                    colors={aboutMeCompleted ? ['#64C59A', '#4CAF85'] : ['#fff', '#F8FDFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.roadmapCardInner}
                  >
                    <TouchableOpacity onPress={() => onNavigateToAboutMe()} activeOpacity={0.7}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, aboutMeCompleted && styles.roadmapMarkerCompleted]}>
                          {aboutMeCompleted ? (
                            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                              <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          ) : (
                            <Text style={[styles.roadmapMarkerNumber]}>1</Text>
                          )}
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={[styles.roadmapCardTitle, aboutMeCompleted && styles.roadmapCardTitleCompleted]}>About Me</Text>
                          <Text style={styles.roadmapCardFrequency}>Onboarding • 1 time</Text>
                          <Text style={[styles.roadmapCardDescription, aboutMeCompleted && styles.roadmapCardDescriptionCompleted]}>
                            Set up your profile
                          </Text>
                        </View>
                        <View style={styles.roadmapCardProgress}>
                          <View style={[styles.roadmapProgressRing, aboutMeCompleted && styles.roadmapProgressRingCompleted]}>
                            {aboutMeCompleted ? (
                              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            ) : (
                              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <Circle cx="12" cy="12" r="10" stroke="#A8E6CF" strokeWidth="2" />
                                <Circle cx="12" cy="12" r="6" stroke="#A8E6CF" strokeWidth="2" opacity="0.5" />
                              </Svg>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>

                {/* Step 2: Daily Sliders */}
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.roadmapCardWrapper}>
                  <LinearGradient 
                    colors={dailySlidersCount > 0 ? ['#64C59A', '#4CAF85'] : ['#fff', '#F8FDFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.roadmapCardInner}
                  >
                    <TouchableOpacity onPress={() => router.push('/daily-sliders')} activeOpacity={0.7}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, dailySlidersCount > 0 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, dailySlidersCount > 0 && styles.roadmapMarkerNumberCompleted]}>
                            2
                          </Text>
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={[styles.roadmapCardTitle, dailySlidersCount > 0 && styles.roadmapCardTitleCompleted]}>Daily Sliders</Text>
                          <Text style={styles.roadmapCardFrequency}>Everyday • {dailySlidersCount} entries</Text>
                          <Text style={[styles.roadmapCardDescription, dailySlidersCount > 0 && styles.roadmapCardDescriptionCompleted]}>
                            Track mood & mindfulness
                          </Text>
                        </View>
                        <View style={styles.roadmapCardProgress}>
                          <View style={[styles.roadmapProgressRing, dailySlidersCount > 0 && styles.roadmapProgressRingCompleted]}>
                            {dailySlidersCount > 0 ? (
                              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            ) : (
                              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <Path d="M8 6H21" stroke="#A8E6CF" strokeWidth="2" />
                                <Path d="M8 12H21" stroke="#A8E6CF" strokeWidth="2" opacity="0.5" />
                                <Path d="M8 18H21" stroke="#A8E6CF" strokeWidth="2" opacity="0.3" />
                                <Circle cx="3" cy="6" r="2" fill="#A8E6CF" />
                              </Svg>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>

                {/* Step 3: Weekly Whispers */}
                <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.roadmapCardWrapper}>
                  <LinearGradient 
                    colors={weeklyWhispersCount > 0 ? ['#64C59A', '#4CAF85'] : ['#fff', '#F8FDFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.roadmapCardInner}
                  >
                    <TouchableOpacity onPress={() => router.push('/weekly-whispers')} activeOpacity={0.7}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, weeklyWhispersCount > 0 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, weeklyWhispersCount > 0 && styles.roadmapMarkerNumberCompleted]}>
                            3
                          </Text>
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={[styles.roadmapCardTitle, weeklyWhispersCount > 0 && styles.roadmapCardTitleCompleted]}>Weekly Whispers</Text>
                          <Text style={styles.roadmapCardFrequency}>Weekly • {weeklyWhispersCount} submissions</Text>
                          <Text style={[styles.roadmapCardDescription, weeklyWhispersCount > 0 && styles.roadmapCardDescriptionCompleted]}>
                            Reflect deeply
                          </Text>
                        </View>
                        <View style={styles.roadmapCardProgress}>
                          <View style={[styles.roadmapProgressRing, weeklyWhispersCount > 0 && styles.roadmapProgressRingCompleted]}>
                            {weeklyWhispersCount > 0 ? (
                              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            ) : (
                              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <Path d="M19 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V6C21 4.9 20.1 4 19 4Z" stroke="#A8E6CF" strokeWidth="2" />
                                <Path d="M7 9H17" stroke="#A8E6CF" strokeWidth="2" opacity="0.5" />
                              </Svg>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>

                {/* Step 4: Core Insights */}
                <Animated.View entering={FadeIn.delay(400).duration(600)} style={[styles.roadmapCardWrapper, { marginBottom: 0 }]}>
                  <LinearGradient 
                    colors={coreInsightsCount >= 4 ? ['#64C59A', '#4CAF85'] : ['#fff', '#F8FDFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.roadmapCardInner}
                  >
                    <TouchableOpacity onPress={() => router.push('/main-questionnaire')} activeOpacity={0.7}>
                      <View style={styles.roadmapCardContent}>
                        <View style={[styles.roadmapMarker, coreInsightsCount >= 4 && styles.roadmapMarkerCompleted]}>
                          <Text style={[styles.roadmapMarkerNumber, coreInsightsCount >= 4 && styles.roadmapMarkerNumberCompleted]}>
                            4
                          </Text>
                        </View>
                        <View style={styles.roadmapCardDetails}>
                          <Text style={[styles.roadmapCardTitle, coreInsightsCount >= 4 && styles.roadmapCardTitleCompleted]}>Core Insights</Text>
                          <Text style={styles.roadmapCardFrequency}>Quarterly • {coreInsightsCount}/4 done</Text>
                          <Text style={[styles.roadmapCardDescription, coreInsightsCount >= 4 && styles.roadmapCardDescriptionCompleted]}>
                            Full assessments
                          </Text>
                        </View>
                        <View style={styles.roadmapCardProgress}>
                          <View style={[styles.roadmapProgressRing, coreInsightsCount >= 4 && styles.roadmapProgressRingCompleted]}>
                            {coreInsightsCount >= 4 ? (
                              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            ) : (
                              <Text style={{ fontSize: 14, fontWeight: '700', color: '#A8E6CF' }}>
                                {coreInsightsCount}/4
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
      {/* Account Modal - Keep similar, add softer transitions */}
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

// Custom Wave Progress Component for mindful wave animation
const WaveProgress = ({ progress, color }: { progress: any; color: string }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -100 + progress.value }],
  }));

  return (
    <View style={styles.waveTrack}>
      <Animated.View style={[styles.waveFill, animatedStyle, { backgroundColor: color }]} />
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 10" preserveAspectRatio="none">
        <Path d="M0 5 Q25 0, 50 5 Q75 10, 100 5 L100 10 L0 10 Z" fill={color} opacity={0.3} />
      </Svg>
    </View>
  );
};

// Styles updates for calm, professional look
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' }, // Transparent for gradient/bg
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 64, paddingBottom: 20, zIndex: 1 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  mindText: { color: '#3bcc97ff' },
  flowText: { color: '#2E8A66' },
  headerTitle: { fontSize: 36, fontWeight: '900', letterSpacing: 0.5 },
  avatarButton: {
    padding: 0,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    resizeMode: 'cover',
    borderRadius: 40,
  },
  avatarContainer: {
    borderRadius: 64,
    backgroundColor: '#F8FDFC',
    padding: 10,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
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
  enhancedProgressGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  enhancedProgressItem: { 
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  circularProgressContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  enhancedProgressNumber: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: '#2E8A66' 
  },
  enhancedProgressLabel: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4, 
    fontWeight: '600',
    textAlign: 'center'
  },
  progressDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressDetailText: {
    fontSize: 13,
    color: '#2E8A66',
    fontWeight: '600',
    marginLeft: 8,
  },
  detailedProgressContainer: {
    marginBottom: 32,
  },
  detailedProgressBar: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 15,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  progressBarValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64C59A',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#E8F5F1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 6,
  },
  progressBarSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
  },
  // Add new styles for missed dates
  missedDatesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8F5F1',
  },
  missedDatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  missedDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  missedDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  missedDateText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 6,
  },
  moreDatesText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  journeySummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  summaryBadgeText: {
    color: '#64C59A',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: '#F8FDFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryStatValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2E8A66',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryFooterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64C59A',
    marginRight: 8,
  },
  summaryFooterText: {
    fontSize: 13,
    color: '#64C59A',
    fontWeight: '600',
  },
  progressCenter: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  waveTrack: { 
    height: 20, 
    backgroundColor: '#E8F5F1', 
    borderRadius: 10, 
    overflow: 'hidden', 
    position: 'relative' 
  },
  waveFill: { 
    height: '100%', 
    width: '200%', 
    backgroundColor: '#64C59A' 
  },
  quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickActionButton: {
    width: (width - 84) / 2,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#A8E6CF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  actionIconContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  actionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  actionSubtitle: { fontSize: 15, color: '#666', lineHeight: 22, opacity: 0.8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 48 },
  modalHandle: { width: 60, height: 6, backgroundColor: '#eee', borderRadius: 3, alignSelf: 'center', marginBottom: 28 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  modalIcon: { width: 44, height: 44, resizeMode: 'contain' },
  logoutRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 32 },
  modalText: { marginLeft: 20, fontSize: 19, color: '#333', fontWeight: '600' },
  logoutText: { color: '#EF4444', fontWeight: '700' },
  
  // Improved Roadmap Map-like UI Styles
  roadmapSection: { marginHorizontal: 16, marginVertical: 32 },
  roadmapBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(168, 230, 207, 0.05)', borderRadius: 32 },
  roadmapPathContainer: { position: 'relative', paddingVertical: 8 },
  roadmapMapPath: { position: 'absolute', left: 32, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(100, 197, 154, 0.3)' },
  roadmapMapPathActive: { backgroundColor: '#A8E6CF' },
  roadmapCards: { position: 'relative', zIndex: 2 },
  roadmapCardWrapper: { marginVertical: 16, marginLeft: 0 },
  roadmapCardInner: { borderRadius: 24, padding: 0, overflow: 'hidden' },
  roadmapCardContent: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  roadmapMarker: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#E8F5F1',
    borderWidth: 3,
    borderColor: '#A8E6CF',
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  roadmapMarkerCompleted: { backgroundColor: '#64C59A', borderColor: '#4CAF85' },
  roadmapMarkerNumber: { fontSize: 24, fontWeight: '700', color: '#64C59A' },
  roadmapMarkerNumberCompleted: { color: '#fff' },
  roadmapCardDetails: { flex: 1 },
  roadmapCardTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  roadmapCardTitleCompleted: { color: '#fff' },
  roadmapCardFrequency: { fontSize: 12, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  roadmapCardDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
  roadmapCardDescriptionCompleted: { color: 'rgba(255, 255, 255, 0.9)' },
  roadmapCardProgress: { marginLeft: 16, alignItems: 'flex-end' },
  roadmapProgressRing: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#E8F5F1' },
  roadmapProgressRingCompleted: { borderColor: 'rgba(255, 255, 255, 0.3)' },
  roadmapProgressPercent: { fontSize: 16, fontWeight: '700', color: '#64C59A' },
  roadmapProgressPercentCompleted: { color: '#fff' },
  roadmapCompletedCheck: { position: 'absolute', right: 16, top: 16, backgroundColor: '#64C59A', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  roadmapSectionTitle: { fontSize: 26, fontWeight: '800', color: '#333', marginBottom: 8, letterSpacing: -0.5 },
  roadmapSectionSubtitle: { fontSize: 14, color: '#999', marginBottom: 24, fontWeight: '500' },
  openProgressButton: { backgroundColor: '#F0FFF6', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});