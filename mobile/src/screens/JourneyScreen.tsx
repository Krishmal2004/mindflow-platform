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
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, clearApiCache } from '../lib/apiClient';
import { Colors } from '../constants/colors';
import { cardShadow } from '../styles/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTabBarHeight } from '../lib/useTabBarHeight';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';



const JOURNEY_ACCENT = '#6366F1';
const ENTRY_DISPLAY_LIMIT = 15;

const { width } = Dimensions.get('window');

// --- Interfaces ---
interface DailySliderData {
    id: number;
    stress_level: number;
    sleep_quality: number;
    calm_after: number;
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
    // All submission dates; when provided, the card becomes tappable to reveal the full list.
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
                <View style={[styles.listIcon, { backgroundColor: Colors.primaryTint }]}>
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
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                )}
            </View>
            {isExpandable && expanded && (
                <View style={styles.entryList}>
                    {/* Longitudinal study means this list only grows over months — cap the
                        expanded render rather than rendering an unbounded array. */}
                    {entries!.slice(0, ENTRY_DISPLAY_LIMIT).map((entry, index) => (
                        <View key={index} style={styles.entryRow}>
                            <Ionicons name="ellipse" size={6} color={Colors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.entryText}>
                                {entry.label ? `${entry.label} — ` : ''}{entry.date}
                            </Text>
                        </View>
                    ))}
                    {entries!.length > ENTRY_DISPLAY_LIMIT && (
                        <Text style={styles.entryMoreText}>
                            +{entries!.length - ENTRY_DISPLAY_LIMIT} more
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function JourneyScreen() {
    const tabBarHeight = useTabBarHeight();

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
    const CHART_WIDTH = width - 24 * 2 - 16 * 2;

    const getChartData = (metric: 'stress' | 'sleep' | 'relax') => {
        const recent = dailyData.slice(0, 7).reverse();
        if (recent.length === 0) return { labels: [], datasets: [{ data: [] }] };

        return {
            labels: recent.map(d => formatDate(d.created_at)),
            datasets: [{
                data: recent.map(d =>
                    metric === 'stress' ? d.stress_level :
                        metric === 'sleep' ? d.sleep_quality : d.calm_after
                )
            }]
        };
    };

    const getLatestValue = (metric: 'stress' | 'sleep' | 'relax'): number | null => {
        if (dailyData.length === 0) return null;
        const latest = dailyData[0];
        return metric === 'stress' ? latest.stress_level : metric === 'sleep' ? latest.sleep_quality : latest.calm_after;
    };

    const renderChart = (metric: 'stress' | 'sleep' | 'relax', color: string) => {
        const data = getChartData(metric);
        if (data.datasets[0].data.length === 0) {
            return (
                <View style={styles.noDataBox}>
                    <Ionicons name="analytics-outline" size={22} color={Colors.textMuted} />
                    <Text style={styles.noDataText}>No data yet</Text>
                </View>
            );
        }

        return (
            <LineChart
                data={data}
                width={CHART_WIDTH}
                height={180}
                fromZero
                segments={5}
                yAxisInterval={1}
                chartConfig={{
                    backgroundColor: Colors.surface,
                    backgroundGradientFrom: Colors.surface,
                    backgroundGradientTo: Colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => color,
                    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                    propsForBackgroundLines: { stroke: Colors.surfaceMuted },
                    style: { borderRadius: 16 },
                    propsForDots: { r: '4', strokeWidth: '2', stroke: color },
                }}
                bezier
                withInnerLines={true}
                withOuterLines={false}
                style={styles.chart}
            />
        );
    };

    const METRICS: { key: 'stress' | 'sleep' | 'relax'; title: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: 'stress', title: 'Stress Levels', color: '#EF4444', icon: 'flame-outline' },
        { key: 'sleep', title: 'Sleep Quality', color: '#3B82F6', icon: 'moon-outline' },
        { key: 'relax', title: 'Calm (After Practice)', color: Colors.primary, icon: 'leaf-outline' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScreenHeader
                title="Your Journey"
                subtitle="Track your comprehensive progress"
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
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

                                {METRICS.map(({ key, title, color, icon }) => {
                                    const latest = getLatestValue(key);
                                    return (
                                        <View key={key} style={styles.metricCard}>
                                            <View style={styles.metricCardHeader}>
                                                <View style={styles.metricTitleRow}>
                                                    <View style={[styles.metricIconCircle, { backgroundColor: `${color}1A` }]}>
                                                        <Ionicons name={icon} size={15} color={color} />
                                                    </View>
                                                    <Text style={styles.cardHeader}>{title}</Text>
                                                </View>
                                                {latest !== null && (
                                                    <View style={[styles.metricBadge, { backgroundColor: `${color}1A` }]}>
                                                        <Text style={[styles.metricBadgeText, { color }]}>{latest}/5</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {renderChart(key, color)}
                                        </View>
                                    );
                                })}
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
        backgroundColor: Colors.background,
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
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 16,
        flex: 1,
        alignItems: 'center',
        ...cardShadow,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
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
        borderBottomColor: JOURNEY_ACCENT,
    },
    tabText: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '700',
    },
    activeTabText: {
        color: Colors.textPrimary,
    },
    section: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    noDataText: {
        fontStyle: 'italic',
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },
    noDataBox: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
        ...cardShadow,
    },
    metricCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metricTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    metricBadgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    cardHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    chart: {
        marginTop: 8,
        borderRadius: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        ...cardShadow,
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
        color: Colors.textPrimary,
    },
    listTime: {
        fontSize: 12,
        color: Colors.textSecondary,
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
        borderTopColor: Colors.surfaceMuted,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    entryText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    entryMoreText: {
        fontSize: 11,
        color: Colors.textMuted,
        fontStyle: 'italic',
        marginTop: 4,
        paddingLeft: 14,
    },
});
