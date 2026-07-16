import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    // When provided, renders the back-button variant for a pushed screen
    // (About Me, and the roadmap detail screens) instead of the tab-screen variant.
    onBack?: () => void;
}

// Shared header for the Dashboard/Journey/Calendar/Profile tab screens and pushed
// screens like About Me — replaces the near-identical title+subtitle block that
// used to be copy-pasted (with drifting styles) into each screen individually.
export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
    if (onBack) {
        // Mirrors the roadmap screens' (e.g. Mindful Mirror) header: a floating white
        // circular back button with a soft shadow, title sitting next to it rather
        // than centered — no card background, divider line, or color accent.
        return (
            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.backHeader}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={styles.backButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.backTitleBlock}>
                        <Text style={styles.backTitle}>{title}</Text>
                        {subtitle ? <Text style={styles.backSubtitle}>{subtitle}</Text> : null}
                    </View>
                    <View style={styles.backSpacer} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Tab-screen variant
    container: { paddingVertical: 12, paddingHorizontal: 24 },
    title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: 15, color: Colors.textSecondary },

    // Back-button (pushed-screen) variant
    backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backButton: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.surface,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    backTitleBlock: { alignItems: 'flex-start' },
    backTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
    backSubtitle: { fontSize: 11, color: Colors.iconMuted, fontWeight: '500', letterSpacing: 0.5, marginTop: 2 },
    backSpacer: { width: 40 },
});
