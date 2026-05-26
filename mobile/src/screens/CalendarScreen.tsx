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
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Svg, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../lib/apiClient';
import { Colors } from '../constants/colors';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Interface
interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export default function CalendarScreen() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useFocusEffect(
        useCallback(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: false });
            }
            fetchCalendarEvents();
        }, [currentDate])
    );

    const fetchCalendarEvents = async () => {
        try {
            setIsLoadingEvents(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const startDate = new Date(firstDay);
            startDate.setDate(firstDay.getDate() - firstDay.getDay());

            const endDate = new Date(lastDay);
            endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const { ok, data } = await apiFetch<CalendarEvent[]>(
                `/api/calendar/events?start=${startStr}&end=${endStr}`
            );
            if (ok && data) setCalendarEvents(data);
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
                    activeOpacity={0.7}
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
                            <Svg width="10" height="10" viewBox="0 0 24 24" fill="#9C27B0">
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
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={20} color="#2D3436" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {monthNames[month]} {year}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton} activeOpacity={0.7}>
                            <Ionicons name="chevron-forward" size={20} color="#2D3436" />
                        </TouchableOpacity>
                    </View>

                    {isLoadingEvents ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
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
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Calendar</Text>
                    <Text style={styles.subtitle}>Track your sessions & schedules</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 120 }}
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
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                        ) : (
                                            <Ionicons name="radio-button-off" size={24} color="#F59E0B" />
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Event Detail Modal */}
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
                            <TouchableOpacity onPress={() => setSelectedDateEvents(null)} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {selectedDateEvents?.events && selectedDateEvents.events.length > 0 ? (
                                selectedDateEvents.events.map((event, index) => (
                                    <View key={index} style={styles.modalEventItem}>
                                        <View style={styles.modalEventRow}>
                                            <Text style={styles.modalEventTitle}>{event.title}</Text>
                                            {event.is_completed && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9',
    },
    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#636E72',
    },
    content: {
        flex: 1,
        marginTop: 16,
    },
    calendarCard: {
        marginHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 16,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
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
        fontWeight: '700',
        color: '#94A3B8',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    dayText: {
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '600',
    },
    todayCell: {
        backgroundColor: Colors.primary,
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
        fontWeight: '700',
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
        backgroundColor: Colors.primary,
    },
    eventLegend: {
        backgroundColor: '#0EA5E9',
    },
    legendText: {
        fontSize: 12,
        color: '#636E72',
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    noEventsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    noEventsText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 12,
        fontWeight: '600',
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    eventCardCompleted: {
        backgroundColor: '#E6F4EA',
        borderWidth: 1.5,
        borderColor: '#C2E7CD',
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
        fontWeight: '700',
        color: '#2D3436',
    },
    eventTime: {
        fontSize: 12,
        color: '#636E72',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
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
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    modalEventItem: {
        marginBottom: 12,
        backgroundColor: '#F6F8F9',
        padding: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    modalEventRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    modalEventTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
    },
    modalEventTime: {
        fontSize: 12,
        color: '#636E72',
        fontWeight: '500',
    },
    modalEventDesc: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        lineHeight: 18,
    },
    modalNoEvents: {
        padding: 24,
        alignItems: 'center',
    },
    modalNoEventsText: {
        color: '#94A3B8',
        fontStyle: 'italic',
        fontWeight: '500',
    },
});
