import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, clearApiCache } from '../lib/apiClient';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

// --- Interfaces ---
interface DailySliderData {
    id: number;
    stress_level: number;
    sleep_quality: number;
    relaxation_level: number;
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

// --- Summary Card (replaces long per-entry lists) ---
interface SummaryCardEntry {
    label?: string;
    date: string;
}

interface SummaryCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    count: number;
    latestLabel?: string;
    latestDate?: string;
    /** All submission dates; when provided, the card becomes tappable to reveal the full list. */
    entries?: SummaryCardEntry[];
}

const SummaryCard = ({ icon, title, count, latestLabel, latestDate, entries }: SummaryCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const isExpandable = !!entries?.length;

    return (
        <TouchableOpacity
            style={styles.listItem}
            activeOpacity={isExpandable ? 0.7 : 1}
            disabled={!isExpandable}
            onPress={() => setExpanded(prev => !prev)}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.listIcon, { backgroundColor: '#E6F4EA' }]}>
                    <Ionicons name={icon} size={20} color={Colors.primary} />
                </View>
                <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{title}</Text>
                    {count === 0 ? (
                        <Text style={styles.noDataText}>No submissions yet</Text>
                    ) : (
                        <>
                            <Text style={styles.summaryCount}>{count} {count === 1 ? 'submission' : 'submissions'}</Text>
                            {latestDate && (
                                <Text style={styles.listTime}>Latest: {latestLabel ? `${latestLabel} — ` : ''}{latestDate}</Text>
                            )}
                        </>
                    )}
                </View>
                {isExpandable && (
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                )}
            </View>
            {isExpandable && expanded && (
                <View style={styles.entryList}>
                    {entries!.map((entry, index) => (
                        <View key={index} style={styles.entryRow}>
                            <Ionicons name="ellipse" size={6} color={Colors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.entryText}>
                                {entry.label ? `${entry.label} — ` : ''}{entry.date}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function JourneyScreen() {
    const [dailyData, setDailyData] = useState<DailySliderData[]>([]);
    const [weeklyData, setWeeklyData] = useState<QuestionnaireResponse[]>([]);
    const [pss10Data, setPss10Data] = useState<QuestionnaireResponse[]>([]);
    const [ffmq15Data, setFfmq15Data] = useState<QuestionnaireResponse[]>([]);
    const [wemwbs14Data, setWemwbs14Data] = useState<QuestionnaireResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'questionnaire'>('daily');

    const fetchData = async (force = false) => {
        try {
            const { ok, data } = await apiFetch<{
                daily?: DailySliderData[];
                weekly?: QuestionnaireResponse[];
                research?: { pss10?: QuestionnaireResponse[]; ffmq15?: QuestionnaireResponse[]; wemwbs14?: QuestionnaireResponse[] };
            }>('/api/journey?limit=90', { force });

            if (!ok || !data) throw new Error('Failed to fetch journey data');

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
        clearApiCache('/api/journey');
        await fetchData(true);
        setRefreshing(false);
    };

    // --- Computed Metrics ---
    const dailyCompletion = useMemo(() => {
        if (dailyData.length === 0) return 0;
        const firstDate = new Date(dailyData[dailyData.length - 1].created_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        return Math.min(100, Math.round((dailyData.length / diffDays) * 100));
    }, [dailyData]);

    const researchCompletion = useMemo(() => {
        const total = pss10Data.length + ffmq15Data.length + wemwbs14Data.length;
        return total > 0 ? 100 : 0;
    }, [pss10Data, ffmq15Data, wemwbs14Data]);

    // --- Chart Data ---
    const getChartData = (metric: 'stress' | 'sleep' | 'relax') => {
        const recent = dailyData.slice(0, 7).reverse();
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
                width={width - 72}
                height={200}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => color,
                    labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                    style: { borderRadius: 24 },
                    propsForDots: { r: '5', strokeWidth: '2', stroke: color }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 24 }}
            />
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Your Journey</Text>
                    <Text style={styles.subtitle}>Track your comprehensive progress</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 120 }}
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
                        <Text style={styles.statValue}>{researchCompletion}%</Text>
                        <Text style={styles.statLabel}>Questionnaires</Text>
                    </View>
                </View>

                {/* Tab selector */}
                <View style={styles.tabContainer}>
                    {['daily', 'questionnaire'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            testID={`journey-tab-${tab}`}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab as any)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab === 'questionnaire' ? 'Surveys' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : (
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
                                    {renderChart('relax', Colors.primary)}
                                </View>
                            </View>
                        )}

                        {/* Questionnaire Tab */}
                        {activeTab === 'questionnaire' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Weekly Recording Summary</Text>
                                <SummaryCard
                                    icon="mic"
                                    title="Weekly Whispers"
                                    count={weeklyData.length}
                                    latestDate={weeklyData[0] ? formatDateTime(weeklyData[0].created_at) : undefined}
                                />

                                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Questionnaire Summary</Text>
                                <SummaryCard
                                    icon="document-text"
                                    title="Perceived Stress Scale (PSS-10)"
                                    count={pss10Data.length}
                                    latestDate={pss10Data[0] ? formatDateTime(pss10Data[0].created_at) : undefined}
                                />
                                <SummaryCard
                                    icon="document-text"
                                    title="Five Facet Mindfulness (FFMQ-15)"
                                    count={ffmq15Data.length}
                                    latestDate={ffmq15Data[0] ? formatDateTime(ffmq15Data[0].created_at) : undefined}
                                />
                                <SummaryCard
                                    icon="document-text"
                                    title="Mental Wellbeing (WEMWBS-14)"
                                    count={wemwbs14Data.length}
                                    latestDate={wemwbs14Data[0] ? formatDateTime(wemwbs14Data[0].created_at) : undefined}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    statLabel: {
        fontSize: 11,
        color: '#636E72',
        marginTop: 6,
        fontWeight: '700',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    tab: {
        marginRight: 24,
        paddingBottom: 8,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '700',
    },
    activeTabText: {
        color: '#2D3436',
    },
    section: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 16,
    },
    noDataText: {
        fontStyle: 'italic',
        color: '#94A3B8',
        textAlign: 'center',
        marginVertical: 16,
        fontWeight: '500',
    },
    metricCard: {
        backgroundColor: '#ffffff',
        borderRadius: 30,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 8,
        marginLeft: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    listIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    listContent: {
        flex: 1,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
    },
    listTime: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 4,
        fontWeight: '500',
    },
    summaryCount: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 2,
    },
    entryList: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    entryText: {
        fontSize: 12,
        color: '#636E72',
        fontWeight: '500',
    },
});
