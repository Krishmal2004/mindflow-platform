import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
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

    // Create closed path for fill
    let fillPathD = '';
    if (points.length > 1) {
        fillPathD = `${pathD} L ${points[points.length - 1].x + 10} ${CHART_HEIGHT} L ${points[0].x + 10} ${CHART_HEIGHT} Z`;
    }

    const uniqueId = label.replace(/\s+/g, '');

    return (
        <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color }]}>{label}</Text>
            <Svg width={CHART_WIDTH + 40} height={CHART_HEIGHT + 30} style={{ marginLeft: -10 }}>
                <Defs>
                    <SvgLinearGradient id={`grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </SvgLinearGradient>
                </Defs>

                {/* Y-Axis Lines (Grid) */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                    const y = CHART_HEIGHT - ((i / yMax) * CHART_HEIGHT);
                    return (
                        <G key={i}>
                            <Line x1="10" y1={y} x2={CHART_WIDTH + 10} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                        </G>
                    );
                })}

                {/* Filled Area */}
                {fillPathD ? (
                    <Path d={fillPathD} fill={`url(#grad-${uniqueId})`} />
                ) : null}

                {/* The Line */}
                {pathD ? (
                    <Path d={pathD} stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                ) : null}

                {/* Data Points */}
                {points.map((p, i) => (
                    <G key={i}>
                        <Circle cx={p.x + 10} cy={p.y} r="6" fill={color} opacity="0.25" />
                        <Circle cx={p.x + 10} cy={p.y} r="3" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
                    </G>
                ))}

                {/* X-Axis Labels */}
                <SvgText x="10" y={CHART_HEIGHT + 18} fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="start">7 Days Ago</SvgText>
                <SvgText x={CHART_WIDTH + 10} y={CHART_HEIGHT + 18} fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="end">Today</SvgText>
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
    const stressData = historyData?.map(d => d.stress_level).filter(v => v != null) || [];
    const moodData = historyData?.map(d => d.mood).filter(v => v != null) || [];
    const sleepData = historyData?.map(d => d.sleep_quality).filter(v => v != null) || [];
    const relaxationData = historyData?.map(d => d.relaxation_level).filter(v => v != null) || [];

    // Entrance Animations
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.8);
    const slideAnim = useSharedValue(24);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
        scaleAnim.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.5)) });
        slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateY: slideAnim.value }],
    }));

    const toggleStats = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStatsExpanded(!statsExpanded);
    };

    const isDaily = historyData && historyData.length > 0;
    
    // Choose theme colors dynamically
    const themeColor = isDaily ? '#D97706' : Colors.primary;
    const themeBg = isDaily ? '#FFFBEB' : '#E6F4EA';
    const themeBgGrad = isDaily 
        ? ['#FFFBEB', '#FFF9F0', '#FFFFFF'] as const
        : ['#E6F4EA', '#F1F7F3', '#FFFFFF'] as const;

    return (
        <LinearGradient
            colors={themeBgGrad}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar style="dark" />

            {/* Background Decoration */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={width * 0.8} color={themeColor} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Animated.View style={[styles.successIcon, { shadowColor: themeColor }, animatedIconStyle]}>
                        <Ionicons name="checkmark-circle" size={80} color={themeColor} />
                    </Animated.View>
                    <Animated.View style={[styles.textCenter, animatedContentStyle]}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </Animated.View>
                </View>

                {historyData && historyData.length > 0 && (
                    <Animated.View style={[styles.statsCard, animatedContentStyle]}>
                        <TouchableOpacity
                            style={styles.statsHeaderButton}
                            onPress={toggleStats}
                            activeOpacity={0.7}
                        >
                            <View style={styles.statsTitleContainer}>
                                <View style={[styles.iconCircle, { backgroundColor: themeBg }]}>
                                    <Ionicons name="stats-chart" size={20} color={themeColor} />
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
                                <SimpleLineChart data={moodData} color="#D97706" label="Mood Level" />
                                <SimpleLineChart data={sleepData} color="#3B82F6" label="Sleep Quality" />
                                <SimpleLineChart data={relaxationData} color="#0D9488" label="Relaxation Level" />
                            </View>
                        )}
                    </Animated.View>
                )}

                <Animated.View style={[{ width: '100%' }, animatedContentStyle]}>
                    <TouchableOpacity
                        style={[styles.homeButton, { backgroundColor: themeColor, shadowColor: themeColor }]}
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.homeButtonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    textCenter: {
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
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
        paddingHorizontal: 16,
    },
    statsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 30,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
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
        color: '#1E293B',
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
        fontWeight: '700',
        marginBottom: 12,
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    homeButton: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
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
