import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

interface TabIconProps {
    focused: boolean;
    iconName: string;
    color: string;
}

const TabIcon = ({ focused, iconName, color }: TabIconProps) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Ionicons name={iconName as any} size={24} color={color} />
        {focused && <View style={styles.activeIndicator} />}
    </View>
);

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#94A3B8',
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarIcon: ({ focused, color }) => {
                    let iconName: string;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Journey':
                            iconName = focused ? 'compass' : 'compass-outline';
                            break;
                        case 'Calendar':
                            iconName = focused ? 'calendar' : 'calendar-outline';
                            break;
                        case 'You':
                            iconName = focused ? 'person-circle' : 'person-circle-outline';
                            break;
                        default:
                            iconName = 'ellipse';
                    }

                    return <TabIcon focused={focused} iconName={iconName} color={color} />;
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
        height: Platform.OS === 'ios' ? 85 : 70,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        elevation: 0,
        shadowOpacity: 0,
    },
    tabItem: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 4,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 32,
    },
    iconContainerActive: {
        // Optional: Add a subtle background for active state
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
});
