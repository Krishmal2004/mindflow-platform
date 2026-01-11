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
const culturalBackgrounds = ["Buddhism", "Islam", "Hindu", "Christian", "Other"];
const hobbiesOptions = [
  "Reading", "Sports & Fitness", "Music", "Travel", "Cooking & Baking",
  "Video Gaming", "Art & Crafts", "Hiking & Outdoors", "Watching Movies/TV", "Photography", "Other"
];

export default function AboutMe({ session, onBack }: { session: Session; onBack: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false); // Validates if it was JUST saved to show success screen
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
  const [otherCultural, setOtherCultural] = useState('');

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

        // Handle cultural background 'Other'
        if (profile.cultural_background) {
          const cb = profile.cultural_background;
          if (!culturalBackgrounds.includes(cb) && cb !== 'Other') {
            // If existing value is not in predefined list, assume it was 'Other' or just set as Other.
            // Since we are moving to pills, if it's not in the list, we set data to 'Other' and fill the other input?
            // Actually better: check if it's in the list. If not, set 'Other' in the pill and the text in otherCultural.
            // But wait, if previous data was free text, it might be anything.
            // Let's see if it matches any.
            if (!culturalBackgrounds.includes(cb)) {
              // It's a custom one.
              setOtherCultural(cb);
              // We don't change data.cultural_background here yet, rely on the pill logic or just keep it.
              // To minimize confusion, if it's not in the list, we select 'Other' visually?
              // The UI depends on `data.cultural_background`.
              // If `data.cultural_background` is 'SomeCustomValue', 
              // and we render pills, 'Other' pill is selected if `data.cultural_background` == 'Other'.
              // We need to set `data.cultural_background` to 'Other' for the pill to light up?
              // No, we should probably keep the raw value in `data.cultural_background` until user changes it?
              // OR: we distinguish 'Other' selection vs the text.
              // Let's replicate what Hobbies does but for single select.
              // Hobbies splits headers.
              // Here:
              if (!culturalBackgrounds.slice(0, -1).includes(cb)) {
                // It's likely 'Other' or a custom string.
                setOtherCultural(cb);
                // We can temporarily set the displayed selection to 'Other' if we want the pill active.
                // But the state is just `data.cultural_background`.
                // We might need to adjust `data.cultural_background` to 'Other' in state if we want the pill active,
                // but then we lose the custom text if we don't save it to `otherCultural` first (which we did).
              }
            }
          }

        }
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

      // Cultural Background: if 'Other' is selected (or used), use `otherCultural`.
      // The `data.cultural_background` tracks the selected pill. 
      // If it is 'Other', we use `otherCultural`.
      let culturalBgToSave = data.cultural_background;
      if (data.cultural_background === 'Other') {
        culturalBgToSave = otherCultural.trim();
      }

      const updateData = {
        ...data,
        age: ageValue,
        hobbies_interests: hobbiesToSave,
        cultural_background: culturalBgToSave,
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
      setJustSaved(true);
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

  // Success Screen (Only just after saving)
  if (justSaved) {
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

  // Read-Only View (If previously completed)
  if (profileCompleted) {
    return (
      <View style={styles.container}>
        <StandardHeader title="About Me" onBack={onBack} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Your Profile</Text>
            <Text style={styles.helpText}>
              You have already submitted your profile information. Here is what we have on file.
            </Text>
          </View>

          {questions.map((q, i) => (
            <Animated.View key={q.key} entering={FadeInDown.delay(100 + i * 50)} style={styles.readOnlyCard}>
              <View style={styles.readOnlyHeader}>
                <View style={styles.readOnlyIconCircle}>
                  <q.Icon width={22} height={22} color="#2E8A66" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.readOnlyLabel}>{q.title}</Text>
                  <Text style={styles.readOnlyValue}>
                    {data[q.key as keyof AboutMeData]?.toString() || 'Not provided'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}

          <View style={styles.readOnlyFooter}>
            <Text style={styles.footerNote}>This information is permanent for the study duration.</Text>
          </View>
        </ScrollView>
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
            {q.key === 'cultural_background' && (
              <View style={styles.pillContainer}>
                {culturalBackgrounds.map(bg => {
                  // Check if selected. 
                  // If data.cultural_background matches 'bg', selected.
                  // Special case: if data.cultural_background is not in the main list, and 'bg' is 'Other', select 'Other'.
                  const isOther = bg === 'Other';
                  const isSelected = data.cultural_background === bg ||
                    (isOther && data.cultural_background && !culturalBackgrounds.slice(0, -1).includes(data.cultural_background));

                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => update('cultural_background', bg)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Show text input if 'Other' is effectively selected */}
                {(data.cultural_background === 'Other' || (data.cultural_background && !culturalBackgrounds.slice(0, -1).includes(data.cultural_background))) && (
                  <View style={{ marginTop: 12, paddingHorizontal: 4, width: '100%' }}>
                    <Text style={styles.sectionSubtitle}>Specify cultural background:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={otherCultural}
                      onChangeText={setOtherCultural}
                      placeholder="e.g. Mixed, etc."
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
            {['university_id', 'major_field_of_study', 'family_background',
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
  readOnlyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F9F6',
  },
  readOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  readOnlyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: '#8CAFA0',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyValue: {
    fontSize: 17,
    color: '#2E3A36',
    fontWeight: '600',
    lineHeight: 24,
  },
  readOnlyFooter: {
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  helpCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
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