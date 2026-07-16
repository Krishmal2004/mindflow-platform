import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../constants/colors';

// Global "you're offline" blocker, mounted once at the app root. Every screen's data
// comes from the backend (no offline cache/sync), so rather than let each screen fail
// silently or show a generic error, surface one consistent modal the moment connectivity
// drops and dismiss it automatically the moment it's back.
export function OfflineNotice() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            // isInternetReachable is `null` for a moment right after a network change
            // (e.g. switching Wi-Fi <-> mobile data) while NetInfo is still probing —
            // only treat that as offline once isConnected itself is false, not during
            // that transient unknown state, so the modal doesn't flash on every handoff.
            const offline = state.isConnected === false
                || (state.isConnected === true && state.isInternetReachable === false);
            setIsOffline(offline);
        });
        return () => unsubscribe();
    }, []);

    return (
        <Modal visible={isOffline} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Ionicons name="cloud-offline-outline" size={40} color={Colors.error} />
                    <Text style={styles.title}>You&apos;re Offline</Text>
                    <Text style={styles.message}>
                        Check your Wi-Fi or mobile data connection. MindFlow needs internet access to load and save your data.
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 12,
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
