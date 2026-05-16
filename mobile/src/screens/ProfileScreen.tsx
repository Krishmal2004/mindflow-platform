import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { API_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import { PopupModal } from '../components/PopupModal'; // Import PopupModal

const DASHBOARD_GRADIENT: [string, string, string] = ['#F0FDF4', '#F8FAFC', '#FFFFFF'];

export default function ProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<{ username: string; research_id: string | null; email: string | null } | null>(null);

    // Modal states
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const getAuthToken = async () => {
        return await AsyncStorage.getItem('authToken');
    };

    const fetchProfile = async () => {
        try {
            // setLoading(true); // Don't block UI on regain focus every time
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            }
        } catch (error) {
            console.log('Error fetching profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            // Navigate to Auth
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const handleResetPassword = async () => {
        if (!profileData?.email) {
            Alert.alert("Error", "No email address found for this account.");
            return;
        }

        try {
            setResettingPassword(true);
            const token = await getAuthToken();
            // Note: calling auth/reset-password. This endpoint should exist on backend or be proxied.
            // Using the backend route we just created: /api/auth/reset-password (which is mapped in main app, check if it's under /api/auth or just /auth)
            // Usually auth routes are at /api/auth or similar. Let's assume /api/auth based on standard practices, 
            // but need to verify main server file. Assuming /api/auth for now.
            // Wait, previous calls use `${API_URL}/api/profile`. 
            // In `backend/src/app.ts` (not seen yet), likely routes are mounted. 
            // If I look at `authRoutes.ts`, it has `/signup`, `/login`.
            // Usually mounted at `/api/auth`. I'll try that.

            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: profileData.email })
            });

            const data = await response.json();

            if (response.ok) {
                setShowResetSuccessModal(true);
            } else {
                throw new Error(data.error || 'Failed to send reset email');
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setResettingPassword(false);
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
        <LinearGradient
            colors={DASHBOARD_GRADIENT}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>My Account</Text>
                    <Text style={styles.subtitle}>Manage your profile & security</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Profile Hero */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={50} color="#10B981" />
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
                                <Ionicons name="person-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoValue}>{profileData?.username || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="id-card-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Research ID</Text>
                                <Text style={styles.infoValue}>{profileData?.research_id || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{profileData?.email || 'Not set'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Link to About Me */}
                    <TouchableOpacity
                        style={[styles.actionButton, { marginTop: 16 }]}
                        onPress={() => navigation.navigate('AboutMe')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                                <Ionicons name="document-text-outline" size={24} color="#0EA5E9" />
                            </View>
                            <View>
                                <Text style={styles.actionText}>About Me Questionnaire</Text>
                                <Text style={styles.actionSubtext}>View or update your details</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { marginBottom: 12 }]}
                        onPress={handleResetPassword}
                        disabled={resettingPassword}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}>
                                <Ionicons name="lock-closed-outline" size={24} color="#0EA5E9" />
                            </View>
                            <View>
                                <Text style={styles.actionText}>Reset Password</Text>
                                <Text style={styles.actionSubtext}>Receive a link to update password</Text>
                            </View>
                        </View>
                        {resettingPassword ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color="#64748B" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={() => setShowSignOutModal(true)}
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

            {/* Sign Out Modal */}
            <Modal visible={showSignOutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertModal}>
                        <View style={styles.alertIconCircle}>
                            <Ionicons name="log-out" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Sign Out?</Text>
                        <Text style={styles.alertMessage}>You will need to log in again to access your account.</Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={styles.alertCancel}
                                onPress={() => setShowSignOutModal(false)}
                            >
                                <Text style={styles.alertCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.alertConfirm}
                                onPress={handleSignOut}
                            >
                                <Text style={styles.alertConfirmText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reset Password Success Modal */}
            <PopupModal
                visible={showResetSuccessModal}
                type="success"
                title="Check your Email"
                message={`We've sent a password reset link to ${profileData?.email}. Please check your inbox.`}
                buttonText="OK"
                onClose={() => setShowResetSuccessModal(false)}
            />
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background handled by LinearGradient
    },
    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    gradientHeader: {
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingVertical: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    content: {
        paddingTop: 24,
        paddingBottom: 120, // Increased to avoid Nav Bar overlap
    },
    profileCard: {
        marginHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1FDF9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#E8F5F1',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    userEmail: {
        fontSize: 14,
        color: '#10B981',
        marginTop: 2,
        fontWeight: '500',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    actionSubtext: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    dangerButton: {
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#FEF2F2',
    },
    dangerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    dangerSubText: {
        fontSize: 12,
        color: '#F87171',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 32,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
    },
    alertIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    alertTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertCancel: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        alignItems: 'center',
    },
    alertCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    alertConfirm: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#EF4444',
        borderRadius: 14,
        alignItems: 'center',
    },
    alertConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
