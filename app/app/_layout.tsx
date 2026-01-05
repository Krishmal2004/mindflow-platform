import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '../src/contexts/SessionContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

function InitialLayout() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Auth check:', { session: !!session, inTabsGroup });

    if (session && !inTabsGroup) {
      // Redirect to the tabs if the user is signed in and not already there
      router.replace('/(tabs)');
    } else if (!session && inTabsGroup) {
      // Redirect to the login page if the user is not signed in and trying to access tabs
      router.replace('/');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <InitialLayout />
    </SessionProvider>
  );
}