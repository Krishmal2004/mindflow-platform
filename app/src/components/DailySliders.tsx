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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Mood options with custom emojis
const MOOD_OPTIONS = [
  { label: 'Awesome', value: 5, emoji: '🤩' },
  { label: 'Good', value: 4, emoji: '😊' },
  { label: 'Fine', value: 3, emoji: '😐' },
  { label: 'Bad', value: 2, emoji: '😞' },
  { label: 'Terrible', value: 1, emoji: '😫' },
];

// Feelings options
const FEELINGS_OPTIONS = [
  'Health', 'Sleep', 'Exercise', 'Food', 'Hobby', 'Money', 'Identity', 
  'Friends', 'Pet', 'Family', 'Dating', 'Work', 'Home', 'School', 
  'Outdoors', 'Travel', 'Weather'
];

// Sleep time options (hours)
const SLEEP_HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const period = i >= 12 ? 'PM' : 'AM';
  return `${hour}:00 ${period}`;
});

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();
  
  // State variables for all questions
  const [stressValue, setStressValue] = useState(5);
  const [mood, setMood] = useState<number | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [sleepQualityValue, setSleepQualityValue] = useState(5);
  const [sleepStartTime, setSleepStartTime] = useState<string | null>(null);
  const [wakeUpTime, setWakeUpTime] = useState<string | null>(null);
  const [relaxationLevel, setRelaxationLevel] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timer, setTimer] = useState(0);
  const [showRelaxationSlider, setShowRelaxationSlider] = useState(false);
  const [completedExerciseTime, setCompletedExerciseTime] = useState<number | null>(null);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null); // To store the database entry ID
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressBar = useRef(new Animated.Value(0)).current;
  const stressAnimation = useRef(new Animated.Value(0)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;

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
      }
    } catch (error) {
      console.error('Error checking daily submission:', error);
    }
  };

  // Animate stress circle based on stress level
  useEffect(() => {
    Animated.timing(stressAnimation, {
      toValue: stressValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [stressValue]);

  // Initial submission of the entry before breathing exercise
  const submitInitialEntry = async () => {
    if (!session?.user?.id) return;
    
    if (stressValue === 0 || mood === null || sleepQualityValue === 0 || 
        sleepStartTime === null || wakeUpTime === null) {
      Alert.alert('Please complete all fields before submitting');
      return;
    }
    
    try {
      const { data, error } = await supabase.from('daily_sliders').insert({
        user_id: session.user.id,
        stress_level: stressValue,
        mood: mood,
        feelings: feelings.join(','),
        sleep_quality: sleepQualityValue,
        sleep_start_time: sleepStartTime,
        wake_up_time: wakeUpTime,
        created_at: new Date().toISOString(),
      }).select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setEntryId(data[0].id);
        setSubmissionMessage(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save initial data. Please try again.');
      console.error(error);
    }
  };

  const startBreathingExercise = () => {
    if (!submissionMessage) {
      Alert.alert('Please submit your initial data first');
      return;
    }
    
    setIsPlaying(true);
    setShowRelaxationSlider(false);
    setTimer(0);
    setBreathingPhase('inhale');
    setCompletedExerciseTime(null);
    
    // Reset progress bar
    progressBar.setValue(0);
    
    // Animate breathing circle
    animateBreathing();
    
    // Animate progress bar
    Animated.timing(progressBar, {
      toValue: 1,
      duration: 240000, // 4 minutes
      useNativeDriver: false,
    }).start();
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTime = prev + 1;
        
        // Update breathing phase every 8 seconds (4 inhale, 4 hold, 4 exhale)
        const phaseIndex = Math.floor(newTime / 8) % 3;
        const phases: Array<'inhale' | 'hold' | 'exhale'> = ['inhale', 'hold', 'exhale'];
        setBreathingPhase(phases[phaseIndex]);
        
        // Check if exercise is complete (4 minutes)
        if (newTime >= 240) { // 4 minutes = 240 seconds
          finishExercise();
          return newTime;
        }
        
        return newTime;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  const animateBreathing = () => {
    Animated.loop(
      Animated.sequence([
        // Inhale - expand (4 seconds)
        Animated.timing(breathingScale, {
          toValue: 1.6, // Scale from 1 to 1.6
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
          toValue: 1, // Scale back to 1
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopExercise = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    breathingScale.stopAnimation();
    progressBar.stopAnimation();
  };

  const finishExercise = () => {
    stopExercise();
    setCompletedExerciseTime(timer);
    setShowRelaxationSlider(true);
  };

  // Update the entry with breathing exercise details
  const updateEntryWithExerciseData = async () => {
    if (!entryId || !session?.user?.id) return;
    
    try {
      const { error } = await supabase.from('daily_sliders').update({
        relaxation_level: relaxationLevel,
        exercise_duration: 4, // Fixed to 4 minutes
        completed_exercise_time: completedExerciseTime,
      }).eq('id', entryId);
      
      if (error) throw error;
      
      setAlreadySubmittedToday(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to update data. Please try again.');
      console.error(error);
    }
  };

  const toggleFeeling = (feeling: string) => {
    if (feelings.includes(feeling)) {
      setFeelings(feelings.filter(f => f !== feeling));
    } else {
      setFeelings([...feelings, feeling]);
    }
  };

  // Progress bar interpolation
  const progressWidth = progressBar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Custom stress animation based on stress level
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 10],
    outputRange: [0.7, 1.3],
  });

  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 10],
    outputRange: [0.3, 0.8],
  });

  // Color changes based on stress level
  const getStressColor = () => {
    if (stressValue <= 3) return '#10B981'; // Green for low stress
    if (stressValue <= 6) return '#FBBF24'; // Yellow for medium stress
    return '#EF4444'; // Red for high stress
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      default: return 'Breathe';
    }
  };

  if (alreadySubmittedToday && !showRelaxationSlider) {
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
        
        <View style={styles.submittedContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.submittedTitle}>Great Job Today!</Text>
          <Text style={styles.submittedText}>You've completed your daily mindfulness routine.</Text>
          <Text style={styles.submittedText}>See you tomorrow!</Text>
          <Text style={styles.happyEmoji}>😊</Text>
        </View>
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
        {!isPlaying ? (
          <>
            {/* Stress Level Slider with Custom Animation */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderTitle}>Stress Level</Text>
              <Text style={styles.sliderSubtitle}>How stressed do you feel today? (1-10)</Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{stressValue}</Text>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${stressValue * 10}%`, backgroundColor: getStressColor() }]} />
                </View>
                
                <View style={styles.thumbContainer}>
                  {[...Array(10)].map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.thumb, stressValue === i + 1 && styles.thumbActive, stressValue === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }]}
                      onPress={() => setStressValue(i + 1)}
                    />
                  ))}
                </View>
                
                <View style={styles.labels}>
                  <Text style={styles.label}>Low</Text>
                  <Text style={styles.label}>High</Text>
                </View>
              </View>
              
              {/* Custom Stress Animation */}
              <View style={styles.stressAnimationContainer}>
                <Animated.View 
                  style={[
                    styles.stressCircle, 
                    { 
                      backgroundColor: getStressColor(),
                      transform: [{ scale: stressCircleScale }],
                      opacity: stressCircleOpacity
                    }
                  ]}
                />
                <Text style={[styles.stressText, { color: getStressColor() }]}>Stress Level: {stressValue}</Text>
              </View>
            </View>

            {/* Mood Selection */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderTitle}>What is your Mood?</Text>
              <Text style={styles.sliderSubtitle}>Select how you're feeling right now</Text>
              
              <View style={styles.moodContainer}>
                {MOOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.moodOption, mood === option.value && styles.moodOptionSelected, mood === option.value && { backgroundColor: getStressColor() }]}
                    onPress={() => setMood(option.value)}
                  >
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                    <Text style={styles.moodLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feelings Selection */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderTitle}>What makes you feel this way?</Text>
              <Text style={styles.sliderSubtitle}>Select all that apply</Text>
              
              <View style={styles.feelingsContainer}>
                {FEELINGS_OPTIONS.map((feeling) => (
                  <TouchableOpacity
                    key={feeling}
                    style={[styles.feelingTag, feelings.includes(feeling) && styles.feelingTagSelected, feelings.includes(feeling) && { backgroundColor: getStressColor() }]}
                    onPress={() => toggleFeeling(feeling)}
                  >
                    <Text style={[styles.feelingText, feelings.includes(feeling) && styles.feelingTextSelected]}>
                      {feeling}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sleep Quality Slider */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderTitle}>Sleep Quality</Text>
              <Text style={styles.sliderSubtitle}>How was your sleep last night? (1-10)</Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{sleepQualityValue}</Text>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${sleepQualityValue * 10}%`, backgroundColor: '#64C59A' }]} />
                </View>
                
                <View style={styles.thumbContainer}>
                  {[...Array(10)].map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.thumb, sleepQualityValue === i + 1 && styles.thumbActive]}
                      onPress={() => setSleepQualityValue(i + 1)}
                    />
                  ))}
                </View>
                
                <View style={styles.labels}>
                  <Text style={styles.label}>Poor</Text>
                  <Text style={styles.label}>Great</Text>
                </View>
              </View>
            </View>

            {/* Sleep Time Selection */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderTitle}>Sleep Schedule</Text>
              <Text style={styles.sliderSubtitle}>When did you sleep and wake up?</Text>
              
              <View style={styles.timeSelectionContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Sleep Start</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {SLEEP_HOURS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeOption, sleepStartTime === time && styles.timeOptionSelected]}
                        onPress={() => setSleepStartTime(time)}
                      >
                        <Text style={[styles.timeText, sleepStartTime === time && styles.timeTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Wake Up</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {SLEEP_HOURS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeOption, wakeUpTime === time && styles.timeOptionSelected]}
                        onPress={() => setWakeUpTime(time)}
                      >
                        <Text style={[styles.timeText, wakeUpTime === time && styles.timeTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Submit Button (before breathing exercise) */}
            {!submissionMessage && (
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: getStressColor() }]}
                onPress={submitInitialEntry}
              >
                <Text style={styles.startButtonText}>Submit Initial Data</Text>
              </TouchableOpacity>
            )}

            {/* Start Breathing Exercise Button (after initial submission) */}
            {submissionMessage && !showRelaxationSlider && (
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: getStressColor() }]}
                onPress={startBreathingExercise}
              >
                <Text style={styles.startButtonText}>Start 4-Minute Breathing Exercise</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* Breathing Exercise Screen */
          <View style={styles.breathingContainer}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>4-Minute Breathing Exercise</Text>
            
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
                <Text style={[styles.instructionText, { color: getStressColor() }]}>{getBreathingInstruction()}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopExercise}
            >
              <Text style={styles.stopButtonText}>Stop Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Relaxation Level Slider (shown after exercise) */}
        {showRelaxationSlider && (
          <View style={styles.relaxationSection}>
            <Text style={styles.sliderTitle}>Relaxation Level</Text>
            <Text style={styles.sliderSubtitle}>How relaxed do you feel now? (1-10)</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{relaxationLevel}</Text>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${relaxationLevel * 10}%`, backgroundColor: '#64C59A' }]} />
              </View>
              
              <View style={styles.thumbContainer}>
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.thumb, relaxationLevel === i + 1 && styles.thumbActive]}
                    onPress={() => setRelaxationLevel(i + 1)}
                  />
                ))}
              </View>
              
              <View style={styles.labels}>
                <Text style={styles.label}>Not Relaxed</Text>
                <Text style={styles.label}>Very Relaxed</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: getStressColor() }]}
              onPress={updateEntryWithExerciseData}
            >
              <Text style={styles.saveButtonText}>Complete Exercise</Text>
            </TouchableOpacity>
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
  submittedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  submittedText: {
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
  sliderSection: {
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
  sliderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sliderSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#64C59A',
    marginBottom: 20,
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
  },
  thumbActive: {
    backgroundColor: '#64C59A',
    transform: [{ scale: 1.2 }],
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
  stressAnimationContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  stressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    marginBottom: 16,
  },
  stressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  moodOptionSelected: {
    backgroundColor: '#64C59A',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feelingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feelingTag: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
  },
  feelingTagSelected: {
    backgroundColor: '#64C59A',
  },
  feelingText: {
    fontSize: 14,
    color: '#333',
  },
  feelingTextSelected: {
    color: '#fff',
  },
  timeSelectionContainer: {
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
  startButton: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
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
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5F1',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#64C59A',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
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
  relaxationSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});