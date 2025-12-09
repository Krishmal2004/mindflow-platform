import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
// Custom SVG Icons
const Icons = {
  school: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 15V22" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  graduation: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M6 12V18C6 19.1046 7.89543 20 12 20C16.1046 20 18 19.1046 18 18V12" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  book: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20V5H6.5C5.83696 5 5.20107 5.26339 4.73223 5.73223C4.26339 6.20107 4 6.83696 4 7.5V19.5Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M20 17H6.5C5.83696 17 5.20107 17.2634 4.73223 17.7322C4.26339 18.2011 4 18.837 4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  calendar: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M16 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M8 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M3 10H21" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  home: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M9 22V12H15V22" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  family: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="19" cy="7" r="3" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="5" cy="7" r="3" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  globe: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M2 12H22" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  heart: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.90836 3.57831 8.50903 2.99884 7.05 2.99884C5.59096 2.99884 4.19164 3.57831 3.16 4.61C2.12831 5.64169 1.54884 7.04102 1.54884 8.5C1.54884 9.95898 2.12831 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  target: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="12" cy="12" r="6" stroke="#64C59A" strokeWidth="2"/>
      <Circle cx="12" cy="12" r="2" fill="#64C59A"/>
    </Svg>
  ),
  mindflow: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C13.3137 2 14.6136 2.25866 15.8268 2.75866C17.04 3.25866 18.1421 4.00001 19.071 5.00001C20 6.00001 20.7424 7.14214 21.2424 8.35534C21.7424 9.56854 22 10.8137 22 12" stroke="#64C59A" strokeWidth="2.5" strokeLinecap="round"/>
      <Path d="M12 22C10.6863 22 9.38642 21.7413 8.17317 21.2413C6.95991 20.7413 5.85786 20 4.92893 19C4 18 3.25759 16.8579 2.75759 15.6447C2.25759 14.4315 2 13.1863 2 12" stroke="#64C59A" strokeWidth="2.5" strokeLinecap="round"/>
      <Path d="M8 14C8.65661 14.6278 9.50909 15 10.4142 15C12.2142 15 13.4142 13.6569 13.4142 12C13.4142 10.3431 12.2142 9 10.4142 9C9.50909 9 8.65661 9.37216 8 10" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
};
interface AboutMeData {
  university_id: string;
  education_level: string;
  major_field_of_study: string;
  age: number | null;
  living_situation: string;
  family_background: string;
  cultural_background: string;
  hobbies_interests: string;
  personal_goals: string;
  why_mindflow: string;
}
const questions = [
  { key: 'university_id', Icon: Icons.school, title: 'University ID', subtitle: 'Your official student ID', required: true },
  { key: 'education_level', Icon: Icons.graduation, title: 'Education Level', subtitle: 'Current academic year', required: true },
  { key: 'major_field_of_study', Icon: Icons.book, title: 'Major / Field of Study', subtitle: 'What are you studying?', required: true },
  { key: 'age', Icon: Icons.calendar, title: 'Age', subtitle: 'How old are you?', required: true },
  { key: 'living_situation', Icon: Icons.home, title: 'Living Situation', subtitle: 'Where do you currently live?', required: true },
  { key: 'family_background', Icon: Icons.family, title: 'Family Background', subtitle: 'Tell us about your family', required: false },
  { key: 'cultural_background', Icon: Icons.globe, title: 'Cultural Background', subtitle: 'Your culture & heritage', required: false },
  { key: 'hobbies_interests', Icon: Icons.heart, title: 'Hobbies & Interests', subtitle: 'What do you enjoy doing?', required: false },
  { key: 'personal_goals', Icon: Icons.target, title: 'Personal Goals', subtitle: 'What are you working towards?', required: false },
  { key: 'why_mindflow', Icon: Icons.mindflow, title: 'Why MindFlow?', subtitle: 'What brings you here?', required: true },
];
const educationLevels = ["First Year", "Second Year", "Third Year", "Fourth Year", "Graduate Student", "Other"];
const livingSituations = ["Dorm", "Off-campus housing", "With family", "Other"];
const hobbiesOptions = [
  "Reading",
  "Sports & Fitness",
  "Music",
  "Travel",
  "Cooking & Baking",
  "Video Gaming",
  "Art & Crafts",
  "Hiking & Outdoors",
  "Watching Movies/TV",
  "Photography",
  "Other"
];
export default function AboutMe({ session, onBack }: { session: Session; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [data, setData] = useState<AboutMeData>({
    university_id: '',
    education_level: '',
    major_field_of_study: '',
    age: null,
    living_situation: '',
    family_background: '',
    cultural_background: '',
    hobbies_interests: '',
    personal_goals: '',
    why_mindflow: '',
  });
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [otherHobby, setOtherHobby] = useState('');
  // Compute completion percentage
  const requiredQuestions = questions.filter(q => q.required);
  const allQuestions = questions;
  const filledAll = allQuestions.filter(q => {
    const value = data[q.key as keyof AboutMeData];
    return value !== '' && value !== null && value !== undefined;
  }).length;
  const completionPercentage = allQuestions.length > 0
    ? Math.round((filledAll / allQuestions.length) * 100)
    : 0;
  const filledRequired = requiredQuestions.filter(q => {
    const value = data[q.key as keyof AboutMeData];
    return value !== '' && value !== null && value !== undefined;
  }).length;
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const hobbiesStr = data.hobbies_interests || '';
    if (hobbiesStr) {
      const hobbies = hobbiesStr.split(', ').filter(h => h.trim());
      const predefinedSet = new Set(hobbiesOptions.slice(0, -1));
      const predefined = hobbies.filter(h => predefinedSet.has(h));
      const others = hobbies.filter(h => !predefinedSet.has(h));
      setSelectedHobbies([...predefined, ...(others.length > 0 ? ['Other'] : [])]);
      setOtherHobby(others.join(', ') || '');
    } else {
      setSelectedHobbies([]);
      setOtherHobby('');
    }
  }, [data.hobbies_interests]);
  useEffect(() => {
    const hobbiesStr = [...selectedHobbies.filter(h => h !== 'Other'), otherHobby.trim()].filter(Boolean).join(', ');
    update('hobbies_interests', hobbiesStr);
  }, [selectedHobbies, otherHobby]);
  async function fetchData() {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('about_me_profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        // Ensure age is properly parsed as a number
        const profileData = {
          ...profile,
          age: profile.age !== null ? Number(profile.age) : null
        };
        setData(prev => ({ ...prev, ...profileData }));
        if (profile.is_completed) {
          setProfileCompleted(true);
        }
      }
    } catch (e) {
      console.log("No profile yet or error:", e);
    } finally {
      setLoading(false);
    }
  }
  async function save() {
    if (!declarationChecked) {
      Alert.alert("Declaration Required", "Please confirm that your information is accurate before submitting.");
      return;
    }
    if (filledRequired < requiredQuestions.length) {
      Alert.alert("Incomplete", "Please complete all required fields before submitting.");
      return;
    }
    try {
      setSaving(true);
      const hobbiesToSave = [...selectedHobbies.filter(h => h !== 'Other'), ...(otherHobby.trim() ? [otherHobby.trim()] : [])].join(', ');
      
      // Ensure age is properly formatted as an integer
      const ageValue = data.age !== null ? parseInt(data.age.toString(), 10) : null;
      
      const updateData = {
        ...data,
        age: ageValue,
        hobbies_interests: hobbiesToSave,
        completion_percentage: completionPercentage,
        is_completed: true,
      };
      
      console.log('Saving data:', { id: session?.user.id, ...updateData });
      
      const { error } = await supabase.from('about_me_profiles').upsert({
        id: session?.user.id,
        ...updateData
      }, {
        onConflict: 'id'
      });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setData(updateData as any);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setProfileCompleted(true);
      }, 5000);
    } catch (e: any) {
      console.error('Save error:', e);
      Alert.alert('Error', e.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  const update = (key: keyof AboutMeData, value: any) => {
    // Ensure age is always a number or null
    if (key === 'age') {
      setData(prev => ({ ...prev, [key]: value === '' || value === null ? null : Number(value) }));
    } else {
      setData(prev => ({ ...prev, [key]: value }));
    }
  };
  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev => {
      if (prev.includes(hobby)) {
        const newSelected = prev.filter(h => h !== hobby);
        if (hobby === 'Other') {
          setOtherHobby('');
        }
        return newSelected;
      } else {
        return [...prev, hobby];
      }
    });
  };
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }
  if (showCelebration) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Animated.View entering={ZoomIn.duration(800)} style={{ alignItems: 'center' }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionText}>You've completed your About Me routine.</Text>
            <Text style={styles.completionText}>You're all set. Let's see the summary!</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </Animated.View>
        </View>
      </View>
    );
  }
  // If profile is completed, show the success page instead of the form
  if (profileCompleted) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#64C59A', '#4CAF85']} style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Complete</Text>
          <Text style={styles.headerSubtitle}>Here's your summary</Text>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.helpCard}>
            <Text style={styles.helpTitle}>Your Profile Overview</Text>
            <Text style={styles.helpText}>
              We've captured all your details. This helps us tailor your MindFlow journey perfectly.
            </Text>
          </Animated.View>
          <View style={styles.summaryContainer}>
            {questions.map((q, i) => {
              let displayValue: string;
              const rawValue = data[q.key as keyof AboutMeData];
              switch (q.key) {
                case 'age':
                  displayValue = rawValue ? `${rawValue} years old` : 'Not specified';
                  break;
                case 'hobbies_interests':
                  displayValue = data.hobbies_interests ? data.hobbies_interests : 'None selected';
                  break;
                default:
                  displayValue = (rawValue as string) || 'Not specified';
              }
              return (
                <Animated.View key={q.key} entering={FadeInDown.delay(150 + i * 60)} style={styles.summaryQuestionCard}>
                  <View style={styles.summaryQuestionHeader}>
                    <View style={styles.iconCircle}>
                      <q.Icon />
                    </View>
                    <View style={styles.questionText}>
                      <Text style={styles.questionTitle}>{q.title}</Text>
                      <Text style={styles.summaryValue} numberOfLines={4}>{displayValue}</Text>
                    </View>
                    <View style={styles.dotFilled} />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#64C59A', '#4CAF85']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Me</Text>
        <Text style={styles.headerSubtitle}>One-time background questions</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{completionPercentage}% Complete</Text>
        </View>
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.helpCard}>
          <Text style={styles.helpTitle}>Help us know you better</Text>
          <Text style={styles.helpText}>
            Please provide accurate and truthful information. This helps us personalize your MindFlow experience.
          </Text>
        </Animated.View>
        {questions.map((q, i) => (
          <Animated.View key={q.key} entering={FadeInDown.delay(150 + i * 60)} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <q.Icon />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.questionTitle}>
                  {q.title} {q.required && <Text style={{ color: '#FF6B6B' }}>*</Text>}
                </Text>
                <Text style={styles.questionSubtitle}>{q.subtitle}</Text>
              </View>
              <View style={[styles.dot, data[q.key as keyof AboutMeData] ? styles.dotFilled : {}]} />
            </View>
            {/* Special Inputs */}
            {q.key === 'education_level' && (
              <View style={styles.pillContainer}>
                {educationLevels.map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.pill, data.education_level === level && styles.pillActive]}
                    onPress={() => update('education_level', level)}
                  >
                    <Text style={[styles.pillText, data.education_level === level && styles.pillTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {q.key === 'living_situation' && (
              <View style={styles.pillContainer}>
                {livingSituations.map(sit => (
                  <TouchableOpacity
                    key={sit}
                    style={[styles.pill, data.living_situation === sit && styles.pillActive]}
                    onPress={() => update('living_situation', sit)}
                  >
                    <Text style={[styles.pillText, data.living_situation === sit && styles.pillTextActive]}>
                      {sit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {q.key === 'hobbies_interests' && (
              <View style={styles.pillContainer}>
                {hobbiesOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pill, selectedHobbies.includes(option) && styles.pillActive]}
                    onPress={() => toggleHobby(option)}
                  >
                    <Text style={[styles.pillText, selectedHobbies.includes(option) && styles.pillTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {selectedHobbies.includes('Other') && (
                  <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
                    <Text style={styles.questionSubtitle}>Other hobby:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={otherHobby}
                      onChangeText={setOtherHobby}
                      placeholder="e.g., Dancing, Singing"
                    />
                  </View>
                )}
              </View>
            )}
            {q.key === 'age' && (
              <TextInput
                style={styles.textInput}
                value={data.age?.toString() || ''}
                onChangeText={t => update('age', t ? parseInt(t, 10) : null)}
                placeholder="e.g. 21"
                keyboardType="numeric"
              />
            )}
            {['university_id', 'major_field_of_study', 'family_background', 'cultural_background',
              'personal_goals', 'why_mindflow'].includes(q.key) && (
              <TextInput
                style={[styles.textInput, q.key.includes('background') || q.key === 'why_mindflow' ? styles.multiline : {}]}
                value={data[q.key as keyof AboutMeData] as string}
                onChangeText={t => update(q.key as keyof AboutMeData, t)}
                placeholder="Type your answer..."
                multiline={q.key.includes('background') || q.key === 'why_mindflow'}
                textAlignVertical="top"
              />
            )}
          </Animated.View>
        ))}
        {/* Declaration */}
        <TouchableOpacity
          style={[styles.checkboxContainer, declarationChecked && styles.checkboxChecked]}
          onPress={() => setDeclarationChecked(!declarationChecked)}
        >
          <View style={[styles.checkbox, declarationChecked && styles.checkboxActive]}>
            {declarationChecked && <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I hereby confirm that all information provided above is true, accurate, and complete to the best of my knowledge.
          </Text>
        </TouchableOpacity>
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!declarationChecked || filledRequired < requiredQuestions.length) && styles.saveBtnDisabled
          ]}
          onPress={save}
          disabled={saving || !declarationChecked || filledRequired < requiredQuestions.length}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Submit My Profile</Text>}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          This information is used to improve your experience and will not be shared without consent.
        </Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FDFC' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 20, top: 60 },
  backText: { fontSize: 28, color: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: '#E8F5F1', marginTop: 6 },
  progressContainer: { marginTop: 20, width: '100%', alignItems: 'center' },
  progressBar: { height: 10, width: '85%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 10 },
  progressText: { marginTop: 10, color: '#fff', fontSize: 15, fontWeight: '600' },
  helpCard: { margin: 20, backgroundColor: '#E8F5F1', borderRadius: 20, padding: 20 },
  helpTitle: { fontSize: 18, fontWeight: '700', color: '#2E8A66', marginBottom: 8 },
  helpText: { fontSize: 15, color: '#444', lineHeight: 22 },
  questionCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 },
  summaryQuestionCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 },
  summaryQuestionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F9F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  questionText: { flex: 1 },
  questionTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  questionSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  summaryValue: { fontSize: 16, color: '#333', marginTop: 8, lineHeight: 22 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' },
  dotFilled: { backgroundColor: '#64C59A' },
  textInput: { backgroundColor: '#F7FAF9', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, borderWidth: 1.5, borderColor: '#E8F5E9' },
  multiline: { minHeight: 100 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  pill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, backgroundColor: '#F0F9F6', borderWidth: 1.5, borderColor: '#64C59A' },
  pillActive: { backgroundColor: '#64C59A' },
  pillText: { color: '#2E8A66', fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  checkboxContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 16, alignItems: 'flex-start' },
  checkboxChecked: { borderColor: '#64C59A', borderWidth: 2 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#ccc', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#64C59A', borderColor: '#64C59A' },
  checkboxLabel: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },
  saveBtn: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#64C59A', paddingVertical: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#64C59A', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  saveBtnDisabled: { backgroundColor: '#aaa', shadowOpacity: 0.2 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footerNote: { textAlign: 'center', marginTop: 20, marginBottom: 40, color: '#666', fontSize: 13, paddingHorizontal: 30, lineHeight: 20 },
  // Success Page Styles
  summaryContainer: { flexGrow: 1 },
  // Celebration Styles
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FDFC',
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  happyEmoji: {
    fontSize: 40,
    marginTop: 20,
  },
});