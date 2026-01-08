import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

interface RoadmapItemProps {
    title: string;
    subtitle?: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    isLocked?: boolean;
    index: number;
}

export const RoadmapItem: React.FC<RoadmapItemProps> = ({ title, subtitle, iconName, onPress, isLocked = false, index }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isLocked}
            style={styles.container}
        >
            <View style={styles.timelineContainer}>
                <View style={styles.line} />
                <View style={[styles.dot, isLocked && styles.lockedDot]}>
                    <Text style={styles.number}>{index + 1}</Text>
                </View>
            </View>

            <View style={[styles.card, isLocked && styles.lockedCard]}>
                <LinearGradient
                    colors={isLocked ? ['#f0f0f0', '#e0e0e0'] : ['#ffffff', '#fcfbf9']}
                    style={styles.gradient}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={isLocked ? 'lock-closed' : iconName}
                            size={24}
                            color={isLocked ? '#999' : Colors.secondary} // Soft Teal
                        />
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.title, isLocked && styles.lockedText]}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {!isLocked && (
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} /> // Mist Blue
                    )}
                </LinearGradient>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 24, // Increased spacing
        paddingHorizontal: 24,
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 20,
        width: 30,
    },
    line: {
        position: 'absolute',
        top: 0,
        bottom: -24,
        width: 2,
        backgroundColor: '#E0E0E0', // Lighter, subtle line
        zIndex: -1,
        borderRadius: 1,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.background, // Dot matches background
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primary, // Sage Green Border
        zIndex: 1,
    },
    lockedDot: {
        borderColor: '#ccc',
    },
    number: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    card: {
        flex: 1,
        borderRadius: 20, // Softer corners
        backgroundColor: Colors.surface,
        shadowColor: Colors.textPrimary,
        shadowOffset: { width: 0, height: 8 }, // Deeper shadow
        shadowOpacity: 0.04, // Very subtle opacity
        shadowRadius: 16, // Wide blur
        elevation: 6,
        marginBottom: 4, // Space for shadow
    },
    lockedCard: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20, // More padding
        borderRadius: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(136, 176, 75, 0.1)', // Very faint Sage
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 17, // Slightly larger
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    lockedText: {
        color: '#999',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '400',
    },
});
