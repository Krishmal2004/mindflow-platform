import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import StandardHeader from './common/StandardHeader';
import SuccessScreen from './common/SuccessScreen';
import LoadingScreen from './common/LoadingScreen';
import VocalBiomarkerCapture from './VocalBiomarkerCapture';

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

export default function WeeklyQuestions() {
  const router = useRouter();
  const { session } = useSession();

  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentWeekId, setCurrentWeekId] = useState('');
  const [voiceRecordingId, setVoiceRecordingId] = useState<number | null>(null);
  const [showVocalCapture, setShowVocalCapture] = useState(false);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const weekId = getCurrentWeekId();
      setCurrentWeekId(weekId);
      checkIfAlreadySubmitted(weekId);
      checkVoiceRecording(weekId);
    }
  }, [session]);

  const checkIfAlreadySubmitted = async (weekId: string) => {
    if (!session?.user?.id) return;

    try {
      // Check if user already answered for this week
      const { data: existing, error } = await supabase
        .from('weekly_answers')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('week_id', weekId)
        .maybeSingle();

      if (error) throw error;

      const isSubmitted = !!existing;
      setAlreadySubmitted(isSubmitted);
    } catch (err: any) {
      console.error('Error checking submission status:', err);
      Alert.alert('Error', err.message || 'Failed to check submission status. Please try again.');
    }
  };

  const checkVoiceRecording = async (weekId: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Extract week number from weekId (format: YYYY-W##-WQ)
      const weekNumber = parseInt(weekId.split('-')[1].replace('W', ''));
      const year = parseInt(weekId.split('-')[0]);

      // Check if user already has a voice recording for this week
      const { data: existing, error } = await supabase
        .from('voice_recordings')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle();

      if (error) throw error;

      const hasRecording = !!existing;
      setHasVoiceRecording(hasRecording);

      // Only show vocal capture if user doesn't have a recording yet
      setShowVocalCapture(!hasRecording);
    } catch (err: any) {
      console.error('Error checking voice recording status:', err);
      Alert.alert('Error', err.message || 'Failed to check recording status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVocalCaptureComplete = (recordingId: number) => {
    setVoiceRecordingId(recordingId);
    setShowVocalCapture(false);
    setHasVoiceRecording(true); // Mark that we now have a recording
    setShowCelebration(true); // Show the celebration screen

    // After a delay, reset to show the success message
    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
  };

  // Loading Screen
  if (loading) {
    return (
      <LoadingScreen title="Weekly Whispers" message="Loading your questions..." onBack={() => router.back()} />
    );
  }

  // Celebration Screen (similar to AboutMe) - shown after successful recording
  if (showCelebration) {
    return (
      <View style={styles.container}>
        <StandardHeader
          title="Weekly Whispers"
          onBack={() => router.back()}
        />
        <SuccessScreen
          title="Great Job For This Week!"
          subtitle={["You've completed your Weekly Whisper routine.", "You're all set. Let's meet again Next Week!"]}
          onPressHome={() => router.push('/')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StandardHeader
        title="Weekly Whispers"
        onBack={() => router.back()}
      />

      {showVocalCapture ? (
        <VocalBiomarkerCapture onComplete={handleVocalCaptureComplete} />
      ) : (
        <SuccessScreen
          title="Already Completed!"
          subtitle={["You've already submitted your voice recording for this week.", "Great job staying consistent with your practice!"]}
          onPressHome={() => router.push('/')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  happyEmoji: {
    fontSize: 60,
    marginTop: 20,
  },
  // Professional Header Styles
  professionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    padding: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  headerSpacer: {
    width: 24,
  },
  dashboardButton: {
    backgroundColor: '#2E8A66',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 30,
    alignItems: 'center',
  },
  dashboardButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});