import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineNotice } from './src/components/OfflineNotice';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <OfflineNotice />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
