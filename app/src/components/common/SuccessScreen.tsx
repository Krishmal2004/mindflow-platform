import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SuccessScreenProps {
    title: string;
    subtitle?: string | string[];
    buttonText?: string;
    onPressHome: () => void;
}

export default function SuccessScreen({
    title,
    subtitle,
    buttonText = "Go to Dashboard",
    onPressHome
}: SuccessScreenProps) {

    const renderSubtitle = () => {
        if (!subtitle) return null;
        if (Array.isArray(subtitle)) {
            return subtitle.map((line, index) => (
                <Text key={index} style={styles.completionText}>{line}</Text>
            ));
        }
        return <Text style={styles.completionText}>{subtitle}</Text>;
    };

    return (
        <View style={styles.completionContainer}>
            <Animated.View entering={ZoomIn.duration(600)} style={styles.contentContainer}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <Text style={styles.completionTitle}>{title}</Text>

                <View style={styles.textContainer}>
                    {renderSubtitle()}
                </View>

                <Text style={styles.happyEmoji}>😊</Text>

                <TouchableOpacity
                    style={styles.startButton}
                    onPress={onPressHome}
                    accessibilityLabel={buttonText}
                    activeOpacity={0.8}
                >
                    <Text style={styles.startButtonText}>{buttonText}</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    completionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FDFC',
    },
    contentContainer: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
    },
    celebrationEmoji: {
        fontSize: 56,
        marginBottom: 16,
    },
    completionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    textContainer: {
        marginBottom: 8,
        alignItems: 'center',
    },
    completionText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 6,
        lineHeight: 22,
        fontWeight: '500',
    },
    happyEmoji: {
        fontSize: 36,
        marginTop: 16,
        marginBottom: 24,
    },
    startButton: {
        backgroundColor: '#2E8A66',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#2E8A66',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        width: '70%',
        alignItems: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
