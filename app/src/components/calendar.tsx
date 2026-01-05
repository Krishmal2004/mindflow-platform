import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSession } from '../../src/contexts/SessionContext';
import { Svg, Path, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

/**
 * Interface defining the structure of calendar events
 */
interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD format
  event_time: string; // HH:MM:SS format
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Calendar screen component that displays a monthly calendar view
 * with mindfulness sessions and other events
 */
export default function CalendarScreen() {
  const { session, loading } = useSession();
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      // Refresh events
      fetchCalendarEvents();
    }, [currentDate])
  );

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  /**
   * Fetches calendar events from the database for the current month
   * including events from adjacent weeks to show complete calendar view
   */
  const fetchCalendarEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Calculate date range for the current view (including padding days)
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Extend the range to include days from previous/next months shown in the calendar
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday of the week containing the 1st

      const endDate = new Date(lastDay);
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

      // Fetch events within range
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', startDate.toISOString().split('T')[0])
        .lte('event_date', endDate.toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;

      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      Alert.alert('Error', 'Failed to fetch calendar events');
    }
  };

  /**
   * Handles pull-to-refresh action
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalendarEvents();
    setRefreshing(false);
  };

  /**
   * Navigates to the previous month
   */
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  /**
   * Navigates to the next month
   */
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  /**
   * Format date as YYYY-MM-DD string for comparison
   */
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  /**
   * Get events for a specific date
   */
  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return calendarEvents.filter(event => event.event_date === dateKey);
  };

  /**
   * Check if a date has a mindfulness session
   */
  const isMindfulnessSession = (date: Date) => {
    const events = getEventsForDate(date);
    return events.some(event => event.title.startsWith('Mindfulness Session'));
  };

  /**
   * Renders the calendar grid with days, events, and indicators
   */
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
      // Removed completed day logic
      const hasMindfulnessSession = isMindfulnessSession(date);
      const events = getEventsForDate(date);
      const hasEvents = events.length > 0;

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            hasMindfulnessSession && styles.mindfulnessDayCell,
            hasEvents && !hasMindfulnessSession && styles.hasEventsCell,
          ]}
          // Removed day completion functionality from press
          onPress={() => handleDayPress(date)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            hasMindfulnessSession && styles.mindfulnessDayText,
          ]}>
            {day}
          </Text>

          {hasMindfulnessSession && (
            <View style={styles.sessionIndicator}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="#9C27B0">
                <Circle cx="12" cy="12" r="10" />
              </Svg>
            </View>
          )}
          {hasEvents && !hasMindfulnessSession && (
            <View style={styles.eventIndicator}>
              <View style={styles.eventDot} />
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
              <View style={[styles.legendColor, styles.mindfulnessLegend]}></View>
              <Text style={styles.legendText}>Mindfulness Session</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.todayLegend]}></View>
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.eventLegend]}></View>
              <Text style={styles.legendText}>Events</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  /**
   * Handles when a day is pressed on the calendar
   * Shows events for the selected date if any exist
   */
  const handleDayPress = (date: Date) => {
    // Show events for the selected date
    const events = getEventsForDate(date);
    if (events.length > 0) {
      const eventMessages = events.map(e => `${e.title}${e.description ? `\n${e.description}` : ''}`).join('\n\n');
      Alert.alert(
        `Events on ${date.toDateString()}`,
        eventMessages,
        [{ text: "OK" }]
      );
      return;
    }

    // Default action for date selection
    Alert.alert(
      "Date Selected",
      `Selected date: ${date.toDateString()}`,
      [{ text: "OK" }]
    );
  };

  /**
   * Gets upcoming mindfulness sessions for display in the events section
   */
  const getUpcomingMindfulnessSessions = () => {
    const today = new Date();
    const upcomingSessions = calendarEvents
      .filter(event =>
        event.title.startsWith('Mindfulness Session') &&
        new Date(event.event_date) >= today
      )
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 4);

    return upcomingSessions;
  };

  return (
    <View style={styles.container}>
      {/* Fixed header section that stays at the top */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Your mindfulness journey, day by day</Text>
      </View>

      {/* Scrollable content area that scrolls below the fixed header */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderCalendar()}

        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Mindfulness Sessions</Text>

          {/* Upcoming Sessions List */}
          {(() => {
            const upcomingSessions = getUpcomingMindfulnessSessions();

            if (upcomingSessions.length === 0) {
              return (
                <View style={styles.noEventsContainer}>
                  <Text style={styles.noEventsText}>No upcoming mindfulness sessions</Text>
                </View>
              );
            }

            return upcomingSessions.map((event, index) => {
              const eventDate = new Date(event.event_date);
              const isCompleted = event.is_completed;

              return (
                <View key={event.id} style={[styles.eventCard, isCompleted && styles.eventCardCompleted]}>
                  <View style={styles.eventIcon}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="#9C27B0">
                      <Circle cx="12" cy="12" r="10" />
                    </Svg>
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>{eventDate.toDateString()}</Text>
                    {event.description ? (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.eventStatus}>
                    {isCompleted ? (
                      <Text style={styles.eventStatusTextCompleted}>Completed</Text>
                    ) : (
                      <Text style={styles.eventStatusTextPending}>Pending</Text>
                    )}
                  </View>
                </View>
              );
            });
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#F8FDFC',
    zIndex: 10,
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
  mindfulnessDayCell: {
    backgroundColor: '#F5EEF8',
  },
  mindfulnessDayText: {
    color: '#9C27B0',
    fontWeight: '600',
  },
  hasEventsCell: {
    backgroundColor: '#E3F2FD',
  },
  // Removed checkIcon styles
  sessionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2196F3',
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
  mindfulnessLegend: {
    backgroundColor: '#9C27B0',
  },
  todayLegend: {
    backgroundColor: '#64C59A',
    borderWidth: 1,
    borderColor: '#fff',
  },
  eventLegend: {
    backgroundColor: '#2196F3',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  eventsSection: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  noEventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
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
  eventDescription: {
    fontSize: 12,
    color: '#999',
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