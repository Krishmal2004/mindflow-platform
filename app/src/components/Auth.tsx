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

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  }

  function handleSignUpClick() {
    Alert.alert(
      'Sign Up',
      'Research admins will assign you and give you the credentials'
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
              />
            </View>
          </View>

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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#2E8A66',
    fontSize: 14,
    fontWeight: '700',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  ssoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  ssoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0EBE8',
  },
  ssoIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  ssoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
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
});