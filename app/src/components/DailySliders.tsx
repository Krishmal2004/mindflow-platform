import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import Svg, { Path, Circle, G, Line, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// Conditional import for expo-av to avoid bundling issues
let Audio: any;
let FileSystem: any;
try {
  const expoAv = require('expo-av');
  Audio = expoAv.Audio;
  const expoFs = require('expo-file-system');
  FileSystem = expoFs;
} catch (e) {
  console.log('Audio features not available');
}

const { width } = Dimensions.get('window');

// Stress level emojis from low to high
const STRESS_EMOJIS = ['😊', '🙂', '😐', '😕', '😟', '😧', '😨', '😰', '😱', '😵'];

// Mood faces from bad to good (5 levels)
const MOOD_FACES = ['😢', '😐', '🙂', '😊', '😄'];

// Sleep quality emojis from poor to excellent (5 levels)
const SLEEP_QUALITY_EMOJIS = ['😫', '😪', '🛌', '😴', '🥱']; // Adjusted: poor to best

// Factors influencing stress
const STRESS_FACTORS = [
  'Health', 'Sleep', 'Exercise', 'Food', 'Hobby', 'Money', 'Identity',
  'Friends', 'Pet', 'Family', 'Dating', 'Work', 'Home', 'School',
  'Outdoors', 'Travel', 'Weather'
];

// Time options for sleep schedule (30-minute intervals)
// Sleep start times from 18:00 (6:00 PM) onwards
const SLEEP_START_OPTIONS: string[] = [];
for (let hour = 18; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    SLEEP_START_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Wake up times from 00:00 (12:00 AM) onwards
const WAKE_UP_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    WAKE_UP_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Custom Icons
const Icons = {
  stress: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="8.5" cy="10.5" r="1.5" fill="#64C59A"/>
      <Circle cx="15.5" cy="10.5" r="1.5" fill="#64C59A"/>
    </Svg>
  ),
  mood: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 14C8.91212 15.2144 10.3643 16 12 16C13.6357 16 15.0879 15.2144 16 14" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="9" cy="9" r="1" fill="#64C59A"/>
      <Circle cx="15" cy="9" r="1" fill="#64C59A"/>
    </Svg>
  ),
  sleep: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M20 20H4V4" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 13H13V21" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M11 3H21V13H11V3Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 11H5V13H3V11Z" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  factors: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M12 6V18" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M6 12H18" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  schedule: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M16 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M8 2V6" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M3 10H21" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  relaxation: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="#64C59A" strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="9" cy="9" r="1" fill="#64C59A"/>
      <Circle cx="15" cy="9" r="1" fill="#64C59A"/>
    </Svg>
  ),
  voice: () => (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#64C59A" strokeWidth="2"/>
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#64C59A" strokeWidth="2"/>
      <Line x1="12" y1="19" x2="12" y2="23" stroke="#64C59A" strokeWidth="2"/>
      <Line x1="8" y1="23" x2="16" y2="23" stroke="#64C59A" strokeWidth="2"/>
    </Svg>
  ),
  play: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M5 3L19 12L5 21V3Z" fill="#64C59A" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  stop: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" stroke="#64C59A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
};

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();

  // State variables
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEditAfterExercise, setShowEditAfterExercise] = useState(false);
  const [researchId, setResearchId] = useState<string | null>(null);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [recording, setRecording] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [weeklyVoiceUrl, setWeeklyVoiceUrl] = useState<string | null>(null);

  const stressAnimation = useRef(new Animated.Value(0)).current;

  // Check if user has already submitted today
  useEffect(() => {
    checkDailySubmission();
    getUserResearchId();
    loadWeeklyVoice();
    
    // Cleanup function
    return () => {
      if (sound) {
        sound.unloadAsync().catch((err: any) => console.log('Error unloading sound:', err));
      }
    };
  }, [session]);

  const getUserResearchId = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('researchID')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      if (data && data.researchID) {
        setResearchId(data.researchID);
        // Show voice recording feature only for users with research ID ending in .ex
        if (data.researchID.endsWith('.ex')) {
          setShowVoiceRecording(true);
        }
      }
    } catch (error) {
      console.error('Error fetching research ID:', error);
    }
  };

  const loadWeeklyVoice = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Get current week number and year
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      
      // Calculate week number
      const startDate = new Date(year, 0, 1);
      const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
      
      // Construct the file key based on your R2 structure
      // Format: SessionRecord/V2025-W50.mp3 for week 50 of 2025
      const fileKey = `SessionRecord/V${year}-W${weekNumber.toString().padStart(2, '0')}.mp3`;
      
      console.log('Loading voice for week:', weekNumber, 'year:', year);
      console.log('Constructed file key:', fileKey);
      
      // Try to get existing voice recording for this week from database first
      const { data, error } = await supabase
        .from('voice_recordings')
        .select('file_url')
        .eq('week_number', weekNumber)
        .eq('year', year)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        throw error;
      }
      
      if (data && data.length > 0 && data[0].file_url) {
        console.log('Found URL in database:', data[0].file_url);
        // Validate URL before setting it
        try {
          new URL(data[0].file_url);
          setWeeklyVoiceUrl(data[0].file_url);
        } catch (urlError) {
          console.error('Invalid URL from database:', data[0].file_url);
        }
      } else {
        // If no database entry, construct URL based on R2 structure
        const r2BaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_URL;
        console.log('R2 Base URL from env:', r2BaseUrl);
        
        if (r2BaseUrl) {
          // Ensure base URL formatting is correct
          let baseUrl = r2BaseUrl;
          // Remove trailing slash if present
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          
          // Ensure fileKey starts with /
          let formattedFileKey = fileKey;
          if (!formattedFileKey.startsWith('/')) {
            formattedFileKey = '/' + formattedFileKey;
          }
          
          const constructedUrl = `${baseUrl}${formattedFileKey}`;
          
          console.log('Base URL:', baseUrl);
          console.log('File key:', formattedFileKey);
          console.log('Constructed URL:', constructedUrl);
          
          // Validate the constructed URL
          try {
            new URL(constructedUrl);
            setWeeklyVoiceUrl(constructedUrl);
          } catch (urlError) {
            console.error('Invalid constructed URL:', constructedUrl);
            console.error('URL error:', urlError);
          }
        } else {
          console.log('R2_PUBLIC_URL environment variable not set');
        }
      }
    } catch (error) {
      console.error('Error loading weekly voice:', error);
      setWeeklyVoiceUrl(null); // Reset URL on error
    }
  };

  const checkDailySubmission = async () => {
    if (!session?.user?.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('daily_sliders')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setAlreadySubmittedToday(true);
        setEntryId(data[0].id);
      }
    } catch (error) {
      console.error('Error checking daily submission:', error);
    }
  };

  // Animate stress circle
  useEffect(() => {
    if (stressLevel !== null) {
      Animated.timing(stressAnimation, {
        toValue: stressLevel,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [stressLevel]);

  // Toggle factor
  const toggleFactor = (factor: string) => {
    setSelectedFactors(prev => prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]);
  };

  // Get stress color
  const getStressColor = () => {
    if (stressLevel === null) return '#64C59A';
    if (stressLevel <= 3) return '#10B981';
    if (stressLevel <= 6) return '#FBBF24';
    return '#EF4444';
  };

  // Get stress emoji
  const getStressEmoji = () => STRESS_EMOJIS[stressLevel ? stressLevel - 1 : 2] || '😐';

  // Get mood face - now 1 bad, 5 good
  const getMoodFace = () => MOOD_FACES[moodLevel ? moodLevel - 1 : 2] || '😐';

  // Get sleep quality emoji - 1 poor, 5 excellent
  const getSleepQualityEmoji = () => SLEEP_QUALITY_EMOJIS[sleepQuality ? sleepQuality - 1 : 2] || '😐';

  // Get relaxation emoji
  const getRelaxationEmoji = () => STRESS_EMOJIS[relaxationLevel ? 10 - relaxationLevel : 2] || '😐';

  // Voice recording functions
  const startRecording = async () => {
    if (!Audio) return;
    
    try {
      if (Platform.OS === 'android') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
      
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedUri(uri);
      }
      
      setIsRecording(false);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!weeklyVoiceUrl || !Audio) {
      Alert.alert('Playback Error', 'No audio file available to play.');
      return;
    }
    
    // Validate URL format
    try {
      new URL(weeklyVoiceUrl);
    } catch (urlError) {
      console.error('Invalid URL format:', weeklyVoiceUrl);
      Alert.alert('Playback Error', 'Invalid audio file URL.');
      return;
    }
    
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false
      });
      
      console.log('Attempting to play audio from URL:', weeklyVoiceUrl);
      
      // Create and load the sound directly
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: weeklyVoiceUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      // Set up playback status update listener
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            newSound.unloadAsync();
          }
        } else if (status.error) {
          console.error('Playback error:', status.error);
          setIsPlaying(false);
          // Provide more detailed error information
          let errorMsg = `Failed to play audio: ${status.error}`;
          if (status.error.includes('400') || status.error.includes('404')) {
            errorMsg = 'Audio file not found or inaccessible. Please check if the file exists in the storage.';
          }
          Alert.alert('Playback Error', errorMsg);
        }
      });
      
      // Play the sound
      await newSound.playAsync();
    } catch (err: any) {
      console.error('Failed to play recording:', err);
      setIsPlaying(false);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to play the audio. Please try again.';
      if (err.message) {
        errorMessage = `Playback failed: ${err.message}`;
      }
      
      // Handle specific error codes
      if (err.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error: Unable to connect to the audio server. Please check your internet connection.';
      } else if (err.code === 'E_CONTENT_NOT_FOUND') {
        errorMessage = 'Audio file not found. The file may not exist or the URL may be incorrect.';
      } else if (err.code === 'E_UNSUPPORTED_FORMAT') {
        errorMessage = 'Unsupported audio format. The file may be corrupted or in an unsupported format.';
      } else if (errorMessage.includes('400') || errorMessage.includes('404')) {
        errorMessage = 'Unable to access the audio file. It may not exist in the storage or there may be permission issues.';
      }
      
      Alert.alert('Playback Error', errorMessage);
    }
  };

  const stopPlaying = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setIsPlaying(false);
        setSound(null);
      } catch (err) {
        console.error('Failed to stop playing', err);
      }
    }
  };

  // Submit wellness data
  const submitWellnessData = async (isEdit = false) => {
    if (!session?.user?.id) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }
    if (stressLevel === null || moodLevel === null || sleepQuality === null || selectedFactors.length === 0 ||
      sleepStart === null || wakeUp === null) {
      Alert.alert('Incomplete Form', 'Please complete all fields before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      let data;
      if (isEdit && entryId) {
        const { error } = await supabase
          .from('daily_sliders')
          .update({
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel, // Add relaxation level to the update
          })
          .eq('id', entryId);
        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from('daily_sliders')
          .insert({
            user_id: session.user.id,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: selectedFactors.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel, // Add relaxation level to the insert
            created_at: new Date().toISOString(),
          })
          .select();
        if (error) throw error;
        data = insertData;
      }
      if (!isEdit && data && data.length > 0) {
        setEntryId(data[0].id);
      }
      setShowCompletion(true);
      setAlreadySubmittedToday(true);
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to save data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stress circle interpolation
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 5, 10],
    outputRange: [1.3, 0.7, 1.3],
    extrapolate: 'clamp',
  });
  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 10],
    outputRange: [0.8, 0.8],
  });

  const getWeekNumber = () => {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  if (alreadySubmittedToday) {
    return (
      <View style={styles.container}>
        {/* Professional Header with Custom Icons */}
        <View style={styles.professionalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Wellness Check</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.completionContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Great Job Today!</Text>
          <Text style={styles.completionText}>You've completed your daily mindfulness routine.</Text>
          <Text style={styles.completionText}>You're all set. Let's meet again tomorrow!</Text>
          <Text style={styles.happyEmoji}>😊</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stress Level Section */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.stress />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Stress Level</Text>
              <Text style={styles.sectionSubtitle}>How stressed do you feel today? (1-10)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Animated.View
              style={[
                styles.stressCircleContainer,
                {
                  transform: [{ scale: stressCircleScale }],
                  opacity: stressCircleOpacity,
                }
              ]}
            >
              <Svg width="120" height="120" viewBox="0 0 120 120">
                <G>
                  <Circle cx="60" cy="60" r="55" fill={getStressColor()} />
                  <Circle cx="60" cy="60" r="45" fill="white" opacity="0.2" />
                  <Path d="M30 60 Q60 30 90 60 Q60 90 30 60" fill="white" opacity="0.1" />
                </G>
              </Svg>
            </Animated.View>
            <Text style={[styles.stressEmoji, { color: getStressColor() }]}>
              {getStressEmoji()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: stressLevel ? `${stressLevel * 10}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(10)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    stressLevel === i + 1 && styles.thumbActive,
                    stressLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setStressLevel(i + 1)}
                />
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Low</Text>
              <Text style={styles.label}>High</Text>
            </View>
          </View>
        </View>
        {/* Mood Selector Section */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.mood />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Mood Level</Text>
              <Text style={styles.sectionSubtitle}>How is your mood today? (1 Bad - 5 Good)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
              {getMoodFace()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: moodLevel ? `${(moodLevel * 100) / 5}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    { width: width / 6 - 10, justifyContent: 'center', alignItems: 'center' },
                    moodLevel === i + 1 && styles.thumbActive,
                    moodLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setMoodLevel(i + 1)}
                >
                  <Text style={[styles.moodThumbEmoji, { textAlign: 'center' }]}>{MOOD_FACES[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Bad</Text>
              <Text style={styles.label}>Good</Text>
            </View>
          </View>
        </View>
        {/* Factors Influencing Stress */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.factors />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Factors Influencing Stress</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            </View>
          </View>
          <View style={styles.factorsContainer}>
            {STRESS_FACTORS.map((factor) => (
              <TouchableOpacity
                key={factor}
                style={[
                  styles.factorTag,
                  selectedFactors.includes(factor) && styles.factorTagSelected,
                  selectedFactors.includes(factor) && { backgroundColor: getStressColor() }
                ]}
                onPress={() => toggleFactor(factor)}
              >
                <Text style={[
                  styles.factorText,
                  selectedFactors.includes(factor) && styles.factorTextSelected
                ]}>
                  {factor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Sleep Schedule */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.schedule />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Sleep Schedule</Text>
              <Text style={styles.sectionSubtitle}>When did you sleep and wake up?</Text>
            </View>
          </View>
          <View style={styles.sleepScheduleContainer}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Sleep Start</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {SLEEP_START_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      sleepStart === time && styles.timeOptionSelected,
                      sleepStart === time && { backgroundColor: getStressColor() }
                    ]}
                    onPress={() => setSleepStart(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      sleepStart === time && styles.timeTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Wake Up</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {WAKE_UP_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      wakeUp === time && styles.timeOptionSelected,
                      wakeUp === time && { backgroundColor: getStressColor() }
                    ]}
                    onPress={() => setWakeUp(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      wakeUp === time && styles.timeTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        {/* Sleep Quality Section - moved after schedule */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.sleep />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Sleep Quality</Text>
              <Text style={styles.sectionSubtitle}>How was your sleep quality? (1 Poor - 5 Excellent)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
              {getSleepQualityEmoji()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: sleepQuality ? `${(sleepQuality * 100) / 5}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    { width: width / 6 - 10 },
                    sleepQuality === i + 1 && styles.thumbActive,
                    sleepQuality === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setSleepQuality(i + 1)}
                />
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Poor</Text>
              <Text style={styles.label}>Excellent</Text>
            </View>
          </View>
        </View>
        {/* Voice Recording Section - only shown for .ex users */}
        {showVoiceRecording && (
          <View style={styles.section}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <Icons.voice />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.sectionTitle}>Weekly Voice Guidance</Text>
                <Text style={styles.sectionSubtitle}>Listen to this week's mindfulness guidance</Text>
              </View>
            </View>
            
            {weeklyVoiceUrl ? (
              <View style={styles.voicePlayerCard}>
                <View style={styles.voicePlayerHeader}>
                  <Text style={styles.voicePlayerTitle}>Mindfulness Session</Text>
                  <Text style={styles.voicePlayerWeek}>Week {getWeekNumber()}</Text>
                </View>
                
                <View style={styles.voicePlayerControls}>
                  <TouchableOpacity 
                    style={[styles.voiceControlButton, { backgroundColor: isPlaying ? '#EF4444' : '#64C59A' }]}
                    onPress={isPlaying ? stopPlaying : playRecording}
                  >
                    {isPlaying ? (
                      <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <Rect x="6" y="6" width="4" height="12" fill="white"/>
                        <Rect x="14" y="6" width="4" height="12" fill="white"/>
                      </Svg>
                    ) : (
                      <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <Path d="M8 5V19L19 12L8 5Z" fill="white"/>
                      </Svg>
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.voiceProgressInfo}>
                    <Text style={styles.voiceStatus}>
                      {isPlaying ? 'Playing...' : 'Tap play to begin'}
                    </Text>
                    <Text style={styles.voiceDuration}>~5 min</Text>
                  </View>
                </View>
                
                <View style={styles.voiceProgressBar}>
                  <View style={[styles.voiceProgressFill, { width: isPlaying ? '60%' : '0%' }]} />
                </View>
                
                <View style={styles.voicePlayerFooter}>
                  <Text style={styles.voicePlayerTip}>🎧 Use headphones for best experience</Text>
                </View>
              </View>
            ) : (
              <View style={styles.voicePlaceholder}>
                <Text style={styles.voicePlaceholderText}>
                  Your research coordinator will upload this week's voice guidance soon.
                </Text>
              </View>
            )}
          </View>
        )}
        {/* Relaxation Level Section - moved after Sleep Quality */}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <Icons.relaxation />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Relaxation Level</Text>
              <Text style={styles.sectionSubtitle}>How relaxed do you feel right now? (1-10)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Text style={[styles.stressEmoji, { fontSize: 60 }]}>
              {getRelaxationEmoji()}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: relaxationLevel ? `${relaxationLevel * 10}%` : '0%',
                    backgroundColor: getStressColor()
                  }
                ]}
              />
            </View>
            <View style={styles.thumbContainer}>
              {[...Array(10)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumb,
                    relaxationLevel === i + 1 && styles.thumbActive,
                    relaxationLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setRelaxationLevel(i + 1)}
                />
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Stressed</Text>
              <Text style={styles.label}>Relaxed</Text>
            </View>
          </View>
        </View>
        {/* Submit Button */}
        {!showCompletion && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: getStressColor() }]}
            onPress={() => submitWellnessData(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Wellness Data'}
            </Text>
          </TouchableOpacity>
        )}
        {showCompletion && (
          <View style={styles.completionContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Great Job Today!</Text>
            <Text style={styles.completionText}>You've completed your daily mindfulness routine.</Text>
            <Text style={styles.completionText}>You're all set. Let's meet again tomorrow!</Text>
            <Text style={styles.happyEmoji}>😊</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 24,
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
    fontSize: 24,
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
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  stressVisualContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stressCircleContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  stressEmoji: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5F1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 4,
  },
  thumbContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5F1',
    borderWidth: 2,
    borderColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbActive: {
    backgroundColor: '#64C59A',
    transform: [{ scale: 1.2 }],
  },
  moodThumbEmoji: {
    fontSize: 20,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#999',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  factorTag: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  factorTagSelected: {
    backgroundColor: '#64C59A',
  },
  factorText: {
    fontSize: 14,
    color: '#333',
  },
  factorTextSelected: {
    color: '#fff',
  },
  sleepScheduleContainer: {
    flexDirection: 'column',
  },
  timeColumn: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  timeOptionSelected: {
    backgroundColor: '#64C59A',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#64C59A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  voicePlayerCard: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5F1',
  },
  voicePlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  voicePlayerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  voicePlayerWeek: {
    fontSize: 14,
    color: '#64C59A',
    fontWeight: '600',
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voicePlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceProgressInfo: {
    flex: 1,
  },
  voiceStatus: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDuration: {
    fontSize: 14,
    color: '#666',
  },
  voiceProgressBar: {
    height: 6,
    backgroundColor: '#E8F5F1',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%',
    backgroundColor: '#64C59A',
    borderRadius: 3,
  },
  voicePlayerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E8F5F1',
    paddingTop: 15,
  },
  voicePlayerTip: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  voicePlaceholder: {
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  voicePlaceholderText: {
    fontSize: 16,
    color: '#64C59A',
    textAlign: 'center',
    fontStyle: 'italic',
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
  headerSpacer: {
    width: 24,
  },
});
