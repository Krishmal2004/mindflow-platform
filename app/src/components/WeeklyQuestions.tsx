import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

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

function getWeekNumber(d: Date): [number, number] {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

export default function WeeklyQuestions() {
  const router = useRouter();
  const { session } = useSession();
  const [questions, setQuestions] = useState<WeeklyQuestionSet | null>(null);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [noQuestions, setNoQuestions] = useState(false);

  useEffect(() => {
    fetchLatestQuestionSet();
  }, [session]);

  const fetchLatestQuestionSet = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const [year, week] = getWeekNumber(new Date());
      const currentWeekId = `${year}-W${week.toString().padStart(2, '0')}`;
      // Fetch the question set for the current week
      const { data: questionData, error: questionError } = await supabase
        .from('weekly_questions')
        .select('*')
        .eq('week_id', currentWeekId)
        .maybeSingle();

      if (questionError) {
        throw questionError;
      }

      if (!questionData) {
        setNoQuestions(true);
      } else {
        setQuestions(questionData);
        // Check if user has already submitted answers for this set
        const { data: answerData, error: answerError } = await supabase
          .from('weekly_answers')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('question_set_id', questionData.id)
          .limit(1);
        if (answerError) throw answerError;
        if (answerData && answerData.length > 0) {
          setAlreadySubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error fetching question set:', error);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
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
    if (!session?.user?.id || !questions) return;
    // Validate that all answers are filled
    if (answers.some(answer => answer.trim() === '')) {
      Alert.alert('Incomplete Form', 'Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('weekly_answers')
        .insert({
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
          submitted_at: new Date().toISOString(),
        });
      if (error) throw error;
      setAlreadySubmitted(true);
      Alert.alert('Success', 'Your answers have been submitted successfully!');
    } catch (error) {
      console.error('Error submitting answers:', error);
      Alert.alert('Submission Error', 'Failed to submit your answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Questions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  // If there are no questions in the database, show completion message
  if (noQuestions) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Questions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Great Job This Week!</Text>
          <Text style={styles.completionText}>You're all set. See you next week!</Text>
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
        <Text style={styles.headerTitle}>Weekly Questions</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {alreadySubmitted ? (
          <View style={styles.completionContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job This Week!</Text>
            <Text style={styles.completionText}>You're all set. See you next week!</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </View>
        ) : questions ? (
          <>
            <Text style={styles.weekInfo}>Week: {questions.week_id}</Text>
            {[...Array(10)].map((_, index) => {
              const questionKey = `q${index + 1}` as keyof WeeklyQuestionSet;
              return (
                <View key={index} style={styles.questionContainer}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                  <Text style={styles.questionText}>{questions[questionKey]}</Text>
                  <TextInput
                    style={styles.answerInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Type your answer here..."
                    value={answers[index]}
                    onChangeText={(text) => handleAnswerChange(index, text)}
                    editable={!submitting}
                  />
                </View>
              );
            })}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#2E8A66' }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
  weekInfo: {
    fontSize: 16,
    color: '#2E8A66',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#E8F5F1',
    borderRadius: 16,
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
    elevation: 5,
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
    marginBottom: 20,
    lineHeight: 26,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#FAFEFD',
  },
  submitButton: {
    backgroundColor: '#2E8A66',
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
});