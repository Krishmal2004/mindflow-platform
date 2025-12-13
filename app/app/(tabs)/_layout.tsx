import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';

const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill={focused ? '#64C59A' : 'none'}>
    <Path
      d="M3 9L12 2L21 9V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V9Z"
      stroke={focused ? '#64C59A' : '#999999'}
      strokeWidth="2"
      fill={focused ? '#64C59A' : 'none'}
    />
    <Path d="M9 22V12H15V22" stroke={focused ? '#fff' : '#999999'} strokeWidth="2" />
  </Svg>
);

const CalendarIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
      stroke={focused ? '#64C59A' : '#999999'}
      strokeWidth="2"
    />
    <Path d="M16 2V6" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
    <Path d="M8 2V6" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
    <Path d="M3 10H21" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
  </Svg>
);

const ProgressIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z"
      stroke={focused ? '#64C59A' : '#999999'}
      strokeWidth="2"
    />
    <Path d="M12 6V12L16 14" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const AccountIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
      stroke={focused ? '#64C59A' : '#999999'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
  </Svg>
);

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
            <TabIconWithLabel Icon={HomeIcon} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={CalendarIcon} label="Calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={ProgressIcon} label="Progress" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel Icon={AccountIcon} label="Account" focused={focused} />
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