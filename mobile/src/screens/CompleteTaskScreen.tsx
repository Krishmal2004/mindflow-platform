import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

type CompleteTaskRouteProp = RouteProp<RootStackParamList, 'CompleteTask'>;

export default function CompleteTaskScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<CompleteTaskRouteProp>();

    const { title, message, buttonText = "Back to Journey", isDaily } = route.params;

    // Entrance Animations
    const fadeAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(0.8);
    const slideAnim = useSharedValue(24);

    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
        scaleAnim.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.5)) });
        slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ scale: scaleAnim.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateY: slideAnim.value }],
    }));

    // Choose theme colors dynamically
    const themeColor = isDaily ? '#D97706' : Colors.primary;
    const themeBgGrad = isDaily
        ? ['#FFFBEB', '#FFF9F0', '#FFFFFF'] as const
        : ['#E6F4EA', '#F1F7F3', '#FFFFFF'] as const;

    return (
        <LinearGradient
            colors={themeBgGrad}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar style="dark" />

            {/* Background Decoration */}
            <View style={styles.decorationContainer}>
                <LeavesDecoration width={width} height={width * 0.8} color={themeColor} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Animated.View style={[styles.successIcon, { shadowColor: themeColor }, animatedIconStyle]}>
                        <Ionicons name="checkmark-circle" size={80} color={themeColor} />
                    </Animated.View>
                    <Animated.View style={[styles.textCenter, animatedContentStyle]}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </Animated.View>
                </View>

                <Animated.View style={[{ width: '100%' }, animatedContentStyle]}>
                    <TouchableOpacity
                        style={[styles.homeButton, { backgroundColor: themeColor, shadowColor: themeColor }]}
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.homeButtonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    decorationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    scrollContent: {
        paddingTop: 100,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    textCenter: {
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: '#FFF',
        borderRadius: 50,
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    homeButton: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        width: '100%',
        alignItems: 'center',
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
