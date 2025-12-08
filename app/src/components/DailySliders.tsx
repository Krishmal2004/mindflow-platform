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

// Mood faces from good to bad (6 levels)
const MOOD_FACES = ['😄', '😊', '🙂', '😐', '😕', '😢'];

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

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();

  // State variables
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEditAfterExercise, setShowEditAfterExercise] = useState(false);

  const stressAnimation = useRef(new Animated.Value(0)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [breathingTime, setBreathingTime] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

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
        setEntryId(data[0].id); // Store entry ID for potential editing
      }
    } catch (error) {
      console.error('Error checking daily submission:', error);
    }
  };

  // Animate stress circle based on stress level
  useEffect(() => {
    if (stressLevel !== null) {
      Animated.timing(stressAnimation, {
        toValue: stressLevel,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [stressLevel]);

  // Toggle factor selection
  const toggleFactor = (factor: string) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter(f => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  // Get stress color based on level
  const getStressColor = () => {
    if (stressLevel === null) return '#64C59A';
    if (stressLevel <= 3) return '#10B981'; // Green for low stress
    if (stressLevel <= 6) return '#FBBF24'; // Yellow for medium stress
    return '#EF4444'; // Red for high stress
  };

  // Get stress emoji based on level
  const getStressEmoji = () => {
    if (stressLevel === null) return '😐';
    return STRESS_EMOJIS[stressLevel - 1] || '😐';
  };

  // Get mood face based on level
  const getMoodFace = () => {
    if (moodLevel === null) return '😐';
    return MOOD_FACES[moodLevel - 1] || '😐';
  };

  // Submit initial wellness data
  const submitWellnessData = async (isEdit = false) => {
    if (!session?.user?.id) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }
    if (stressLevel === null || moodLevel === null || selectedFactors.length === 0 ||
      sleepStart === null || wakeUp === null) {
      Alert.alert('Incomplete Form', 'Please complete all fields before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit && entryId) {
        // Update existing entry
        const { error } = await supabase
          .from('daily_sliders')
          .update({
            stress_level: stressLevel,
            mood: moodLevel, // Changed from mood_level to mood to match schema
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
          })
          .eq('id', entryId);
        if (error) throw error;
        setShowEditAfterExercise(true);
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from('daily_sliders')
          .insert({
            user_id: session.user.id,
            stress_level: stressLevel,
            mood: moodLevel, // Changed from mood_level to mood to match schema
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            created_at: new Date().toISOString(),
          })
          .select();
        if (error) throw error;
        if (data && data.length > 0) {
          setEntryId(data[0].id);
          setShowEditAfterExercise(true);
        }
      }
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start breathing exercise
  const startBreathingExercise = () => {
    setIsBreathing(true);
    setBreathingTime(0);
    setBreathingPhase('inhale');
    // Animate breathing circle
    animateBreathing();
    // Start timer
    timerRef.current = setInterval(() => {
      setBreathingTime(prev => {
        const newTime = prev + 1;
        // Update breathing phase every 8 seconds (4 inhale, 4 hold, 4 exhale)
        const phaseIndex = Math.floor(newTime / 8) % 3;
        const phases: Array<'inhale' | 'hold' | 'exhale'> = ['inhale', 'hold', 'exhale'];
        setBreathingPhase(phases[phaseIndex]);
        // Check if exercise is complete (4 minutes)
        if (newTime >= 240) { // 4 minutes = 240 seconds
          finishBreathingExercise();
          return newTime;
        }
        return newTime;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  // Animate breathing
  const animateBreathing = () => {
    Animated.loop(
      Animated.sequence([
        // Inhale - expand (4 seconds)
        Animated.timing(breathingScale, {
          toValue: 1.6,
          duration: 4000,
          useNativeDriver: true,
        }),
        // Hold (4 seconds)
        Animated.timing(breathingScale, {
          toValue: 1.6,
          duration: 4000,
          useNativeDriver: true,
        }),
        // Exhale - contract (4 seconds)
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop breathing exercise
  const stopBreathingExercise = () => {
    setIsBreathing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    breathingScale.stopAnimation();
  };

  // Submit final wellness data after breathing exercise
  const submitFinalWellnessData = async () => {
    if (!session?.user?.id || !entryId) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update entry with exercise data and mark as complete
      const { error } = await supabase
        .from('daily_sliders')
        .update({
          exercise_duration: 4, // Fixed to 4 minutes
          completed_exercise_time: breathingTime,
        })
        .eq('id', entryId);
        
      if (error) throw error;
      
      // Mark as completed for today
      setAlreadySubmittedToday(true);
      setShowCompletion(true);
      // Removed setShowEditAfterExercise call
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
      stopBreathingExercise();
    }
  };

  // Finish breathing exercise
  const finishBreathingExercise = () => {
    stopBreathingExercise();
    updateEntryWithExerciseData();
    // Set showCompletion to true to show the final submit button
    setShowCompletion(true);
    setShowEditAfterExercise(false);
  };

  // Update entry with exercise data
  const updateEntryWithExerciseData = async () => {
    if (!entryId || !session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('daily_sliders')
        .update({
          exercise_duration: 4, // Fixed to 4 minutes
          completed_exercise_time: breathingTime,
        })
        .eq('id', entryId);
      if (error) throw error;
      // We no longer setAlreadySubmittedToday here since we want the final submit button
    } catch (error) {
      Alert.alert('Update Error', 'Failed to update exercise data. Please try again.');
      console.error(error);
    }
  };

  // Get breathing instruction
  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      default: return 'Breathe';
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stress circle scale interpolation - big at 1 (green), small at 5 (yellow), big at 10 (red)
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 5, 10],
    outputRange: [1.3, 0.7, 1.3],
    extrapolate: 'clamp',
  });

  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 10],
    outputRange: [0.8, 0.8],
  });

  // If already submitted today and not doing breathing
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

  // Breathing exercise screen
  if (isBreathing) {
    return (
      <View style={styles.container}>
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
                styles.breathingCircle,
                {
                  backgroundColor: getStressColor(),
                  transform: [{ scale: breathingScale }],
                }
              ]}
            />
            <View style={styles.instructionContainer}>
              <Text style={[styles.instructionText, { color: getStressColor() }]}>
                {getBreathingInstruction()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: getStressColor() }]}
            onPress={submitFinalWellnessData}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Finish Breathing Exercise & Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main form (or edit form after exercise)
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
          <Text style={styles.sectionTitle}>Stress Level</Text>
          <Text style={styles.sectionSubtitle}>How stressed do you feel today? (1-10)</Text>
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
          <Text style={styles.sectionTitle}>Mood Level</Text>
          <Text style={styles.sectionSubtitle}>How is your mood today? (1 Good - 6 Bad)</Text>
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
                    width: moodLevel ? `${moodLevel * (100 / 6)}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(6)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    { width: width / 7 }, // Adjust for 6 levels
                    moodLevel === i + 1 && styles.thumbActive,
                    moodLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setMoodLevel(i + 1)}
                >
                  <Text style={styles.moodThumbEmoji}>{MOOD_FACES[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Good</Text>
              <Text style={styles.label}>Bad</Text>
            </View>
          </View>
        </View>

        {/* Factors Influencing Stress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factors Influencing Stress</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
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
          <Text style={styles.sectionTitle}>Sleep Schedule</Text>
          <Text style={styles.sectionSubtitle}>When did you sleep and wake up?</Text>
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
            <Text style={styles.completionText}>You're all set. Let's meet again tomorrow!</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
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
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#64C59A',
    opacity: 0.7,
  },
  instructionContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#64C59A',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});