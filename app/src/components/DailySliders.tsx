import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Stress level emojis from low to high
const STRESS_EMOJIS = ['😊', '🙂', '😐', '😕', '😟', '😧', '😨', '😰', '😱', '😵'];

// Mood faces from bad to good (5 levels)
const MOOD_FACES = ['😢', '😐', '🙂', '😊', '😄'];

// Sleep quality emojis from poor to excellent (5 levels)
const SLEEP_QUALITY_EMOJIS = ['😫', '😪', '🛌', '😴', '🥱']; // Adjusted: poor to best

// Factors influencing stress
const STRESS_FACTORS = [
  'Health', 'Sleep', 'Exercise', 'Food', 'Hobby', 'Money', 'Identity',
  'Friends', 'Pet', 'Family', 'Dating', 'Work', 'Home', 'School',
  'Outdoors', 'Travel', 'Weather'
];

// Time options for sleep schedule (30-minute intervals)
const TIME_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Custom Icons
const Icons = {
  stress: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="8.5" cy="10.5" r="1.5" fill="#64C59A"/>
      <Circle cx="15.5" cy="10.5" r="1.5" fill="#64C59A"/>
    </Svg>
  ),
  mood: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 14C8.91212 15.2144 10.3643 16 12 16C13.6357 16 15.0879 15.2144 16 14" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="9" cy="9" r="1" fill="#64C59A"/>
      <Circle cx="15" cy="9" r="1" fill="#64C59A"/>
    </Svg>
  ),
  sleep: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M20 20H4V4" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 13H13V21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M11 3H21V13H11V3Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 11H5V13H3V11Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  factors: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 6V18" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M6 12H18" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  schedule: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M16 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M8 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M3 10H21" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  relaxation: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="9" cy="9" r="1" fill="#64C59A"/>
      <Circle cx="15" cy="9" r="1" fill="#64C59A"/>
    </Svg>
  ),
};

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();

  // State variables
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEditAfterExercise, setShowEditAfterExercise] = useState(false);
  const [showRelaxationSlider, setShowRelaxationSlider] = useState(false);

  const stressAnimation = useRef(new Animated.Value(0)).current;
  const breathingAnimation = useRef(new Animated.Value(0)).current; // For custom animation
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [breathingTime, setBreathingTime] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');

  // Check if user has already submitted today
  useEffect(() => {
    checkDailySubmission();
  }, [session]);

  const checkDailySubmission = async () => {
    if (!session?.user?.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('daily_sliders')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setAlreadySubmittedToday(true);
        setEntryId(data[0].id);
      }
    } catch (error) {
      console.error('Error checking daily submission:', error);
    }
  };

  // Animate stress circle
  useEffect(() => {
    if (stressLevel !== null) {
      Animated.timing(stressAnimation, {
        toValue: stressLevel,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [stressLevel]);

  // Toggle factor
  const toggleFactor = (factor: string) => {
    setSelectedFactors(prev => prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]);
  };

  // Get stress color
  const getStressColor = () => {
    if (stressLevel === null) return '#64C59A';
    if (stressLevel <= 3) return '#10B981';
    if (stressLevel <= 6) return '#FBBF24';
    return '#EF4444';
  };

  // Get stress emoji
  const getStressEmoji = () => STRESS_EMOJIS[stressLevel ? stressLevel - 1 : 2] || '😐';

  // Get mood face - now 1 bad, 5 good
  const getMoodFace = () => MOOD_FACES[moodLevel ? moodLevel - 1 : 2] || '😐';

  // Get sleep quality emoji - 1 poor, 5 excellent
  const getSleepQualityEmoji = () => SLEEP_QUALITY_EMOJIS[sleepQuality ? sleepQuality - 1 : 2] || '😐';

  // Get relaxation emoji
  const getRelaxationEmoji = () => STRESS_EMOJIS[relaxationLevel ? 10 - relaxationLevel : 2] || '😐';

  // Submit wellness data
  const submitWellnessData = async (isEdit = false) => {
    if (!session?.user?.id) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }
    if (stressLevel === null || moodLevel === null || sleepQuality === null || selectedFactors.length === 0 ||
      sleepStart === null || wakeUp === null) {
      Alert.alert('Incomplete Form', 'Please complete all fields before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      let data;
      if (isEdit && entryId) {
        const { error } = await supabase
          .from('daily_sliders')
          .update({
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
          })
          .eq('id', entryId);
        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from('daily_sliders')
          .insert({
            user_id: session.user.id,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            // Adding the missing fields with default values
            exercise_duration: 0,
            completed_exercise_time: 0,
            relaxation_level: null,
            created_at: new Date().toISOString(),
          })
          .select();
        if (error) throw error;
        data = insertData;
      }
      if (!isEdit && data && data.length > 0) {
        setEntryId(data[0].id);
      }
      setShowEditAfterExercise(true);
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start breathing
  const startBreathingExercise = () => {
    setIsBreathing(true);
    setBreathingTime(0);
    setBreathingPhase('inhale');
    animateBreathing();
    timerRef.current = setInterval(() => {
      setBreathingTime(prev => {
        const newTime = prev + 1;
        const cycleTime = newTime % 16;
        if (cycleTime < 4) setBreathingPhase('inhale');
        else if (cycleTime < 8) setBreathingPhase('hold1');
        else if (cycleTime < 12) setBreathingPhase('exhale');
        else setBreathingPhase('hold2');
        if (newTime >= 240) {
          finishBreathingExercise();
          return prev;
        }
        return newTime;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  // Custom breathing animation - using opacity or color change instead of scale
  const animateBreathing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnimation, { toValue: 1, duration: 4000, useNativeDriver: true }), // Inhale
        Animated.timing(breathingAnimation, { toValue: 1, duration: 4000, useNativeDriver: true }), // Hold1
        Animated.timing(breathingAnimation, { toValue: 0, duration: 4000, useNativeDriver: true }), // Exhale
        Animated.timing(breathingAnimation, { toValue: 0, duration: 4000, useNativeDriver: true }), // Hold2
      ])
    ).start();
  };

  // Stop breathing
  const stopBreathingExercise = () => {
    setIsBreathing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    breathingAnimation.stopAnimation();
    setShowRelaxationSlider(true);
  };

  // Finish breathing
  const finishBreathingExercise = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    breathingAnimation.stopAnimation();
    await updateEntryWithExerciseData();
    setShowCompletion(true);
    setAlreadySubmittedToday(true);
    setIsBreathing(false);
  };

  // Update with exercise
  const updateEntryWithExerciseData = async () => {
    if (!entryId || !session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('daily_sliders')
        .update({
          exercise_duration: 4,
          completed_exercise_time: Math.floor(breathingTime / 60), // Convert to minutes
        })
        .eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      Alert.alert('Update Error', 'Failed to update exercise data.');
      console.error(error);
    }
  };

  // Submit relaxation
  const submitRelaxationAndFinal = async () => {
    if (relaxationLevel === null) {
      Alert.alert('Incomplete', 'Please select your relaxation level.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('daily_sliders')
        .update({
          relaxation_level: relaxationLevel,
        })
        .eq('id', entryId);
      if (error) throw error;
      setShowCompletion(true);
      setAlreadySubmittedToday(true);
      setShowRelaxationSlider(false);
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Breathing instruction
  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold1': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'hold2': return 'Hold...';
      default: return 'Breathe';
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stress circle interpolation
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 5, 10],
    outputRange: [1.3, 0.7, 1.3],
    extrapolate: 'clamp',
  });
  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 10],
    outputRange: [0.8, 0.8],
  });

  // Breathing animation interpolation - e.g., opacity for custom element
  const breathingOpacity = breathingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const breathingColor = breathingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EF4444', '#10B981'],
    extrapolate: 'clamp',
  });

  if (alreadySubmittedToday && !isBreathing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Sliders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Great Job Today!</Text>
          <Text style={styles.completionText}>You've completed your daily mindfulness routine.</Text>
          <Text style={styles.completionText}>You’re all set. Let’s meet again tomorrow!</Text>
          <Text style={styles.happyEmoji}>😊</Text>
        </View>
      </View>
    );
  }

  if (isBreathing) {
    return (
      <View style={styles.container}>
        <Svg style={styles.backgroundSvg} width={width} height="100%" viewBox="0 0 375 812" fill="none">
          <Path d="M0 0C0 0 100 50 187.5 50C275 50 375 0 375 0V812H0V0Z" fill="#F0F9F6" opacity="0.5"/>
          <Path d="M0 100C50 150 150 50 187.5 50C225 50 325 150 375 100" fill="#E8F5F1" opacity="0.3"/>
        </Svg>
        <View style={styles.header}>
          <TouchableOpacity onPress={stopBreathingExercise} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Breathing Exercise</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.breathingContainer}>
          <Text style={styles.timerText}>{formatTime(breathingTime)}</Text>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathingElement,
                {
                  opacity: breathingOpacity,
                  backgroundColor: breathingColor,
                }
              ]}
            >
              <Text style={styles.instructionText}>{getBreathingInstruction()}</Text>
            </Animated.View>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, styles.longButton, { backgroundColor: getStressColor() }]}
            onPress={stopBreathingExercise}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Finish Breathing Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showRelaxationSlider) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Relaxation Level</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <Icons.relaxation />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.sectionTitle}>Relaxation Level</Text>
                <Text style={styles.sectionSubtitle}>How relaxed do you feel after the exercise? (1-10)</Text>
              </View>
            </View>
            <View style={styles.stressVisualContainer}>
              <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
                {getRelaxationEmoji()}
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: relaxationLevel ? `${relaxationLevel * 10}%` : '0%',
                      backgroundColor: getStressColor()
                    }
                  ]}
                />
              </View>
              <View style={styles.thumbContainer}>
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.thumb,
                      relaxationLevel === i + 1 && styles.thumbActive,
                      relaxationLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                    ]}
                    onPress={() => setRelaxationLevel(i + 1)}
                  />
                ))}
              </View>
              <View style={styles.labels}>
                <Text style={styles.label}>Stressed</Text>
                <Text style={styles.label}>Relaxed</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, styles.longButton, { backgroundColor: getStressColor() }]}
            onPress={submitRelaxationAndFinal}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Relaxation Level'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Sliders</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stress Level Section */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.stress />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Stress Level</Text>
              <Text style={styles.sectionSubtitle}>How stressed do you feel today? (1-10)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Animated.View
              style={[
                styles.stressCircleContainer,
                {
                  transform: [{ scale: stressCircleScale }],
                  opacity: stressCircleOpacity,
                }
              ]}
            >
              <Svg width="120" height="120" viewBox="0 0 120 120">
                <G>
                  <Circle cx="60" cy="60" r="55" fill={getStressColor()} />
                  <Circle cx="60" cy="60" r="45" fill="white" opacity="0.2" />
                  <Path d="M30 60 Q60 30 90 60 Q60 90 30 60" fill="white" opacity="0.1" />
                </G>
              </Svg>
            </Animated.View>
            <Text style={[styles.stressEmoji, { color: getStressColor() }]}>
              {getStressEmoji()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: stressLevel ? `${stressLevel * 10}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(10)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    stressLevel === i + 1 && styles.thumbActive,
                    stressLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setStressLevel(i + 1)}
                />
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Low</Text>
              <Text style={styles.label}>High</Text>
            </View>
          </View>
        </View>
        {/* Mood Selector Section */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.mood />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Mood Level</Text>
              <Text style={styles.sectionSubtitle}>How is your mood today? (1 Bad - 5 Good)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
              {getMoodFace()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: moodLevel ? `${(moodLevel * 100) / 5}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    { width: width / 6 - 10, justifyContent: 'center', alignItems: 'center' },
                    moodLevel === i + 1 && styles.thumbActive,
                    moodLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setMoodLevel(i + 1)}
                >
                  <Text style={[styles.moodThumbEmoji, { textAlign: 'center' }]}>{MOOD_FACES[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Bad</Text>
              <Text style={styles.label}>Good</Text>
            </View>
          </View>
        </View>
        {/* Factors Influencing Stress */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.factors />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Factors Influencing Stress</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            </View>
          </View>
          <View style={styles.factorsContainer}>
            {STRESS_FACTORS.map((factor) => (
              <TouchableOpacity
                key={factor}
                style={[
                  styles.factorTag,
                  selectedFactors.includes(factor) && styles.factorTagSelected,
                  selectedFactors.includes(factor) && { backgroundColor: getStressColor() }
                ]}
                onPress={() => toggleFactor(factor)}
              >
                <Text style={[
                  styles.factorText,
                  selectedFactors.includes(factor) && styles.factorTextSelected
                ]}>
                  {factor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Sleep Schedule */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.schedule />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Sleep Schedule</Text>
              <Text style={styles.sectionSubtitle}>When did you sleep and wake up?</Text>
            </View>
          </View>
          <View style={styles.sleepScheduleContainer}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Sleep Start</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      sleepStart === time && styles.timeOptionSelected,
                      sleepStart === time && { backgroundColor: getStressColor() }
                    ]}
                    onPress={() => setSleepStart(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      sleepStart === time && styles.timeTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Wake Up</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      wakeUp === time && styles.timeOptionSelected,
                      wakeUp === time && { backgroundColor: getStressColor() }
                    ]}
                    onPress={() => setWakeUp(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      wakeUp === time && styles.timeTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        {/* Sleep Quality Section - moved after schedule */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.sleep />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Sleep Quality</Text>
              <Text style={styles.sectionSubtitle}>How was your sleep quality? (1 Poor - 5 Excellent)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
              {getSleepQualityEmoji()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: sleepQuality ? `${(sleepQuality * 100) / 5}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    { width: width / 6 - 10 },
                    sleepQuality === i + 1 && styles.thumbActive,
                    sleepQuality === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setSleepQuality(i + 1)}
                />
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Poor</Text>
              <Text style={styles.label}>Excellent</Text>
            </View>
          </View>
        </View>
        {/* Submit Button */}
        {!showCompletion && !isBreathing && (
          showEditAfterExercise ? (
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: getStressColor() }]}
              onPress={startBreathingExercise}
            >
              <Text style={styles.submitButtonText}>Start 4-Minute Breathing Exercise</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: getStressColor() }]}
              onPress={() => submitWellnessData(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Wellness Data'}
              </Text>
            </TouchableOpacity>
          )
        )}
        {showCompletion && (
          <View style={styles.completionContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job Today!</Text>
            <Text style={styles.completionText}>You've completed your daily mindfulness routine.</Text>
            <Text style={styles.completionText}>You’re all set. Let’s meet again tomorrow!</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  backgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 24,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  happyEmoji: {
    fontSize: 60,
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  stressVisualContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stressCircleContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  stressEmoji: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5F1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 4,
  },
  thumbContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5F1',
    borderWidth: 2,
    borderColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbActive: {
    backgroundColor: '#64C59A',
    transform: [{ scale: 1.2 }],
  },
  moodThumbEmoji: {
    fontSize: 20,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#999',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  factorTag: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  factorTagSelected: {
    backgroundColor: '#64C59A',
  },
  factorText: {
    fontSize: 14,
    color: '#333',
  },
  factorTextSelected: {
    color: '#fff',
  },
  sleepScheduleContainer: {
    flexDirection: 'column',
  },
  timeColumn: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  timeOptionSelected: {
    backgroundColor: '#64C59A',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  longButton: {
    paddingHorizontal: 40, // Make button longer
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  breathingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  breathingElement: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
});