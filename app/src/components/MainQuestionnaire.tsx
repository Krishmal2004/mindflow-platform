import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Custom SVG Icons for different question types
const QuestionIcons = {
  stress: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 14C8.65661 13.3722 9.50909 13 10.4142 13C12.2142 13 13.4142 14.3431 13.4142 16C13.4142 17.6569 12.2142 19 10.4142 19C9.50909 19 8.65661 18.6278 8 18" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="8" cy="10" r="1" fill="#64C59A"/>
      <Circle cx="16" cy="10" r="1" fill="#64C59A"/>
    </Svg>
  ),
  mindfulness: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 8V12L15 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="12" cy="12" r="3" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
};

interface QuestionSet {
  id: number;
  title: string;
  description: string;
  version: string;
  section_a_title: string;
  section_a_instructions: string;
  section_a_scale_min: number;
  section_a_scale_max: number;
  section_a_scale_labels: string[];
  section_b_title: string;
  section_b_instructions: string;
  section_b_scale_min: number;
  section_b_scale_max: number;
  section_b_scale_labels: string[];
  created_at: string;
}

interface Question {
  id: number;
  question_set_id: number;
  section_type: string;
  question_id: string;
  question_text: string;
  facet?: string;
  reverse_score: boolean;
  sort_order: number;
}

interface Answer {
  questionId: string;
  value: number | null;
}

