// app/account.tsx
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
  Modal,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

/**
 * Account Component
 * 
 * Manages user profile display, password updates, and signing out.
 */
export default function Account({ session }: { session: Session }) {
  const router = useRouter();
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [username, setUsername] = useState('');
  const [researchID, setResearchID] = useState('');
  const [email, setEmail] = useState('');

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Avatar configuration
  const avatarSeed = session?.user?.id || 'mindful-user';
  // Use a fixed avatar URL or generate one
  const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${avatarSeed}&backgroundColor=E8F5F1`;



  useFocusEffect(
    useCallback(() => {
      if (session) {
        setEmail(session.user.email || '');
        getProfile();
      }
    }, [session])
  );

  /**
   * Fetches user profile details (username, researchID) from Supabase.
   */
  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, researchID')
        .eq('id', session?.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUsername(data.username || 'Mindful User');
        setResearchID(data.researchID || 'Not set');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading profile:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates the user's password.
   * Validates length and match before submitting to Supabase.
   */
  async function changePassword() {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert('Success', 'Your password has been changed!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Signs the user out and redirects to the authentication screen.
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Navigate to auth screen (root)
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Fixed at Top */}
      <View style={styles.header}>
        <Text style={styles.title}>My Account</Text>
        <Text style={styles.subtitle}>Manage your profile & security</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}>
        {/* Profile Hero */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.profileCard}>
          {/* User Profile Picture */}
          <View style={styles.avatarCircle}>
            <Image source={require('../../assets/images/user.png')} style={styles.avatarImage} />
          </View>

          <Text style={styles.userName}>{username}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </Animated.View>

        {/* Profile Information */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{username || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Research ID</Text>
              <Text style={styles.infoValue}>{researchID}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
          <View style={styles.infoNote}>
            <Text style={styles.noteText}>
              Profile information cannot be changed. Contact admin if needed.
            </Text>
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.actionLeft}>
              <View style={styles.iconCircle}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15.75 8.25V6C15.75 3.92893 14.0711 2.25 12 2.25C9.92893 2.25 8.25 3.92893 8.25 6V8.25M12 14.25V16.25M10.5 19.5H13.5C14.7426 19.5 15.75 18.4926 15.75 17.25V14.25C15.75 13.0074 14.7426 12 13.5 12H10.5C9.25736 12 8.25 13.0074 8.25 14.25V17.25C8.25 18.4926 9.25736 19.5 10.5 19.5Z"
                    stroke="#64C59A"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M9 18L15 12L9 6" stroke="#64C59A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={() => setShowSignOutModal(true)}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17.75 12H6.25M13.25 7.75L17.75 12L13.25 16.25M17 20.5H9.5C7.42893 20.5 5.75 18.8211 5.75 16.75V7.25C5.75 5.17893 7.42893 3.5 9.5 3.5H17"
                    stroke="#EF4444"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.dangerText}>Sign Out from Device</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M9 18L15 12L9 6" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#aaa"
              />
            </View>

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, saving && { opacity: 0.7 }]}
                onPress={changePassword}
                disabled={saving}
              >
                <Text style={styles.confirmText}>
                  {saving ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade">
        <View style={styles.signOutModalOverlay}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>Sign Out?</Text>
            <Text style={styles.alertMessage}>You will need to log in again.</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancel} onPress={() => setShowSignOutModal(false)}>
                <Text style={styles.alertCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertConfirm} onPress={signOut}>
                <Text style={styles.alertConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FDFC' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 10, backgroundColor: '#F8FDFC', zIndex: 10 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E8A66',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  profileCard: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#fff',
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 140,
    height: 140,
    resizeMode: 'cover',
    marginTop: 8,
  },
  userName: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginTop: 12 },
  userEmail: { fontSize: 16, color: '#64C59A', marginTop: 6, fontWeight: '500' },
  section: { marginTop: 32, paddingHorizontal: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 16, color: '#555', fontWeight: '500' },
  infoValue: { fontSize: 16, color: '#1A1A1A', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 20 },
  infoNote: { marginTop: 16, padding: 16, backgroundColor: '#F0FDF9', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#64C59A' },
  noteText: { fontSize: 14, color: '#2E8A66', lineHeight: 20 },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: { fontSize: 17, color: '#333', fontWeight: '500' },
  dangerButton: { backgroundColor: '#FFFBFA' },
  dangerText: { fontSize: 17, color: '#EF4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  signOutModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 },
  modalHandle: { width: 50, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 16, color: '#333', marginBottom: 10, fontWeight: '500' },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    color: '#333',
  },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginTop: 10 },
  modalActions: { flexDirection: 'row', marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 16, marginRight: 12, backgroundColor: '#F0F0F0', borderRadius: 16, alignItems: 'center' },
  cancelText: { fontSize: 17, color: '#666', fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 16, marginLeft: 12, backgroundColor: '#64C59A', borderRadius: 16, alignItems: 'center' },
  confirmText: { fontSize: 17, color: '#fff', fontWeight: '600' },
  alertModal: { backgroundColor: '#fff', marginHorizontal: 40, borderRadius: 24, padding: 32, alignItems: 'center' },
  alertTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  alertMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  alertActions: { flexDirection: 'row', width: '100%' },
  alertCancel: { flex: 1, paddingVertical: 16, backgroundColor: '#F0F0F0', borderRadius: 16, marginRight: 12, alignItems: 'center' },
  alertCancelText: { fontSize: 17, color: '#666', fontWeight: '600' },
  alertConfirm: { flex: 1, paddingVertical: 16, backgroundColor: '#EF4444', borderRadius: 16, marginLeft: 12, alignItems: 'center' },
  alertConfirmText: { fontSize: 17, color: '#fff', fontWeight: '600' },
});