import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { useSession } from '../../src/contexts/SessionContext';
import AccountComponent from '../../src/components/Account';
import { supabase } from '../../src/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function AccountScreen() {
  const { session, loading } = useSession();
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <AccountComponent session={session as Session} />
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