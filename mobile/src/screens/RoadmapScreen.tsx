import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { RoadmapItem } from '../components/RoadmapItem';

const ROADMAP_STEPS = [
    { title: 'Daily Sliders', icon: 'sunny-outline', route: 'DailySliders', subtitle: 'Track your daily mood' },
    { title: 'Weekly Whispers', icon: 'calendar-outline', route: 'WeeklyWhispers', subtitle: 'Reflect on your week' },
    { title: 'Thrive Tracker', icon: 'trending-up-outline', route: 'ThriveTracker', subtitle: 'Monitor your growth' },
    { title: 'Stress Snapshot', icon: 'camera-outline', route: 'StressSnapshot', subtitle: 'Capture stress levels' },
    { title: 'Mindful Mirror', icon: 'person-outline', route: 'MindfulMirror', subtitle: 'Self-reflection' },
];

export default function RoadmapScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Journey</Text>
                    <Text style={styles.subtitle}>Track your progress over time</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    content: {
        paddingBottom: 40,
    },
});
