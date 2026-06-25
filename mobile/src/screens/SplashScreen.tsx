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
import { getPostAuthRoute } from '../lib/postAuthRoute';


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
                    try {
                        const response = await fetch(`${API_URL}/api/profile`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (response.ok) {
                            const route = await getPostAuthRoute();
                            navigation.replace(route);
                        } else {
                            console.log("Session expired, directing to login");
                            await AsyncStorage.multiRemove(['isLoggedIn', 'authToken', 'user']);
                            navigation.replace('Login');
                        }
                    } catch (netError) {
                        console.log("Network error verifying session", netError);
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
                <View style={styles.titleWrapper}>
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
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    imageContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: 200,
        height: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 4,
        zIndex: 1,  
    },
    illustration: {
        width: '65%',
        height: '65%',
    },
    textContainer: {
        alignItems: 'center',
        zIndex: 1,
    },
    titleWrapper: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    titleThin: {
        fontSize: 36,
        fontWeight: '300',
        color: '#2D3436',
        letterSpacing: 1,
    },
    titleBold: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 13,
        color: '#636E72',
        letterSpacing: 3,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
});
