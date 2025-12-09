import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

// Custom SVG Icons for Weekly Questions
const WeeklyIcons = {
  gratitude: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  presence: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="12" cy="12" r="4" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  challenge: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  values: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M9 12L11 14L15 10" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  ),
  joy: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 14C8.65661 13.3722 9.50909 13 10.4142 13C12.2142 13 13.4142 14.3431 13.4142 16C13.4142 17.6569 12.2142 19 10.4142 19C9.50909 19 8.65661 18.6278 8 18" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="8" cy="10" r="1" fill="#64C59A"/>
      <Circle cx="16" cy="10" r="1" fill="#64C59A"/>
    </Svg>
  ),
  relationships: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M17 3.13C17.8604 3.35031 18.623 3.85071 19.1676 4.55232C19.7122 5.25392 20.0078 6.11683 20.0078 7.005C20.0078 7.89318 19.7122 8.75608 19.1676 9.45769C18.623 10.1593 17.8604 10.6597 17 10.88" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  ),
  habits: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 8V12L15 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="12" r="9" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  kindness: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.90836 3.57831 8.50903 2.99884 7.05 2.99884C5.59096 2.99884 4.19164 3.57831 3.16 4.61C2.12831 5.64169 1.54884 7.04102 1.54884 8.5C1.54884 9.95898 2.12831 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  learning: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20V5H6.5C5.83696 5 5.20107 5.26339 4.73223 5.73223C4.26339 6.20107 4 6.83696 4 7.5V19.5Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M20 17H6.5C5.83696 17 5.20107 17.2634 4.73223 17.7322C4.26339 18.2011 4 18.837 4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M10 10H14" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M10 14H14" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  ),
  mentalHealth: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V12" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18 3V9" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15 6H21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
};

interface WeeklyQuestionSet {
  id: number;
  week_id: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  created_at: string;
}

// Map questions to icons
const questionIcons = [
  WeeklyIcons.gratitude,
  WeeklyIcons.presence,
  WeeklyIcons.challenge,
  WeeklyIcons.values,
  WeeklyIcons.joy,
  WeeklyIcons.relationships,
  WeeklyIcons.habits,
  WeeklyIcons.kindness,
  WeeklyIcons.learning,
  WeeklyIcons.mentalHealth,
];

// ISO Week Number (Monday as first day of week)
function getWeekNumber(d: Date): [number, number] {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return [date.getUTCFullYear(), weekNo];
}

export default function WeeklyQuestions() {
  const router = useRouter();
  const { session } = useSession();

  const [questions, setQuestions] = useState<WeeklyQuestionSet | null>(null);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [noQuestionsAvailable, setNoQuestionsAvailable] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchWeeklyQuestions();
    }
  }, [session]);

  const fetchWeeklyQuestions = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const [year, week] = getWeekNumber(new Date());
      const currentWeekId = `${year}-W${week.toString().padStart(2, '0')}`;

      // Step 1: Try to get current week's questions
      let { data: questionSet, error } = await supabase
        .from('weekly_questions')
        .select('*')
        .eq('week_id', currentWeekId)
        .single();

      // Step 2: If not found, get the latest available set
      if (!questionSet || error?.code === 'PGRST116') {
        const { data, error: fallbackError } = await supabase
          .from('weekly_questions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        questionSet = data;
        error = fallbackError;
      }

      if (error && error.code !== 'PGRST116') throw error;
      if (!questionSet) {
        setNoQuestionsAvailable(true);
        return;
      }

      setQuestions(questionSet);
      setNoQuestionsAvailable(false);

      // Check if user already answered this exact question set
      const { data: existing } = await supabase
        .from('weekly_answers')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('question_set_id', questionSet.id)
        .maybeSingle();

      setAlreadySubmitted(!!existing);

    } catch (err: any) {
      console.error('Error loading weekly questions:', err);
      Alert.alert('Error', err.message || 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = text;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!questions || !session?.user?.id) return;

    const emptyAnswer = answers.findIndex(a => a.trim() === '');
    if (emptyAnswer !== -1) {
      Alert.alert('Incomplete', `Please answer Question ${emptyAnswer + 1} before submitting.`);
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('weekly_answers').insert({
        user_id: session.user.id,
        question_set_id: questions.id,
        a1: answers[0],
        a2: answers[1],
        a3: answers[2],
        a4: answers[3],
        a5: answers[4],
        a6: answers[5],
        a7: answers[6],
        a8: answers[7],
        a9: answers[8],
        a10: answers[9],
      });

      if (error) {
        if (error.code === '23505') {
          // User already submitted, show celebration directly
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setAlreadySubmitted(true);
          }, 5000);
        } else {
          throw error;
        }
      } else {
        // Show celebration animation and then mark as submitted
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setAlreadySubmitted(true);
        }, 5000);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Submission Failed', err.message || 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Reflection</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8A66" />
          <Text style={styles.loadingText}>Loading your questions...</Text>
        </View>
      </View>
    );
  }

  // No Questions Available
  if (noQuestionsAvailable || !questions) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Reflection</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>No Questions Yet</Text>
          <Text style={styles.completionText}>Weekly reflection questions will appear here when available.</Text>
          <Text style={styles.completionText}>Check back soon!</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchWeeklyQuestions}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Celebration Screen (similar to AboutMe)
  if (showCelebration) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(800)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionText}>You've completed your weekly reflection.</Text>
            <Text style={styles.completionText}>Thank you for taking this mindful moment.</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </Animated.View>
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
        <Text style={styles.headerTitle}>Weekly Reflection</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {alreadySubmitted ? (
          <View style={styles.completionContainer}>
            <Animated.View entering={ZoomIn.duration(800)} style={{ alignItems: 'center' }}>
              <Text style={styles.celebrationEmoji}>Well done</Text>
              <Text style={styles.completionTitle}>You've Completed This Week!</Text>
              <Text style={styles.completionText}>Your answers have been saved.</Text>
              <Text style={styles.completionText}>See you next week with new questions.</Text>
              <Text style={styles.happyEmoji}>Take care</Text>
            </Animated.View>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.weekInfoContainer}>
              <Text style={styles.weekInfo}>Week {questions.week_id}</Text>
            </Animated.View>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const qKey = `q${num}` as keyof WeeklyQuestionSet;
              const index = num - 1;
              const IconComponent = questionIcons[index];
              
              return (
                <Animated.View 
                  key={num} 
                  entering={FadeInDown.delay(150 + index * 60)} 
                  style={styles.questionContainer}
                >
                  <View style={styles.questionHeader}>
                    <View style={styles.iconCircle}>
                      <IconComponent />
                    </View>
                    <View style={styles.questionTextContainer}>
                      <Text style={styles.questionNumber}>Question {num}</Text>
                      <Text style={styles.questionText}>{questions[qKey] as string}</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.answerInput}
                    multiline
                    placeholder="Your thoughtful answer..."
                    value={answers[index]}
                    onChangeText={(text) => handleAnswerChange(index, text)}
                    editable={!submitting}
                    textAlignVertical="top"
                  />
                </Animated.View>
              );
            })}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Reflection</Text>
              )}
            </TouchableOpacity>
          </>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
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
    fontSize: 26,
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
  },
  weekInfoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  weekInfo: {
    fontSize: 16,
    color: '#2E8A66',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E8F5F1',
    borderRadius: 30,
  },
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  questionTextContainer: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8A66',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    lineHeight: 26,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
    minHeight: 110,
  },
  submitButton: {
    backgroundColor: '#2E8A66',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    marginTop: 30,
    backgroundColor: '#2E8A66',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});