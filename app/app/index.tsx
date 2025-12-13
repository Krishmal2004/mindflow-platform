import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSession } from '../src/contexts/SessionContext';
import Auth from '../src/components/Auth';
import { Redirect } from 'expo-router';

export default function RootScreen() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  // If there's a session, redirect to the main app
  if (session) {
    return <Redirect href="/(tabs)" />;
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