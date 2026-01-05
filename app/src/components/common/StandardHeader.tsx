import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Icons } from './AppIcons';

interface StandardHeaderProps {
    title: string;
    onBack?: () => void;
    rightContent?: React.ReactNode;
    subtitle?: string;
}

export default function StandardHeader({
    title,
    onBack,
    rightContent,
    subtitle
}: StandardHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Icons.Back />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    )}
                </View>

                {/* Right side spacer or content */}
                <View style={styles.rightContent}>
                    {rightContent ? rightContent : <View style={{ width: 40 }} />}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 16,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    rightContent: {
        minWidth: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
