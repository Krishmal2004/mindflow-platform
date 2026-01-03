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
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Custom SVG Icons for different question types (simplified and smaller)
const QuestionIcons = {
  stress: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="1.5" />
      <Path d="M8 14C8.65661 13.3722 9.50909 13 10.4142 13C12.2142 13 13.4142 14.3431 13.4142 16C13.4142 17.6569 12.2142 19 10.4142 19C9.50909 19 8.65661 18.6278 8 18" stroke="#64C59A" strokeWidth="1.5" />
      <Circle cx="8" cy="10" r="1" fill="#64C59A" />
      <Circle cx="16" cy="10" r="1" fill="#64C59A" />
    </Svg>
  ),
  mindfulness: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="1.5" />
      <Path d="M12 8V12L15 15" stroke="#64C59A" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke="#64C59A" strokeWidth="1.5" />
    </Svg>
  ),
  wellbeing: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="1.5" />
      <Path d="M8 12H16M12 8V16" stroke="#64C59A" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  ),
};

interface QuestionSet {
  id: number;
  title: string;
  description: string;
  version: string;
  created_at: string;
}

interface QuestionSection {
  id: number;
  question_set_id: number;
  section_key: string;
  title: string;
  instructions: string;
  scale_min: number;
  scale_max: number;
  scale_labels: string[];
  created_at: string;
}

interface Question {
  id: number;
  question_set_id: number;
  section_key: string;
  question_id: string;
  question_text: string;
  facet?: string;
  reverse_score: boolean;
  sort_order: number;
  created_at: string;
}

interface Answer {
  questionId: string;
  value: number | null;
}

