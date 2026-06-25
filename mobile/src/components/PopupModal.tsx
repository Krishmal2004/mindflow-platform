import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PopupModalProps {
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    onClose: () => void;
    onConfirm?: () => void;
}

export const PopupModal = ({ visible, type, title, message, buttonText = 'OK', onClose, onConfirm }: PopupModalProps) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', color: Colors.primary, bgColor: '#E6F4EA' };
            case 'error':
                return { icon: 'close-circle', color: '#EF4444', bgColor: '#FEE2E2' };
            case 'warning':
                return { icon: 'warning', color: '#F59E0B', bgColor: '#FEF3C7' };
            case 'info':
            default:
                return { icon: 'information-circle', color: '#8B5CF6', bgColor: '#EDE9FE' };
        }
    };

    const { icon, color, bgColor } = getIconAndColors();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={popupStyles.overlay}>
                <Animated.View style={[popupStyles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon Circle */}
                    <View style={[popupStyles.iconCircle, { backgroundColor: bgColor }]}>
                        <Ionicons name={icon as any} size={48} color={color} />
                    </View>

                    {/* Title */}
                    <Text style={popupStyles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={popupStyles.message}>{message}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={[popupStyles.button, { backgroundColor: color }]}
                        onPress={() => {
                            onClose();
                            if (onConfirm) onConfirm();
                        }}
                    >
                        <Text style={popupStyles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const popupStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
