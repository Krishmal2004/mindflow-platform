import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';

const MeditationSplash = require('../../assets/app-icon.png');
const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        textOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

        const checkFirstLaunch = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 3000));
                const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
                const alreadyLaunched = await AsyncStorage.getItem('alreadyLaunched');

                if (isLoggedIn === 'true') {
                    navigation.replace('MainTabs' as any);
                } else if (alreadyLaunched === null) {
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

    const imageStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20, { duration: 800 }) }],
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <Animated.View style={[styles.imageContainer, imageStyle]}>
                <Image
                    source={MeditationSplash}
                    style={styles.illustration}
                    resizeMode="contain"
                />
            </Animated.View>

            <Animated.View style={[styles.textContainer, textStyle]}>
                {/* <View style={styles.titleWrapper}>
                    <Text style={styles.titleThin}>Mind</Text>
                    <Text style={styles.titleBold}>Flow</Text>
                </View> */}
                <Text style={styles.subtitle}>Find your inner peace</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8', // Softer background
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: width * 0.4,
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    illustration: {
        width: '80%',
        height: '80%',
    },
    textContainer: {
        alignItems: 'center',
    },
    titleWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    titleThin: {
        fontSize: 42,
        fontWeight: '300',
        color: '#2D3436',
        letterSpacing: 2,
    },
    titleBold: {
        fontSize: 42,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#636E72',
        letterSpacing: 4,
        textTransform: 'uppercase',
        fontWeight: '500',
    },
});
