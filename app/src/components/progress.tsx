import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { useSession } from '../../src/contexts/SessionContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { session, loading } = useSession();
  const [stats, setStats] = useState({
    totalEntries: 0,
    streak: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [chartData, setChartData] = useState<number[]>([]);
  
  useEffect(() => {
    if (session) {
      fetchProgressData();
    }
  }, [session]);
  
  async function fetchProgressData() {
    try {
      // Fetch total entries
      const { count: totalEntries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id);
        
      if (entriesError) throw entriesError;
      
      // Calculate streak (simplified - in a real app you'd check consecutive days)
      const streak = Math.min(totalEntries || 0, 7);
      
      // Calculate this week's entries
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { count: thisWeek, error: weekError } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id)
        .gte('created_at', startOfWeek.toISOString());
        
      if (weekError) throw weekError;
      
      // Calculate this month's entries
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: thisMonth, error: monthError } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id)
        .gte('created_at', startOfMonth.toISOString());
        
      if (monthError) throw monthError;
      
      setStats({
        totalEntries: totalEntries || 0,
        streak: streak,
        thisWeek: thisWeek || 0,
        thisMonth: thisMonth || 0
      });
      
      // Generate mock chart data
      const mockData = [];
      for (let i = 0; i < 7; i++) {
        mockData.push(Math.floor(Math.random() * 10) + 1);
      }
      setChartData(mockData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  }
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer} />
      </View>
    );
  }
  
  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Please sign in to view your progress</Text>
      </View>
    );
  }

  // Render a simple bar chart
  const renderChart = () => {
    const maxValue = Math.max(...chartData, 1);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This Week's Activity</Text>
        <View style={styles.chart}>
          {chartData.map((value, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar, 
                    { height: `${(value / maxValue) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.chartLabel}>{weekdays[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Track your mindfulness journey</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>
      
      {renderChart()}
      
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            {stats.totalEntries > 0 
              ? "Great job keeping up with your mindfulness practice! Consistency is key to building lasting habits."
              : "Start your mindfulness journey today! Creating your first entry is the first step towards a more mindful life."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 72) / 2,
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#64C59A',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  chartBar: {
    backgroundColor: '#64C59A',
    width: '60%',
    alignSelf: 'center',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  insightsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightCard: {
    backgroundColor: '#E8F5F1',
    borderRadius: 12,
    padding: 16,
  },
  insightText: {
    fontSize: 14,
    color: '#2E8A66',
    lineHeight: 20,
    textAlign: 'center',
  },
});