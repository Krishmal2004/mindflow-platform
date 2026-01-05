import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface AppCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    noPadding?: boolean;
}

export default function AppCard({ children, style, noPadding = false }: AppCardProps) {
    return (
        <View style={[styles.card, noPadding && { padding: 0 }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
});
