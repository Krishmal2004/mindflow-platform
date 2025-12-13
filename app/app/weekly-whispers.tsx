import React from 'react';
import WeeklyQuestions from '../src/components/WeeklyQuestions';
import { Stack } from 'expo-router';

export default function WeeklyWhispersRoute() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <WeeklyQuestions />
    </>
  );
}