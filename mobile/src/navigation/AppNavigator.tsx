import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import TabNavigator from './TabNavigator';
import DailySlidersScreen from '../screens/roadmap/DailySlidersScreen';
import WeeklyWhispersScreen from '../screens/roadmap/WeeklyWhispersScreen';
import ThriveTrackerScreen from '../screens/roadmap/ThriveTrackerScreen';
import StressSnapshotScreen from '../screens/roadmap/StressSnapshotScreen';
import MindfulMirrorScreen from '../screens/roadmap/MindfulMirrorScreen';

import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ animation: 'slide_from_right' }} />

                {/* Main Application Flow (Tabs) */}
                <Stack.Screen name="MainTabs" component={TabNavigator} options={{ animation: 'fade' }} />

                {/* Detailed Screens (Pushed on top of tabs) */}
                <Stack.Screen name="DailySliders" component={DailySlidersScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="WeeklyWhispers" component={WeeklyWhispersScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="ThriveTracker" component={ThriveTrackerScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="StressSnapshot" component={StressSnapshotScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="MindfulMirror" component={MindfulMirrorScreen} options={{ animation: 'slide_from_right' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
