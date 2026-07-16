import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationIcons } from '../components/NavigationIcons';
import DashboardScreen from '../screens/DashboardScreen';
import JourneyScreen from '../screens/JourneyScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    {
                        height: 64 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                    }
                ],
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#9AA5B1',
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarIcon: ({ focused, color }) => {
                    const iconProps = { width: 24, height: 24, color, strokeWidth: focused ? 2.4 : 2 };

                    switch (route.name) {
                        case 'Home': return <NavigationIcons.Home {...iconProps} />;
                        case 'Journey': return <NavigationIcons.History {...iconProps} />;
                        case 'Calendar': return <NavigationIcons.Calendar {...iconProps} />;
                        case 'You': return <NavigationIcons.User {...iconProps} />;
                        default: return <NavigationIcons.Home {...iconProps} />;
                    }
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Journey"
                component={JourneyScreen}
                options={{ tabBarLabel: 'Journey' }}
            />
            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{ tabBarLabel: 'Calendar' }}
            />
            <Tab.Screen
                name="You"
                component={ProfileScreen}
                options={{ tabBarLabel: 'You' }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEF1F0',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 10,
    },
    tabItem: {},
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
        marginTop: 3,
        marginBottom: Platform.OS === 'ios' ? 0 : 2,
    },
});
