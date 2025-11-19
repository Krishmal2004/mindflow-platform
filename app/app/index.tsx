import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, ImageBackground, StatusBar, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import Auth from '../src/components/Auth';
import Account from '../src/components/Account';

export default function App() {
  const [showContent, setShowContent] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const timeout = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setShowContent(true);
        fade.setValue(1);
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fade]);

  if (showContent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={false} style="dark" />
        <View style={styles.content}>
          {session && session.user ? (
            <Account key={session.user.id} session={session} />
          ) : (
            <Auth />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.splashContainer}>
      <StatusBar hidden />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ImageBackground 
          source={require('../assets/images/appIntro.jpg')} 
          style={styles.image} 
          resizeMode="cover" 
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#fff' },
  image: { flex: 1, width: '100%', height: '100%' },
  content: { flex: 1 },
});
