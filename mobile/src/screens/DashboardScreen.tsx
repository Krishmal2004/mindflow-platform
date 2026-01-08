import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RoadmapItem } from '../components/RoadmapItem';
import { Notification, NotificationType } from '../components/Notification';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const MINDFULNESS_TIPS = [
    { id: 1, title: 'Meditation', icon: 'flower-outline', duration: '5 min' },
    { id: 2, title: 'Listen', icon: 'musical-notes-outline', duration: '10 min' },
    { id: 3, title: 'Breathe', icon: 'water-outline', duration: '3 min' },
    { id: 4, title: 'Focus', icon: 'eye-outline', duration: '7 min' },
];

const ROADMAP_STEPS = [
    { title: 'Daily Sliders', icon: 'sunny-outline', route: 'DailySliders', subtitle: 'Track your daily mood' },
    { title: 'Weekly Whispers', icon: 'calendar-outline', route: 'WeeklyWhispers', subtitle: 'Reflect on your week' },
    { title: 'Thrive Tracker', icon: 'trending-up-outline', route: 'ThriveTracker', subtitle: 'Monitor your growth' },
    { title: 'Stress Snapshot', icon: 'camera-outline', route: 'StressSnapshot', subtitle: 'Capture stress levels' },
    { title: 'Mindful Mirror', icon: 'person-outline', route: 'MindfulMirror', subtitle: 'Self-reflection' },
];

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export default function DashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    const handleFeaturePress = (feature: string) => {
        // Removed notification call as per request
        // Navigation would go here
        // For roadmap items, they will have direct navigation in the loop below
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Notification
                type="success"
                message={notificationMessage}
                visible={notificationVisible}
                onHide={() => setNotificationVisible(false)}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Good Morning,</Text>
                            <Text style={styles.username}>Hasitha</Text>
                        </View>
                        <TouchableOpacity style={styles.profileButton}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>HE</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Mindfulness Tips Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mindfulness Tips</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tipsContainer}
                        contentContainerStyle={styles.tipsContent}
                    >
                        {MINDFULNESS_TIPS.map((tip) => (
                            <TouchableOpacity
                                key={tip.id}
                                style={styles.tipCard}
                                onPress={() => handleFeaturePress(tip.title)}
                            >
                                <LinearGradient
                                    colors={[Colors.surface, Colors.background]} // Sand White gradient
                                    style={styles.tipGradient}
                                >
                                    <View style={styles.tipIconBg}>
                                        <Ionicons name={tip.icon as any} size={24} color={Colors.secondary} />
                                    </View>
                                    <Text style={styles.tipTitle}>{tip.title}</Text>
                                    <Text style={styles.tipDuration}>{tip.duration}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Roadmap Section */}
                    <Text style={[styles.sectionTitle, styles.roadmapTitle]}>Your Roadmap</Text>
                    <View style={styles.roadmapContainer}>
                        {ROADMAP_STEPS.map((step, index) => (
                            <RoadmapItem
                                key={index}
                                index={index}
                                title={step.title}
                                subtitle={step.subtitle}
                                iconName={step.icon as any}
                                onPress={() => navigation.navigate(step.route as any)}
                            />
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // Warm Gray background
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
        marginTop: 10,
    },
    greeting: {
        fontSize: 16,
        color: Colors.textSecondary, // Mist Blue
        fontWeight: '500',
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary, // Dark Gray
    },
    profileButton: {
        padding: 4,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary, // Sage Green
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarText: {
        color: Colors.surface,
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    seeAll: {
        color: Colors.secondary, // Soft Teal
        fontWeight: '600',
    },
    tipsContainer: {
        marginBottom: 32,
    },
    tipsContent: {
        paddingHorizontal: 20,
    },
    tipCard: {
        width: 120,
        height: 140,
        marginRight: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    tipGradient: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    tipIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(100, 197, 235, 0.15)', // Soft Teal faint
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 8,
    },
    tipDuration: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    roadmapTitle: {
        marginLeft: 20,
        marginBottom: 16,
    },
    roadmapContainer: {
        paddingBottom: 20,
    },
});
