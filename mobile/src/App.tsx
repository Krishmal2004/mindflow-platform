import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import LoginScreen from './screens/auth/LoginScreen';

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setShowLogin(true);
        fade.setValue(1);
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [fade]);

  if (showLogin) return <LoginScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ImageBackground source={require('../assets/images/appIntro.jpg')} style={styles.image} resizeMode="cover" />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1, width: '100%', height: '100%' },
});
