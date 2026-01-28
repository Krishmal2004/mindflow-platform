import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { LeavesDecoration } from '../components/LeavesDecoration';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80; // Padding
const CHART_HEIGHT = 160;

type CompleteTaskRouteProp = RouteProp<RootStackParamList, 'CompleteTask'>;

interface GraphProps {
    data: number[];
    color: string;
    label: string;
    yMax?: number;
}

const SimpleLineChart = ({ data, color, label, yMax = 5 }: GraphProps) => {
    if (!data || data.length === 0) return null;

    const points = data.map((value, index) => {
        const x = data.length === 1
            ? CHART_WIDTH / 2
            : (index / (data.length - 1)) * CHART_WIDTH;

        const y = CHART_HEIGHT - ((value / yMax) * CHART_HEIGHT);
        return { x, y, value };
    });

    // Create path
    let pathD = '';
    if (points.length > 1) {
        pathD = `M ${points[0].x + 10} ${points[0].y} ` + points.map(p => `L ${p.x + 10} ${p.y}`).join(' ');
    } else {
        pathD = '';
    }

    return (
        <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color }]}>{label}</Text>
            <Svg width={CHART_WIDTH + 40} height={CHART_HEIGHT + 30} style={{ marginLeft: -10 }}>
                {/* Y-Axis Lines (Grid) */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                    const y = CHART_HEIGHT - ((i / yMax) * CHART_HEIGHT);
                    return (
                        <G key={i}>
                            <Line x1="10" y1={y} x2={CHART_WIDTH + 10} y2={y} stroke="#E2E8F0" strokeWidth="1" />
                        </G>
                    );
                })}

                {/* The Line */}
                {pathD ? (
                    <Path d={pathD} stroke={color} strokeWidth="3" fill="none" />
                ) : null}

                {/* Data Points */}
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x + 10} cy={p.y} r="4" fill="#FFF" stroke={color} strokeWidth="2" />
                ))}
            </Svg>
        </View>
    );
};

export default function CompleteTaskScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<CompleteTaskRouteProp>();

    // Collapsible State
    const [statsExpanded, setStatsExpanded] = useState(false);

    const { title, message, buttonText = "Back to Journey", historyData } = route.params;

    // Extract data for charts
    // Assuming historyData is ordered oldest to newest from backend
    const stressData = historyData?.map(d => d.stress_level).filter(v => v != null) || [];
    const moodData = historyData?.map(d => d.mood).filter(v => v != null) || [];
    const sleepData = historyData?.map(d => d.sleep_quality).filter(v => v != null) || [];
    const relaxationData = historyData?.map(d => d.relaxation_level).filter(v => v != null) || [];

    const toggleStats = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStatsExpanded(!statsExpanded);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decoration */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={width * 0.8} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#64C59A" />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                </View>

                {historyData && historyData.length > 0 && (
                    <View style={styles.statsCard}>
                        <TouchableOpacity
                            style={styles.statsHeaderButton}
                            onPress={toggleStats}
                            activeOpacity={0.7}
                        >
                            <View style={styles.statsTitleContainer}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                                    <Ionicons name="stats-chart" size={20} color="#64C59A" />
                                </View>
                                <Text style={styles.statsHeader}>Your Progress (7 Days)</Text>
                            </View>
                            <Ionicons
                                name={statsExpanded ? "chevron-up" : "chevron-down"}
                                size={24}
                                color="#94A3B8"
                            />
                        </TouchableOpacity>

                        {statsExpanded && (
                            <View style={styles.chartsContainer}>
                                <SimpleLineChart data={stressData} color="#EF4444" label="Stress Level" />
                                <SimpleLineChart data={moodData} color="#64C59A" label="Mood Level" />
                                <SimpleLineChart data={sleepData} color="#3B82F6" label="Sleep Quality" />
                                <SimpleLineChart data={relaxationData} color="#64C59A" label="Relaxation Level" />
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    })}
                >
                    <Text style={styles.homeButtonText}>{buttonText}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    scrollContent: {
        paddingTop: 100,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    successIcon: {
        marginBottom: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        backgroundColor: '#FFF',
        borderRadius: 50,
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    statsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden', // For neat corners when collapsed
    },
    statsHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    statsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statsHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: 0.3,
    },
    chartsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    chartContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    homeButton: {
        backgroundColor: '#64C59A', // Updated Primary Color
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: '#64C59A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        width: '100%',
        alignItems: 'center',
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
