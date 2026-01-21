import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

const ROADMAP_STEPS = [
    { title: 'Daily Sliders', icon: 'sunny-outline', route: 'DailySliders', subtitle: 'Track Mood' },
    { title: 'Weekly Whispers', icon: 'calendar-outline', route: 'WeeklyWhispers', subtitle: 'Reflect' },
    { title: 'Thrive Tracker', icon: 'trending-up-outline', route: 'ThriveTracker', subtitle: 'Growth' },
    { title: 'Stress Snapshot', icon: 'camera-outline', route: 'StressSnapshot', subtitle: 'Snapshot' },
    { title: 'Mindful Mirror', icon: 'person-outline', route: 'MindfulMirror', subtitle: 'Self' },
];

export default function RoadmapScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <View style={styles.container}>
            {/* Background Decoration */}
            <View style={styles.bgDecoration}>
                <LeavesDecoration width={width} height={width} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Journey</Text>
                    <Text style={styles.subtitle}>Start your mindfulness path</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Vertical Line */}
                    <View style={styles.verticalLine} />

                    {ROADMAP_STEPS.map((step, index) => {
                        const isEven = index % 2 === 0;
                        return (
                            <View key={index} style={[styles.stepContainer, isEven ? styles.stepLeft : styles.stepRight]}>
                                {/* Node on Line */}
                                <View style={[styles.node, { left: '50%', marginLeft: -16 }]}>
                                    <View style={styles.nodeInner}>
                                        <Ionicons name={step.icon as any} size={16} color="#FFF" />
                                    </View>
                                </View>

                                {/* Card */}
                                <TouchableOpacity
                                    style={[styles.card, isEven ? styles.cardRight : styles.cardLeft]}
                                    onPress={() => navigation.navigate(step.route as any)}
                                >
                                    <Text style={styles.cardTitle}>{step.title}</Text>
                                    <Text style={styles.cardSubtitle}>{step.subtitle}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgDecoration: {
        position: 'absolute',
        top: 0,
        right: 0,
        opacity: 0.5,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    scrollContent: {
        paddingBottom: 60,
        paddingTop: 20,
        position: 'relative',
    },
    verticalLine: {
        position: 'absolute',
        top: 20,
        bottom: 20,
        left: '50%',
        width: 2,
        backgroundColor: '#E0E0E0',
        marginLeft: -1,
    },
    stepContainer: {
        width: width,
        height: 120, // Height of each step section
        justifyContent: 'center',
        position: 'relative',
    },
    stepLeft: {
        // Just used for alternating loop
    },
    stepRight: {
        // Just used for alternating loop
    },
    node: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.background, // Border effect
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    nodeInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.4, // Card width
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    cardRight: {
        marginLeft: width * 0.5 + 30, // Right side of line
    },
    cardLeft: {
        marginLeft: width * 0.5 - width * 0.4 - 30, // Left side of line
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
});
