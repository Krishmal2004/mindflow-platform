import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { cardShadow, cardShadowElevated } from '../styles/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { apiFetch, clearAuthStorage } from '../lib/apiClient';

// Component
export default function ProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<{
        username: string; research_id: string | null; email: string | null;
    } | null>(null);

    // Modals
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    // Data
    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const fetchProfile = async () => {
        try {
            const { ok, data } = await apiFetch<{
                username: string; research_id: string | null; email: string | null;
            }>('/api/profile');
            if (ok && data) setProfileData(data);
        } catch (e) {
            console.log('Error fetching profile', e);
        } finally {
            setLoading(false);
        }
    };

    // Sign-out
    const handleSignOut = async () => {
        try {
            await clearAuthStorage();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch {
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScreenHeader title="My Account" subtitle="Manage your profile & security" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Profile Hero */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={50} color={Colors.primary} />
                    </View>
                    <Text style={styles.userName}>{profileData?.username || 'Mindful User'}</Text>
                    <Text style={styles.userEmail}>{profileData?.email || 'No email on file'}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="person-outline" size={20} color={Colors.iconMuted} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoValue}>{profileData?.username || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="id-card-outline" size={20} color={Colors.iconMuted} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Research ID</Text>
                                {profileData?.research_id ? (
                                    <Text style={styles.infoValue}>{profileData.research_id}</Text>
                                ) : (
                                    <View style={styles.pendingRow}>
                                        <Ionicons name="time-outline" size={13} color="#D97706" />
                                        <Text style={styles.pendingText}>Researchers will add you shortly</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={20} color={Colors.iconMuted} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{profileData?.email || 'Not set'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionButton, { marginTop: 16 }]}
                        onPress={() => navigation.navigate('AboutMe')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E6F4EA' }]}>
                                <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.actionText}>About Me Questionnaire</Text>
                                <Text style={styles.actionSubtext}>View or update your details</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.iconMuted} />
                    </TouchableOpacity>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { marginBottom: 12 }]}
                        onPress={() => navigation.navigate('ForgotPassword', { email: profileData?.email ?? '', locked: true })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E6F4EA' }]}>
                                <Ionicons name="lock-closed-outline" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.actionText}>Reset Password</Text>
                                <Text style={styles.actionSubtext}>Verify via a one-time code</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.iconMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={() => setShowSignOutModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                            </View>
                            <View>
                                <Text style={styles.dangerText}>Sign Out from Device</Text>
                                <Text style={styles.dangerSubText}>Log out safely</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Sign Out Modal ── */}
            <Modal visible={showSignOutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertModal}>
                        <View style={styles.alertIconCircle}>
                            <Ionicons name="log-out" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Sign Out?</Text>
                        <Text style={styles.alertMessage}>You will need to log in again to access your account.</Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity style={styles.alertCancel} onPress={() => setShowSignOutModal(false)} activeOpacity={0.7}>
                                <Text style={styles.alertCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.alertConfirm} onPress={handleSignOut} activeOpacity={0.7}>
                                <Text style={styles.alertConfirmText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    content: { paddingTop: 20, paddingBottom: 120 },

    profileCard: {
        marginHorizontal: 24, backgroundColor: Colors.surface, borderRadius: 30,
        paddingVertical: 28, alignItems: 'center',
        ...cardShadowElevated, marginBottom: 8,
    },
    avatarCircle: {
        width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primaryTint,
        justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 3, borderColor: '#C2E7CD',
    },
    userName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
    userEmail: { fontSize: 14, color: Colors.primary, marginTop: 4, fontWeight: '600' },

    section: { marginTop: 24, paddingHorizontal: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 4 },

    infoCard: {
        backgroundColor: Colors.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8,
        ...cardShadow,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.surfaceMuted },
    infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    pendingText: { fontSize: 13, color: '#D97706', fontWeight: '600', fontStyle: 'italic' },

    actionButton: {
        backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 24,
        ...cardShadow,
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    actionSubtext: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    dangerButton: { marginTop: 0, borderWidth: 1.5, borderColor: '#FEE2E2' },
    dangerText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
    dangerSubText: { fontSize: 12, color: '#F87171', marginTop: 2 },

    // Sign-out modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    alertModal: {
        backgroundColor: Colors.surface, borderRadius: 30, padding: 28, width: '85%', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    },
    alertIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    alertTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
    alertMessage: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22, fontWeight: '500' },
    alertActions: { flexDirection: 'row', gap: 12, width: '100%' },
    alertCancel: { flex: 1, paddingVertical: 16, backgroundColor: Colors.surfaceMuted, borderRadius: 30, alignItems: 'center' },
    alertCancelText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
    alertConfirm: { flex: 1, paddingVertical: 16, backgroundColor: '#EF4444', borderRadius: 30, alignItems: 'center' },
    alertConfirmText: { fontSize: 16, fontWeight: '700', color: Colors.surface },
});
