import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function CalendarScreen() {
    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>CALENDAR</Text>
                <Text style={styles.headerSubtitle}>{monthNames[today.getMonth()]} {today.getFullYear()}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Calendar Placeholder */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <Ionicons name="calendar" size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.placeholderTitle}>Your Mindfulness Calendar</Text>
                    <Text style={styles.placeholderText}>
                        Track your meditation sessions, breathing exercises, and daily check-ins here.
                    </Text>
                </View>

                {/* Upcoming Sessions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>UPCOMING SESSIONS</Text>

                    <View style={styles.sessionCard}>
                        <View style={[styles.sessionDot, { backgroundColor: '#667eea' }]} />
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitle}>Morning Meditation</Text>
                            <Text style={styles.sessionTime}>Today, 7:00 AM</Text>
                        </View>
                        <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
                    </View>

                    <View style={styles.sessionCard}>
                        <View style={[styles.sessionDot, { backgroundColor: '#10B981' }]} />
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitle}>Daily Slider Check-in</Text>
                            <Text style={styles.sessionTime}>Today, 8:00 PM</Text>
                        </View>
                        <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
                    </View>

                    <View style={styles.sessionCard}>
                        <View style={[styles.sessionDot, { backgroundColor: '#8B5CF6' }]} />
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitle}>Weekly Reflection</Text>
                            <Text style={styles.sessionTime}>Sunday, 6:00 PM</Text>
                        </View>
                        <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Sessions{'\n'}This Month</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>🔥 7</Text>
                        <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>45</Text>
                        <Text style={styles.statLabel}>Minutes{'\n'}Today</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    calendarHeader: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    placeholderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 16,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    sessionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 14,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    sessionTime: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
    },
});
