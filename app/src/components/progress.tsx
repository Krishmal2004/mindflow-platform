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
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icons } from './common/AppIcons';

const { width } = Dimensions.get('window');

/**
 * Interface defining the structure of daily slider data
 */
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

/**
 * Interface defining the structure of weekly progress data
 */
interface WeeklyProgressData {
  week: string;
  completed: boolean;
  submitted_at?: string;
}

/**
 * Interface defining the structure of main questionnaire data
 */
interface MainQuestionnaireData {
  id: number;
  version: string;
  submitted_at: string;
}

/**
 * Main progress screen component that displays user's mindfulness journey data
 */
/**
 * Formats a date string to "MMM D" format (e.g., "Jan 1")
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ProgressScreen() {
  const { session } = useSession();
  const [dailySliderData, setDailySliderData] = useState<DailySliderData[]>([]);
  const [weeklyProgressData, setWeeklyProgressData] = useState<WeeklyProgressData[]>([]);
  const [mainQuestionnaireData, setMainQuestionnaireData] = useState<MainQuestionnaireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'main'>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'stress' | 'sleep' | 'relax' | null>(null);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [selectedWeeklySubmissions, setSelectedWeeklySubmissions] = useState<WeeklyProgressData[]>([]);
  const [selectedMainSubmissions, setSelectedMainSubmissions] = useState<MainQuestionnaireData[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }

      // Refresh data
      if (session?.user?.id) {
        fetchAllProgressData();
      }
    }, [session])
  );

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllProgressData();
    }
  }, [session]);

  /**
   * Handles pull-to-refresh action
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllProgressData();
    setRefreshing(false);
  };

  /**
   * Fetches all progress data from Supabase, including daily sliders, voice recordings, and questionnaires.
   */
  const fetchAllProgressData = async () => {
    try {
      // Execute independent fetches in parallel
      const [
        { data: sliderData, error: sliderError },
        { data: voiceRecordings, error: voiceRecordingsError },
        { data: sessionData, error: sessionError }
      ] = await Promise.all([
        supabase
          .from('daily_sliders')
          .select('*')
          .eq('user_id', session?.user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('voice_recordings')
          .select('week_number, year, created_at')
          .eq('user_id', session?.user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('main_questionnaire_sessions')
          .select('id, question_set_id, started_at')
          .eq('user_id', session?.user?.id)
          .order('started_at', { ascending: false })
      ]);

      // 1. Handle Daily Sliders
      if (sliderError) throw sliderError;
      setDailySliderData(sliderData || []);

      // 2. Handle Weekly Progress
      if (voiceRecordingsError) throw voiceRecordingsError;

      const submittedWeeksMap = new Map<string, { week: string; completed: boolean; submitted_at: string }>();
      let earliestWeeklyDate: Date | null = null;
      if (voiceRecordings && voiceRecordings.length > 0) {
        voiceRecordings.forEach(recording => {
          // Determine week boundaries
          const date = new Date(recording.year, 0, 1 + (recording.week_number - 1) * 7);
          if (!earliestWeeklyDate || date < earliestWeeklyDate) earliestWeeklyDate = date;
          const [y, w] = getWeekNumber(date);
          const weekKey = `${y}-W${w.toString().padStart(2, '0')}`;
          submittedWeeksMap.set(weekKey, { week: weekKey, completed: true, submitted_at: recording.created_at });
        });
      }

      const weeksList: Array<{ week: string; completed: boolean; submitted_at?: string }> = [];
      if (earliestWeeklyDate) {
        const start = new Date(earliestWeeklyDate);
        start.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let cur = new Date(start);
        while (cur <= today) {
          const [yr, wk] = getWeekNumber(cur);
          const key = `${yr}-W${wk.toString().padStart(2, '0')}`;
          if (!weeksList.find(w => w.week === key)) {
            const weekData = submittedWeeksMap.get(key);
            if (weekData) {
              weeksList.push(weekData);
            } else {
              weeksList.push({ week: key, completed: false });
            }
          }
          cur.setDate(cur.getDate() + 7);
        }
      }
      setWeeklyProgressData(weeksList);

      // 3. Handle Main Questionnaire
      if (sessionError) throw sessionError;

      if (sessionData && sessionData.length > 0) {
        const questionSetIds = sessionData.map(session => session.question_set_id);

        const { data: questionSets, error: questionSetsError } = await supabase
          .from('main_question_sets')
          .select('id, version')
          .in('id', questionSetIds);

        if (questionSetsError) throw questionSetsError;

        // Format the data
        const formattedMainData = sessionData.map(session => {
          const questionSet = questionSets.find(qs => qs.id === session.question_set_id);
          return {
            id: session.id,
            version: questionSet ? questionSet.version : 'Unknown',
            submitted_at: session.started_at
          };
        });

        setMainQuestionnaireData(formattedMainData);
      } else {
        setMainQuestionnaireData([]);
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to fetch progress data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper function to get week number from a date
   */
  function getWeekNumber(d: Date): [number, number] {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
  }

  /**
   * Formats a date string to a short date format
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Formats a date string to include time
   */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Calculates the average of an array of numbers
   */
  const average = (arr: number[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  // Memoize averages
  const { avgStress, avgSleep, avgRelaxation } = useMemo(() => {
    const stressData = dailySliderData.map(item => item.stress_level);
    const sleepData = dailySliderData.map(item => item.sleep_quality);
    const relaxationData = dailySliderData.map(item => item.relaxation_level);

    return {
      avgStress: average(stressData),
      avgSleep: average(sleepData),
      avgRelaxation: average(relaxationData)
    };
  }, [dailySliderData]);

  // Memoize daily completion rate
  const dailyCompletion = useMemo(() => {
    if (!dailySliderData || dailySliderData.length === 0) return 0;

    const earliestEntry = [...dailySliderData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    const earliestDate = new Date(earliestEntry.created_at);
    earliestDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total expected days
    const days = Math.max(1, Math.ceil((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const completedCount = dailySliderData.length;

    return Math.min(100, Math.round((completedCount / days) * 100));
  }, [dailySliderData]);

  // Memoize weekly completion rate
  const weeklyCompletion = useMemo(() => {
    if (!weeklyProgressData || weeklyProgressData.length === 0) return 0;
    const totalWeeks = weeklyProgressData.length;
    const completedWeeks = weeklyProgressData.filter(w => w.completed).length;
    return Math.round((completedWeeks / Math.max(1, totalWeeks)) * 100);
  }, [weeklyProgressData]);

  // Memoize main questionnaire completion rate and missed months
  const { mainCompletion, mainMissedMonths } = useMemo(() => {
    if (!mainQuestionnaireData || mainQuestionnaireData.length === 0) {
      return { mainCompletion: 0, mainMissedMonths: [] };
    }

    const sortedMain = [...mainQuestionnaireData].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    const earliest = new Date(sortedMain[0].submitted_at);
    earliest.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const months: string[] = [];
    const monthSet = new Set<string>();
    const getMonthKey = (d: Date) => `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;

    sortedMain.forEach(item => {
      monthSet.add(getMonthKey(new Date(item.submitted_at)));
    });

    const cur = new Date(earliest);
    while (cur <= today) {
      const mk = getMonthKey(cur);
      months.push(mk);
      cur.setMonth(cur.getMonth() + 1);
    }

    const completedMain = Array.from(monthSet).filter(m => months.includes(m)).length;
    const rate = Math.round((completedMain / Math.max(1, months.length)) * 100);
    const missed = months.filter(m => !monthSet.has(m));

    return { mainCompletion: rate, mainMissedMonths: missed };
  }, [mainQuestionnaireData]);

  /**
   * Prepares the data for the detailed chart (last 14 entries, reversed for chronological order)
   */
  const getChartData = (metric: 'stress' | 'sleep' | 'relax' | null) => {
    if (!metric) return [];
    // Take last 14 entries
    const recentData = dailySliderData.slice(0, 14).reverse();

    return recentData.map(item => ({
      value: metric === 'stress' ? item.stress_level :
        metric === 'sleep' ? item.sleep_quality : item.relaxation_level,
      date: formatDate(item.created_at)
    }));
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your mindfulness journey</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>Completion Overview</Text>
          <View style={styles.completionGrid}>
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Icons.List width={24} height={24} color="#64C59A" strokeWidth={2} />
              </View>
              <Text style={styles.completionValue}>{dailyCompletion}%</Text>
              <Text style={styles.completionLabel}>Daily Sliders</Text>
            </View>

            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Icons.Calendar width={24} height={24} color="#64C59A" strokeWidth={2} />
              </View>
              <Text style={styles.completionValue}>{weeklyCompletion}%</Text>
              <Text style={styles.completionLabel}>Weekly Recordings</Text>
            </View>

            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Icons.History width={24} height={24} color="#64C59A" strokeWidth={2} />
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
            <View style={styles.detailedProgressContainer}>
              <View style={styles.detailedProgressBar}>
                <View style={styles.progressBarHeader}>
                  <View style={styles.progressBarIconLabel}>
                    <Icons.List width={24} height={24} color="#64C59A" strokeWidth={2} />
                    <Text style={styles.progressBarTitle}>Daily Sliders</Text>
                  </View>
                  <Text style={styles.progressBarValue}>{dailyCompletion}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: `${dailyCompletion}%`, backgroundColor: '#64C59A' }]} />
                </View>
                <Text style={styles.progressBarSubtitle}>{dailySliderData.length} entries total</Text>
                {/* Missed dates (last 14 days) */}
                {(() => {
                  if (!dailySliderData || dailySliderData.length === 0) return null;
                  const today = new Date(); today.setHours(0, 0, 0, 0);

                  // Use the helper logic to find missed dates or memoize this block if it's heavy
                  // For now, calculating on empty array is fast enough, but we should reuse earliestDailyDate logic if available
                  // Re-deriving earliest for display logic:
                  const earliestEntry = [...dailySliderData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
                  if (!earliestEntry) return null;

                  const start = new Date(earliestEntry.created_at);
                  start.setHours(0, 0, 0, 0);
                  const entrySet = new Set<number>();
                  dailySliderData.forEach(e => {
                    const d = new Date(e.created_at);
                    d.setHours(0, 0, 0, 0);
                    entrySet.add(d.getTime());
                  });
                  const missed: string[] = [];
                  const cur = new Date(start);
                  while (cur <= today) {
                    if (!entrySet.has(cur.getTime())) {
                      missed.push(cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    }
                    cur.setDate(cur.getDate() + 1);
                  }
                  return missed.length > 0 ? (
                    <View style={styles.missedDatesContainer}>
                      <Text style={styles.missedDatesTitle}>Missed Dates ({missed.length}):</Text>
                      <View style={styles.missedDatesList}>
                        {missed.slice(0, 5).map((d, i) => (
                          <View key={i} style={styles.missedDateItem}>
                            <Icons.RemoveCircle width={16} height={16} color="#EF4444" strokeWidth={2} />
                            <Text style={styles.missedDateText}>{d}</Text>
                          </View>
                        ))}
                        {missed.length > 5 && <Text style={styles.moreDatesText}>+ {missed.length - 5} more</Text>}
                      </View>
                    </View>
                  ) : null;
                })()}
              </View>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Your Well-being Summary (Last 14 Days)</Text>
              <View style={styles.statsGridContainer}>
                <TouchableOpacity
                  style={[styles.statsGridCard, { borderLeftColor: '#64C59A' }]}
                  onPress={() => setSelectedMetric('stress')}
                  activeOpacity={0.7}
                >
                  <View style={styles.statsGridHeader}>
                    <Icons.Stress width={20} height={20} color="#64C59A" />
                    <Text style={styles.statsGridLabel}>Stress</Text>
                  </View>
                  <Text style={[styles.statsGridValue, { color: '#64C59A' }]}>{avgStress.toFixed(1)}</Text>
                  <Text style={styles.statsGridSub}>avg. last 14 days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statsGridCard, { borderLeftColor: '#4CAF85' }]}
                  onPress={() => setSelectedMetric('sleep')}
                  activeOpacity={0.7}
                >
                  <View style={styles.statsGridHeader}>
                    <Icons.Sleep width={20} height={20} color="#4CAF85" />
                    <Text style={styles.statsGridLabel}>Sleep</Text>
                  </View>
                  <Text style={[styles.statsGridValue, { color: '#4CAF85' }]}>{avgSleep.toFixed(1)}</Text>
                  <Text style={styles.statsGridSub}>avg. last 14 days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statsGridCard, { borderLeftColor: '#2E8A66' }]}
                  onPress={() => setSelectedMetric('relax')}
                  activeOpacity={0.7}
                >
                  <View style={styles.statsGridHeader}>
                    <Icons.Relaxation width={20} height={20} color="#2E8A66" />
                    <Text style={styles.statsGridLabel}>Relax</Text>
                  </View>
                  <Text style={[styles.statsGridValue, { color: '#2E8A66' }]}>{avgRelaxation.toFixed(1)}</Text>
                  <Text style={styles.statsGridSub}>avg. last 14 days</Text>
                </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        )}

        {/* Weekly Progress */}
        {activeTab === 'weekly' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.tabContent}>
            <View style={styles.detailedProgressContainer}>
              <View style={styles.detailedProgressBar}>
                <View style={styles.progressBarHeader}>
                  <View style={styles.progressBarIconLabel}>
                    <Icons.Calendar width={24} height={24} color="#64C59A" strokeWidth={2} />
                    <Text style={styles.progressBarTitle}>Weekly Reflections</Text>
                  </View>
                  <Text style={styles.progressBarValue}>{weeklyCompletion}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: `${weeklyCompletion}%`, backgroundColor: '#64C59A' }]} />
                </View>
                <Text style={styles.progressBarSubtitle}>{weeklyProgressData.filter(w => w.completed).length}/{weeklyProgressData.length} weeks completed</Text>
                {weeklyProgressData && weeklyProgressData.filter(w => !w.completed).length > 0 && (
                  <View style={styles.missedDatesContainer}>
                    <Text style={styles.missedDatesTitle}>Missed Weeks ({weeklyProgressData.filter(w => !w.completed).length}):</Text>
                    <View style={styles.missedDatesList}>
                      {weeklyProgressData.filter(w => !w.completed).slice(0, 6).map((w, i) => (
                        <View key={i} style={styles.missedDateItem}>
                          <Icons.RemoveCircle width={16} height={16} color="#EF4444" strokeWidth={2} />
                          <Text style={styles.missedDateText}>{w.week}</Text>
                        </View>
                      ))}
                      {weeklyProgressData.filter(w => !w.completed).length > 6 && <Text style={styles.moreDatesText}>+ {weeklyProgressData.filter(w => !w.completed).length - 6} more</Text>}
                    </View>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Weekly Completion Timeline</Text>
              <WeeklyCompletionChart data={weeklyProgressData} />
            </View>

            <View style={styles.tableSection}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableTitle}>Weekly Submission History</Text>
                {weeklyProgressData.filter(w => w.completed).length > 5 && (
                  <TouchableOpacity onPress={() => {
                    setSelectedWeeklySubmissions(weeklyProgressData.filter(w => w.completed));
                    setWeeklyModalVisible(true);
                  }}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {weeklyProgressData.filter(w => w.completed).length > 0 ? (
                weeklyProgressData
                  .filter(w => w.completed)
                  .slice(0, 5)
                  .map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={styles.weekCell}>
                        <Text style={styles.dateCell}>{item.week}</Text>
                        {item.submitted_at && (
                          <Text style={styles.submissionTime}>{formatDateTime(item.submitted_at)}</Text>
                        )}
                      </View>
                      <View style={styles.statusCell}>
                        <View style={styles.completedIconContainer}>
                          <Icons.History width={20} height={20} color="#64C59A" />
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
            <View style={styles.detailedProgressContainer}>
              <View style={styles.detailedProgressBar}>
                <View style={styles.progressBarHeader}>
                  <View style={styles.progressBarIconLabel}>
                    <Icons.History width={24} height={24} color="#4CAF85" strokeWidth={2} />
                    <Text style={styles.progressBarTitle}>Main Questionnaires</Text>
                  </View>
                  <Text style={styles.progressBarValue}>{mainCompletion}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: `${mainCompletion}%`, backgroundColor: '#4CAF85' }]} />
                </View>
                <Text style={styles.progressBarSubtitle}>{mainQuestionnaireData.length} sessions</Text>
              </View>
            </View>
            <View style={styles.chartSection}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.chartTitle}>Main Questionnaire Submissions</Text>
                {mainQuestionnaireData.length > 5 && (
                  <TouchableOpacity onPress={() => {
                    setSelectedMainSubmissions(mainQuestionnaireData);
                    setMainModalVisible(true);
                  }}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.submissionList}>
                {mainQuestionnaireData.length > 0 ? (
                  mainQuestionnaireData
                    .slice(0, 5)
                    .map((item) => (
                      <View key={item.id} style={styles.tableRow}>
                        <View style={styles.weekCell}>
                          <Text style={styles.dateCell}>{item.version}</Text>
                          <Text style={styles.submissionTime}>{formatDateTime(item.submitted_at)}</Text>
                        </View>
                        <View style={styles.statusCell}>
                          <View style={styles.completedIconContainer}>
                            <Icons.History width={20} height={20} color="#64C59A" />
                          </View>
                        </View>
                      </View>
                    ))
                ) : (
                  <Text style={styles.noDataText}>No main questionnaire submissions yet</Text>
                )}
              </View>
            </View>

            {/* Missed main questionnaires (by month) */}
            {mainMissedMonths && mainMissedMonths.length > 0 && (
              <View style={[styles.missedDatesContainer, { marginBottom: 12 }]}>
                <Text style={styles.missedDatesTitle}>Missed Months ({mainMissedMonths.length}):</Text>
                <View style={styles.missedDatesList}>
                  {mainMissedMonths.slice(0, 6).map((m, i) => (
                    <View key={i} style={styles.missedDateItem}>
                      <Icons.RemoveCircle width={16} height={16} color="#EF4444" strokeWidth={2} />
                      <Text style={styles.missedDateText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mainQuestionnaireData.length}</Text>
                <Text style={styles.statLabel}>Total Submissions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mainCompletion}%</Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Weekly Submissions Modal */}
      <Modal
        visible={weeklyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWeeklyModalVisible(false)}
      >
        <View style={styles.allSubmissionsModalContainer}>
          <View style={styles.allSubmissionsModalContent}>
            <View style={styles.allSubmissionsModalHeader}>
              <Text style={styles.allSubmissionsModalTitle}>All Weekly Submissions</Text>
              <TouchableOpacity onPress={() => setWeeklyModalVisible(false)}>
                <Icons.Close width={24} height={24} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.allSubmissionsModalBody}>
              {selectedWeeklySubmissions.map((item, index) => (
                <View key={index} style={styles.allSubmissionsModalListItem}>
                  <View style={styles.weekCell}>
                    <Text style={styles.dateCell}>{item.week}</Text>
                    {item.submitted_at && (
                      <Text style={styles.submissionTime}>{formatDateTime(item.submitted_at)}</Text>
                    )}
                  </View>
                  <View style={styles.statusCell}>
                    <View style={styles.completedIconContainer}>
                      <Icons.History width={20} height={20} color="#64C59A" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Submissions Modal */}
      <Modal
        visible={mainModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMainModalVisible(false)}
      >
        <View style={styles.allSubmissionsModalContainer}>
          <View style={styles.allSubmissionsModalContent}>
            <View style={styles.allSubmissionsModalHeader}>
              <Text style={styles.allSubmissionsModalTitle}>All Main Questionnaire Submissions</Text>
              <TouchableOpacity onPress={() => setMainModalVisible(false)}>
                <Icons.Close width={24} height={24} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.allSubmissionsModalBody}>
              {selectedMainSubmissions.map((item) => (
                <View key={item.id} style={styles.allSubmissionsModalListItem}>
                  <View style={styles.weekCell}>
                    <Text style={styles.dateCell}>{item.version}</Text>
                    <Text style={styles.submissionTime}>{formatDateTime(item.submitted_at)}</Text>
                  </View>
                  <View style={styles.statusCell}>
                    <View style={styles.completedIconContainer}>
                      <Icons.History width={20} height={20} color="#64C59A" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Metric Detail Modal */}
      <Modal
        visible={selectedMetric !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedMetric(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedMetric(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View
                  style={[
                    styles.modalColorDot,
                    {
                      backgroundColor:
                        selectedMetric === 'stress' ? '#64C59A' :
                          selectedMetric === 'sleep' ? '#4CAF85' : '#2E8A66'
                    }
                  ]}
                />
                <Text style={styles.modalTitle}>
                  {selectedMetric === 'stress' ? 'Stress Levels' :
                    selectedMetric === 'sleep' ? 'Sleep Quality' : 'Relaxation Levels'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMetric(null)}>
                <Icons.Close width={24} height={24} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalChartContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.modalChartWrapper}>
                <LineChart
                  data={getChartData(selectedMetric)}
                  color={
                    selectedMetric === 'stress' ? '#64C59A' :
                      selectedMetric === 'sleep' ? '#4CAF85' : '#2E8A66'
                  }
                  metric={selectedMetric}
                />


                {/* Metric Description */}
                <View style={styles.metricDescriptionContainer}>
                  <Text style={styles.metricDescriptionText}>
                    {selectedMetric === 'stress' ? "Review your Stress level last 14 days 1 is low stress and 5 is high.." :
                      selectedMetric === 'sleep' ? "Review your Sleep quality last 14 days 1 is bad and 5 is excellent.." :
                        "Review your Relaxation level last 14 days 1 is not relaxed at all and 5 is fully relaxed.."}
                  </Text>
                </View>
              </View>

              {/* Data Table */}
              <View style={styles.modalTableContainer}>
                <Text style={styles.modalTableTitle}>Daily Values</Text>
                <View style={styles.modalTableHeader}>
                  <Text style={[styles.modalTableHeaderCell, { flex: 1 }]}>Date</Text>
                  <Text style={[styles.modalTableHeaderCell, { flex: 1, textAlign: 'right' }]}>Value</Text>
                </View>
                {dailySliderData.slice(0, 14).map((item, idx) => (
                  <View key={idx} style={styles.modalTableRow}>
                    <Text style={[styles.modalTableCell, { flex: 1 }]}>
                      {formatDate(item.created_at)}
                    </Text>
                    <Text style={[styles.modalTableCell, { flex: 1, textAlign: 'right' }]}>
                      {selectedMetric === 'stress' ? item.stress_level :
                        selectedMetric === 'sleep' ? item.sleep_quality : item.relaxation_level}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Component to display a line chart for metric data
 */
const LineChart = ({ data, color, metric }: {
  data: { value: number; date: string }[];
  color: string;
  metric: 'stress' | 'sleep' | 'relax' | null;
}) => {
  if (data.length === 0) return null;

  const chartHeight = 250;
  const chartWidth = width - 48;
  const marginLeft = 35;
  const graphWidth = chartWidth - marginLeft;
  const pointSpacing = data.length > 1 ? graphWidth / (data.length - 1) : graphWidth / 2;

  // Fixed range 0-5
  const minValue = 0;
  const maxValue = 5;

  // Convert data values to coordinates
  const points = data.map((item, index) => {
    const x = marginLeft + index * pointSpacing;
    const y = chartHeight - ((item.value - minValue) / (maxValue - minValue)) * (chartHeight - 40) - 20;
    return { x, y, value: item.value, date: item.date };
  });

  // Create path for the line
  let pathData = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x},${points[i].y}`;
  }

  // Generate Y-axis labels
  const yLabels = [0, 1, 2, 3, 4, 5];

  const getLegendForValue = (val: number) => {
    return val.toString();
  };

  return (
    <View style={styles.chartContainer}>
      <Svg height={chartHeight} width={chartWidth}>
        {/* Y-axis labels */}
        {yLabels.map((value, index) => {
          const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * (chartHeight - 40) - 20;
          return (
            <React.Fragment key={index}>
              <SvgText
                x={marginLeft - 5}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#666"
              >
                {getLegendForValue(value)}
              </SvgText>
              <Line
                x1={marginLeft}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </React.Fragment>
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
            r="4"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={[styles.xAxisLabels, { marginLeft: marginLeft }]}>
        {data.map((item, index) => (
          (index === 0 || index === data.length - 1 || index % 3 === 0) ? (
            <Text key={index} style={[styles.xAxisLabel, { left: index * pointSpacing - 20, position: 'absolute', width: 40, textAlign: 'center' }]}>
              {item.date}
            </Text>
          ) : null
        ))}
      </View>
    </View>
  );
};

/**
 * Component to display weekly completion chart
 */
const WeeklyCompletionChart = ({ data }: { data: WeeklyProgressData[] }) => {
  if (data.length === 0) return null;

  const chartHeight = 150;
  const chartWidth = width - 48;
  const barWidth = Math.max(20, chartWidth / Math.min(data.length, 10) - 4); // Limit to 10 bars for readability
  const barSpacing = 4;

  return (
    <View style={styles.chartContainer}>
      <Svg height={chartHeight} width={chartWidth}>
        {data.slice(0, 10).map((week, index) => { // Limit to 10 weeks for readability
          const x = index * (barWidth + barSpacing);
          const barHeight = week.completed ? 120 : 60;
          const y = chartHeight - barHeight;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={week.completed ? "#64C59A" : "#E5E7EB"}
              rx="4"
            />
          );
        })}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {data.slice(0, 10).map((week, index) => (
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#F8FDFC',
    zIndex: 10,
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
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#64C59A',
    fontWeight: '600',
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
  weekCell: {
    flex: 2,
  },
  submissionTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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

  completedIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  completedIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  /* Detailed progress styles */
  detailedProgressContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  detailedProgressBar: {
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 10,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarIconLabel: { flexDirection: 'row', alignItems: 'center' },
  progressBarTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 10 },
  progressBarValue: { fontSize: 16, fontWeight: '800', color: '#333' },
  progressBarTrack: { height: 8, backgroundColor: '#F0F9F6', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 8 },
  progressBarSubtitle: { fontSize: 12, color: '#888' },
  missedDatesContainer: { marginTop: 10, backgroundColor: '#FFF7F7', padding: 10, borderRadius: 10 },
  missedDatesTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 8 },
  missedDatesList: { flexDirection: 'row', flexWrap: 'wrap' },
  missedDateItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 8 },
  missedDateText: { marginLeft: 6, color: '#EF4444' },
  moreDatesText: { marginTop: 6, color: '#999' },
  // Stats Grid Styles
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statsGridCard: {
    width: '32%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsGridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statsGridValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statsGridSub: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalChartContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: '50%',
  },
  modalChartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTableContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  modalTableTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  modalTableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  modalTableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  modalTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalTableCell: {
    fontSize: 13,
    color: '#333',
  },
  allSubmissionsModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  allSubmissionsModalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
  },
  allSubmissionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  allSubmissionsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  allSubmissionsModalBody: {
    padding: 20,
  },
  allSubmissionsModalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricDescriptionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#64C59A',
    width: '100%',
  },
  metricDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});