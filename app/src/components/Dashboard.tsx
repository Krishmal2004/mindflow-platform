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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { supabase } from '../lib/supabase';

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

// Reusable Brain Avatar Component (same as Account screen)
const BrainAvatar = ({ size = 48 }: { size?: number }) => (
  <View style={[styles.avatarContainer, { width: size + 16, height: size + 16 }]}>
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#64C59A" />
          <Stop offset="100%" stopColor="#4CAF85" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="58" fill="url(#grad)" opacity="0.15" />
      <Path
        d="M60 20 C40 20, 30 35, 30 55 C30 75, 45 90, 60 90 C75 90, 90 75, 90 55 C90 35, 80 20, 60 20 Z"
        stroke="#64C59A"
        strokeWidth="4"
        fill="none"
      />
      <Path d="M45 40 Q40 50, 45 60 Q40 70, 45 80" stroke="#64C59A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M38 45 Q35 55, 38 65 Q35 75, 38 82" stroke="#64C59A" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <Path d="M75 40 Q80 50, 75 60 Q80 70, 75 80" stroke="#64C59A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M82 45 Q85 55, 82 65 Q85 75, 82 82" stroke="#64C59A" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <Circle cx="60" cy="48" r="8" fill="#64C59A" opacity="0.25" />
      <Circle cx="60" cy="48" r="4" fill="#64C59A" />
      <Circle cx="60" cy="60" r="48" stroke="#64C59A" strokeWidth="1.5" fill="none" opacity="0.3" />
    </Svg>
  </View>
);

