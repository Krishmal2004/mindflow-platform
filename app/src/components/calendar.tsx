// app/calendar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSession } from '../../src/contexts/SessionContext';
import { Svg, Path, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const { session, loading } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());

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
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isCompleted = day <= 17; // Mock: days 1–17 completed

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            isCompleted && styles.completedCell,
          ]}
          onPress={() => console.log(`Tapped: ${year}-${month + 1}-${day}`)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isCompleted && styles.completedText,
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

          <View style={styles.streakFooter}>
            <View style={styles.fireBadge}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="#FF9500">
                <Path d="M8.5 19C8.5 19 7 19 7 17.5C7 15.5 9.5 14.5 9.5 11C9.5 11 10 6 14.5 6.5C17 7 19 9.5 19 13.5C19 17.5 16 19.5 12 19.5C10.5 19.5 8.5 19 8.5 19Z" />
              </Svg>
              <Text style={styles.streakText}>12 Day Streak</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Your mindfulness journey, day by day</Text>
      </View>

      {renderCalendar()}

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#9C27B0">
              <Path d="M12 2L13.09 8.26L22 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L2 9.27L10.91 8.26L12 2Z"/>
            </Svg>
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>New Weekly Challenge</Text>
            <Text style={styles.eventTime}>Starts Monday • 3 days left</Text>
          </View>
        </View>

        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#2E8A66">
              <Path d="M12 8V12L15 15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <Circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none"/>
            </Svg>
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>Mindful Breathing Session</Text>
            <Text style={styles.eventTime}>Thursday, 7:00 PM</Text>
          </View>
        </View>
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
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 15,
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
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 20,
    color: '#333',
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
  },
  dayText: {
    fontSize: 16,
    color: '#333',
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
  checkIcon: {
    position: 'absolute',
    bottom: -6,
  },
  streakFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  streakText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9500',
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
});