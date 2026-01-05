import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import SuccessScreen from './common/SuccessScreen';
import StandardHeader from './common/StandardHeader';
import AppButton from './common/AppButton';
import { Icons, Emojis } from './common/AppIcons';

const { width } = Dimensions.get('window');

// Factors influencing stress
const STRESS_FACTORS = [
  'Health', 'Sleep', 'Exercise', 'Food', 'Hobby', 'Money', 'Identity',
  'Friends', 'Pet', 'Family', 'Dating', 'Work', 'Home', 'School',
  'Outdoors', 'Travel', 'Weather'
];

// Time options for sleep schedule (30-minute intervals)
// Sleep start times from 18:00 (6:00 PM) to 06:00 (6:00 AM)
const SLEEP_START_OPTIONS: string[] = [];
// Add times from 6:00 PM to 11:30 PM
for (let hour = 18; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    SLEEP_START_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}
// Add times from 12:00 AM to 6:00 AM
for (let hour = 0; hour <= 6; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === 6 && minute > 0) break; // Stop at 6:00 AM
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    SLEEP_START_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}
// Wake up times from 00:00 (12:00 AM) onwards until 12:00 PM
const WAKE_UP_OPTIONS: string[] = [];
// Add times from 12:00 AM to 11:30 PM
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    WAKE_UP_OPTIONS.push(`${displayHour}:${displayMinute} ${period}`);
  }
}

// Accent colors for study groups
const CONTROL_COLOR = '#64C59A';
const EXPERIMENT_COLOR = '#6366F1';

