import React from 'react';
import DailySliders from '../src/components/DailySliders';
import { Stack } from 'expo-router';

export default function DailySlidersRoute() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <DailySliders />
    </>
  );
}