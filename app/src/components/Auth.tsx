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
      source={require('../../assets/images/mindfulnessLogo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and signup

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

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Sign Up Successful',
        'Please check your email for confirmation.'
      );
      // Switch back to login view after successful signup
      setIsSignUp(false);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          {/* Logo */}
          <MindFlowLogo />

          {/* App Name */}
          <Text style={styles.appName}>MindFlow</Text>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>
            {isSignUp 
              ? 'Create an account to start your mindfulness journey' 
              : 'Welcome back to your mindfulness journey'}
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

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                {isSignUp ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle between Login and Sign Up */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {isSignUp 
                ? 'Already have an account? ' 
                : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.signupLink}>
                {isSignUp ? 'Login' : 'Sign Up'}
              </Text>
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
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  innerContainer: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#64C59A',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  logo: {
    width: 64,
    height: 64,
    tintColor: '#fff',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E8A66',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#2E8A66',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#64C59A',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#64C59A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#888',
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
    backgroundColor: '#F7F7F7',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ssoIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  ssoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 32,
  },
  signupText: {
    color: '#666',
    fontSize: 16,
  },
  signupLink: {
    color: '#2E8A66',
    fontSize: 16,
    fontWeight: 'bold',
  },
});