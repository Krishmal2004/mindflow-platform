import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState, TextInput, TouchableOpacity, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  function validate() {
    let isValid = true;
    let newErrors: {email?: string; password?: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  async function signInWithEmail() {
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Mindfulness Research</Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="name@example.com"
            placeholderTextColor="#A0A0A0"
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: undefined});
            }}
            value={email}
            autoCapitalize={'none'}
            keyboardType="email-address"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Enter your password"
            placeholderTextColor="#A0A0A0"
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: undefined});
            }}
            value={password}
            secureTextEntry={true}
            autoCapitalize={'none'}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => signInWithEmail()} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
