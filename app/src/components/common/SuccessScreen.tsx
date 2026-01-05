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
        padding: 20,
        backgroundColor: '#F8FDFC', // Ensure background matches app theme
    },
    contentContainer: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    celebrationEmoji: {
        fontSize: 72,
        marginBottom: 24,
    },
    completionTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    textContainer: {
        marginBottom: 8,
        alignItems: 'center',
    },
    completionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
        fontWeight: '500',
    },
    happyEmoji: {
        fontSize: 48,
        marginTop: 24,
        marginBottom: 32,
    },
    startButton: {
        backgroundColor: '#2E8A66',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 20,
        shadowColor: '#2E8A66',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        width: '80%',
        alignItems: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
