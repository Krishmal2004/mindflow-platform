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
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [streak] = useState(12);
  const [completed] = useState(48);
  const [consistency] = useState(95);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % MINDFULNESS_TIPS.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
        <TouchableOpacity onPress={() => setShowAccountModal(true)}>
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
                  strokeDashoffset={440 - (440 * streak) / 30}
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
              </View>
              <View style={styles.smallStat}>
                <Text style={styles.smallNumber}>{consistency}%</Text>
                <Text style={styles.smallLabel}>Consistency</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.card, styles.cardCalm]} onPress={onNavigateToAboutMe}>
              <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <Path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <Circle cx="12" cy="7" r="4" stroke="#fff" strokeWidth="2.5" />
              </Svg>
              <Text style={styles.cardTitle}>About Me</Text>
              <Text style={styles.cardDesc}>One-time questions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.cardWeekly]}>
              <View style={styles.badge}><Text style={styles.badgeText}>Weekly</Text></View>
              <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#fff" strokeWidth="2.5" />
                <Path d="M16 2V6" stroke="#fff" strokeWidth="2.5" />
                <Path d="M8 2V6" stroke="#fff" strokeWidth="2.5" />
              </Svg>
              <Text style={styles.cardTitle}>Weekly Questions</Text>
              <Text style={styles.cardDesc}>Available this week</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.cardDeep]}>
              <Svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
                <Path d="M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2Z" />
                <Path d="M12 10C14.2091 10 16 11.7909 16 14C16 16.2091 14.2091 18 12 18C9.79086 18 8 16.2091 8 14C8 11.7909 9.79086 10 12 10Z" />
                <Path d="M12 20C14.2091 20 16 18.2091 16 16C16 13.7909 14.2091 12 12 12C9.79086 12 8 13.7909 8 16C8 18.2091 9.79086 20 12 20Z" />
              </Svg>
              <Text style={styles.cardTitle}>Main Questions</Text>
              <Text style={styles.cardDesc}>Deeper mindfulness</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.cardDaily]}>
              <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <Path d="M8 6H21" stroke="#fff" strokeWidth="2.5" />
                <Path d="M8 12H21" stroke="#fff" strokeWidth="2.5" />
                <Path d="M8 18H21" stroke="#fff" strokeWidth="2.5" />
                <Path d="M3 6H3.01" stroke="#fff" strokeWidth="3" />
                <Path d="M3 12H3.01" stroke="#fff" strokeWidth="3" />
                <Path d="M3 18H3.01" stroke="#fff" strokeWidth="3" />
              </Svg>
              <Text style={styles.cardTitle}>Basic Questions</Text>
              <Text style={styles.cardDesc}>Daily habits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.calendarCard}>
            {['Wed\n14', 'Thu\n15', 'Fri\n16', 'Sat\n17', 'Sun\n18', 'Mon\n19', 'Tue\n20'].map((d, i) => {
              const isActive = i >= 3 && i <= 5;
              return (
                <View key={i} style={styles.dayItem}>
                  <Text style={styles.dayLabel}>{d.split('\n')[0]}</Text>
                  <View style={[styles.dayCircle, isActive && styles.activeDayCircle]}>
                    <Text style={[styles.dayNumber, isActive && styles.activeDayNumber]}>{d.split('\n')[1]}</Text>
                  </View>
                  {isActive && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.checkIcon}>
                      <Path d="M20 6L9 17L4 12" stroke="#64C59A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Account Modal */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAccountModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalRow} onPress={() => { setShowAccountModal(false); /* Navigate to Account */ }}>
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
  avatarContainer: { borderRadius: 60, backgroundColor: '#E8F5F1', padding: 8, borderWidth: 4, borderColor: '#fff', shadowColor: '#64C59A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  tipCard: { marginHorizontal: 24, marginTop: 20, borderRadius: 32, padding: 32, shadowColor: '#64C59A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 25, elevation: 20 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tipLabel: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 10 },
  tipText: { color: '#fff', fontSize: 20, lineHeight: 30, fontWeight: '500' },
  tipDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#fff', width: 24 },
  section: { paddingHorizontal: 24, marginTop: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  progressGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ringCard: { position: 'relative' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ringNumber: { fontSize: 38, fontWeight: '800', color: '#2E8A66', marginTop: 8 },
  ringLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  smallStats: { gap: 16 },
  smallStat: { backgroundColor: '#fff', padding: 20, borderRadius: 28, width: 130, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  smallNumber: { fontSize: 36, fontWeight: '800', color: '#2E8A66' },
  smallLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (width - 72) / 2, backgroundColor: '#fff', borderRadius: 32, padding: 28, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 25, elevation: 16 },
  cardCalm: { backgroundColor: '#64C59A' },
  cardWeekly: { backgroundColor: '#2E8A66' },
  cardDeep: { backgroundColor: '#1A5F4A' },
  cardDaily: { backgroundColor: '#4CAF85' },
  badge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#FF9500', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginTop: 20 },
  cardDesc: { color: '#fff', fontSize: 14, opacity: 0.9, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  calendarCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 32, paddingVertical: 24, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  dayItem: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 12, color: '#999', marginBottom: 8 },
  dayCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { backgroundColor: '#64C59A' },
  dayNumber: { fontSize: 17, fontWeight: '600', color: '#666' },
  activeDayNumber: { color: '#fff', fontWeight: '700' },
  checkIcon: { position: 'absolute', bottom: -12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 },
  modalHandle: { width: 50, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  logoutRow: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 28 },
  modalText: { marginLeft: 16, fontSize: 18, color: '#333', fontWeight: '500' },
  logoutText: { color: '#EF4444', fontWeight: '600' },
});