import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Alert,
    TouchableOpacity,
    RefreshControl,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';

const DASHBOARD_GRADIENT: [string, string, string] = ['#F0FDF4', '#F8FAFC', '#FFFFFF'];

const { width } = Dimensions.get('window');

// --- Interfaces ---

interface DailySliderData {
    id: number;
    stress_level: number;
    sleep_quality: number;
    relaxation_level: number;
    created_at: string;
}

interface VoiceRecordingData {
    week_number: number;
    year: number;
    created_at: string;
}

interface QuestionnaireResponse {
    id: number;
    created_at: string;
}

// --- Helper Functions ---

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getWeekNumber = (d: Date): [number, number] => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
};

export default function JourneyScreen() {
    const [dailyData, setDailyData] = useState<DailySliderData[]>([]);
    const [weeklyData, setWeeklyData] = useState<VoiceRecordingData[]>([]);
    const [pss10Data, setPss10Data] = useState<QuestionnaireResponse[]>([]);
    const [ffmq15Data, setFfmq15Data] = useState<QuestionnaireResponse[]>([]);
    const [wemwbs14Data, setWemwbs14Data] = useState<QuestionnaireResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'questionnaire'>('daily');
    const [selectedMetric, setSelectedMetric] = useState<'stress' | 'sleep' | 'relax' | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/journey`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch journey data');
            }

            const data = await response.json();

            setDailyData(data.daily || []);
            setWeeklyData(data.weekly || []);
            setPss10Data(data.research?.pss10 || []);
            setFfmq15Data(data.research?.ffmq15 || []);
            setWemwbs14Data(data.research?.wemwbs14 || []);

        } catch (error) {
            console.error('Error fetching journey data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // --- Computed Metrics ---

    const dailyCompletion = useMemo(() => {
        if (dailyData.length === 0) return 0;
        // Simple heuristic: 1 entry per day expected since first entry
        const firstDate = new Date(dailyData[dailyData.length - 1].created_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        return Math.min(100, Math.round((dailyData.length / diffDays) * 100));
    }, [dailyData]);

    const weeklyCompletion = useMemo(() => {
        // Simple logic: number of submitted weeks vs weeks passed this year (simplified)
        if (weeklyData.length === 0) return 0;
        return Math.min(100, Math.round((weeklyData.length / getWeekNumber(new Date())[1]) * 100)); // Rough estimate
    }, [weeklyData]);

    const researchCompletion = useMemo(() => {
        // Average completion of 3 questionnaires
        // Assuming 1 per month or strict interval? For now just showing count/checking existence
        const total = pss10Data.length + ffmq15Data.length + wemwbs14Data.length;
        return total > 0 ? 100 : 0; // Placeholder logic as research schedule varies
    }, [pss10Data, ffmq15Data, wemwbs14Data]);

    // --- Chart Data ---

    const getChartData = (metric: 'stress' | 'sleep' | 'relax') => {
        const recent = dailyData.slice(0, 7).reverse(); // Last 7 entries
        if (recent.length === 0) return { labels: [], datasets: [{ data: [] }] };

        return {
            labels: recent.map(d => formatDate(d.created_at)),
            datasets: [{
                data: recent.map(d =>
                    metric === 'stress' ? d.stress_level :
                        metric === 'sleep' ? d.sleep_quality : d.relaxation_level
                )
            }]
        };
    };

    const renderChart = (metric: 'stress' | 'sleep' | 'relax', color: string) => {
        const data = getChartData(metric);
        if (data.datasets[0].data.length === 0) return <Text style={styles.noDataText}>No data yet</Text>;

        return (
            <LineChart
                data={data}
                width={width - 80}
                height={220}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => color,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: '6', strokeWidth: '2', stroke: color }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        );
    };


    return (
        <LinearGradient
            colors={DASHBOARD_GRADIENT}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Your Journey</Text>
                    <Text style={styles.subtitle}>Track your comprehensive progress</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Completion Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{dailyCompletion}%</Text>
                        <Text style={styles.statLabel}>Daily</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{weeklyCompletion}%</Text>
                        <Text style={styles.statLabel}>Weekly</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{researchCompletion}%</Text>
                        <Text style={styles.statLabel}>Questionnaire</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {['daily', 'weekly', 'questionnaire'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab as any)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View>
                    {/* Daily Tab */}
                    {activeTab === 'daily' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Daily Metrics (Last 7 Entries)</Text>

                            <View style={styles.metricCard}>
                                <Text style={styles.cardHeader}>Stress Levels</Text>
                                {renderChart('stress', '#EF4444')}
                            </View>

                            <View style={styles.metricCard}>
                                <Text style={styles.cardHeader}>Sleep Quality</Text>
                                {renderChart('sleep', '#3B82F6')}
                            </View>

                            <View style={styles.metricCard}>
                                <Text style={styles.cardHeader}>Relaxation</Text>
                                {renderChart('relax', '#10B981')}
                            </View>
                        </View>
                    )}

                    {/* Weekly Tab */}
                    {activeTab === 'weekly' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Voice Journal Entries</Text>
                            {weeklyData.length === 0 ? (
                                <Text style={styles.noDataText}>No voice journals recorded yet.</Text>
                            ) : (
                                weeklyData.map((item, index) => (
                                    <View key={index} style={styles.listItem}>
                                        <View style={styles.listIcon}>
                                            <Ionicons name="mic" size={20} color="#6366F1" />
                                        </View>
                                        <View style={styles.listContent}>
                                            <Text style={styles.listTitle}>Week {item.week_number}, {item.year}</Text>
                                            <Text style={styles.listTime}>{formatDateTime(item.created_at)}</Text>
                                        </View>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {/* Questionnaire Tab */}
                    {activeTab === 'questionnaire' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Questionnaire History</Text>

                            {/* PSS-10 */}
                            <View style={styles.researchGroup}>
                                <Text style={styles.groupHeader}>Perceived Stress Scale (PSS-10)</Text>
                                {pss10Data.length === 0 ? <Text style={styles.noDataText}>No submissions</Text> :
                                    pss10Data.map((item, i) => (
                                        <View key={item.id} style={styles.listItem}>
                                            <Text style={styles.listTitle}>PSS-10 Submission #{pss10Data.length - i}</Text>
                                            <Text style={styles.listTime}>{formatDateTime(item.created_at)}</Text>
                                        </View>
                                    ))
                                }
                            </View>

                            {/* FFMQ-15 */}
                            <View style={styles.researchGroup}>
                                <Text style={styles.groupHeader}>Five Facet Mindfulness (FFMQ-15)</Text>
                                {ffmq15Data.length === 0 ? <Text style={styles.noDataText}>No submissions</Text> :
                                    ffmq15Data.map((item, i) => (
                                        <View key={item.id} style={styles.listItem}>
                                            <Text style={styles.listTitle}>FFMQ-15 Submission #{ffmq15Data.length - i}</Text>
                                            <Text style={styles.listTime}>{formatDateTime(item.created_at)}</Text>
                                        </View>
                                    ))
                                }
                            </View>

                            {/* WEMWBS-14 */}
                            <View style={styles.researchGroup}>
                                <Text style={styles.groupHeader}>Mental Wellbeing (WEMWBS-14)</Text>
                                {wemwbs14Data.length === 0 ? <Text style={styles.noDataText}>No submissions</Text> :
                                    wemwbs14Data.map((item, i) => (
                                        <View key={item.id} style={styles.listItem}>
                                            <Text style={styles.listTitle}>WEMWBS-14 Submission #{wemwbs14Data.length - i}</Text>
                                            <Text style={styles.listTime}>{formatDateTime(item.created_at)}</Text>
                                        </View>
                                    ))
                                }
                            </View>

                        </View>
                    )}
                </View>
            </ScrollView>
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        width: '30%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    tab: {
        marginRight: 16,
        paddingBottom: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#10B981',
    },
    tabText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1E293B',
    },
    section: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    noDataText: {
        fontStyle: 'italic',
        color: '#94A3B8',
        textAlign: 'center',
        marginVertical: 10,
    },
    metricCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    listIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listContent: {
        flex: 1,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    listTime: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    researchGroup: {
        marginBottom: 24,
    },
    groupHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
});
