import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    SlideInUp,
    SlideOutUp,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export type NotificationType = 'success' | 'error';

interface NotificationProps {
    type: NotificationType;
    message: string;
    visible: boolean;
    onHide: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ type, message, visible, onHide }) => {
    const translateY = useSharedValue(-100);

    useEffect(() => {
        if (visible) {
            // Calm entry: fade in
            translateY.value = withTiming(Platform.OS === 'ios' ? 50 : 20, { duration: 400 });
            const timer = setTimeout(() => {
                // Calm exit: fade out (move up slowly while fading)
                translateY.value = withTiming(-100, { duration: 600 }, () => {
                    runOnJS(onHide)();
                });
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            translateY.value = withTiming(-100, { duration: 300 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: withTiming(visible ? 1 : 0),
        };
    });

    // Muted Blue-Green Palette
    // Success: Sage Green (#8faea3)
    // Error: Muted Red/Pink
    const backgroundColor = type === 'success' ? Colors.success : Colors.error;
    const iconName = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';

    return (
        <Animated.View style={[styles.container, animatedStyle, { backgroundColor }]}>
            <Ionicons name={iconName} size={24} color={Colors.surface} style={styles.icon} />
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
        width: width - 40,
        alignSelf: 'center',
    },
    icon: {
        marginRight: 12,
    },
    message: {
        color: Colors.surface, // Sand White text
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
});
