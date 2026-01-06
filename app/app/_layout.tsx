import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../src/contexts/SessionContext';

export default function RootLayout() {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
