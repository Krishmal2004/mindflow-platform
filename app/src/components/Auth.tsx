import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '../lib/supabase';

// Use the project logo from local assets
const MindFlowLogo = () => (
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/images/Auth.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignUpInfo, setShowSignUpInfo] = useState(false);

  async function signInWithEmail() {
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMessage(error.message);
    }
    setLoading(false);
  }

  function handleSignUpClick() {
    setShowSignUpInfo(true);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          {/* Logo */}
          <MindFlowLogo />

          {/* App Name */}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.appName, styles.mindText]}>Mind</Text>
            <Text style={[styles.appName, styles.flowText]}>Flow</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>
            Welcome back to your mindfulness journey
          </Text>

          {/* University Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>University Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="IT24XXXXXX@my.sliit.lk"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
            </View>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={handleSignUpClick}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sign Up Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSignUpInfo}
        onRequestClose={() => setShowSignUpInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSignUpInfo(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Up</Text>
            </View>
            <Text style={styles.modalText}>
              Research admins will assign you and give you the credentials.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSignUpInfo(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  innerContainer: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#E8F5F1',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#2E8A66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#A8E6CF',
  },
  logo: {
    width: 95,
    height: 95,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2E8A66',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 44,
    paddingHorizontal: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    color: '#2E8A66',
    marginBottom: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0EBE8',
    color: '#333',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2E8A66',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 26,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#2E8A66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 36,
    justifyContent: 'center',
    gap: 6,
  },
  signupText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  signupLink: {
    color: '#2E8A66',
    fontSize: 16,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  mindText: {
    color: '#3bcc97ff',
  },
  flowText: {
    color: '#2E8A66',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#A8E6CF',
  },
  modalHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 138, 102, 0.1)',
    width: '100%',
    alignItems: 'center',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E8A66',
  },
  modalText: {
    fontSize: 16,
    color: '#2E8A66',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#2E8A66',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});