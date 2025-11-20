import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Mock data for demonstration
const mindfulnessTips = [
  "Take a moment to breathe deeply. Notice how your body feels right now, without judgment.",
  "Focus on the present moment. What do you see, hear, and feel right now?",
  "Practice gratitude by thinking of three things you're thankful for today.",
  "Take a mindful walk, paying attention to each step and your surroundings."
];

const quickAccessCards = [
  {
    id: 'about',
    title: 'About Me',
    description: 'One-time questions',
    progress: 0
  },
  {
    id: 'weekly',
    title: 'Weekly Questions',
    description: 'Deeper reflections',
    progress: 0
  },
  {
    id: 'main',
    title: 'Main Questions',
    description: 'Deeper mindfulness',
    progress: 25
  },
  {
    id: 'basic',
    title: 'Basic Questions',
    description: 'Daily habits',
    progress: 60
  }
];

const recentActivities = [
  { id: '1', text: 'Completed Main Question', time: '2h ago' },
  { id: '2', text: 'New Weekly Challenge', time: '5h ago' },
  { id: '3', text: 'Finished Basic Habit', time: '1d ago' },
  { id: '4', text: 'Started About Me Section', time: '2d ago' }
];

// Simple calendar component
const CalendarStrip = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dates = [];
  
  // Generate 7 days starting from today
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };
  
  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.sectionTitle}>This Week</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
        {dates.map((date, index) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity 
              key={index}
              style={[styles.calendarDay, isSelected && styles.selectedCalendarDay]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.calendarDayText, isSelected && styles.selectedCalendarDayText]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const QuickAccessCard = ({ item, onPress }: { item: typeof quickAccessCards[0], onPress: (id: string) => void }) => (
  <TouchableOpacity 
    style={styles.quickAccessCard} 
    onPress={() => onPress(item.id)}
    activeOpacity={0.8}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.cardIcon, { backgroundColor: getCardColor(item.id) }]} />
      <Text style={styles.cardTitle}>{item.title}</Text>
    </View>
    <Text style={styles.cardDescription}>{item.description}</Text>
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${item.progress}%`,
              backgroundColor: getCardColor(item.id)
            }
          ]} 
        />
      </View>
      <Text style={styles.cardProgress}>{item.progress}%</Text>
    </View>
  </TouchableOpacity>
);

const ActivityItem = ({ item }: { item: typeof recentActivities[0] }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: getActivityColor(item.text) }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityText}>{item.text}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  </View>
);

// Helper functions for colors
function getCardColor(id: string) {
  switch (id) {
    case 'about': return '#64C59A';
    case 'weekly': return '#2E8A66';
    case 'main': return '#333333';
    case 'basic': return '#64C59A';
    default: return '#64C59A';
  }
}

function getActivityColor(text: string) {
  if (text.includes('Completed')) return '#64C59A';
  if (text.includes('New')) return '#2E8A66';
  if (text.includes('Finished')) return '#333333';
  return '#64C59A';
}

export default function Dashboard({ session, onNavigateToAboutMe }: { session: Session, onNavigateToAboutMe: () => void }) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [streak, setStreak] = useState(12); // Mock streak data
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Rotate tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % mindfulnessTips.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleCardPress = (id: string) => {
    if (id === 'about') {
      onNavigateToAboutMe();
    }
    // Handle other card presses as needed
  };
  
  async function confirmSignOut() {
    try {
      await supabase.auth.signOut();
      setShowSignOutModal(false);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindFlow</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => setShowSignOutModal(true)}
        >
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>👨‍💻</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        {/* Daily Mindfulness Tip Banner */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipTitle}>Daily Mindfulness Tip</Text>
          <Text style={styles.tipText}>"{mindfulnessTips[currentTipIndex]}"</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>Today's Focus – Day {streak} Streak</Text>
          </View>
        </View>
        
        {/* Horizontal Calendar */}
        <CalendarStrip />
        
        {/* Quick Access Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.cardsContainer}>
            {quickAccessCards.map(card => (
              <QuickAccessCard key={card.id} item={card} onPress={handleCardPress} />
            ))}
          </View>
        </View>
        
        {/* Recent Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {recentActivities.map(activity => (
              <ActivityItem key={activity.id} item={activity} />
            ))}
          </View>
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Sign Out Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.signOutButton]}
                onPress={confirmSignOut}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8A66',
  },
  profileButton: {
    padding: 4,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tipBanner: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tipTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  streakContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E8A66',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarScroll: {
    marginVertical: 10,
  },
  calendarDay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCalendarDay: {
    backgroundColor: '#64C59A',
    borderColor: '#64C59A',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  selectedCalendarDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 'auto',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardProgress: {
    fontSize: 12,
    color: '#2E8A66',
    fontWeight: '600',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    marginLeft: 10,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});