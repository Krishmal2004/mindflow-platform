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
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop, Ellipse, Rect } from 'react-native-svg';

import { Colors as GlobalColors } from '../../constants/colors';
const Colors = {
    ...GlobalColors,
    primary: '#6366F1',
};
const THEME_BG = '#EEF2FF';
import { API_URL } from '../../config/api';
import { VoiceRecordingIllustration } from '../../components/MeditationIllustration';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { PopupModal } from '../../components/PopupModal';

const { width, height: screenHeight } = Dimensions.get('window');

// The passage to read aloud
const PASSAGE_TEXT = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";



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
    const [nextReset, setNextReset] = useState<Date | null>(null);
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
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(err => console.log('Cleanup error', err));
            }
        };
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
                if (data.completed || data.submitted) {
                    setAlreadySubmitted(true);
                    if (data.nextReset) setNextReset(new Date(data.nextReset));
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
                    // Auto-stop at 45 seconds (max duration)
                    if (newDuration >= 45) {
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

    // Auto-stop at max duration (45 seconds) - always goes to review
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
                // At 45 seconds, it's always valid - go directly to review
                setRecordingUri(uri);
                setRecordingDuration(45);
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
            if (!token) throw new Error('Not authenticated');

            // 1. Create FormData for file upload
            const formData = new FormData();
            const filename = recordingUri.split('/').pop() || 'recording.m4a';
            const fileType = filename.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';

            formData.append('file', {
                uri: recordingUri,
                name: filename,
                type: fileType,
            } as any);

            // 2. Upload Audio File
            const uploadResponse = await fetch(`${API_URL}/api/roadmap/weekly/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                console.error('Upload failed:', errorData);
                throw new Error(errorData.error || 'Audio upload failed');
            }

            const uploadResult = await uploadResponse.json();
            const { fileKey, fileUrl } = uploadResult;

            // 3. Submit Metadata
            const submitResponse = await fetch(`${API_URL}/api/roadmap/weekly`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    duration: recordingDuration,
                    file_key: fileKey,
                    file_url: fileUrl
                })
            });

            if (!submitResponse.ok) {
                const errorData = await submitResponse.json();
                throw new Error(errorData.error || 'Submission failed');
            }

            showPopup('success', 'Success!', 'Your voice recording has been submitted successfully.', () => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            { name: 'MainTabs' },
                            {
                                name: 'CompleteTask',
                                params: {
                                    title: 'Great Job!',
                                    message: 'Your voice recording has been submitted successfully. See you next week!',
                                    buttonText: 'Back to Journey'
                                }
                            }
                        ],
                    })
                );
            });

        } catch (error: any) {
            console.error('Submission processing error:', error);
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

                {/* Background leaves */}
                <LeavesDecoration width={width} height={width} color={Colors.primary} />

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Already Submitted!</Text>
                    <Text style={styles.successText}>You've completed this week's recording.</Text>
                    {nextReset && (
                        <Text style={[styles.successText, { marginTop: 8, fontWeight: '600', color: Colors.primary }]}>
                            Next reset: {nextReset.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    )}

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

                {/* Background leaves */}
                <LeavesDecoration width={width} height={width} color={Colors.primary} />

                <ScrollView contentContainerStyle={styles.introContent} scrollEnabled={false}>
                    {/* Large SVG Illustration */}
                    <View style={styles.illustrationContainer}>
                        <VoiceRecordingIllustration width={width * 0.67} height={width * 0.67} color={Colors.primary} />
                    </View>

                    {/* Title and Description */}
                    <Text style={styles.introTitle}>Voice Recording</Text>
                    <Text style={styles.introSubtitle}>Vocal Biomarker Capture</Text>

                    <View style={styles.introCard}>
                        <View style={styles.introIconRow}>
                            <View style={styles.introIconCircle}>
                                <Ionicons name="mic" size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.introCardTitle}>What You'll Do</Text>
                        </View>
                        <Text style={styles.introCardText}>
                            Read a short paragraph aloud in your normal speaking voice. This helps us understand your vocal patterns for research purposes.
                        </Text>

                        <View style={styles.infoBadges}>
                            <View style={styles.badge}>
                                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                                <Text style={styles.badgeText}>15-45 sec</Text>
                            </View>
                            <View style={styles.badge}>
                                <Ionicons name="book-outline" size={16} color={Colors.primary} />
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

            {/* Background leaves */}
            <LeavesDecoration width={width} height={width} color={Colors.primary} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={async () => {
                        if (isRecording) {
                            try {
                                if (intervalRef.current) {
                                    clearInterval(intervalRef.current);
                                    intervalRef.current = null;
                                }
                                if (recordingRef.current) {
                                    await recordingRef.current.stopAndUnloadAsync();
                                }
                            } catch (e) {
                                console.log('Error stopping recording on back:', e);
                            } finally {
                                recordingRef.current = null;
                                setIsRecording(false);
                            }
                        }
                        if (recordingUri) {
                            setRecordingUri(null);
                        } else {
                            setCurrentStep('intro');
                        }
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>Weekly Whispers</Text>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{formatTime(recordingDuration)}</Text>
                </View>
            </View>

            {!recordingUri ? (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.instructionText}>
                        Read the passage aloud in your normal speaking voice:
                    </Text>

                    <View style={styles.questionCard}>
                        <View style={styles.passageHeader}>
                            <Ionicons name="book-outline" size={18} color={Colors.primary} />
                            <Text style={styles.passageLabel}>PASSAGE TO READ</Text>
                        </View>
                        
                        <View style={styles.passageContainer}>
                            <ScrollView nestedScrollEnabled style={{ maxHeight: 300 }}>
                                <Text style={styles.passageText}>{PASSAGE_TEXT}</Text>
                            </ScrollView>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.recordingRow}>
                            {/* Left Side: SVG Illustration */}
                            <View style={styles.leftSideContainer}>
                                <VoiceRecordingIllustration width={width * 0.4} height={width * 0.4} color={Colors.primary} />
                            </View>

                            {/* Right Side: Controls */}
                            <View style={styles.rightSideContainer}>
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
                                    {isRecording ? 'Tap to Stop' : 'Tap to Record'}
                                </Text>

                                {!isRecording && (
                                    <Text style={styles.hintText}>Min 15s | Max 45s</Text>
                                )}
                            </View>
                        </View>

                        {isRecording && (
                            <View style={styles.recordingIndicator}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.recordingText}>Recording in progress...</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.instructionText}>
                        Review your recording before submitting:
                    </Text>

                    <View style={styles.questionCard}>
                        <View style={styles.reviewIconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                        </View>
                        <Text style={styles.reviewTitle}>Recording Complete!</Text>

                        <View style={styles.waveformContainer}>
                            {[16, 24, 32, 20, 40, 28, 18, 36, 22, 30, 26, 34, 18, 22, 28].map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h }]} />
                            ))}
                        </View>

                        <Text style={styles.reviewDuration}>Duration: {formatTime(recordingDuration)}</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.7}>
                                <Ionicons name="refresh" size={20} color={Colors.primary} />
                                <Text style={styles.retryButtonText}>Retake</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={uploading}
                                activeOpacity={0.7}
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
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9', // Soft cream backdrop
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
        paddingVertical: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
    },
    progressBadge: {
        backgroundColor: THEME_BG,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    instructionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#636E72',
        marginBottom: 20,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30, // Standardized bottom panel/card curves
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
        minHeight: 320,
    },
    // Intro Screen
    introContent: {
        padding: 16,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 2,
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 16,
        textAlign: 'center',
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        width: '100%',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    introIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    introIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    introCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    introCardText: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
    },
    infoBadges: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: THEME_BG,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.primary,
    },
    goButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        gap: 10,
    },
    goButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Recording Screen
    recordingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    leftSideContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSideContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButtonContainer: {
        marginTop: 8,
        marginBottom: 10,
    },
    recordButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    statusRecording: {
        color: '#EF4444',
        fontWeight: '700',
    },
    hintText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        backgroundColor: '#FEF2F2',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginRight: 8,
    },
    recordingText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '600',
    },
    // Passage Section
    passageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    passageLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        marginLeft: 8,
        letterSpacing: 1.5,
    },
    passageContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 4,
    },
    passageText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    // Review Screen
    reviewIconCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    reviewTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 16,
        textAlign: 'center',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        marginBottom: 16,
        width: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    waveBar: {
        width: 4,
        backgroundColor: Colors.primary,
        borderRadius: 2,
        marginHorizontal: 2,
        opacity: 0.7,
    },
    reviewDuration: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 16,
        textAlign: 'center',
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
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#DFE6E9',
        backgroundColor: '#FFFFFF',
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Success screen
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: THEME_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 8,
        textAlign: 'center',
    },
    successText: {
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    homeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
