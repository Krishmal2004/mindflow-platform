import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationIcons } from '../components/NavigationIcons';
import DashboardScreen from '../screens/DashboardScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
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
                        height: 70 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
                    }
                ],
                tabBarActiveTintColor: '#64C59A',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarIcon: ({ focused, color }) => {
                    const iconProps = {
                        width: 28,  // Increased size
                        height: 28, // Increased size
                        color: color,
                        strokeWidth: focused ? 2.5 : 2
                    };

                    switch (route.name) {
                        case 'Home':
                            return <NavigationIcons.Home {...iconProps} />;
                        case 'Journey':
                            return <NavigationIcons.History {...iconProps} />;
                        case 'Calendar':
                            return <NavigationIcons.Calendar {...iconProps} />;
                        case 'You':
                            return <NavigationIcons.User {...iconProps} />;
                        default:
                            return <NavigationIcons.Home {...iconProps} />;
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
                component={RoadmapScreen}
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
        // Height and paddingBottom are now dynamic based on safe area insets
        borderTopWidth: 0, // Removed border
        elevation: 10, // Added shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        position: 'absolute', // Floating effect to allow shadow to show
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 10, // Move content down slightly inside the larger bar
        borderTopLeftRadius: 20, // Rounded top corners
        borderTopRightRadius: 20,
    },
    tabItem: {
        // paddingVertical: 5, // Simplified padding
    },
    tabLabel: {
        fontSize: 12, // Slightly larger font
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 4,
        marginBottom: Platform.OS === 'ios' ? 0 : 4,
    },
});
