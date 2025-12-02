import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface DailySliderData {
  id: number;
  stress_level: number;
  sleep_quality: number;
  relaxation_level: number;
  exercise_duration: number;
  created_at: string;
}

export default function ProgressScreen() {
  const { session } = useSession();
  const [data, setData] = useState<DailySliderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDailySliderData();
    }
  }, [session]);

  const fetchDailySliderData = async () => {
    try {
      const { data: sliderData, error } = await supabase
        .from('daily_sliders')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(7); // Get last 7 days

      if (error) throw error;
      setData(sliderData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const average = (arr: number[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const stressData = data.map(item => item.stress_level);
  const sleepData = data.map(item => item.sleep_quality);
  const relaxationData = data.map(item => item.relaxation_level);

  const avgStress = average(stressData);
  const avgSleep = average(sleepData);
  const avgRelaxation = average(relaxationData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
          <Text style={styles.chartTitle}>Stress Levels (Last 7 Days)</Text>
          <LineChart data={stressData} color="#EF4444" labels={data.map(d => formatDate(d.created_at))} />
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Sleep Quality (Last 7 Days)</Text>
          <LineChart data={sleepData} color="#3B82F6" labels={data.map(d => formatDate(d.created_at))} />
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Relaxation Levels (Last 7 Days)</Text>
          <LineChart data={relaxationData} color="#10B981" labels={data.map(d => formatDate(d.created_at))} />
        </View>

        {/* Data Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Recent Entries</Text>
          {data.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.dateCell}>{formatDate(item.created_at)}</Text>
              <Text style={styles.dataCell}>{item.stress_level}</Text>
              <Text style={styles.dataCell}>{item.sleep_quality}</Text>
              <Text style={styles.dataCell}>{item.relaxation_level}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const LineChart = ({ data, color, labels }: { data: number[]; color: string; labels: string[] }) => {
  if (data.length === 0) return null;

  const maxValue = 10;
  const minValue = 1;
  const chartHeight = 200;
  const chartWidth = width - 48;
  const pointSpacing = chartWidth / (data.length - 1);

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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 24,
  },
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
    fontSize: 12,
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
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
});