import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

const QUOTES = [
    "Breathe in calm, breathe out stress.",
    "This moment is the only moment.",
    "Peace comes from within.",
    "You are exactly where you need to be.",
    "Focus on the present.",
];

export const DailyQuote = () => {
    // Ideally fetch from an API or rotate daily. For now, random or static.
    const quote = QUOTES[0];

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Daily Focus</Text>
            <Text style={styles.quote}>"{quote}"</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    quote: {
        fontSize: 24,
        fontWeight: '300', // Light font for "Calm" feel
        color: Colors.textPrimary,
        fontStyle: 'italic',
        lineHeight: 32,
    },
});
