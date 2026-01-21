import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop, Ellipse, Rect } from 'react-native-svg';

import { Colors } from '../../constants/colors';
import { API_URL } from '../../config/api';
import { VoiceRecordingIllustration } from '../../components/MeditationIllustration';

const { width, height: screenHeight } = Dimensions.get('window');

// The passage to read aloud
const PASSAGE_TEXT = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";

// Custom Popup Modal Component
interface PopupModalProps {
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    onClose: () => void;
    onConfirm?: () => void;
}

const PopupModal = ({ visible, type, title, message, buttonText = 'OK', onClose, onConfirm }: PopupModalProps) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', color: '#10B981', bgColor: '#D1FAE5' };
            case 'error':
                return { icon: 'close-circle', color: '#EF4444', bgColor: '#FEE2E2' };
            case 'warning':
                return { icon: 'warning', color: '#F59E0B', bgColor: '#FEF3C7' };
            case 'info':
            default:
                return { icon: 'information-circle', color: '#8B5CF6', bgColor: '#EDE9FE' };
        }
    };

    const { icon, color, bgColor } = getIconAndColors();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={popupStyles.overlay}>
                <Animated.View style={[popupStyles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon Circle */}
                    <View style={[popupStyles.iconCircle, { backgroundColor: bgColor }]}>
                        <Ionicons name={icon as any} size={48} color={color} />
                    </View>

                    {/* Title */}
                    <Text style={popupStyles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={popupStyles.message}>{message}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={[popupStyles.button, { backgroundColor: color }]}
                        onPress={() => {
                            onClose();
                            if (onConfirm) onConfirm();
                        }}
                    >
                        <Text style={popupStyles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const popupStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});



export default function WeeklyWhispersScreen() {
    const navigation = useNavigation();

    // Screen state
    const [currentStep, setCurrentStep] = useState<'intro' | 'recording'>('intro');

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Popup Modal state
    const [popup, setPopup] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, type: 'info', title: '', message: '' });

    const showPopup = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setPopup({ visible: true, type, title, message, onConfirm });
    };

    const hidePopup = () => {
        setPopup(prev => ({ ...prev, visible: false }));
    };

    // Refs
    const recordingRef = useRef<Audio.Recording | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Animation
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkPermissionAndStatus();
    }, []);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [isRecording]);

    const checkPermissionAndStatus = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            setPermissionGranted(status === 'granted');

            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/api/roadmap/weekly/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.submitted) {
                    setAlreadySubmitted(true);
                }
            }
        } catch (error) {
            console.log('Status check failed');
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            if (!permissionGranted) {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    showPopup('warning', 'Permission Required', 'Microphone permission is needed to record your voice.');
                    return;
                }
                setPermissionGranted(true);
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            setIsRecording(true);
            setRecordingDuration(0);

            intervalRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    // Auto-stop at 30 seconds (max duration)
                    if (newDuration >= 30) {
                        stopRecordingAutoMax();
                    }
                    return newDuration;
                });
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording', err);
            showPopup('error', 'Recording Error', 'Failed to start recording. Please try again.');
        }
    };

    // Auto-stop at max duration (30 seconds) - always goes to review
    const stopRecordingAutoMax = async () => {
        if (!recordingRef.current) return;

        try {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();

            if (uri) {
                // At 30 seconds, it's always valid - go directly to review
                setRecordingUri(uri);
                setRecordingDuration(30);
            }

            setIsRecording(false);
        } catch (err) {
            console.error('Failed to stop recording', err);
            setIsRecording(false);
        } finally {
            recordingRef.current = null;
        }
    };

    // Manual stop - checks minimum duration
    const stopRecording = async () => {
        if (!recordingRef.current) return;

        try {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();

            if (uri) {
                if (recordingDuration < 15) {
                    showPopup('warning', 'Too Short!', 'Your recording must be at least 15 seconds. Please try again.');
                    setRecordingDuration(0);
                } else {
                    setRecordingUri(uri);
                }
            }

            setIsRecording(false);
        } catch (err) {
            console.error('Failed to stop recording', err);
            setIsRecording(false);
        } finally {
            recordingRef.current = null;
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleRetry = () => {
        setRecordingUri(null);
        setRecordingDuration(0);
    };

    const handleSubmit = async () => {
        if (!recordingUri) return;

        setUploading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');

            const response = await fetch(`${API_URL}/api/roadmap/weekly`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    duration: recordingDuration,
                })
            });

            if (!response.ok) {
                throw new Error('Submission failed');
            }

            showPopup('success', 'Success!', 'Your voice recording has been submitted successfully.', () => {
                navigation.goBack();
            });

        } catch (error: any) {
            showPopup('error', 'Submission Failed', error.message || 'Failed to submit. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (alreadySubmitted) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Weekly Whispers</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#8B5CF6" />
                    </View>
                    <Text style={styles.successTitle}>Already Submitted!</Text>
                    <Text style={styles.successText}>You've completed this week's recording.</Text>
                    <Text style={styles.successText}>Come back next week!</Text>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.homeButtonText}>Back to Journey</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // INTRO SCREEN
    if (currentStep === 'intro') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <PopupModal
                    visible={popup.visible}
                    type={popup.type}
                    title={popup.title}
                    message={popup.message}
                    onClose={hidePopup}
                    onConfirm={popup.onConfirm}
                />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Weekly Whispers</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.introContent}>
                    {/* Large SVG Illustration */}
                    <View style={styles.illustrationContainer}>
                        <VoiceRecordingIllustration width={width * 0.75} height={width * 0.75} />
                    </View>

                    {/* Title and Description */}
                    <Text style={styles.introTitle}>Voice Recording</Text>
                    <Text style={styles.introSubtitle}>Vocal Biomarker Capture</Text>

                    <View style={styles.introCard}>
                        <View style={styles.introIconRow}>
                            <View style={styles.introIconCircle}>
                                <Ionicons name="mic" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.introCardTitle}>What You'll Do</Text>
                        </View>
                        <Text style={styles.introCardText}>
                            Read a short paragraph aloud in your normal speaking voice. This helps us understand your vocal patterns for research purposes.
                        </Text>

                        <View style={styles.infoBadges}>
                            <View style={styles.badge}>
                                <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                                <Text style={styles.badgeText}>15-30 sec</Text>
                            </View>
                            <View style={styles.badge}>
                                <Ionicons name="book-outline" size={16} color="#8B5CF6" />
                                <Text style={styles.badgeText}>Read Aloud</Text>
                            </View>
                        </View>
                    </View>

                    {/* Go Button */}
                    <TouchableOpacity
                        style={styles.goButton}
                        onPress={() => setCurrentStep('recording')}
                    >
                        <Text style={styles.goButtonText}>Let's Go</Text>
                        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // RECORDING SCREEN
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <PopupModal
                visible={popup.visible}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onClose={hidePopup}
                onConfirm={popup.onConfirm}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => setCurrentStep('intro')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Record</Text>
                <View style={{ width: 40 }} />
            </View>

            {!recordingUri ? (
                <View style={styles.recordingScreenContainer}>
                    {/* Fixed Top Section: SVG + Recording Controls */}
                    <View style={styles.fixedTopSection}>
                        {/* Large SVG Illustration */}
                        <VoiceRecordingIllustration width={width * 0.5} height={width * 0.5} />

                        {/* Timer */}
                        <Text style={[styles.timerText, isRecording && styles.timerRecording]}>
                            {formatTime(recordingDuration)}
                        </Text>

                        {/* Record Button */}
                        <TouchableOpacity
                            onPress={handleToggleRecording}
                            activeOpacity={0.8}
                            style={styles.recordButtonContainer}
                        >
                            <View style={[styles.recordButton, isRecording && styles.recordButtonActive]}>
                                <Ionicons
                                    name={isRecording ? "stop" : "mic"}
                                    size={32}
                                    color="#FFFFFF"
                                />
                            </View>
                        </TouchableOpacity>

                        <Text style={[styles.statusText, isRecording && styles.statusRecording]}>
                            {isRecording ? 'Tap to Stop' : 'Tap to Start'}
                        </Text>

                        {!isRecording && (
                            <Text style={styles.hintText}>15-30 seconds</Text>
                        )}

                        {isRecording && (
                            <View style={styles.recordingIndicator}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.recordingText}>Recording...</Text>
                            </View>
                        )}
                    </View>

                    {/* Scrollable Passage Section */}
                    <View style={styles.passageSection}>
                        <View style={styles.passageHeader}>
                            <Ionicons name="book-outline" size={18} color="#8B5CF6" />
                            <Text style={styles.passageLabel}>READ ALOUD</Text>
                        </View>
                        <ScrollView
                            style={styles.passageScrollView}
                            showsVerticalScrollIndicator={true}
                        >
                            <Text style={styles.passageText}>{PASSAGE_TEXT}</Text>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            ) : (
                <View style={styles.reviewContainer}>
                    <View style={styles.reviewCard}>
                        <View style={styles.reviewIconCircle}>
                            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                        </View>
                        <Text style={styles.reviewTitle}>Recording Complete!</Text>

                        <View style={styles.waveformContainer}>
                            {[16, 24, 32, 20, 40, 28, 18, 36, 22, 30].map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h }]} />
                            ))}
                        </View>

                        <Text style={styles.reviewDuration}>Duration: {formatTime(recordingDuration)}</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                                <Ionicons name="refresh" size={20} color="#8B5CF6" />
                                <Text style={styles.retryButtonText}>Retake</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.submitButtonText}>Submit</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    // Intro Screen
    introContent: {
        padding: 24,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 24,
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    introSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    introIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    introCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    introCardText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 16,
    },
    infoBadges: {
        flexDirection: 'row',
        gap: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8B5CF6',
    },
    goButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#8B5CF6',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    goButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Recording Screen
    recordingScreenContainer: {
        flex: 1,
    },
    fixedTopSection: {
        alignItems: 'center',
        paddingTop: 16,
        paddingHorizontal: 20,
        backgroundColor: '#F8FAFC',
    },
    timerText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#8B5CF6',
        marginTop: 8,
    },
    timerRecording: {
        color: '#EF4444',
    },
    recordButtonContainer: {
        marginTop: 16,
        marginBottom: 12,
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    recordButtonActive: {
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    statusRecording: {
        color: '#EF4444',
    },
    hintText: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 4,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        marginRight: 8,
    },
    recordingText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    // Passage Section
    passageSection: {
        flex: 1,
        marginTop: 16,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    passageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    passageLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8B5CF6',
        marginLeft: 8,
        letterSpacing: 1,
    },
    passageScrollView: {
        flex: 1,
    },
    passageText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 28,
    },
    // Review Screen
    reviewContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    reviewIconCircle: {
        marginBottom: 16,
    },
    reviewTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 24,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        marginBottom: 16,
        width: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    waveBar: {
        width: 6,
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
        marginHorizontal: 3,
        opacity: 0.7,
    },
    reviewDuration: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#EDE9FE',
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Success screen
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    successText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    homeButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        marginTop: 32,
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
