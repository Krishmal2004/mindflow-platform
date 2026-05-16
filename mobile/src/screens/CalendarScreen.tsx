import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Svg, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { Colors } from '../constants/colors';

// Interface
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

const DASHBOARD_GRADIENT: [string, string, string] = ['#F0FDF4', '#F8FAFC', '#FFFFFF'];


export default function CalendarScreen() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
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

    const fetchCalendarEvents = async () => {
        try {
            setIsLoadingEvents(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Calculate date range for the current view
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const startDate = new Date(firstDay);
            startDate.setDate(firstDay.getDate() - firstDay.getDay());

            const endDate = new Date(lastDay);
            endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const response = await fetch(`${API_URL}/api/calendar/events?start=${startStr}&end=${endStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCalendarEvents(data);
            } else {
                console.log("Failed to fetch events");
            }

        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCalendarEvents();
        setRefreshing(false);
    };

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

    const formatDateKey = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getEventsForDate = (date: Date) => {
        const dateKey = formatDateKey(date);
        return calendarEvents.filter(event => event.event_date === dateKey);
    };

    const isMindfulnessSession = (date: Date) => {
        const events = getEventsForDate(date);
        return events.some(event => event.title.startsWith('Mindfulness Session'));
    };

    const handleDayPress = (date: Date) => {
        const events = getEventsForDate(date);
        setSelectedDateEvents({ date, events });
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

        weekDays.forEach(day => {
            cells.push(
                <View key={day} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                </View>
            );
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
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
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={20} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {monthNames[month]} {year}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {isLoadingEvents ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#64C59A" />
                        </View>
                    ) : (
                        <View style={styles.grid}>{cells}</View>
                    )}

                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.mindfulnessLegend]}></View>
                            <Text style={styles.legendText}>Mindfulness</Text>
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

    const upcomingMindfulnessSessions = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return calendarEvents
            .filter(event => new Date(event.event_date) >= today)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .slice(0, 4);
    }, [calendarEvents]);

    return (
        <LinearGradient
            colors={DASHBOARD_GRADIENT}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Calendar</Text>
                    <Text style={styles.subtitle}>Your Journey</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {renderCalendar()}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Events</Text>

                    {upcomingMindfulnessSessions.length === 0 ? (
                        <View style={styles.noEventsContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.noEventsText}>No upcoming events</Text>
                        </View>
                    ) : (
                        upcomingMindfulnessSessions.map((event) => {
                            const eventDate = new Date(event.event_date);
                            const isCompleted = event.is_completed;
                            const isMindfulness = event.title.startsWith('Mindfulness Session');

                            return (
                                <View key={event.id} style={[styles.eventCard, isCompleted && styles.eventCardCompleted]}>
                                    <View style={[styles.eventIcon, isMindfulness ? styles.iconMindfulness : styles.iconDefault]}>
                                        <Ionicons
                                            name={isMindfulness ? "flower-outline" : "calendar-outline"}
                                            size={24}
                                            color={isMindfulness ? "#9C27B0" : "#0EA5E9"}
                                        />
                                    </View>
                                    <View style={styles.eventContent}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        <Text style={styles.eventTime}>
                                            {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {event.event_time ? ` • ${event.event_time.slice(0, 5)}` : ''}
                                        </Text>
                                        {event.description ? (
                                            <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
                                        ) : null}
                                    </View>
                                    <View style={styles.eventStatus}>
                                        {isCompleted ? (
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        ) : (
                                            <Ionicons name="radio-button-off" size={20} color="#F59E0B" />
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!selectedDateEvents}
                onRequestClose={() => setSelectedDateEvents(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setSelectedDateEvents(null)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedDateEvents?.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedDateEvents(null)}>
                                <Ionicons name="close-circle" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {selectedDateEvents?.events && selectedDateEvents.events.length > 0 ? (
                                selectedDateEvents.events.map((event, index) => (
                                    <View key={index} style={styles.modalEventItem}>
                                        <View style={styles.modalEventRow}>
                                            <Text style={styles.modalEventTitle}>{event.title}</Text>
                                            {event.is_completed && <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />}
                                        </View>
                                        <Text style={styles.modalEventTime}>
                                            {event.event_time ? event.event_time.slice(0, 5) : 'All Day'}
                                        </Text>
                                        {event.description && <Text style={styles.modalEventDesc}>{event.description}</Text>}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.modalNoEvents}>
                                    <Text style={styles.modalNoEventsText}>No events for this date.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background handled by LinearGradient
    },
    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    content: {
        flex: 1,
        marginTop: 16,
    },
    calendarCard: {
        marginHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 24,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    weekDayCell: {
        width: `${100 / 7}%`,
        paddingVertical: 8,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    dayText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    todayCell: {
        backgroundColor: '#10B981', // Dashboard Success Green
        borderRadius: 20,
    },
    todayText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    mindfulnessDayCell: {
        backgroundColor: '#F3E8FF',
        borderRadius: 20,
    },
    mindfulnessDayText: {
        color: '#9333EA',
        fontWeight: '600',
    },
    hasEventsCell: {
        backgroundColor: '#E0F2FE',
        borderRadius: 20,
    },
    sessionIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    eventIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
    },
    eventDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#0EA5E9',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    mindfulnessLegend: {
        backgroundColor: '#9333EA',
    },
    todayLegend: {
        backgroundColor: '#10B981',
    },
    eventLegend: {
        backgroundColor: '#0EA5E9',
    },
    legendText: {
        fontSize: 11,
        color: '#64748B',
    },
    section: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    noEventsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    noEventsText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 12,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    eventCardCompleted: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    eventIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconMindfulness: {
        backgroundColor: '#F3E8FF',
    },
    iconDefault: {
        backgroundColor: '#E0F2FE',
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    eventTime: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    eventDescription: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    eventStatus: {
        marginLeft: 12,
    },
    loadingContainer: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    modalEventItem: {
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    modalEventRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    modalEventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    modalEventTime: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    modalEventDesc: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    modalNoEvents: {
        padding: 24,
        alignItems: 'center',
    },
    modalNoEventsText: {
        color: '#94A3B8',
        fontStyle: 'italic',
    },
});
