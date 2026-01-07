import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';

type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    Signup: undefined;
    Dashboard: undefined;
};

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
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ animation: 'fade' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
