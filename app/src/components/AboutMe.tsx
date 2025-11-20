import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  is_completed: boolean;
  completion_percentage: number;
}

const livingSituations = [
  "Dorm",
  "Off-campus housing",
  "With family",
  "Other"
];

const educationLevels = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Graduate Student",
  "Other"
];

export default function AboutMe({ session, onBack }: { session: Session, onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutMeData, setAboutMeData] = useState<AboutMeData>({
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
    is_completed: false,
    completion_percentage: 0
  });

  useEffect(() => {
    fetchAboutMeData();
  }, []);

  // Calculate completion percentage whenever aboutMeData changes
  useEffect(() => {
    const completionPercentage = calculateCompletion();
    setAboutMeData(prev => ({
      ...prev,
      completion_percentage: completionPercentage
    }));
  }, [aboutMeData.university_id, aboutMeData.education_level, aboutMeData.major_field_of_study, 
      aboutMeData.age, aboutMeData.living_situation, aboutMeData.family_background, 
      aboutMeData.cultural_background, aboutMeData.hobbies_interests, 
      aboutMeData.personal_goals, aboutMeData.why_mindflow]);

  async function fetchAboutMeData() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error } = await supabase
        .from('about_me_profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      if (data) {
        const completionPercentage = calculateCompletionFromData(data);
        setAboutMeData({
          university_id: data.university_id || '',
          education_level: data.education_level || '',
          major_field_of_study: data.major_field_of_study || '',
          age: data.age,
          living_situation: data.living_situation || '',
          family_background: data.family_background || '',
          cultural_background: data.cultural_background || '',
          hobbies_interests: data.hobbies_interests || '',
          personal_goals: data.personal_goals || '',
          why_mindflow: data.why_mindflow || '',
          is_completed: data.is_completed || false,
          completion_percentage: completionPercentage
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function calculateCompletionFromData(data: any): number {
    const fields = [
      data.university_id,
      data.education_level,
      data.major_field_of_study,
      data.age,
      data.living_situation,
      data.family_background,
      data.cultural_background,
      data.hobbies_interests,
      data.personal_goals,
      data.why_mindflow
    ];
    
    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  }

  function calculateCompletion(): number {
    const fields = [
      aboutMeData.university_id,
      aboutMeData.education_level,
      aboutMeData.major_field_of_study,
      aboutMeData.age,
      aboutMeData.living_situation,
      aboutMeData.family_background,
      aboutMeData.cultural_background,
      aboutMeData.hobbies_interests,
      aboutMeData.personal_goals,
      aboutMeData.why_mindflow
    ];
    
    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  }

  async function saveAboutMeData() {
    try {
      setSaving(true);
      if (!session?.user) throw new Error('No user on the session!');

      const isCompleted = aboutMeData.completion_percentage === 100;

      const updates = {
        id: session?.user.id,
        university_id: aboutMeData.university_id,
        education_level: aboutMeData.education_level,
        major_field_of_study: aboutMeData.major_field_of_study,
        age: aboutMeData.age,
        living_situation: aboutMeData.living_situation,
        family_background: aboutMeData.family_background,
        cultural_background: aboutMeData.cultural_background,
        hobbies_interests: aboutMeData.hobbies_interests,
        personal_goals: aboutMeData.personal_goals,
        why_mindflow: aboutMeData.why_mindflow,
        completion_percentage: aboutMeData.completion_percentage,
        is_completed: isCompleted,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('about_me_profiles').upsert(updates);

      if (error) throw error;

      Alert.alert(
        'Success', 
        isCompleted 
          ? 'Your profile has been completed! You can update these answers anytime in settings.' 
          : 'Your answers have been saved!',
        [{ text: 'OK', onPress: () => {
          if (isCompleted) {
            onBack();
          }
        }}]
      );

      // Update local state
      setAboutMeData({
        ...aboutMeData,
        is_completed: isCompleted
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Save Failed', error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof AboutMeData, value: any) {
    setAboutMeData({
      ...aboutMeData,
      [field]: value
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64C59A" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About Me</Text>
        <Text style={styles.subtitle}>One-time profile setup to personalize your experience</Text>
      </View>

      <View style={styles.completionContainer}>
        <View style={styles.completionBarBackground}>
          <View 
            style={[
              styles.completionBar, 
              { width: `${aboutMeData.completion_percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.completionText}>{aboutMeData.completion_percentage}% Complete</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>University ID *</Text>
            <TextInput
              style={styles.input}
              value={aboutMeData.university_id}
              onChangeText={(text) => updateField('university_id', text)}
              placeholder="Enter your university ID"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Education Level *</Text>
            <View style={styles.pickerContainer}>
              {educationLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pickerItem,
                    aboutMeData.education_level === level && styles.selectedPickerItem
                  ]}
                  onPress={() => updateField('education_level', level)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    aboutMeData.education_level === level && styles.selectedPickerItemText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Major / Field of Study *</Text>
            <TextInput
              style={styles.input}
              value={aboutMeData.major_field_of_study}
              onChangeText={(text) => updateField('major_field_of_study', text)}
              placeholder="e.g., Computer Science, Psychology"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={aboutMeData.age ? aboutMeData.age.toString() : ''}
              onChangeText={(text) => updateField('age', parseInt(text) || null)}
              placeholder="Enter your age"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Living Situation *</Text>
            <View style={styles.pickerContainer}>
              {livingSituations.map((situation) => (
                <TouchableOpacity
                  key={situation}
                  style={[
                    styles.pickerItem,
                    aboutMeData.living_situation === situation && styles.selectedPickerItem
                  ]}
                  onPress={() => updateField('living_situation', situation)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    aboutMeData.living_situation === situation && styles.selectedPickerItemText
                  ]}>
                    {situation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background & Interests</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Family Background</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMeData.family_background}
              onChangeText={(text) => updateField('family_background', text)}
              placeholder="Describe your family background"
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cultural Background</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMeData.cultural_background}
              onChangeText={(text) => updateField('cultural_background', text)}
              placeholder="Describe your cultural background"
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hobbies & Interests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMeData.hobbies_interests}
              onChangeText={(text) => updateField('hobbies_interests', text)}
              placeholder="List your hobbies and interests"
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Motivation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Goals</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMeData.personal_goals}
              onChangeText={(text) => updateField('personal_goals', text)}
              placeholder="What are your personal goals?"
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Why MindFlow? *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMeData.why_mindflow}
              onChangeText={(text) => updateField('why_mindflow', text)}
              placeholder="What motivated you to join MindFlow?"
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Note: You can update these answers anytime in settings
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveAboutMeData}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {aboutMeData.is_completed ? 'Update My Answers' : 'Save My Answers'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#64C59A',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  completionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  completionBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  completionBar: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 5,
  },
  completionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#64C59A',
  },
  selectedPickerItem: {
    backgroundColor: '#64C59A',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedPickerItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: '#E8F5F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#2E8A66',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});