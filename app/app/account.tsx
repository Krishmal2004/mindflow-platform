import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { useSession } from '../src/contexts/SessionContext';
import Auth from '../src/components/Auth';
import AccountComponent from '../src/components/Account';
import { supabase } from '../src/lib/supabase';

export default function AccountScreen() {
  const { session, loading } = useSession();
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }
  
  if (!session) {
    return <Auth />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AccountComponent session={session} />
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