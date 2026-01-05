import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../src/contexts/SessionContext';
import Dashboard from '../../src/components/Dashboard';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { session, loading } = useSession();
  const router = useRouter();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Dashboard session={session as Session} onNavigateToAboutMe={() => router.push('/about-me')} />
    </SafeAreaView>
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
});