import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import { r2, BUCKET_NAME, PUBLIC_URL_BASE } from '../lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
// Removed inline Svg imports
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Icons } from './common/AppIcons';
import AppButton from './common/AppButton';
import AppCard from './common/AppCard';

// Custom Icons moved to AppIcons.tsx

// ISO Week Number (Monday as first day of week)
function getWeekNumber(d: Date): [number, number] {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return [date.getUTCFullYear(), weekNo];
}

// Get formatted week ID (e.g., 2025-W50-WQ)
function getCurrentWeekId(): string {
  const [year, week] = getWeekNumber(new Date());
  return `${year}-W${week.toString().padStart(2, '0')}-WQ`;
}

const PASSAGE_TEXT = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";

export default function VocalBiomarkerCapture({ onComplete }: { onComplete: (recordingId: number) => void }) {
  const router = useRouter();
  const { session } = useSession();

  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(false); // New state for 5-second loading screen

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio. Please enable it in system settings.');
          return;
        }
      }


      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with WAV format
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
        }
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Automatically stop recording at 30 seconds
          if (newDuration >= 30) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Stop the recording automatically
            stopRecording();
          }
          return newDuration;
        });
      }, 1000) as unknown as NodeJS.Timeout;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        setRecordingUri(uri);

        // Get the actual duration from the recording object
        const status = await recordingRef.current.getStatusAsync();
        const actualDuration = status.durationMillis / 1000;

        // If the actual duration is >= 30 seconds, it was auto-stopped, so skip the minimum duration check
        if (actualDuration >= 30) {
          // This was an auto-stop at 30 seconds, proceed to complete stage
          setIsRecording(false);
        } else if (actualDuration < 15) {
          // Check duration only for manually stopped recordings
          Alert.alert('Recording Too Short', 'Recording must be at least 15 seconds.');
          setRecordingUri(null);
          setRecordingDuration(0);
          setIsRecording(false); // Reset recording state so button shows "Start" again
        } else {
          // Recording is between 15-30 seconds, proceed normally
          setIsRecording(false);
        }
      }

    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      setIsRecording(false); // Ensure recording state is reset on error
    } finally {
      recordingRef.current = null;
    }
  };

  async function uploadFile(uri: string): Promise<string> {
    try {
      console.log("Starting upload for:", uri);

      // Create a File instance and read as base64 using the new API
      const file = new FileSystem.File(uri);
      const base64Data = await file.base64();

      // Convert base64 to Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Get current week info
      const [year, week] = getWeekNumber(new Date());

      // Generate filename
      const fileName = `weekly-${year}-W${week.toString().padStart(2, '0')}-${session!.user.id}.wav`;
      const fileKey = `WeeklyVoice/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: bytes,
        ContentType: 'audio/wav',
      });

      console.log("Sending to R2...");
      await r2.send(command);
      console.log("Upload success!");

      return `${PUBLIC_URL_BASE}/${fileKey}`;
    } catch (error: any) {
      console.error("Upload failed:", error);
      throw new Error(`Upload Error: ${error.message || JSON.stringify(error)}`);
    }
  }

  const uploadRecording = async () => {
    if (!recordingUri || !session?.user?.id) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current week info
      const [year, week] = getWeekNumber(new Date());
      const weekId = getCurrentWeekId();

      // Upload file to R2
      const fileUrl = await uploadFile(recordingUri);

      // Save metadata to database
      const { data: recordingData, error: recordingError } = await supabase
        .from('voice_recordings')
        .insert({
          user_id: session.user.id,
          week_number: week,
          year: year,
          file_key: `WeeklyVoice/weekly-${year}-W${week.toString().padStart(2, '0')}-${session.user.id}.wav`,
          file_url: fileUrl,
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Show loading screen for 5 seconds instead of celebration
      setUploading(false);
      setShowLoading(true);

      // Wait for 5 seconds
      setTimeout(() => {
        setShowLoading(false);
        // Call onComplete with the recording ID
        onComplete(recordingData.id);
      }, 5000);
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'Failed to upload recording. Please try again.');
      setUploading(false);
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

  if (!permissionResponse || permissionResponse.status !== 'granted') {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
          <AppCard style={styles.instructionContainer}>
            <Icons.Microphone width={48} height={48} color="#2E8A66" />
            <Text style={styles.instructionTitle}>Microphone Access Required</Text>
            <Text style={[styles.instructionText, { marginBottom: 24 }]}>
              This feature requires microphone access to record your voice for analysis.
              {permissionResponse?.status === 'denied' && "\n\nYou may need to enable it in your device settings."}
            </Text>
            <AppButton
              title={permissionResponse?.status === 'denied' ? "Open Settings" : "Enable Microphone"}
              onPress={permissionResponse?.status === 'denied' ? Linking.openSettings : requestPermission}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {!showLoading && ( // Only show the main content if not showing loading
          <>
            {!recordingUri ? (
              <>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.instructionContainer}>
                  <Icons.Microphone isRecording={isRecording} width={32} height={32} color="#2E8A66" />
                  <Text style={styles.instructionTitle}>Voice Recording</Text>
                  <Text style={styles.instructionText}>
                    Please read the following paragraph aloud in your normal speaking voice. Try to speak clearly.
                  </Text>
                </Animated.View>



                <Animated.View entering={FadeInDown.delay(200)} style={styles.recordingContainer}>
                  <View style={styles.timerContainer}>
                    <Text style={[styles.timerText, isRecording && { color: '#EF4444' }]}>
                      {recordingDuration}s
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      isRecording && styles.recordingActive
                    ]}
                    onPress={handleToggleRecording}
                    disabled={uploading}
                  >
                    <Icons.Microphone isRecording={isRecording} width={40} height={40} color="#fff" fill={isRecording ? "#EF4444" : "#2E8A66"} />
                  </TouchableOpacity>

                  <Text style={[styles.recordButtonText, isRecording && { color: '#EF4444', fontWeight: '700' }]}>
                    {isRecording ? 'Stop Recording' : 'Tap to Start'}
                  </Text>

                  {/* Minimum duration hint */}
                  {!isRecording && (
                    <Text style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Minimum 15 seconds</Text>
                  )}

                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                  )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)} style={styles.passageContainer}>
                  <Text style={styles.passageTitle}>Read Aloud:</Text>
                  <Text style={styles.passageText}>{PASSAGE_TEXT}</Text>
                </Animated.View>
              </>
            ) : (
              <Animated.View entering={FadeInDown.delay(100)}>
                <AppCard style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Icons.Check width={48} height={48} />
                    <Text style={styles.reviewTitle}>Recording Complete!</Text>
                  </View>

                  <View style={styles.audioPlaceholder}>
                    {/* Simulating a waveform visualization */}
                    <View style={[styles.waveBar, { height: 16 }]} />
                    <View style={[styles.waveBar, { height: 24 }]} />
                    <View style={[styles.waveBar, { height: 32 }]} />
                    <View style={[styles.waveBar, { height: 20 }]} />
                    <View style={[styles.waveBar, { height: 40 }]} />
                    <View style={[styles.waveBar, { height: 28 }]} />
                    <View style={[styles.waveBar, { height: 18 }]} />
                  </View>

                  <Text style={styles.reviewText}>Duration: {recordingDuration} seconds</Text>

                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Retake"
                      onPress={handleRetry}
                      variant="secondary"
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <AppButton
                      title={uploading ? `Uploading ${uploadProgress}%` : "Submit Recording"}
                      onPress={uploadRecording}
                      loading={uploading}
                      disabled={uploading}
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  </View>
                </AppCard>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>


    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E8A66',
    marginTop: 24,
    textAlign: 'center',
  },
  instructionContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E8A66',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    textAlign: 'center',
  },
  passageContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  passageText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'left',
  },
  passageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E8A66',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recordingContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E8A66',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E8A66',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2E8A66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  recordingActive: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.1 }], // Slightly enlarge when active
  },
  stopIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 12,
  },
  recordingText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  reviewCard: {
    alignItems: 'center',
    padding: 32,
  },
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E8A66',
    marginBottom: 8,
  },
  audioPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 24,
    width: '100%',
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#2E8A66',
    borderRadius: 3,
    marginHorizontal: 3,
    opacity: 0.7,
  },
  reviewText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E8A66',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2E8A66',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});