import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import Svg, { Path, Circle, G, Line, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Stress level emojis from low to high (1-5 scale)
const STRESS_EMOJIS = ['😊', '🙂', '😐', '😕', '😟'];
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
// Sleep start times from 18:00 (6:00 PM) to 06:00 (6:00 AM)
const SLEEP_START_OPTIONS: string[] = [];
// Add times from 6:00 PM to 11:30 PM
for (let hour = 18; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    SLEEP_START_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}
// Add times from 12:00 AM to 6:00 AM
for (let hour = 0; hour <= 6; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === 6 && minute > 0) break; // Stop at 6:00 AM
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    SLEEP_START_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Wake up times from 00:00 (12:00 AM) onwards until 12:00 PM
const WAKE_UP_OPTIONS: string[] = [];
// Add times from 12:00 AM to 11:30 PM
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    WAKE_UP_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Accent colors for study groups
const CONTROL_COLOR = '#64C59A';
const EXPERIMENT_COLOR = '#6366F1';

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
  voice: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#64C59A" strokeWidth="2"/>
      <Line x1="12" y1="19" x2="12" y2="23" stroke="#64C59A" strokeWidth="2"/>
      <Line x1="8" y1="23" x2="16" y2="23" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  play: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M5 3L19 12L5 21V3Z" fill="#64C59A" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  stop: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
};

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();

  // State variables
  const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
  const [practiceDuration, setPracticeDuration] = useState<string>('');
  const [practiceLog, setPracticeLog] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [otherFactor, setOtherFactor] = useState<string>(''); // New state for "Other" text input
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEditAfterExercise, setShowEditAfterExercise] = useState(false);

  const stressAnimation = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Check if user has already submitted today
  useEffect(() => {
    checkDailySubmission();

    // Cleanup function
    return () => {
      // Cleanup code if needed
    };
  }, [session]);

  useEffect(() => {
    if (alreadySubmittedToday || showCompletion) {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [alreadySubmittedToday, showCompletion]);

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
    } catch (error) {}
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
    if (factor === 'Other') {
      if (selectedFactors.includes('Other')) {
        setSelectedFactors(prev => prev.filter(f => f !== 'Other'));
        setOtherFactor('');
      } else {
        setSelectedFactors(prev => [...prev, 'Other']);
      }
    } else {
      setSelectedFactors(prev => prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]);
    }
  };

  // Get stress color
  const getStressColor = () => {
    if (stressLevel === null) return '#64C59A';
    if (stressLevel <= 2) return '#10B981';
    if (stressLevel <= 3) return '#FBBF24';
    return '#EF4444';
  };

  // Get stress emoji
  const getStressEmoji = () => STRESS_EMOJIS[stressLevel ? stressLevel - 1 : 2] || '😐';

  // Get mood face - now 1 bad, 5 good
  const getMoodFace = () => MOOD_FACES[moodLevel ? moodLevel - 1 : 2] || '😐';

  // Get sleep quality emoji - 1 poor, 5 excellent
  const getSleepQualityEmoji = () => SLEEP_QUALITY_EMOJIS[sleepQuality ? sleepQuality - 1 : 2] || '😐';

  // Get relaxation emoji - 1 stressed, 5 relaxed
  const getRelaxationEmoji = () => STRESS_EMOJIS[relaxationLevel ? 5 - relaxationLevel : 2] || '😐';

  // Submit wellness data
  const submitWellnessData = async (isEdit = false) => {
    if (!session?.user?.id) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }

    // Prepare factors list including "Other" if selected
    let factorsToSubmit = [...selectedFactors];
    if (selectedFactors.includes('Other') && otherFactor.trim()) {
      factorsToSubmit = factorsToSubmit.filter(f => f !== 'Other');
      factorsToSubmit.push(`Other: ${otherFactor.trim()}`);
    }

    if (mindfulnessPractice === null || stressLevel === null || moodLevel === null || sleepQuality === null || factorsToSubmit.length === 0 ||
      sleepStart === null || wakeUp === null) {
      Alert.alert('Incomplete Form', 'Please complete all fields before submitting.');
      return;
    }

    if (mindfulnessPractice === 'yes' && (!practiceDuration.trim() || !practiceLog.trim())) {
      Alert.alert('Incomplete Form', 'Please fill in the duration and what you practiced.');
      return;
    }

    setIsSubmitting(true);
    try {
      let data;
      if (isEdit && entryId) {
        const { error } = await supabase
          .from('daily_sliders')
          .update({
            mindfulness_practice: mindfulnessPractice,
            practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
            practice_log: mindfulnessPractice === 'yes' ? practiceLog : null,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: factorsToSubmit.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel,
          })
          .eq('id', entryId);
        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from('daily_sliders')
          .insert({
            user_id: session.user.id,
            mindfulness_practice: mindfulnessPractice,
            practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
            practice_log: mindfulnessPractice === 'yes' ? practiceLog : null,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: factorsToSubmit.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel,
            created_at: new Date().toISOString(),
          })
          .select();
        if (error) throw error;
        data = insertData;
      }

      if (!isEdit && data && data.length > 0) {
        setEntryId(data[0].id);
      }

      setShowCompletion(true);
      setAlreadySubmittedToday(true);
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stress circle interpolation
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 3, 5],
    outputRange: [1.3, 0.7, 1.3],
    extrapolate: 'clamp',
  });

  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 5],
    outputRange: [0.8, 0.8],
  });

  const getWeekNumber = () => {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  };

  const progress = useMemo(() => {
    let completed = 0;
    let total = 7;
    if (mindfulnessPractice !== null) {
      if (mindfulnessPractice === 'no') {
        completed++;
      } else if (practiceDuration.trim() && practiceLog.trim()) {
        completed++;
      }
    }
    if (stressLevel !== null) completed++;
    if (moodLevel !== null) completed++;
    let factorsFilled = selectedFactors.length > 0;
    if (selectedFactors.includes('Other') && !otherFactor.trim()) factorsFilled = false;
    if (factorsFilled) completed++;
    if (sleepStart && wakeUp) completed++;
    if (sleepQuality !== null) completed++;
    if (relaxationLevel !== null) completed++;
    return (completed / total) * 100;
  }, [mindfulnessPractice, practiceDuration, practiceLog, stressLevel, moodLevel, selectedFactors, otherFactor, sleepStart, wakeUp, sleepQuality, relaxationLevel]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Use a single accent color for the progress bar (same for all groups)
  const groupAccentColor = CONTROL_COLOR;

  if (alreadySubmittedToday) {
    return (
      <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Daily Sliders </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>100%</Text>
            </View>
          </View>
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Great Job Today!</Text>
          <Text style={styles.completionText}>You've completed your daily mindfulness routine.</Text>
          <Text style={styles.completionText}>You're all set. Let's meet again tomorrow!</Text>
          <Text style={styles.happyEmoji}>😊</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.professionalHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Daily Sliders</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{`${Math.round(progress)}%`}</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.voice />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Mindfulness Practice</Text>
              <Text style={styles.sectionSubtitle}>Have you done mindfulness practice today?</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                mindfulnessPractice === 'yes' && styles.choiceButtonSelected,
                mindfulnessPractice === 'yes' && { backgroundColor: '#64C59A' }
              ]}
              onPress={() => setMindfulnessPractice('yes')}
            >
              <Text style={[
                styles.choiceButtonText,
                mindfulnessPractice === 'yes' && styles.choiceButtonTextSelected
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                mindfulnessPractice === 'no' && styles.choiceButtonSelected,
                mindfulnessPractice === 'no' && { backgroundColor: '#EF4444' }
              ]}
              onPress={() => setMindfulnessPractice('no')}
            >
              <Text style={[
                styles.choiceButtonText,
                mindfulnessPractice === 'no' && styles.choiceButtonTextSelected
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
          {mindfulnessPractice === 'yes' && (
            <View style={styles.practiceDetailsContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.durationInput}
                  placeholder="e.g., 10"
                  value={practiceDuration}
                  onChangeText={setPracticeDuration}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What did you practice? (Bullet points)</Text>
                <TextInput
                  style={styles.logInput}
                  placeholder="• Breathing exercise\n• Body scan\n• Walking meditation"
                  value={practiceLog}
                  onChangeText={setPracticeLog}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.stress />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Stress Level</Text>
              <Text style={styles.sectionSubtitle}>How stressed do you feel today? (1-5)</Text>
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
                    width: stressLevel ? `${stressLevel * 20}%` : '0%',
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
                    stressLevel === i + 1 && styles.thumbActive,
                    stressLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setStressLevel(i + 1)}
                >
                  <Text style={[styles.moodThumbEmoji, { textAlign: 'center' }]}>{STRESS_EMOJIS[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Low</Text>
              <Text style={styles.label}>High</Text>
            </View>
          </View>
        </View>
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
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.factors />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Factors Influencing Mood</Text>
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
            <TouchableOpacity
              style={[
                styles.factorTag,
                selectedFactors.includes('Other') && styles.factorTagSelected,
                selectedFactors.includes('Other') && { backgroundColor: getStressColor() }
              ]}
              onPress={() => toggleFactor('Other')}
            >
              <Text style={[
                styles.factorText,
                selectedFactors.includes('Other') && styles.factorTextSelected
              ]}>
                Other
              </Text>
            </TouchableOpacity>
          </View>
          {selectedFactors.includes('Other') && (
            <View style={styles.otherFactorContainer}>
              <Text style={styles.otherFactorLabel}>Please specify:</Text>
              <TextInput
                style={styles.otherFactorInput}
                placeholder="Enter other factor..."
                value={otherFactor}
                onChangeText={setOtherFactor}
                multiline
              />
            </View>
          )}
        </View>
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
                {SLEEP_START_OPTIONS.map((time) => (
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
                {WAKE_UP_OPTIONS.map((time) => (
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
                    { width: width / 6 - 10, justifyContent: 'center', alignItems: 'center' },
                    sleepQuality === i + 1 && styles.thumbActive,
                    sleepQuality === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setSleepQuality(i + 1)}
                >
                  <Text style={[styles.moodThumbEmoji, { textAlign: 'center' }]}>{SLEEP_QUALITY_EMOJIS[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Poor</Text>
              <Text style={styles.label}>Excellent</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.relaxation />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Relaxation Level</Text>
              <Text style={styles.sectionSubtitle}>How relaxed do you feel right now? (1-5)</Text>
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
                    width: relaxationLevel ? `${relaxationLevel * 20}%` : '0%',
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
                    relaxationLevel === i + 1 && styles.thumbActive,
                    relaxationLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setRelaxationLevel(i + 1)}
                >
                  <Text style={[styles.moodThumbEmoji, { textAlign: 'center' }]}>{STRESS_EMOJIS[4 - i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Stressed</Text>
              <Text style={styles.label}>Relaxed</Text>
            </View>
          </View>
        </View>
        {!showCompletion && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: getStressColor() }]}
            onPress={() => submitWellnessData(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Wellness Data'}
            </Text>
          </TouchableOpacity>
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
  professionalHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    padding: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  headerSpacer: {
    width: 24,
  },
  // progressContainer: {
  //   marginTop: 20,
  // },
  // progressBar: {
  //   height: 6,
  //   backgroundColor: '#E8F5F1',
  //   borderRadius: 3,
  //   overflow: 'hidden',
  // },
  // progressFill: {
  //   height: '100%',
  //   backgroundColor: '#64C59A',
  // },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    padding: 24,
    paddingBottom: 80,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5F1',
    borderWidth: 2,
    borderColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbActive: {
    backgroundColor: '#64C59A',
    transform: [{ scale: 1.1 }],
  },
  moodThumbEmoji: {
    fontSize: 24,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6F6EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSmallLabel: {
    fontSize: 12,
    color: '#8CAFA0',
    fontWeight: '600',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  factorTag: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
  otherFactorContainer: {
    marginTop: 20,
    width: '100%',
  },
  otherFactorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  otherFactorInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
    minHeight: 60,
    textAlignVertical: 'top',
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
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  voicePlayerCard: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  voicePlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  voicePlayerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  voicePlayerWeek: {
    fontSize: 14,
    color: '#64C59A',
    fontWeight: '600',
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voicePlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceProgressInfo: {
    flex: 1,
  },
  voiceStatus: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDuration: {
    fontSize: 14,
    color: '#666',
  },
  voiceProgressBar: {
    height: 6,
    backgroundColor: '#E8F5F1',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 3,
  },
  voicePlayerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E8F5F1',
    paddingTop: 15,
  },
  voicePlayerTip: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  voicePlaceholder: {
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  voicePlaceholderText: {
    fontSize: 16,
    color: '#64C59A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  choiceButton: {
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#E8F5F1',
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  choiceButtonSelected: {
    borderColor: '#fff',
  },
  choiceButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  choiceButtonTextSelected: {
    color: '#fff',
  },
  practiceDetailsContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
  },
  logInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  promptContainer: {
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFEAAA',
  },
  promptText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});