export default function MainQuestionnaire() {
  const router = useRouter();
  const { session } = useSession();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [questionSections, setQuestionSections] = useState<QuestionSection[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  // Timer effect
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

  // Check for new questionnaire availability and redirect automatically
  useEffect(() => {
    if (questionSet && !alreadySubmitted && !showStartScreen && !currentSection && !loading) {
      setShowStartScreen(true);
    }
  }, [questionSet, alreadySubmitted, showStartScreen, currentSection, loading]);

  const fetchQuestionSet = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
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
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('questionnaire_sections')
        .select('*')
        .eq('question_set_id', questionSetData.id)
        .order('section_key', { ascending: true });
      if (sectionsError) throw sectionsError;
      setQuestionSections(sectionsData || []);
      const { data: questionsData, error: questionsError } = await supabase
        .from('main_questions')
        .select('*')
        .eq('question_set_id', questionSetData.id)
        .order('section_key', { ascending: true })
        .order('sort_order', { ascending: true });
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
      const initialAnswers = questionsData?.map(q => ({
        questionId: q.question_id,
        value: null
      })) || [];
      setAnswers(initialAnswers);
      // Check if the user has already submitted responses for this questionnaire set
      const { data: existingResponses } = await supabase
        .from('main_questionnaire_responses')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('question_set_id', questionSetData.id)
        .limit(1)
        .maybeSingle();
      
      // Also check if there's a session record
      const { data: existingSession } = await supabase
        .from('main_questionnaire_sessions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('question_set_id', questionSetData.id)
        .maybeSingle();
      
      const hasSubmitted = !!existingResponses || !!existingSession;
      setAlreadySubmitted(hasSubmitted);
      
      // If there's no submission yet, automatically start the questionnaire
      if (!hasSubmitted && !showStartScreen && !currentSection) {
        setShowStartScreen(true);
      }
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

  const isSectionCompleted = (sectionKey: string) => {
    const sectionQuestions = questions.filter(q => q.section_key === sectionKey);
    return sectionQuestions.every(q => answers.find(a => a.questionId === q.question_id)?.value !== null);
  };

  const getPreviousSectionKey = (sectionKey: string) => {
    const orderedKeys = questionSections.map(s => s.section_key).sort();
    const idx = orderedKeys.indexOf(sectionKey);
    if (idx > 0) return orderedKeys[idx - 1];
    return null;
  };

  const isSectionUnlocked = (sectionKey: string) => {
    const prev = getPreviousSectionKey(sectionKey);
    if (!prev) return true;
    return isSectionCompleted(prev);
  };

  const handleSubmit = async () => {
    if (!questionSet || !session?.user?.id) return;
    const unanswered = answers.find(a => a.value === null);
    if (unanswered) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const timeSpent = getTimeSpent();
      const { data: sessionData, error: sessionError } = await supabase
        .from('main_questionnaire_sessions')
        .insert({
          user_id: session.user.id,
          question_set_id: questionSet.id,
          time_to_complete: timeSpent,
          started_at: startTime?.toISOString(),
        })
        .select()
        .single();
      if (sessionError) throw sessionError;
      const responses = answers.map(answer => ({
        session_id: sessionData.id,
        user_id: session.user.id,
        question_set_id: questionSet.id,
        question_id: answer.questionId,
        response_value: answer.value,
      }));
      const { error: responsesError } = await supabase
        .from('main_questionnaire_responses')
        .insert(responses);
      if (responsesError) throw responsesError;
      // Update the submission status immediately
      setAlreadySubmitted(true);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        // Optionally navigate to progress screen after celebration
        // router.push('/(tabs)/progress');
      }, 3000);
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
    setCurrentSection(questionSections[0]?.section_key || null); // Auto start Part A
  };

  const goToSection = (section: string) => {
    setCurrentSection(section);
  };

  const goBackToSections = () => {
    setCurrentSection(null);
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>Loading</Text>
          </View>
          
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2E8A66" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // No Questionnaire
  if (!questionSet) {
    return (
       <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>0%</Text>
          </View>
          
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>No Questionnaire</Text>
          <Text style={styles.completionText}>Please check back later.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchQuestionSet}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Already Submitted Screen
  if (alreadySubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>100%</Text>
          </View>
        </View>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(600)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Questionnaire Completed</Text>
            <Text style={styles.completionText}>You have already completed this questionnaire.</Text>
            <Text style={styles.happyEmoji}>😊</Text>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => router.push('/')}
              accessibilityLabel="Go to dashboard"
            >
              <Text style={styles.startButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Celebration
  if (showCelebration) {
    return (
      <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>100%</Text>
          </View>
        </View>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(600)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionText}>You've completed the questionnaire.</Text>
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
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>0%</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>{questionSet.title}</Text>
            <Text style={styles.introSubtitle}>{questionSet.description}</Text>
            <View style={styles.introSection}>
              <Text style={styles.introText}>The questionnaire consists of:</Text>
              <View style={styles.bulletPoints}>
                {questionSections.map((section, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletIcon}>•</Text>
                    <Text style={styles.bulletText}>{section.title} ({questions.filter(q => q.section_key === section.section_key).length} questions)</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.introText}>Answer honestly. Time tracked.</Text>
            </View>
            <View style={styles.timerPreview}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="1.5" />
                <Path d="M12 6V12L16 14" stroke="#64C59A" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
              <Text style={styles.timerText}>Time tracked</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startQuestionnaire}>
              <Text style={styles.startButtonText}>Begin</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Section Selection
  if (!currentSection) {
    // Calculate overall progress
    const totalQuestions = questions.length;
    const totalAnswered = answers.filter(a => a.value !== null).length;
    const overallProgress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
    
    return (
      <View style={styles.container}>
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Main Questionnaire</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{totalAnswered}/{totalQuestions}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Complete Sections</Text>
            <Text style={styles.sectionSubtitle}>Answer all to finish</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time: {getTimeSpent()}s</Text>
          </View>
          {questionSections.map((section, index) => {
            const unlocked = isSectionUnlocked(section.section_key);
            const sectionQuestions = questions.filter(q => q.section_key === section.section_key);
            const answeredCount = answers.filter(a => sectionQuestions.some(q => q.question_id === a.questionId) && a.value !== null).length;
            const prevKey = getPreviousSectionKey(section.section_key);
            const isCompleted = answeredCount === sectionQuestions.length && answeredCount > 0;
            return (
              <Animated.View key={section.id} entering={FadeInDown.delay(100 + index * 50)} style={[styles.sectionCard, isCompleted && styles.sectionCardCompleted]}>
                <View style={styles.sectionIconContainer}>
                  {section.section_key === 'A' && <QuestionIcons.stress />}
                  {section.section_key === 'B' && <QuestionIcons.mindfulness />}
                  {section.section_key === 'C' && <QuestionIcons.wellbeing />}
                </View>
                <View style={styles.sectionTextContainer}>
                  <Text style={styles.sectionCardTitle}>{section.section_key === 'A' ? 'Part A: PSS' : section.section_key === 'B' ? 'Part B: FFMQ' : section.section_key === 'C' ? 'Part C: WEMWBS' : `Part ${section.section_key} ${section.title}`}</Text>
                  <Text style={styles.sectionCardSubtitle}>{sectionQuestions.length} questions</Text>
                  <Text style={styles.sectionCardProgress}>{answeredCount}/{sectionQuestions.length} answered</Text>
                  <View style={styles.sectionProgressBar}>
                    <View 
                      style={[styles.sectionProgressBarFill, { width: `${(answeredCount / sectionQuestions.length) * 100}%` }]} 
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.sectionButton, !unlocked && styles.disabledButton]}
                  onPress={unlocked ? () => goToSection(section.section_key) : undefined}
                >
                  <Text style={[styles.sectionButtonText, !unlocked && styles.disabledButtonText]}>
                    {unlocked ? (isCompleted ? 'Review' : 'Start') : `Complete Part ${prevKey} first`}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  }

  // Questions Screen
  const currentSectionData = questionSections.find(s => s.section_key === currentSection);
  const currentSectionQuestions = questions.filter(q => q.section_key === currentSection);
  const answeredCount = answers.filter(a => currentSectionQuestions.some(q => q.question_id === a.questionId) && a.value !== null).length;
  const isLastSection = currentSection === questionSections[questionSections.length - 1].section_key;
  
  // Calculate overall progress
  const totalQuestions = questions.length;
  const totalAnswered = answers.filter(a => a.value !== null).length;
  const overallProgress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  const sectionProgress = currentSectionQuestions.length > 0 ? (answeredCount / currentSectionQuestions.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.professionalHeader}>
        <TouchableOpacity onPress={goBackToSections} style={styles.headerBackButton}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{currentSectionData?.section_key === 'A' ? 'Part A: PSS' : currentSectionData?.section_key === 'B' ? 'Part B: FFMQ' : currentSectionData?.section_key === 'C' ? 'Part C: WEMWBS' : ''}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>{answeredCount}/{currentSectionQuestions.length}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Time: {getTimeSpent()}s</Text>
        </View>
        <View style={styles.sectionInstructionsContainer}>
          <Text style={styles.sectionInstructions}>{currentSectionData?.instructions}</Text>
          <View style={styles.scaleLabelsContainer}>
            <Text style={styles.scaleMinLabel}>{currentSectionData?.scale_labels[0]}</Text>
            <Text style={styles.scaleMaxLabel}>{currentSectionData?.scale_labels[currentSectionData?.scale_labels.length - 1]}</Text>
          </View>
          <View style={styles.scaleNumbersContainer}>
            {Array.from({ length: (currentSectionData?.scale_max || 0) - (currentSectionData?.scale_min || 0) + 1 }, (_, i) => {
              const value = i + (currentSectionData?.scale_min || 0);
              return (
                <View key={value} style={styles.scaleNumberItem}>
                  <Text style={styles.scaleNumberText}>{value}</Text>
                </View>
              );
            })}
          </View>
        </View>
        {currentSectionQuestions.map((question, index) => {
          const answer = answers.find(a => a.questionId === question.question_id);
          return (
            <Animated.View key={question.id} entering={FadeInDown.delay(100 + index * 30)} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberCircle}>
                  <Text style={styles.questionNumberText}>Q{question.sort_order}</Text>
                </View>
                <View style={styles.questionTextContainer}>
                  <Text style={styles.questionText}>
                    {question.question_text}
                    {question.facet && <Text style={styles.facetText}> ({question.facet})</Text>}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingScaleContainer}>
                {Array.from({ length: (currentSectionData?.scale_max || 0) - (currentSectionData?.scale_min || 0) + 1 }, (_, i) => {
                  const value = i + (currentSectionData?.scale_min || 0);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.ratingButton,
                        answer?.value === value && styles.ratingButtonSelected,
                      ]}
                      onPress={() => handleAnswerChange(question.question_id, value)}
                      accessibilityLabel={`Rate ${value} for question ${question.sort_order}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: answer?.value === value }}
                    >
                      <Text
                        style={[
                          styles.ratingButtonText,
                          answer?.value === value && styles.ratingButtonTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={isLastSection ? handleSubmit : goBackToSections}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isLastSection ? 'Submit' : 'Save & Continue'}</Text>
          )}
        </TouchableOpacity>
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8F5F1',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E8A66',
    borderRadius: 3,
  },
  progressBadge: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E6F6EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: '#F8FDFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  happyEmoji: {
    fontSize: 40,
    marginTop: 12,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#2E8A66',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  introSection: {
    marginBottom: 20,
  },
  introText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  bulletPoints: {
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletIcon: {
    fontSize: 14,
    color: '#64C59A',
    marginRight: 6,
  },
  bulletText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  timerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F1',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8A66',
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: '#2E8A66',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  timerContainer: {
    backgroundColor: '#E8F5F1',
    borderRadius: 16,
    padding: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionCardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sectionCardProgress: {
    fontSize: 12,
    color: '#64C59A',
    fontWeight: '600',
  },
  sectionProgressBar: {
    height: 4,
    backgroundColor: '#E8F5F1',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    width: '100%',
  },
  sectionProgressBarFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 2,
  },
  sectionButton: {
    backgroundColor: '#64C59A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 36,
    justifyContent: 'center',
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sectionCardCompleted: {
    borderColor: '#64C59A',
    borderWidth: 2,
    backgroundColor: '#F0FDF9',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  sectionInstructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  scaleLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleMinLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scaleMaxLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scaleNumbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scaleNumberItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  questionContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8FEFB',
    borderRadius: 12,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  questionNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E8A66',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8A66',
    marginBottom: 4,
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
  },
  facetText: {
    fontSize: 12,
    color: '#2E8A66',
    fontStyle: 'italic',
  },
  ratingScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5F1',
    marginHorizontal: 2,
  },
  ratingButtonSelected: {
    backgroundColor: '#2E8A66',
    borderColor: '#2E8A66',
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ratingButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#2E8A66',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});