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
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Icons } from './common/AppIcons';
import StandardHeader from './common/StandardHeader';
import SuccessScreen from './common/SuccessScreen';

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
  { key: 'university_id', Icon: Icons.School, title: 'University ID', subtitle: 'Your official student ID', required: true },
  { key: 'education_level', Icon: Icons.Graduation, title: 'Education Level', subtitle: 'Current academic year', required: true },
  { key: 'major_field_of_study', Icon: Icons.Book, title: 'Major / Field of Study', subtitle: 'What are you studying?', required: true },
  { key: 'age', Icon: Icons.Calendar, title: 'Age', subtitle: 'How old are you?', required: true },
  { key: 'living_situation', Icon: Icons.Home, title: 'Living Situation', subtitle: 'Where do you currently live?', required: true },
  { key: 'family_background', Icon: Icons.Family, title: 'Family Background', subtitle: 'Tell us about your family', required: true },
  { key: 'cultural_background', Icon: Icons.Globe, title: 'Cultural Background', subtitle: 'Your culture & heritage', required: true },
  { key: 'hobbies_interests', Icon: Icons.Heart, title: 'Hobbies & Interests', subtitle: 'What do you enjoy doing?', required: true },
  { key: 'personal_goals', Icon: Icons.Target, title: 'Personal Goals', subtitle: 'What are you working towards?', required: false },
  { key: 'why_mindflow', Icon: Icons.Mindflow, title: 'Previous Experience', subtitle: 'Have you done any mindfulness practices?', required: true },
];

const educationLevels = ["First Year", "Second Year", "Third Year", "Fourth Year", "Graduate Student", "Other"];
const livingSituations = ["Dorm", "Off-campus housing", "With family", "Other"];
const hobbiesOptions = [
  "Reading", "Sports & Fitness", "Music", "Travel", "Cooking & Baking",
  "Video Gaming", "Art & Crafts", "Hiking & Outdoors", "Watching Movies/TV", "Photography", "Other"
];

export default function AboutMe({ session, onBack }: { session: Session; onBack: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
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

      if (error && error.code !== 'PGRST116') throw error;

      if (profile) {
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
      const ageValue = data.age !== null ? parseInt(data.age.toString(), 10) : null;

      const updateData = {
        ...data,
        age: ageValue,
        hobbies_interests: hobbiesToSave,
        completion_percentage: completionPercentage,
        is_completed: true,
      };

      const { error } = await supabase.from('about_me_profiles').upsert({
        id: session?.user.id,
        ...updateData
      }, {
        onConflict: 'id'
      });

      if (error) throw error;

      setData(updateData as any);
      setProfileCompleted(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const update = (key: keyof AboutMeData, value: any) => {
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
        if (hobby === 'Other') setOtherHobby('');
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

  // Success Screen
  if (profileCompleted) {
    return (
      <View style={styles.container}>
        <StandardHeader
          title="Profile Complete"
          onBack={onBack}
        />
        <SuccessScreen
          title="All Set!"
          subtitle={["You've completed your profile.", "We can now personalize your experience."]}
          buttonText="Back to Dashboard"
          onPressHome={onBack}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StandardHeader
        title="About Me"
        onBack={onBack}
        rightContent={
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{`${completionPercentage}%`}</Text>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.helpCard}>
          <Text style={styles.helpTitle}>Help us know you better</Text>
          <Text style={styles.helpText}>
            Please provide accurate and truthful information. This helps us personalize your MindFlow experience.
          </Text>
        </Animated.View>

        {questions.map((q, i) => (
          <Animated.View key={q.key} entering={FadeInDown.delay(150 + i * 60)} style={styles.section}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <q.Icon width={24} height={24} color="#2E8A66" />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.sectionTitle}>
                  {q.title} {q.required && <Text style={{ color: '#FF6B6B' }}>*</Text>}
                </Text>
                <Text style={styles.sectionSubtitle}>{q.subtitle}</Text>
              </View>
            </View>

            {/* Content Inputs */}
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
                  <View style={{ marginTop: 12, paddingHorizontal: 4, width: '100%' }}>
                    <Text style={styles.sectionSubtitle}>Other hobby:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={otherHobby}
                      onChangeText={setOtherHobby}
                      placeholder="e.g., Dancing"
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
          activeOpacity={0.8}
          onPress={save}
          disabled={saving || !declarationChecked || filledRequired < requiredQuestions.length}
        >
          <LinearGradient
            colors={(!declarationChecked || filledRequired < requiredQuestions.length)
              ? ['#d1e7dd', '#d1e7dd']
              : ['#2E8A66', '#3bcc97']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.saveBtn,
              (!declarationChecked || filledRequired < requiredQuestions.length) && styles.saveBtnDisabled
            ]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Submit My Profile</Text>}
          </LinearGradient>
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
    color: '#2E8A66',
    fontWeight: '800',
    fontSize: 14,
  },
  helpCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 0,
    backgroundColor: '#E8F5F1',
    borderRadius: 24,
    padding: 24,
  },
  helpTitle: { fontSize: 18, fontWeight: '700', color: '#2E8A66', marginBottom: 8 },
  helpText: { fontSize: 15, color: '#444', lineHeight: 22 },

  // Section Styles (Matching DailySliders)
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questionText: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#666', lineHeight: 20, fontWeight: '500' },

  // Input Styles
  textInput: {
    backgroundColor: '#FAFEFD',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    color: '#333',
    // Slight shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  multiline: { minHeight: 120 },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8F5F1',
  },
  pillActive: {
    backgroundColor: '#E8F5F1',
    borderColor: '#64C59A',
  },
  pillText: { color: '#666', fontWeight: '600' },
  pillTextActive: { color: '#2E8A66', fontWeight: '700' },

  // Footer/Submit
  checkboxContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  checkboxChecked: { borderColor: '#64C59A', borderWidth: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#ccc', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#64C59A', borderColor: '#64C59A' },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },

  saveBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#2E8A66',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: {
    shadowOpacity: 0.1,
    elevation: 0,
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footerNote: { textAlign: 'center', marginTop: 20, marginBottom: 40, color: '#999', fontSize: 12 },
});