export default function DailySliders() {
  const router = useRouter();
  const { session } = useSession();
  // State variables
  const [mindfulnessPractice, setMindfulnessPractice] = useState<'yes' | 'no' | null>(null);
  const [practiceDuration, setPracticeDuration] = useState<string>('');
  const [practiceLog, setPracticeLog] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [relaxationLevel, setRelaxationLevel] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [otherFactor, setOtherFactor] = useState<string>(''); // New state for "Other" text input
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [wakeUp, setWakeUp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEditAfterExercise, setShowEditAfterExercise] = useState(false);
  const [userExtension, setUserExtension] = useState<'ex' | 'cg' | ''>('');
  // Weekly recordings state
  const [weeklyRecordings, setWeeklyRecordings] = useState<Array<any>>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  // Playback tracking for selected recording
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);
  const webviewRef = useRef<any>(null);
  const stressAnimation = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Check if user has already submitted today
  useEffect(() => {
    checkDailySubmission();
    fetchUserExtension();
    // Cleanup function
    return () => {
      // Cleanup code if needed
    };
  }, [session]);

  const fetchUserExtension = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('researchID')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.researchID) {
        if (data.researchID.endsWith('.ex')) {
          setUserExtension('ex');
        } else if (data.researchID.endsWith('.cg')) {
          setUserExtension('cg');
        }
      }
    } catch (error) {
      console.error('Error fetching user extension:', error);
    }
  };
  useEffect(() => {
    if (alreadySubmittedToday || showCompletion) {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [alreadySubmittedToday, showCompletion]);
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
    } catch (error) { }
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

  // Fetch weekly recordings for the current week number
  const getISOWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      setLoadingRecordings(true);
      try {
        const weekNo = getISOWeekNumber(new Date());
        const { data, error } = await supabase
          .from('weekly_recordings')
          .select('*')
          .eq('week_no', weekNo)
          .order('published_at', { ascending: false });
        if (error) throw error;
        setWeeklyRecordings(data || []);
      } catch (err) {
        console.error('Error fetching weekly recordings', err);
        setWeeklyRecordings([]);
      } finally {
        setLoadingRecordings(false);
      }
    };
    fetchRecordings();
  }, [session]);

  // Build HTML for embed player which prevents native controls and posts playback time back
  const getYouTubeHTML = (youtubeId: string | undefined) => {
    if (!youtubeId) return '<html></html>';
    return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <style>html,body,#player{height:100%;margin:0;background:#000}</style>
      </head>
      <body>
        <div id="player"></div>
        <script>
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${youtubeId}',
              playerVars: {
                autoplay: 1,
                controls: 1,
                disablekb: 0,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                fs: 1,
              },
              events: {
                'onReady': function() {
                  // user must press play; ensure we can post time updates
                  window.setInterval(function() {
                    try {
                      if (player && player.getCurrentTime) {
                        var t = Math.floor(player.getCurrentTime());
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'time', seconds: t }));
                      }
                    } catch(e){}
                  }, 1000);
                },
                'onStateChange': function(event) {
                  if (event.data == YT.PlayerState.ENDED) {
                    try {
                      var t = Math.floor(player.getCurrentTime());
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ended', seconds: t }));
                    } catch(e){}
                  }
                }
              }
            });
          }
        </script>
      </body>
    </html>
    `;
  };

  const handleWebviewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'time') {
        setPlaybackSeconds(msg.seconds || 0);
      }
      if (msg.type === 'ended') {
        setPlaybackSeconds(msg.seconds || 0);
        // Persist when video ends
        savePlaybackSeconds(msg.seconds || 0);
      }
    } catch (e) { }
  };

  const savePlaybackSeconds = async (seconds: number) => {
    if (!session?.user?.id) return;
    const sec = Math.floor(seconds || 0);
    try {
      if (entryId) {
        const { data: cur, error: err1 } = await supabase
          .from('daily_sliders')
          .select('video_play_seconds')
          .eq('id', entryId)
          .single();
        if (err1) throw err1;
        const newVal = (cur?.video_play_seconds || 0) + sec;
        await supabase.from('daily_sliders').update({ video_play_seconds: newVal }).eq('id', entryId);
      } else {
        const { data, error } = await supabase
          .from('daily_sliders')
          .insert({ user_id: session.user.id, video_play_seconds: sec, created_at: new Date().toISOString() })
          .select();
        if (error) throw error;
        if (data && data.length > 0) setEntryId(data[0].id);
      }
    } catch (err) {
      // ignore persistence errors silently
      console.error('Failed to save playback seconds', err);
    }
  };
  // Toggle factor
  const toggleFactor = (factor: string) => {
    if (factor === 'Other') {
      if (selectedFactors.includes('Other')) {
        setSelectedFactors(prev => prev.filter(f => f !== 'Other'));
        setOtherFactor('');
      } else {
        setSelectedFactors(prev => [...prev, 'Other']);
      }
    } else {
      setSelectedFactors(prev => prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]);
    }
  };
  // Get stress color
  const getStressColor = () => {
    if (stressLevel === null) return '#64C59A';
    if (stressLevel <= 2) return '#10B981';
    if (stressLevel <= 3) return '#FBBF24';
    return '#EF4444';
  };
  // Get icon components for current selections (returns a React component)
  const getStressIcon = () => {
    const idx = stressLevel ? stressLevel - 1 : 2;
    return Emojis.Stress[idx] || Emojis.Stress[2];
  };
  const getMoodIcon = () => {
    const idx = moodLevel ? moodLevel - 1 : 2;
    return Emojis.Mood[idx] || Emojis.Mood[2];
  };
  const getSleepIcon = () => {
    const idx = sleepQuality ? sleepQuality - 1 : 2;
    return Emojis.SleepQuality[idx] || Emojis.SleepQuality[2];
  };
  const getRelaxationIcon = () => {
    const idx = relaxationLevel ? 5 - relaxationLevel : 2;
    return Emojis.Stress[idx] || Emojis.Stress[2];
  };
  // Submit wellness data
  const handleSubmit = async (isEdit = false) => {
    if (!session?.user?.id) {
      Alert.alert('Authentication Error', 'Please log in to submit data.');
      return;
    }
    // Prepare factors list including "Other" if selected
    let factorsToSubmit = [...selectedFactors];
    if (selectedFactors.includes('Other') && otherFactor.trim()) {
      factorsToSubmit = factorsToSubmit.filter(f => f !== 'Other');
      factorsToSubmit.push(`Other: ${otherFactor.trim()}`);
    }
    if (mindfulnessPractice === null || stressLevel === null || moodLevel === null || sleepQuality === null || factorsToSubmit.length === 0 ||
      sleepStart === null || wakeUp === null) {
      Alert.alert('Incomplete Form', 'Please complete all fields before submitting.');
      return;
    }
    if (mindfulnessPractice === 'yes' && (!practiceDuration.trim() || !practiceLog.trim())) {
      Alert.alert('Incomplete Form', 'Please fill in the duration and what you practiced.');
      return;
    }
    setIsSubmitting(true);
    try {
      let data;
      if (isEdit && entryId) {
        const { error } = await supabase
          .from('daily_sliders')
          .update({
            mindfulness_practice: mindfulnessPractice,
            practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
            practice_log: mindfulnessPractice === 'yes' ? practiceLog : null,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: factorsToSubmit.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel,
          })
          .eq('id', entryId);
        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from('daily_sliders')
          .insert({
            user_id: session.user.id,
            mindfulness_practice: mindfulnessPractice,
            practice_duration: mindfulnessPractice === 'yes' ? parseInt(practiceDuration) : null,
            practice_log: mindfulnessPractice === 'yes' ? practiceLog : null,
            stress_level: stressLevel,
            mood: moodLevel,
            sleep_quality: sleepQuality,
            feelings: factorsToSubmit.join(','),
            sleep_start_time: sleepStart,
            wake_up_time: wakeUp,
            relaxation_level: relaxationLevel,
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
    } finally {
      setIsSubmitting(false);
    }
  };
  // Stress circle interpolation
  const stressCircleScale = stressAnimation.interpolate({
    inputRange: [1, 3, 5],
    outputRange: [1.3, 0.7, 1.3],
    extrapolate: 'clamp',
  });
  const stressCircleOpacity = stressAnimation.interpolate({
    inputRange: [1, 5],
    outputRange: [0.8, 0.8],
  });
  const getWeekNumber = () => {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  };
  const progress = useMemo(() => {
    let completed = 0;
    let total = 7;
    if (mindfulnessPractice !== null) {
      if (mindfulnessPractice === 'no') {
        completed++;
      } else if (practiceDuration.trim() && practiceLog.trim()) {
        completed++;
      }
    }
    if (stressLevel !== null) completed++;
    if (moodLevel !== null) completed++;
    let factorsFilled = selectedFactors.length > 0;
    if (selectedFactors.includes('Other') && !otherFactor.trim()) factorsFilled = false;
    if (factorsFilled) completed++;
    if (sleepStart && wakeUp) completed++;
    if (sleepQuality !== null) completed++;
    if (relaxationLevel !== null) completed++;
    return (completed / total) * 100;
  }, [mindfulnessPractice, practiceDuration, practiceLog, stressLevel, moodLevel, selectedFactors, otherFactor, sleepStart, wakeUp, sleepQuality, relaxationLevel]);
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Custom Icons from AppIcons
  const QuestionIcons = {
    mindfulness: () => <Icons.Mindfulness width={24} height={24} />,
    stress: () => <Icons.Stress width={24} height={24} />,
    mood: () => <Icons.Mood width={24} height={24} />,
    sleep: () => <Icons.Sleep width={24} height={24} />,
    recording: () => <Icons.Recording width={24} height={24} />,
    relaxation: () => <Icons.Relaxation width={24} height={24} />,
    factors: () => <Icons.Factors width={24} height={24} />,
    schedule: () => <Icons.Schedule width={24} height={24} />,
  };
  // Use a single accent color for the progress bar (same for all groups)
  const groupAccentColor = CONTROL_COLOR;
  if (alreadySubmittedToday) {
    return (
      <View style={styles.container}>
        <StandardHeader
          title="Daily Sliders"
          onBack={() => router.back()}
        />

        <SuccessScreen
          title="Great Job Today!"
          subtitle={["You've completed your daily entry.", "See you tomorrow!"]}
          onPressHome={() => router.push('/')}
        />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StandardHeader
        title="Daily Sliders"
        onBack={() => router.back()}
        rightContent={
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{`${Math.round(progress)}%`}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mindfulness Practice moved after Sleep Quality - only for .ex users */}
        {userExtension === 'ex' && (
          <View style={styles.section}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <QuestionIcons.mindfulness />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.sectionTitle}>Mindfulness Practice</Text>
                <Text style={styles.sectionSubtitle}>Have you done mindfulness practice today?</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  mindfulnessPractice === 'yes' && styles.choiceButtonSelected,
                  mindfulnessPractice === 'yes' && { backgroundColor: '#64C59A' }
                ]}
                onPress={() => setMindfulnessPractice('yes')}
              >
                <Text style={[
                  styles.choiceButtonText,
                  mindfulnessPractice === 'yes' && styles.choiceButtonTextSelected
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  mindfulnessPractice === 'no' && styles.choiceButtonSelected,
                  mindfulnessPractice === 'no' && { backgroundColor: '#EF4444' }
                ]}
                onPress={() => setMindfulnessPractice('no')}
              >
                <Text style={[
                  styles.choiceButtonText,
                  mindfulnessPractice === 'no' && styles.choiceButtonTextSelected
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
            {mindfulnessPractice === 'yes' && (
              <View style={styles.practiceDetailsContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.durationInput}
                    placeholder="e.g., 10"
                    value={practiceDuration}
                    onChangeText={setPracticeDuration}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>What did you practice? (Bullet points)</Text>
                  <TextInput
                    style={styles.logInput}
                    placeholder="• Breathing exercise\n• Body scan\n• Walking meditation"
                    value={practiceLog}
                    onChangeText={setPracticeLog}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
            )}
          </View>
        )}
        {/* Recording modal */}
        <Modal
          visible={showRecordingModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => { setShowRecordingModal(false); setSelectedRecording(null); }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { setShowRecordingModal(false); setSelectedRecording(null); }}>
            <View style={styles.recordingModalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{selectedRecording?.title}</Text>
                <TouchableOpacity onPress={() => { setShowRecordingModal(false); setSelectedRecording(null); }}>
                  <Icons.Close width={22} height={22} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.recordingWebviewContainer}>
                {selectedRecording ? (
                  <WebView
                    ref={webviewRef}
                    originWhitelist={["*"]}
                    source={{ html: getYouTubeHTML(selectedRecording.youtube_id) }}
                    style={{ flex: 1, backgroundColor: '#000' }}
                    onMessage={handleWebviewMessage}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>No recording selected</Text>
                  </View>
                )}
              </View>
              <View style={{ padding: 12 }}>
                <Text style={styles.recordingDesc}>{selectedRecording?.description || 'No description'}</Text>
                <Text style={[styles.recordingDesc, { marginTop: 8 }]}>Seconds watched: {playbackSeconds}</Text>
                {selectedRecording && (
                  <TouchableOpacity
                    style={[styles.playButton, { marginTop: 12 }]}
                    onPress={() => {
                      const url = `https://www.youtube.com/watch?v=${selectedRecording.youtube_id}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Open in YouTube</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        </Modal>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.stress />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Stress Level</Text>
              <Text style={styles.sectionSubtitle}>How stressed do you feel today? (1-5)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <Animated.View
              style={[styles.iconLarge, { width: 80, height: 80 }, {
                transform: [
                  {
                    translateX: stressLevel
                      ? stressAnimation.interpolate({
                        inputRange: [1, 2, 3, 4, 5],
                        outputRange: [-30, -15, 0, 15, 30]
                      })
                      : 0
                  }
                ]
              }]}
            >
              {(() => {
                const IconComp = getStressIcon();
                return IconComp ? <IconComp width={80} height={80} /> : null;
              })()}
            </Animated.View>
          </View>
          <View style={styles.sliderSimpleContainer}>
            <View style={styles.emotionRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.emotionButton,
                    stressLevel === i + 1 && styles.emotionButtonSelected,
                    stressLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setStressLevel(i + 1)}
                >
                  {(() => {
                    const IconComp = Emojis.Stress[i];
                    return IconComp ? <IconComp width={28} height={28} /> : null;
                  })()}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Low</Text>
              <Text style={styles.label}>High</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.mood />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Mood Level</Text>
              <Text style={styles.sectionSubtitle}>How is your mood today? (1 Bad - 5 Good)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <View style={[styles.iconLarge, { width: 80, height: 80 }]}>
              {(() => {
                const IconComp = getMoodIcon();
                return IconComp ? <IconComp width={80} height={80} /> : null;
              })()}
            </View>
          </View>
          <View style={styles.sliderSimpleContainer}>
            <View style={styles.emotionRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.emotionButton,
                    moodLevel === i + 1 && styles.emotionButtonSelected,
                    moodLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setMoodLevel(i + 1)}
                >
                  {(() => {
                    const IconComp = Emojis.Mood[i];
                    return IconComp ? <IconComp width={28} height={28} /> : null;
                  })()}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Bad</Text>
              <Text style={styles.label}>Good</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.factors />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Factors Influencing Mood</Text>
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
            <TouchableOpacity
              style={[
                styles.factorTag,
                selectedFactors.includes('Other') && styles.factorTagSelected,
                selectedFactors.includes('Other') && { backgroundColor: getStressColor() }
              ]}
              onPress={() => toggleFactor('Other')}
            >
              <Text style={[
                styles.factorText,
                selectedFactors.includes('Other') && styles.factorTextSelected
              ]}>
                Other
              </Text>
            </TouchableOpacity>
          </View>
          {selectedFactors.includes('Other') && (
            <View style={styles.otherFactorContainer}>
              <Text style={styles.otherFactorLabel}>Please specify:</Text>
              <TextInput
                style={styles.otherFactorInput}
                placeholder="Enter other factor..."
                value={otherFactor}
                onChangeText={setOtherFactor}
                multiline
              />
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.schedule />
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
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.sleep />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Sleep Quality</Text>
              <Text style={styles.sectionSubtitle}>How was your sleep quality? (1 Poor - 5 Excellent)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <View style={[styles.iconLarge, { width: 80, height: 80 }]}>
              {(() => {
                const IconComp = getSleepIcon();
                return IconComp ? <IconComp width={80} height={80} /> : null;
              })()}
            </View>
          </View>
          <View style={styles.sliderSimpleContainer}>
            <View style={styles.emotionRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.emotionButton,
                    sleepQuality === i + 1 && styles.emotionButtonSelected,
                    sleepQuality === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setSleepQuality(i + 1)}
                >
                  {(() => {
                    const IconComp = Emojis.SleepQuality[i];
                    return IconComp ? <IconComp width={28} height={28} /> : null;
                  })()}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Poor</Text>
              <Text style={styles.label}>Excellent</Text>
            </View>
          </View>
        </View>
        {/* Weekly recordings (YouTube) - moved after Mindfulness Practice */}
        {userExtension === 'ex' && (
          <View style={styles.section}>
            <View style={styles.questionHeader}>
              <View style={styles.iconCircle}>
                <QuestionIcons.recording />
              </View>
              <View style={styles.questionText}>
                <Text style={styles.sectionTitle}>This Week's Recording</Text>
                <Text style={styles.sectionSubtitle}>Guided practice curated for this week</Text>
              </View>
            </View>
            {loadingRecordings ? (
              <ActivityIndicator size="small" color="#64C59A" />
            ) : (weeklyRecordings && weeklyRecordings.length > 0) ? (
              weeklyRecordings.map((rec: any) => (
                <View key={rec.id} style={styles.recordingCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordingTitle}>{rec.title}</Text>
                    {rec.description ? <Text style={styles.recordingDesc} numberOfLines={2}>{rec.description}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => { setSelectedRecording(rec); setShowRecordingModal(true); }}
                  >
                    <Icons.Play width={20} height={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: '#666' }}>No recordings available this week.</Text>
            )}
          </View>
        )}
        <View style={styles.section}>
          <View style={styles.questionHeader}>
            <View style={styles.iconCircle}>
              <QuestionIcons.relaxation />
            </View>
            <View style={styles.questionText}>
              <Text style={styles.sectionTitle}>Relaxation Level</Text>
              <Text style={styles.sectionSubtitle}>How relaxed do you feel right now? (1-5)</Text>
            </View>
          </View>
          <View style={styles.stressVisualContainer}>
            <View style={[styles.iconLarge, { width: 80, height: 80 }]}>
              {(() => {
                const IconComp = getRelaxationIcon();
                return IconComp ? <IconComp width={80} height={80} /> : null;
              })()}
            </View>
          </View>
          <View style={styles.sliderSimpleContainer}>
            <View style={styles.emotionRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.emotionButton,
                    relaxationLevel === i + 1 && styles.emotionButtonSelected,
                    relaxationLevel === i + 1 && { borderColor: getStressColor(), backgroundColor: getStressColor() }
                  ]}
                  onPress={() => setRelaxationLevel(i + 1)}
                >
                  {(() => {
                    // Reusing Stress emojis for relaxation (reversed)
                    const IconComp = Emojis.Stress[4 - i];
                    return IconComp ? <IconComp width={28} height={28} /> : null;
                  })()}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.labels}>
              <Text style={styles.label}>Stressed</Text>
              <Text style={styles.label}>Relaxed</Text>
            </View>
          </View>
        </View>
        {!showCompletion && (
          <AppButton
            title="Submit Wellness Data"
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        )}
        {showCompletion && (
          <SuccessScreen
            title="Great Job Today!"
            subtitle={["You've completed your daily mindfulness routine.", "You're all set. Let's meet again tomorrow!"]}
            onPressHome={() => router.push('/')}
          />
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
  professionalHeader: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  // progressContainer: {
  // marginTop: 20,
  // },
  // progressBar: {
  // height: 6,
  // backgroundColor: '#E8F5F1',
  // borderRadius: 3,
  // overflow: 'hidden',
  // },
  // progressFill: {
  // height: '100%',
  // backgroundColor: '#64C59A',
  // },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    padding: 24,
    paddingBottom: 80,
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
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 3,
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
  iconLarge: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderSimpleContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 4 
  },
  emotionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionButtonSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
  },
  thumbContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5F1',
    borderWidth: 2,
    borderColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbActive: {
    backgroundColor: '#64C59A',
    transform: [{ scale: 1.1 }],
  },
  moodThumbEmoji: {
    fontSize: 24,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6F6EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  // Recordings
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FDFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  recordingDesc: {
    fontSize: 13,
    color: '#666',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#64C59A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  recordingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  recordingWebviewContainer: {
    height: 220,
    backgroundColor: '#000'
  },
  modalTableRow: {
    padding: 12,
  },
  modalTableCell: {
    fontSize: 14,
    color: '#333',
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSmallLabel: {
    fontSize: 12,
    color: '#8CAFA0',
    fontWeight: '600',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  factorTag: {
    backgroundColor: '#F0F9F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
  otherFactorContainer: {
    marginTop: 20,
    width: '100%',
  },
  otherFactorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  otherFactorInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
    minHeight: 60,
    textAlignVertical: 'top',
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
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    shadowOffset: { width: 0, height: 2 },
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  choiceButton: {
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#E8F5F1',
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  choiceButtonSelected: {
    borderColor: '#fff',
  },
  choiceButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  choiceButtonTextSelected: {
    color: '#fff',
  },
  practiceDetailsContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
  },
  logInput: {
    borderWidth: 1,
    borderColor: '#E8F5F1',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFEFD',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  promptContainer: {
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFEAAA',
  },
  promptText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});