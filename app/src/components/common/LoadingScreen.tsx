import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import StandardHeader from './StandardHeader';

interface LoadingScreenProps {
    title?: string;
    message?: string;
    onBack?: () => void;
}

export default function LoadingScreen({
    title = "Loading...",
    message = "Please wait...",
    onBack
}: LoadingScreenProps) {
    return (
        <View style={styles.container}>
            {title && <StandardHeader title={title} onBack={onBack} />}
            <View style={styles.content}>
                <ActivityIndicator size="large" color="#2E8A66" />
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FDFC',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});
