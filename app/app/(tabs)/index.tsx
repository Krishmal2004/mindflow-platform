import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { useSession } from '../../src/contexts/SessionContext';
import Dashboard from '../../src/components/Dashboard';
import AboutMe from '../../src/components/AboutMe';
import { Session } from '@supabase/supabase-js';

export default function HomeScreen() {
  const { session, loading } = useSession();
  const [showAboutMe, setShowAboutMe] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  if (showAboutMe && session) {
    return <AboutMe session={session} onBack={() => setShowAboutMe(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Dashboard session={session as Session} onNavigateToAboutMe={() => setShowAboutMe(true)} />
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