import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DailySliderData {
  id: number;
  stress_level: number;
  sleep_quality: number;
  relaxation_level: number;
  mindfulness_practice: 'yes' | 'no' | null;
  practice_duration: number | null;
  practice_log: string | null;
  created_at: string;
}

interface WeeklyProgressData {
  week: string;
  completed: boolean;
}

interface MainQuestionnaireData {
  id: number;
  version: string;
  submitted_at: string;
}

export default function ProgressScreen() {
  const { session } = useSession();
  const [dailySliderData, setDailySliderData] = useState<DailySliderData[]>([]);
  const [weeklyProgressData, setWeeklyProgressData] = useState<WeeklyProgressData[]>([]);
  const [mainQuestionnaireData, setMainQuestionnaireData] = useState<MainQuestionnaireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'main'>('daily');

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllProgressData();
    }
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllProgressData();
    setRefreshing(false);
  };

  const fetchAllProgressData = async () => {
    try {
      // Fetch daily slider data
      const { data: sliderData, error: sliderError } = await supabase
        .from('daily_sliders')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(14); // Get last 14 days for better visualization

      if (sliderError) throw sliderError;
      setDailySliderData(sliderData || []);

      // Fetch weekly progress data (last 12 weeks)
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks
      
      // Get all weeks in the last 12 weeks
      const weeks = [];
      const today = new Date();
      const currentWeek = getWeekNumber(today);
      for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(today);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const [year, week] = getWeekNumber(weekDate);
        weeks.push(`${year}-W${week.toString().padStart(2, '0')}`);
      }

      // Check which weeks have submissions
      const { data: weeklyAnswers, error: weeklyError } = await supabase
        .from('weekly_answers')
        .select('week_id, submitted_at')
        .eq('user_id', session?.user?.id)
        .gte('submitted_at', twelveWeeksAgo.toISOString());

      if (weeklyError) throw weeklyError;

      // Get unique weeks with submissions
      const submittedWeeks = new Set();
      if (weeklyAnswers) {
        weeklyAnswers.forEach(answer => {
          // Extract week from week_id (format: YYYY-WNN-WQ)
          const weekPart = answer.week_id.split('-').slice(0, 2).join('-');
          submittedWeeks.add(weekPart);
        });
      }

      const weeklyData = weeks.map(week => ({
        week,
        completed: submittedWeeks.has(week)
      }));

      setWeeklyProgressData(weeklyData);

      // Fetch main questionnaire data
      const { data: mainData, error: mainError } = await supabase
        .from('main_questionnaire_responses')
        .select(`
          id, 
          submitted_at,
          main_question_sets(version)
        `)
        .eq('user_id', session?.user?.id)
        .order('submitted_at', { ascending: false })
        .limit(5); // Get last 5 submissions

      if (mainError) throw mainError;
      
      // Extract version from joined data
      const formattedMainData = mainData?.map(item => ({
        id: item.id,
        version: item.main_question_sets && item.main_question_sets[0] ? item.main_question_sets[0].version : 'Unknown',
        submitted_at: item.submitted_at
      })) || [];

      setMainQuestionnaireData(formattedMainData);

    } catch (error) {
      Alert.alert('Error', 'Failed to fetch progress data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get week number
  function getWeekNumber(d: Date): [number, number] {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
  }

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

  const average = (arr: number[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const stressData = dailySliderData.map(item => item.stress_level);
  const sleepData = dailySliderData.map(item => item.sleep_quality);
  const relaxationData = dailySliderData.map(item => item.relaxation_level);

  const avgStress = average(stressData);
  const avgSleep = average(sleepData);
  const avgRelaxation = average(relaxationData);

  // Calculate completion percentages
  const dailyCompletion = dailySliderData.length > 0 ? 
    Math.min(100, Math.round((dailySliderData.length / 14) * 100)) : 0;
  
  const weeklyCompletion = weeklyProgressData.length > 0 ? 
    Math.round((weeklyProgressData.filter(w => w.completed).length / weeklyProgressData.length) * 100) : 0;
  
  const mainCompletion = mainQuestionnaireData.length > 0 ? 
    Math.min(100, Math.round((mainQuestionnaireData.length / 4) * 100)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Completion Overview */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>Completion Overview</Text>
          <View style={styles.completionGrid}>
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M8 6H21" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M8 12H21" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M8 18H21" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M3 6H3.01" stroke="#64C59A" strokeWidth="3" />
                  <Path d="M3 12H3.01" stroke="#64C59A" strokeWidth="3" />
                  <Path d="M3 18H3.01" stroke="#64C59A" strokeWidth="3" />
                </Svg>
              </View>
              <Text style={styles.completionValue}>{dailyCompletion}%</Text>
              <Text style={styles.completionLabel}>Daily Sliders</Text>
            </View>
            
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M16 2V6" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M8 2V6" stroke="#64C59A" strokeWidth="2" />
                  <Path d="M3 10H21" stroke="#64C59A" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.completionValue}>{weeklyCompletion}%</Text>
              <Text style={styles.completionLabel}>Weekly Questions</Text>
            </View>
            
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
                  <Path d="M12 8V12L15 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </View>
              <Text style={styles.completionValue}>{mainCompletion}%</Text>
              <Text style={styles.completionLabel}>Main Questionnaires</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'main' && styles.activeTab]}
            onPress={() => setActiveTab('main')}
          >
            <Text style={[styles.tabText, activeTab === 'main' && styles.activeTabText]}>Main</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Progress */}
        {activeTab === 'daily' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.tabContent}>
            {/* Stats Summary */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgStress.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg. Stress</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgSleep.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg. Sleep</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgRelaxation.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg. Relaxation</Text>
              </View>
            </View>

            {/* Charts */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Stress Levels (Last 14 Days)</Text>
              <LineChart data={stressData} color="#EF4444" labels={dailySliderData.map(d => formatDate(d.created_at))} />
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Sleep Quality (Last 14 Days)</Text>
              <LineChart data={sleepData} color="#3B82F6" labels={dailySliderData.map(d => formatDate(d.created_at))} />
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Relaxation Levels (Last 14 Days)</Text>
              <LineChart data={relaxationData} color="#10B981" labels={dailySliderData.map(d => formatDate(d.created_at))} />
            </View>

            {/* Data Table */}
            <View style={styles.tableSection}>
              <Text style={styles.tableTitle}>Recent Entries</Text>
              {dailySliderData.length > 0 ? (
                dailySliderData.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={styles.dateCell}>{formatDate(item.created_at)}</Text>
                    <Text style={styles.dataCell}>{item.stress_level}</Text>
                    <Text style={styles.dataCell}>{item.sleep_quality}</Text>
                    <Text style={styles.dataCell}>{item.relaxation_level}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No daily slider data available</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Weekly Progress */}
        {activeTab === 'weekly' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.tabContent}>
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Weekly Questions Completion (Last 12 Weeks)</Text>
              <WeeklyCompletionChart data={weeklyProgressData} />
            </View>

            <View style={styles.tableSection}>
              <Text style={styles.tableTitle}>Weekly Submission History</Text>
              {weeklyProgressData.filter(w => w.completed).length > 0 ? (
                weeklyProgressData
                  .filter(w => w.completed)
                  .slice(0, 10)
                  .map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.dateCell}>{item.week}</Text>
                      <View style={styles.statusCell}>
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>Completed</Text>
                        </View>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.noDataText}>No weekly question submissions yet</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Main Questionnaire Progress */}
        {activeTab === 'main' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.tabContent}>
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Main Questionnaire Submissions</Text>
              <View style={styles.submissionList}>
                {mainQuestionnaireData.length > 0 ? (
                  mainQuestionnaireData.map((item) => (
                    <View key={item.id} style={styles.submissionItem}>
                      <View style={styles.submissionIcon}>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
                          <Path d="M12 8V12L15 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
                        </Svg>
                      </View>
                      <View style={styles.submissionText}>
                        <Text style={styles.submissionVersion}>{item.version}</Text>
                        <Text style={styles.submissionDate}>{formatDateTime(item.submitted_at)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No main questionnaire submissions yet</Text>
                )}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mainQuestionnaireData.length}</Text>
                <Text style={styles.statLabel}>Total Submissions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mainCompletion}%</Text>
                <Text style={styles.statLabel}>OfYear Target</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const LineChart = ({ data, color, labels }: { data: number[]; color: string; labels: string[] }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data, 5);
  const minValue = Math.min(...data, 1);
  const chartHeight = 200;
  const chartWidth = width - 48;
  const pointSpacing = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  // Convert data values to coordinates
  const points = data.map((value, index) => {
    const x = index * pointSpacing;
    const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    return { x, y };
  });

  // Create path for the line
  let pathData = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x},${points[i].y}`;
  }

  return (
    <View style={styles.chartContainer}>
      <Svg height={chartHeight} width={chartWidth}>
        {/* Grid lines */}
        {[1, 3, 5, 7, 9].map((level) => {
          const y = chartHeight - ((level - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <Line
              key={level}
              x1="0"
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Data line */}
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {labels.map((label, index) => (
          <Text key={index} style={styles.xAxisLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const WeeklyCompletionChart = ({ data }: { data: WeeklyProgressData[] }) => {
  if (data.length === 0) return null;

  const chartHeight = 150;
  const chartWidth = width - 48;
  const barWidth = Math.max(20, chartWidth / data.length - 4);
  const barSpacing = 4;

  return (
    <View style={styles.chartContainer}>
      <Svg height={chartHeight} width={chartWidth}>
        {data.map((week, index) => {
          const x = index * (barWidth + barSpacing);
          const y = week.completed ? 20 : 40;
          const height = week.completed ? chartHeight - 40 : chartHeight - 60;
          
          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill={week.completed ? "#64C59A" : "#E5E7EB"}
              rx="4"
            />
          );
        })}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {data.map((week, index) => (
          <Text key={index} style={styles.xAxisLabel}>
            W{week.week.split('-W')[1]}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E8A66',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  // Completion Overview Styles
  overviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  completionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completionCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  completionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#64C59A',
    marginBottom: 4,
  },
  completionLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F1',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#64C59A',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#64C59A',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  // Chart Styles
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
  // Table Styles
  tableSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateCell: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
  },
  dataCell: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  statusCell: {
    flex: 1,
    alignItems: 'flex-end',
  },
  completedBadge: {
    backgroundColor: '#64C59A20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    color: '#64C59A',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Submission List Styles
  submissionList: {
    marginBottom: 20,
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  submissionIcon: {
    marginRight: 16,
  },
  submissionText: {
    flex: 1,
  },
  submissionVersion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 14,
    color: '#666',
  },
});