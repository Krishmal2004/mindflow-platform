import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StyleSheet, View, Alert, TextInput, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { Session } from '@supabase/supabase-js';
import DailyEntryForm from './DailyEntryForm';

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    // ... (rest of getProfile)
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }
  
  // ... (rest of updateProfile)
  async function updateProfile() {
    try {
      setSaving(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      Alert.alert('Success', 'Profile information updated.');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Update Failed', error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <DailyEntryForm session={session} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY PROFILE</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={[styles.input, styles.disabledText]} 
                value={session?.user?.email} 
                editable={false} 
              />
            </View>
            
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username || ''}
                onChangeText={(text) => setUsername(text)}
                placeholder="Not set"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={website || ''}
                onChangeText={(text) => setWebsite(text)}
                placeholder="Not set"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={updateProfile}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Update Profile</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS Grouped Background Color
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6D72',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
    color: '#000',
    width: 100,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  disabledText: {
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 13,
    color: '#6D6D72',
    marginTop: 8,
    marginLeft: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 17,
  },
});
