import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSession } from '../src/contexts/SessionContext';
import Auth from '../src/components/Auth';
import { useRouter } from 'expo-router';

export default function RootScreen() {
  const { session, loading } = useSession();
  const router = useRouter();

  // Redirect logic moved to app/_layout.tsx


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  // If there's a session, we are redirecting, so show nothing or loading
  if (session) {
    return null;
  }

  // Otherwise, show the auth screen
  return <Auth />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});