import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSession } from '../../src/contexts/SessionContext';
import { useEffect } from 'react';
import { Icons } from '../../src/components/common/AppIcons';

// Animated + Fixed Label Component
const TabIconWithLabel = ({
  Icon,
  label,
  focused,
}: {
  Icon: React.FC<{ focused: boolean }>;
  label: string;
  focused: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.1 : 1) }],
  }));

  return (
    <Animated.View style={[styles.tabContainer, animatedStyle]}>
      <Icon focused={focused} />
      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

export default function TabLayout() {
  const { session, loading } = useSession();
  const router = useRouter();

  // Redirect logic moved to app/_layout.tsx


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8ECEF',
          height: 88,
          paddingBottom: 30,
          paddingTop: 12,
          paddingHorizontal: 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={Icons.TabHome} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={Icons.TabCalendar} label="Calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={Icons.TabProgress} label="Progress" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={Icons.TabAccount} label="Account" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: '#999999',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#64C59A',
    fontWeight: '700',
  },
});