import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Pressable,
    Animated,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationIcons } from '../components/NavigationIcons';
import DashboardScreen from '../screens/DashboardScreen';
import JourneyScreen from '../screens/JourneyScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR   = Colors.primary;  // sage green
const INACTIVE_COLOR = '#AEBBC7';       // cool grey

const TABS: {
    name: string;
    label: string;
    Icon: React.ComponentType<{ width?: number; height?: number; color?: string; strokeWidth?: number }>;
}[] = [
    { name: 'Home',     label: 'Home',     Icon: NavigationIcons.Home },
    { name: 'Journey',  label: 'Journey',  Icon: NavigationIcons.History },
    { name: 'Calendar', label: 'Calendar', Icon: NavigationIcons.Calendar },
    { name: 'You',      label: 'You',      Icon: NavigationIcons.User },
];

/** Single animated tab item */
function TabItem({
    tab,
    isFocused,
    researchGroup,
    onPress,
}: {
    tab: typeof TABS[number];
    isFocused: boolean;
    researchGroup: string;
    onPress: () => void;
}) {
    const scale  = useRef(new Animated.Value(isFocused ? 1.10 : 1)).current;
    const pressO = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: isFocused ? 1.10 : 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 180,
        }).start();
    }, [isFocused]);

    const handlePressIn = () =>
        Animated.spring(pressO, { toValue: 0.82, useNativeDriver: true, damping: 10, stiffness: 300 }).start();

    const handlePressOut = () =>
        Animated.spring(pressO, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 300 }).start();

    const color = isFocused
        ? (researchGroup === 'cg' ? '#D97706' : ACTIVE_COLOR)
        : INACTIVE_COLOR;

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tab.label}
            style={styles.tabItem}
            android_ripple={null}
        >
            <Animated.View style={{ transform: [{ scale: Animated.multiply(scale, pressO) }] }}>
                <tab.Icon
                    width={24}
                    height={24}
                    color={color}
                    strokeWidth={isFocused ? 2.3 : 1.8}
                />
            </Animated.View>

            {/* Label always visible — weight/color shifts on active */}
            <Text
                style={[
                    styles.tabLabel,
                    {
                        color,
                        fontWeight: isFocused ? '700' : '500',
                    },
                ]}
                numberOfLines={1}
            >
                {tab.label}
            </Text>
        </Pressable>
    );
}

/** Elegant floating tab bar, rounded top corners, always-visible labels */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

    const [researchGroup, setResearchGroup] = React.useState<string>('ex');

    // Retrieve group when tab navigates or mounts to dynamically load CG or EX theme
    useEffect(() => {
        const checkGroup = async () => {
            try {
                const val = await AsyncStorage.getItem('researchGroup');
                if (val) {
                    setResearchGroup(val);
                }
            } catch (err) {
                console.log('Error reading researchGroup in TabBar:', err);
            }
        };
        checkGroup();
    }, [state.index]);

    return (
        <View style={[styles.barOuter, { paddingBottom: bottomPad }]}>
            {/* Clean Inner Tab items */}
            <View style={styles.barInner}>
                {TABS.map((tab, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: state.routes[index].key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(tab.name);
                        }
                    };

                    return (
                        <TabItem
                            key={tab.name}
                            tab={tab}
                            isFocused={isFocused}
                            researchGroup={researchGroup}
                            onPress={onPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}

export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home"     component={DashboardScreen} />
            <Tab.Screen name="Journey"  component={JourneyScreen} />
            <Tab.Screen name="Calendar" component={CalendarScreen} />
            <Tab.Screen name="You"      component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    barOuter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        // Generous rounded top corners
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#1A2E35',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.09,
        shadowRadius: 20,
        elevation: 18,
        paddingTop: 4,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    barInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        gap: 3,
        minHeight: 56,
    },
    tabLabel: {
        fontSize: 11,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});
