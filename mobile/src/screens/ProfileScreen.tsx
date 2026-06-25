import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { API_URL } from '../config/api';
import { apiFetch, clearAuthStorage } from '../lib/apiClient';
import { PopupModal } from '../components/PopupModal';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

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
            const { ok, data } = await apiFetch<{ username: string; research_id: string | null; email: string | null }>('/api/profile');
            if (ok && data) setProfileData(data);
        } catch (error) {
            console.log('Error fetching profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await clearAuthStorage();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch {
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
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width} />

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
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E6F4EA' }]}>
                                <Ionicons name="lock-closed-outline" size={24} color={Colors.primary} />
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
                                activeOpacity={0.7}
                            >
                                <Text style={styles.alertCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.alertConfirm}
                                onPress={handleSignOut}
                                activeOpacity={0.7}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9',
    },
    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F8F9',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#636E72',
    },
    content: {
        paddingTop: 20,
        paddingBottom: 120,
    },
    profileCard: {
        marginHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 3,
        borderColor: '#C2E7CD',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D3436',
    },
    userEmail: {
        fontSize: 14,
        color: Colors.primary,
        marginTop: 4,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
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
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#2D3436',
        fontWeight: '700',
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
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
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
    },
    actionSubtext: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    dangerButton: {
        marginTop: 0,
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
    },
    dangerText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },
    dangerSubText: {
        fontSize: 12,
        color: '#F87171',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 28,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
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
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 15,
        color: '#636E72',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
        fontWeight: '500',
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
        borderRadius: 30,
        alignItems: 'center',
    },
    alertCancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#636E72',
    },
    alertConfirm: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#EF4444',
        borderRadius: 30,
        alignItems: 'center',
    },
    alertConfirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
