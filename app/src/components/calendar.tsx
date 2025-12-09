// app/calendar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSession } from '../../src/contexts/SessionContext';
import { Svg, Path, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const { session, loading } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [mindfulnessSessions, setMindfulnessSessions] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading Calendar...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Please sign in to view your mindfulness journey</Text>
      </View>
    );
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Check if a date is a Thursday (4 = Thursday in JS Date)
  const isThursday = (date: Date) => date.getDay() === 4;

  // Format date as YYYY-MM-DD string for comparison
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cells = [];

    // Weekday headers
    weekDays.forEach(day => {
      cells.push(
        <View key={day} style={styles.weekDayCell}>
          <Text style={styles.weekDayText}>{day}</Text>
        </View>
      );
    });

    // Empty cells before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isCompleted = completedDays.has(dateKey);
      const isMindfulnessSession = isThursday(date);
      const hasMindfulnessSession = isMindfulnessSession && mindfulnessSessions.has(dateKey);

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            isCompleted && styles.completedCell,
            isMindfulnessSession && styles.mindfulnessDayCell,
          ]}
          onPress={() => handleDayPress(date, isMindfulnessSession)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isCompleted && styles.completedText,
            isMindfulnessSession && styles.mindfulnessDayText,
          ]}>
            {day}
          </Text>
          {isCompleted && !isToday && (
            <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.checkIcon}>
              <Path
                d="M20 6L9 17L4 12"
                stroke="#64C59A"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          {isMindfulnessSession && !isCompleted && (
            <View style={styles.sessionIndicator}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="#9C27B0">
                <Circle cx="12" cy="12" r="10" />
              </Svg>
            </View>
          )}
          {hasMindfulnessSession && !isToday && (
            <View style={styles.sessionCompletedIndicator}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="#9C27B0">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#fff"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.calendarCard}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>{cells}</View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.completedLegend]}></View>
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.mindfulnessLegend]}></View>
              <Text style={styles.legendText}>Mindfulness Session</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.todayLegend]}></View>
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const handleDayPress = (date: Date, isMindfulnessSession: boolean) => {
    const dateKey = formatDateKey(date);
    
    if (isMindfulnessSession) {
      // Toggle mindfulness session attendance
      setMindfulnessSessions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dateKey)) {
          newSet.delete(dateKey);
        } else {
          newSet.add(dateKey);
        }
        return newSet;
      });
      
      Alert.alert(
        "Mindfulness Session",
        `Marked mindfulness session for ${date.toDateString()} as ${mindfulnessSessions.has(dateKey) ? 'not attended' : 'attended'}!`,
        [{ text: "OK" }]
      );
    } else {
      // Toggle regular day completion
      setCompletedDays(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dateKey)) {
          newSet.delete(dateKey);
        } else {
          newSet.add(dateKey);
        }
        return newSet;
      });
      
      Alert.alert(
        "Day Status",
        `Marked ${date.toDateString()} as ${completedDays.has(dateKey) ? 'not completed' : 'completed'}!`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Your mindfulness journey, day by day</Text>
      </View>

      {renderCalendar()}

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Upcoming Mindfulness Sessions</Text>
        
        {/* Generate upcoming Thursday sessions */}
        {(() => {
          const upcomingSessions = [];
          const today = new Date();
          let checkDate = new Date(today);
          
          // Find next 4 Thursdays
          for (let i = 0; i < 4; i++) {
            // Move to next Thursday
            while (checkDate.getDay() !== 4 || checkDate <= today) {
              checkDate.setDate(checkDate.getDate() + 1);
            }
            
            const dateKey = formatDateKey(checkDate);
            const isAttended = mindfulnessSessions.has(dateKey);
            
            upcomingSessions.push(
              <View key={i} style={[styles.eventCard, isAttended && styles.eventCardCompleted]}>
                <View style={styles.eventIcon}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="#9C27B0">
                    <Circle cx="12" cy="12" r="10" />
                  </Svg>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Mindfulness Session</Text>
                  <Text style={styles.eventTime}>{checkDate.toDateString()}</Text>
                </View>
                <View style={styles.eventStatus}>
                  {isAttended ? (
                    <Text style={styles.eventStatusTextCompleted}>Attended</Text>
                  ) : (
                    <Text style={styles.eventStatusTextPending}>Pending</Text>
                  )}
                </View>
              </View>
            );
            
            // Move to next day for next iteration
            checkDate.setDate(checkDate.getDate() + 1);
          }
          
          return upcomingSessions;
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  headerSection: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E8A66',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  calendarCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 12,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  todayCell: {
    backgroundColor: '#64C59A',
    borderRadius: 50,
  },
  todayText: {
    color: '#fff',
    fontWeight: '700',
  },
  completedCell: {
    position: 'relative',
  },
  completedText: {
    color: '#64C59A',
    fontWeight: '600',
  },
  mindfulnessDayCell: {
    backgroundColor: '#F5EEF8',
  },
  mindfulnessDayText: {
    color: '#9C27B0',
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    bottom: -6,
  },
  sessionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  sessionCompletedIndicator: {
    position: 'absolute',
    bottom: -6,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  completedLegend: {
    backgroundColor: '#64C59A',
  },
  mindfulnessLegend: {
    backgroundColor: '#9C27B0',
  },
  todayLegend: {
    backgroundColor: '#64C59A',
    borderWidth: 1,
    borderColor: '#fff',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  eventsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  eventCardCompleted: {
    backgroundColor: '#F0F9F6',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  eventStatusTextPending: {
    color: '#FF9500',
    fontWeight: '600',
    fontSize: 14,
  },
  eventStatusTextCompleted: {
    color: '#64C59A',
    fontWeight: '600',
    fontSize: 14,
  },
});