export default function MainQuestionnaire() {
  const router = useRouter();
  const { session } = useSession();

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [currentSection, setCurrentSection] = useState<'A' | 'B' | null>(null);

  // Timer effect to track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchQuestionSet();
    }
  }, [session]);

  const fetchQuestionSet = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      // Get the latest question set
      const { data: questionSetData, error: questionSetError } = await supabase
        .from('main_question_sets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionSetError) throw questionSetError;
      if (!questionSetData) {
        Alert.alert('No Questionnaire', 'No main questionnaire is currently available.');
        return;
      }

      setQuestionSet(questionSetData);

      // Get all questions for this set
      const { data: questionsData, error: questionsError } = await supabase
        .from('main_questions')
        .select('*')
        .eq('question_set_id', questionSetData.id)
        .order('section_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (questionsError) throw questionsError;
      
      setQuestions(questionsData || []);
      
      // Initialize answers array
      const initialAnswers = questionsData?.map(q => ({
        questionId: q.question_id,
        value: null
      })) || [];
      
      setAnswers(initialAnswers);

      // Check if user already submitted this version
      const { data: existing } = await supabase
        .from('main_questionnaire_responses')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('question_set_id', questionSetData.id)
        .maybeSingle();

      setAlreadySubmitted(!!existing);

    } catch (err: any) {
      console.error('Error loading questionnaire:', err);
      Alert.alert('Error', err.message || 'Failed to load questionnaire. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId ? { ...answer, value } : answer
      )
    );
  };

  const getTimeSpent = () => {
    if (!startTime) return 0;
    return Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
  };

  const handleSubmit = async () => {
    if (!questionSet || !session?.user?.id) return;

    // Check if all questions are answered
    const unanswered = answers.find(a => a.value === null);
    if (unanswered) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const timeSpent = getTimeSpent();
      
      // Organize answers by section
      const sectionAAnswers = answers
        .filter(a => a.questionId.startsWith('PSS'))
        .sort((a, b) => {
          const numA = parseInt(a.questionId.split('_')[1]);
          const numB = parseInt(b.questionId.split('_')[1]);
          return numA - numB;
        });
      
      const sectionBAnswers = answers
        .filter(a => a.questionId.startsWith('FFMQ'))
        .sort((a, b) => {
          const numA = parseInt(a.questionId.split('_')[1]);
          const numB = parseInt(b.questionId.split('_')[1]);
          return numA - numB;
        });

      const { error } = await supabase.from('main_questionnaire_responses').insert({
        user_id: session.user.id,
        question_set_id: questionSet.id,
        // Section A answers (1-10)
        a1: sectionAAnswers[0]?.value ?? null,
        a2: sectionAAnswers[1]?.value ?? null,
        a3: sectionAAnswers[2]?.value ?? null,
        a4: sectionAAnswers[3]?.value ?? null,
        a5: sectionAAnswers[4]?.value ?? null,
        a6: sectionAAnswers[5]?.value ?? null,
        a7: sectionAAnswers[6]?.value ?? null,
        a8: sectionAAnswers[7]?.value ?? null,
        a9: sectionAAnswers[8]?.value ?? null,
        a10: sectionAAnswers[9]?.value ?? null,
        // Section B answers (1-15)
        b1: sectionBAnswers[0]?.value ?? null,
        b2: sectionBAnswers[1]?.value ?? null,
        b3: sectionBAnswers[2]?.value ?? null,
        b4: sectionBAnswers[3]?.value ?? null,
        b5: sectionBAnswers[4]?.value ?? null,
        b6: sectionBAnswers[5]?.value ?? null,
        b7: sectionBAnswers[6]?.value ?? null,
        b8: sectionBAnswers[7]?.value ?? null,
        b9: sectionBAnswers[8]?.value ?? null,
        b10: sectionBAnswers[9]?.value ?? null,
        b11: sectionBAnswers[10]?.value ?? null,
        b12: sectionBAnswers[11]?.value ?? null,
        b13: sectionBAnswers[12]?.value ?? null,
        b14: sectionBAnswers[13]?.value ?? null,
        b15: sectionBAnswers[14]?.value ?? null,
        // Metadata
        time_to_complete: timeSpent,
        started_at: startTime?.toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          // User already submitted
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setAlreadySubmitted(true);
          }, 5000);
        } else {
          throw error;
        }
      } else {
        // Show celebration
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

  const startQuestionnaire = () => {
    setShowStartScreen(false);
    setStartTime(new Date());
  };

  const goToSection = (section: 'A' | 'B') => {
    setCurrentSection(section);
  };

  const goBackToSections = () => {
    setCurrentSection(null);
  };

  const submitSection = () => {
    // For now, just go back to section selection
    // In a real implementation, you might want to validate this section
    goBackToSections();
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8A66" />
          <Text style={styles.loadingText}>Loading your questionnaire...</Text>
        </View>
      </View>
    );
  }

  // No Questionnaire Available
  if (!questionSet) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>No Questionnaire Available</Text>
          <Text style={styles.completionText}>Main questionnaire is not available at this time.</Text>
          <Text style={styles.completionText}>Please check back later.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchQuestionSet}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Celebration Screen (similar to AboutMe.tsx)
  if (showCelebration) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(800)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionText}>You've completed the main questionnaire.</Text>
            <Text style={styles.completionText}>Thank you for your participation.</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Already Submitted Screen
  if (alreadySubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(800)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionText}>You've completed the main questionnaire.</Text>
            <Text style={styles.completionText}>Thank you for your participation.</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Start Screen
  if (showStartScreen) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.startCard}>
            <Text style={styles.startTitle}>Main Questionnaire</Text>
            <Text style={styles.startSubtitle}>{questionSet.title}</Text>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                You're about to begin the main questionnaire which consists of two parts:
              </Text>
              <View style={styles.bulletPoints}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.bulletText}>Part A: Perceived Stress Scale (10 questions)</Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.bulletText}>Part B: Five Facet Mindfulness Questionnaire (15 questions)</Text>
                </View>
              </View>
              <Text style={styles.infoText}>
                Your time to complete the questionnaire will be recorded. Please answer honestly and take your time.
              </Text>
            </View>
            
            <View style={styles.timerPreview}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
                <Path d="M12 6V12L16 14" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.timerText}>Time will be tracked</Text>
            </View>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={startQuestionnaire}
            >
              <Text style={styles.startButtonText}>Begin Questionnaire</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Section Selection Screen
  if (!currentSection) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose a Section</Text>
            <Text style={styles.sectionSubtitle}>Complete both sections to finish the questionnaire</Text>
          </Animated.View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time: {getTimeSpent()}s</Text>
          </View>
          
          <Animated.View entering={FadeInDown.delay(200)} style={styles.sectionCard}>
            <View style={styles.sectionIconContainer}>
              <QuestionIcons.stress />
            </View>
            <View style={styles.sectionTextContainer}>
              <Text style={styles.sectionCardTitle}>{questionSet.section_a_title}</Text>
              <Text style={styles.sectionCardSubtitle}>10 questions</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => goToSection('A')}
            >
              <Text style={styles.sectionButtonText}>Start Part A</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(300)} style={styles.sectionCard}>
            <View style={styles.sectionIconContainer}>
              <QuestionIcons.mindfulness />
            </View>
            <View style={styles.sectionTextContainer}>
              <Text style={styles.sectionCardTitle}>{questionSet.section_b_title}</Text>
              <Text style={styles.sectionCardSubtitle}>15 questions</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => goToSection('B')}
            >
              <Text style={styles.sectionButtonText}>Start Part B</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Section A Questions
  if (currentSection === 'A') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time: {getTimeSpent()}s</Text>
          </View>
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{questionSet.section_a_title}</Text>
            <Text style={styles.sectionInstructions}>{questionSet.section_a_instructions}</Text>
            
            {/* Scale Labels with Min/Max indicators */}
            <View style={styles.scaleLabelsContainer}>
              <Text style={styles.scaleMinLabel}>{questionSet.section_a_scale_labels[0]}</Text>
              <Text style={styles.scaleMaxLabel}>{questionSet.section_a_scale_labels[questionSet.section_a_scale_labels.length - 1]}</Text>
            </View>
            
            {/* Scale Numbers */}
            <View style={styles.scaleNumbersContainer}>
              {Array.from({ length: questionSet.section_a_scale_max - questionSet.section_a_scale_min + 1 }, (_, i) => {
                const value = i + questionSet.section_a_scale_min;
                return (
                  <View key={value} style={styles.scaleNumberItem}>
                    <Text style={styles.scaleNumberText}>{value}</Text>
                  </View>
                );
              })}
            </View>
            
            {/* Questions */}
            {questions
              .filter(q => q.section_type === 'A')
              .map((question, index) => {
                const answer = answers.find(a => a.questionId === question.question_id);
                return (
                  <Animated.View 
                    key={question.id} 
                    entering={FadeInDown.delay(150 + index * 60)} 
                    style={styles.questionContainer}
                  >
                    <View style={styles.questionHeader}>
                      <View style={styles.iconCircle}>
                        <QuestionIcons.stress />
                      </View>
                      <View style={styles.questionTextContainer}>
                        <Text style={styles.questionNumber}>Question {question.sort_order}</Text>
                        <Text style={styles.questionText}>{question.question_text}</Text>
                      </View>
                    </View>
                    
                    {/* Rating Scale */}
                    <View style={styles.ratingScaleContainer}>
                      {Array.from({ length: questionSet.section_a_scale_max - questionSet.section_a_scale_min + 1 }, (_, i) => {
                        const value = i + questionSet.section_a_scale_min;
                        return (
                          <TouchableOpacity
                            key={value}
                            style={[
                              styles.ratingButton,
                              answer?.value === value && styles.ratingButtonSelected
                            ]}
                            onPress={() => handleAnswerChange(question.question_id, value)}
                          >
                            <Text style={[
                              styles.ratingButtonText,
                              answer?.value === value && styles.ratingButtonTextSelected
                            ]}>
                              {value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>
                );
              })}
          </Animated.View>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={goBackToSections}
          >
            <Text style={styles.submitButtonText}>Save & Continue to Part B</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Section B Questions
  if (currentSection === 'B') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time: {getTimeSpent()}s</Text>
          </View>
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{questionSet.section_b_title}</Text>
            <Text style={styles.sectionInstructions}>{questionSet.section_b_instructions}</Text>
            
            {/* Scale Labels with Min/Max indicators */}
            <View style={styles.scaleLabelsContainer}>
              <Text style={styles.scaleMinLabel}>{questionSet.section_b_scale_labels[0]}</Text>
              <Text style={styles.scaleMaxLabel}>{questionSet.section_b_scale_labels[questionSet.section_b_scale_labels.length - 1]}</Text>
            </View>
            
            {/* Scale Numbers */}
            <View style={styles.scaleNumbersContainer}>
              {Array.from({ length: questionSet.section_b_scale_max - questionSet.section_b_scale_min + 1 }, (_, i) => {
                const value = i + questionSet.section_b_scale_min;
                return (
                  <View key={value} style={styles.scaleNumberItem}>
                    <Text style={styles.scaleNumberText}>{value}</Text>
                  </View>
                );
              })}
            </View>
            
            {/* Questions */}
            {questions
              .filter(q => q.section_type === 'B')
              .map((question, index) => {
                const answer = answers.find(a => a.questionId === question.question_id);
                return (
                  <Animated.View 
                    key={question.id} 
                    entering={FadeInDown.delay(150 + index * 60)} 
                    style={styles.questionContainer}
                  >
                    <View style={styles.questionHeader}>
                      <View style={styles.iconCircle}>
                        <QuestionIcons.mindfulness />
                      </View>
                      <View style={styles.questionTextContainer}>
                        <Text style={styles.questionNumber}>Question {question.sort_order}</Text>
                        <Text style={styles.questionText}>
                          {question.question_text}
                          {question.facet && (
                            <Text style={styles.facetText}> ({question.facet})</Text>
                          )}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Rating Scale */}
                    <View style={styles.ratingScaleContainer}>
                      {Array.from({ length: questionSet.section_b_scale_max - questionSet.section_b_scale_min + 1 }, (_, i) => {
                        const value = i + questionSet.section_b_scale_min;
                        return (
                          <TouchableOpacity
                            key={value}
                            style={[
                              styles.ratingButton,
                              answer?.value === value && styles.ratingButtonSelected
                            ]}
                            onPress={() => handleAnswerChange(question.question_id, value)}
                          >
                            <Text style={[
                              styles.ratingButtonText,
                              answer?.value === value && styles.ratingButtonTextSelected
                            ]}>
                              {value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>
                );
              })}
          </Animated.View>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Questionnaire</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return null;
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
    marginBottom: 30,
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
  // Start Screen Styles
  startCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  bulletPoints: {
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bulletIcon: {
    fontSize: 18,
    color: '#64C59A',
    marginRight: 10,
  },
  bulletText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  timerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F1',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8A66',
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: '#2E8A66',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  // Section Selection Styles
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  timerContainer: {
    backgroundColor: '#E8F5F1',
    borderRadius: 20,
    padding: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionButton: {
    backgroundColor: '#64C59A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Question Styles
  sectionContainer: {
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
  sectionInstructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  scaleLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scaleMinLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scaleMaxLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scaleNumbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scaleNumberItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  questionContainer: {
    marginBottom: 30,
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
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 24,
  },
  facetText: {
    fontSize: 14,
    color: '#2E8A66',
    fontStyle: 'italic',
  },
  ratingScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5F1',
  },
  ratingButtonSelected: {
    backgroundColor: '#64C59A',
    borderColor: '#64C59A',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  ratingButtonTextSelected: {
    color: '#fff',
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
});