export default function Dashboard({ session, onNavigateToAboutMe }: { session: any; onNavigateToAboutMe: () => void }) {
  const router = useRouter();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % MINDFULNESS_TIPS.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user progress data
  useEffect(() => {
    fetchUserProgress();
  }, [session]);

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
      
      setStreak(currentStreak);
      setCompleted(completionCount);
      setConsistency(consistencyPercentage);
      setWeeklyProgress(weeklyProgressPercentage);
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
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert("Error", error.message);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindFlow</Text>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={styles.avatarButton}>
          <BrainAvatar size={48} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Daily Mindfulness Tip */}
        <Animated.View entering={FadeIn.duration(800)}>
          <LinearGradient colors={['#64C59A', '#4CAF85']} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <Path d="M12 2L13.09 8.26L22 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L2 9.27L10.91 8.26L12 2Z" />
              </Svg>
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

        {/* Progress Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressGrid}>
            <View style={styles.ringCard}>
              <Svg width="160" height="160" viewBox="0 0 160 160">
                <Circle cx="80" cy="80" r="70" stroke="#E8F5E9" strokeWidth="14" fill="none" />
                <Circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#64C59A"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * Math.min(100, streak)) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="#FF9500">
                  <Path d="M8.5 19C8.5 19 7 19 7 17.5C7 15.5 9.5 14.5 9.5 11C9.5 11 10 6 14.5 6.5C17 7 19 9.5 19 13.5C19 17.5 16 19.5 12 19.5C10.5 19.5 8.5 19 8.5 19Z" />
                </Svg>
                <Text style={styles.ringNumber}>{streak}</Text>
                <Text style={styles.ringLabel}>Day Streak</Text>
              </View>
            </View>

            <View style={styles.smallStats}>
              <View style={styles.smallStat}>
                <Text style={styles.smallNumber}>{completed}</Text>
                <Text style={styles.smallLabel}>Completed</Text>
                <Text style={styles.smallSubLabel}>Last 6 Months</Text>
              </View>
              <View style={styles.smallStat}>
                <Text style={styles.smallNumber}>{consistency}%</Text>
                <Text style={styles.smallLabel}>Consistency</Text>
                <Text style={styles.smallSubLabel}>Last 30 Days</Text>
              </View>
            </View>
          </View>
          
          {/* Weekly Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarHeader}>
              <Text style={styles.progressBarLabel}>Weekly Questions</Text>
              <Text style={styles.progressBarValue}>{weeklyProgress}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <Animated.View 
                style={[styles.progressBarFill, { width: weeklyProgress > 0 ? `${weeklyProgress}%` : '0%' }]} 
                entering={FadeIn.duration(600)}
              />
            </View>
            <Text style={styles.progressBarSubtitle}>Completed {Math.floor((weeklyProgress * 26) / 100)} of 26 weeks in the last 6 months</Text>
          </View>
        </Animated.View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={onNavigateToAboutMe}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#64C59A20' }]}>
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <Path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="12" cy="7" r="4" stroke="#64C59A" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.actionTitle}>About Me</Text>
              <Text style={styles.actionSubtitle}>One-time questions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/weekly-questions')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#4CAF8520' }]}>
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#4CAF85" strokeWidth="2" />
                  <Path d="M16 2V6" stroke="#4CAF85" strokeWidth="2" />
                  <Path d="M8 2V6" stroke="#4CAF85" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.actionTitle}>Weekly Questions</Text>
              <Text style={styles.actionSubtitle}>Available this week</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/daily-sliders')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#2E8A6620' }]}>
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <Path d="M8 6H21" stroke="#2E8A66" strokeWidth="2" />
                  <Path d="M8 12H21" stroke="#2E8A66" strokeWidth="2" />
                  <Path d="M8 18H21" stroke="#2E8A66" strokeWidth="2" />
                  <Path d="M3 6H3.01" stroke="#2E8A66" strokeWidth="3" />
                  <Path d="M3 12H3.01" stroke="#2E8A66" strokeWidth="3" />
                  <Path d="M3 18H3.01" stroke="#2E8A66" strokeWidth="3" />
                </Svg>
              </View>
              <Text style={styles.actionTitle}>Daily Sliders</Text>
              <Text style={styles.actionSubtitle}>Track stress & sleep</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/progress')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#1A5F4A20' }]}>
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#1A5F4A" strokeWidth="2"/>
                  <Path d="M12 6V12L16 14" stroke="#1A5F4A" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.actionTitle}>Progress</Text>
              <Text style={styles.actionSubtitle}>View your stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Account Modal */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAccountModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalRow} onPress={() => { setShowAccountModal(false); router.push('/account'); }}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="7" r="4" stroke="#333" strokeWidth="2" />
                <Path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#333" strokeWidth="2" />
              </Svg>
              <Text style={styles.modalText}>Manage Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalRow, styles.logoutRow]} onPress={handleSignOut}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
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
  container: { flex: 1, backgroundColor: '#F8FDFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#2E8A66' },
  avatarButton: { 
    padding: 4,
    borderRadius: 30,
    backgroundColor: '#fff',
    shadowColor: '#64C59A', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 15 
  },
  avatarContainer: { 
    borderRadius: 60, 
    backgroundColor: '#E8F5F1', 
    padding: 8, 
    borderWidth: 4, 
    borderColor: '#fff' 
  },
  tipCard: { marginHorizontal: 24, marginTop: 20, borderRadius: 32, padding: 32, shadowColor: '#64C59A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 25, elevation: 20 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tipLabel: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 10 },
  tipText: { color: '#fff', fontSize: 20, lineHeight: 30, fontWeight: '500' },
  tipDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#fff', width: 24 },
  section: { paddingHorizontal: 24, marginTop: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  progressGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  ringCard: { position: 'relative' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ringNumber: { fontSize: 38, fontWeight: '800', color: '#2E8A66', marginTop: 8 },
  ringLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  smallStats: { gap: 16 },
  smallStat: { backgroundColor: '#fff', padding: 20, borderRadius: 28, width: 130, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  smallNumber: { fontSize: 36, fontWeight: '800', color: '#2E8A66' },
  smallLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  smallSubLabel: { fontSize: 11, color: '#999' },
  // Progress bar styles
  progressBarContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  progressBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressBarLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  progressBarValue: { fontSize: 16, fontWeight: '700', color: '#2E8A66' },
  progressBarTrack: { height: 12, backgroundColor: '#E8F5F1', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#64C59A', borderRadius: 6 },
  progressBarSubtitle: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 },
  // Quick Actions Styles
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 72) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 },
  modalHandle: { width: 50, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  logoutRow: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 28 },
  modalText: { marginLeft: 16, fontSize: 18, color: '#333', fontWeight: '500' },
  logoutText: { color: '#EF4444', fontWeight: '600' },
});