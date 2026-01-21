import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';

const AppLogo = require('../../assets/app-icon.png');

export default function SplashScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 1500 });
        scale.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) });

        const checkFirstLaunch = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 2500));
                const value = await AsyncStorage.getItem('alreadyLaunched');
                if (value === null) {
                    navigation.replace('Onboarding');
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                navigation.replace('Login');
            }
        };

        checkFirstLaunch();
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Animated.View style={[styles.content, animatedStyle]}>
                <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
                <View style={styles.titleContainer}>
                    <Text style={styles.titleThin}>Mind</Text>
                    <Text style={styles.titleBold}>Flow</Text>
                </View>
                <Text style={styles.subtitle}>Find your inner peace</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // Light Theme
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    titleThin: {
        fontSize: 48,
        fontWeight: '300',
        color: Colors.textPrimary,
        letterSpacing: 2,
    },
    titleBold: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
});
