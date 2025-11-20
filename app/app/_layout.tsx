import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { SessionProvider } from '../src/contexts/SessionContext';

// Custom icons for each tab with improved styling
const HomeIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.tabIcon, styles.homeIcon, { backgroundColor: focused ? '#64C59A' : color }]} />
);

const CalendarIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.tabIcon, styles.calendarIcon, { backgroundColor: focused ? '#64C59A' : color }]} />
);

const ProgressIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.tabIcon, styles.progressIcon, { backgroundColor: focused ? '#64C59A' : color }]} />
);

const AccountIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.tabIcon, styles.accountIcon, { backgroundColor: focused ? '#64C59A' : color }]} />
);

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#64C59A',
          tabBarInactiveTintColor: '#CCCCCC',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          tabBarShowLabel: false, // Hide labels for cleaner UI
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => <HomeIcon color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, focused }) => <CalendarIcon color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, focused }) => <ProgressIcon color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, focused }) => <AccountIcon color={color} focused={focused} />,
          }}
        />
      </Tabs>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    transform: [{ scale: 1 }],
  },
  homeIcon: {
    backgroundColor: '#64C59A',
  },
  calendarIcon: {
    backgroundColor: '#333333',
  },
  progressIcon: {
    backgroundColor: '#2E8A66',
  },
  accountIcon: {
    backgroundColor: '#64C59A',
  },
});