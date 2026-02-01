import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { API_URL } from '../config/api';

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

        const validateSession = async () => {
            try {
                // Minimum splash time
                await new Promise(resolve => setTimeout(resolve, 2000));

                const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
                const token = await AsyncStorage.getItem('authToken');
                const alreadyLaunched = await AsyncStorage.getItem('alreadyLaunched');

                if (isLoggedIn === 'true' && token) {
                    // VERIFY TOKEN WITH BACKEND
                    try {
                        const response = await fetch(`${API_URL}/api/profile`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (response.ok) {
                            // Token is valid, proceed
                            navigation.replace('MainTabs' as any);
                        } else {
                            // Token expired or invalid
                            console.log("Session expired, directing to login");
                            await AsyncStorage.multiRemove(['isLoggedIn', 'authToken', 'user']);
                            navigation.replace('Login');
                        }
                    } catch (netError) {
                        // If network error, we might want to let them in (offline mode) or block.
                        // For now, assuming standard online-first app, we'll let them in if we think we have a token,
                        // OR safer: redirect to login if we can't verify.
                        // Given the user issue "not connected to DB", it's better to force verification or handle offline gracefully.
                        // Let's assume strict verification for fixing the "issue".
                        console.log("Network error verifying session", netError);
                        // Optional: Navigate to MainTabs but show offline banner?
                        // For this specific fix request "keeping the session... not connected", forcing re-login on fail is safer.
                        navigation.replace('Login');
                    }
                } else if (alreadyLaunched === null) {
                    navigation.replace('Onboarding');
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                console.error("Splash Error", error);
                navigation.replace('Login');
            }
        };

        validateSession();
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
