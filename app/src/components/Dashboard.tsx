import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  ImageBackground,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  withTiming,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Pattern,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

import { supabase } from "../lib/supabase";
import { Icons } from "./common/AppIcons";

const { width } = Dimensions.get("window");

/**
 * Mindfulness tips to display for experimental group (ex).
 */
const MINDFULNESS_TIPS = [
  "Take a moment to breathe deeply. Notice how your body feels right now, without judgment.",
  "Pause and observe one thing you can see, hear, and feel in this moment.",
  "Let go of yesterday and tomorrow. This moment is all that exists.",
  "Smile gently — even a small one changes your brain chemistry.",
  "Wherever you are, be there completely.",
  "Your breath is your anchor. Return to it whenever you feel lost.",
  "You don't need to fix anything right now. Just notice.",
  "Every exhale is a letting go.",
  "You are exactly where you need to be.",
  "This too shall pass. Breathe through it.",
];

/**
 * Control facts to display for control group (cg).
 */
const CONTROL_FACTS = [
  "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.",
  "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
  "Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.",
  "A day on Venus is longer than a year on Venus.",
  "Bananas are curved because they grow towards the sun.",
  "The first computer bug was a real moth found in a Harvard Mark II computer in 1947.",
  "Water covers about 71% of the Earth's surface, but oceans hold 96.5% of all water.",
  "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes.",
  "Oxford University is older than the Aztec Empire.",
  "There are more stars in the universe than grains of sand on all the Earth's beaches.",
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SkeletonItem = ({
  style,
  borderRadius = 12,
}: {
  style?: any;
  borderRadius?: number;
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: "#E1E9E5", borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
};

/**
 * Dashboard Component
 *
 * The main landing screen for the application. It displays:
 * - A daily tip or fact based on user group.
 * - Progress statistics (streak, consistency).
 * - A "Mindfulness Path" map (Daily -> Weekly -> Monthly).
 * - Account management access.
 */
export default function Dashboard({
  session,
  onNavigateToAboutMe,
}: {
  session: any;
  onNavigateToAboutMe: () => void;
}) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }

      // Refresh data
      if (session?.user?.id) {
        Promise.all([fetchResearchID(), fetchUserProgress()]);
      }
    }, [session])
  );

  // State for content rotation and user progress
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [researchID, setResearchID] = useState("");
  const [userExtension, setUserExtension] = useState<"ex" | "cg" | "">("");
  const [aboutMeCompleted, setAboutMeCompleted] = useState(false);

  // Map node completion states
  const [dailyDoneToday, setDailyDoneToday] = useState(false);
  const [weeklyDoneThisWeek, setWeeklyDoneThisWeek] = useState(false);
  const [monthlyDoneThisMonth, setMonthlyDoneThisMonth] = useState(false);

  // Animation values
  const streakProgress = useSharedValue(0);
  const consistencyProgress = useSharedValue(0);

  const animatedPropsStreak = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - Math.min(1, streakProgress.value / 100)),
  }));

  const animatedPropsConsistency = useAnimatedProps(() => ({
    strokeDashoffset: 440 * (1 - consistencyProgress.value / 100),
  }));

  /**
   * Rotates the displayed tip or fact every 60 seconds.
   */
  useEffect(() => {
    const tipsLength =
      userExtension === "ex" ? MINDFULNESS_TIPS.length : CONTROL_FACTS.length;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tipsLength);
    }, 60000);
    return () => clearInterval(interval);
  }, [userExtension]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchResearchID(), fetchUserProgress()]);
      setLoading(false);
    };
    loadData();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchResearchID(), fetchUserProgress()]);
    setRefreshing(false);
  };

  /**
   * Fetches the user's research ID to determine their group (experimental vs control).
   */
  const fetchResearchID = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("researchID")
        .eq("id", session.user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data?.researchID) {
        setResearchID(data.researchID);
        if (data.researchID.endsWith(".ex")) setUserExtension("ex");
        else if (data.researchID.endsWith(".cg")) setUserExtension("cg");
      }

      setAboutMeCompleted(!!data?.researchID);
    } catch (error) {
      console.error("Error fetching research ID:", error);
    }
  };

  /**
   * Aggregates user progress metrics including streaks, consistency, and map node status.
   */
  const fetchUserProgress = async () => {
    if (!session?.user?.id) return;
    try {
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay() || 7;
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
      else startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Concurrent data fetching for optimal performance
      const [
        { data: streakData },
        { count: totalCount },
        { count: recentCount },
        { data: voiceRecordings },
        { count: monthlyMainCount },
      ] = await Promise.all([
        supabase
          .from("daily_sliders")
          .select("created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("daily_sliders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .gte("created_at", sixMonthsAgo.toISOString()),
        supabase
          .from("daily_sliders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("voice_recordings")
          .select("created_at")
          .eq("user_id", session.user.id)
          .gte("created_at", sixMonthsAgo.toISOString()),
        supabase
          .from("main_questionnaire_responses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .gte("submitted_at", startOfMonth.toISOString()),
      ]);

      // Calculate Streak
      let currentStreak = 0;
      let isDailyDone = false;
      if (streakData && streakData.length > 0) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const lastEntry = new Date(streakData[0].created_at);
        if (lastEntry >= startOfToday) {
          isDailyDone = true;
        }

        const entryDates = new Set(
          streakData.map((entry) => {
            const d = new Date(entry.created_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        // Check streak starting from today if done, otherwise from yesterday
        let checkDate = new Date(todayDate);
        if (!isDailyDone) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (entryDates.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // Calculate Consistency (last 30 days)
      const consistencyPercentage = recentCount
        ? Math.min(100, Math.round((recentCount / 30) * 100))
        : 0;

      // Calculate Weekly Progress
      const uniqueWeeksLines = voiceRecordings || [];
      const uniqueWeeks = new Set(
        uniqueWeeksLines.map((a) => {
          const d = new Date(a.created_at);
          const [year, week] = getWeekNumber(d);
          return `${year}-W${week.toString().padStart(2, "0")}`;
        })
      );
      const weeklyProgressPercentage = uniqueWeeks.size
        ? Math.min(100, Math.round((uniqueWeeks.size / 26) * 100))
        : 0;

      let isWeeklyDone = false;
      const [currentYear, currentWeek] = getWeekNumber(new Date());
      const currentWeekStr = `${currentYear}-W${currentWeek
        .toString()
        .padStart(2, "0")}`;
      if (uniqueWeeks.has(currentWeekStr)) {
        isWeeklyDone = true;
      }

      // Monthly Progress check
      const isMonthlyDone = (monthlyMainCount || 0) > 0;

      setStreak(currentStreak);
      setCompleted(totalCount || 0);
      setConsistency(consistencyPercentage);
      setWeeklyProgress(weeklyProgressPercentage);
      setDailyDoneToday(isDailyDone);
      setWeeklyDoneThisWeek(isWeeklyDone);
      setMonthlyDoneThisMonth(isMonthlyDone);

      streakProgress.value = withTiming(
        currentStreak > 10 ? 100 : currentStreak * 10,
        { duration: 1000 }
      );
      consistencyProgress.value = withTiming(consistencyPercentage, {
        duration: 1000,
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  };

  /**
   * Helper to get ISO week number.
   */
  function getWeekNumber(d: Date): [number, number] {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      (((d as any) - (yearStart as any)) / 86400000 + 1) / 7
    );
    return [d.getUTCFullYear(), weekNo];
  }

  const handleSignOut = async () => {
    setShowAccountModal(false);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Error", error.message);
              return;
            }
            // After sign-out, navigate directly to the auth route.
            router.replace("/auth" as any);
          } catch (error: any) {
            console.error("Error signing out:", error);
            Alert.alert("Error", error.message || "Failed to sign out");
          }
        },
      },
    ]);
  };

  const tipsArray = userExtension === "ex" ? MINDFULNESS_TIPS : CONTROL_FACTS;
  const currentTip = tipsArray[currentTipIndex % tipsArray.length];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#F8FDFC", "#E8F5F1"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, styles.mindText]}>Mind</Text>
          <Text style={[styles.headerTitle, styles.flowText]}>Flow</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          style={styles.avatarButton}
        >
          <Image
            source={require("../../assets/images/user.png")}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 0, paddingHorizontal: 28 }}
        >
          {/* Tip Card Skeleton */}
          <SkeletonItem
            style={{
              height: 180,
              width: "100%",
              borderRadius: 32,
              marginTop: 10,
            }}
          />

          {/* Journey Section Skeleton */}
          <View style={{ marginTop: 32 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <SkeletonItem style={{ width: 150, height: 30 }} />
              <SkeletonItem style={{ width: 100, height: 30 }} />
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <SkeletonItem
                style={{ width: "48%", height: 160, borderRadius: 160 }}
              />
              <SkeletonItem
                style={{ width: "48%", height: 160, borderRadius: 160 }}
              />
            </View>
          </View>

          {/* About Me Skeleton */}
          <SkeletonItem
            style={{
              height: 100,
              width: "100%",
              marginTop: 20,
              borderRadius: 24,
            }}
          />

          {/* Map Skeleton */}
          <View style={{ marginTop: 20 }}>
            <SkeletonItem
              style={{ width: 120, height: 30, marginBottom: 10 }}
            />
            <SkeletonItem
              style={{ height: 300, width: "100%", borderRadius: 24 }}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {userExtension && (
            <Animated.View entering={FadeIn.duration(1000)}>
              <LinearGradient
                colors={
                  userExtension === "ex"
                    ? ["#3bcc97ff", "#2E8A66"]
                    : ["#9B6B35", "#7A5424"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tipCard}
              >
                <Svg
                  style={StyleSheet.absoluteFillObject}
                  viewBox="0 0 100 100"
                  opacity={0.08}
                >
                  <Pattern
                    id="pattern"
                    patternUnits="userSpaceOnUse"
                    width="20"
                    height="20"
                  >
                    <Circle cx="10" cy="10" r="2" fill="#fff" />
                  </Pattern>
                  <Circle cx="50" cy="50" r="50" fill="url(#pattern)" />
                </Svg>
                <View style={styles.tipHeader}>
                  <View style={styles.tipIconCircle}>
                    <Icons.Mindfulness width={24} height={24} color="#fff" />
                  </View>
                  <Text style={styles.tipLabel}>
                    {userExtension === "ex"
                      ? "Daily Mindfulness Tip"
                      : "Fascinating Fact"}
                  </Text>
                </View>
                <Text style={styles.tipText}>{currentTip}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Your Journey Statistics */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(800)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Journey</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/progress")}
              >
                <Text style={styles.viewAllText}>Explore More</Text>
                <Icons.Forward width={16} height={16} color="#64C59A" />
              </TouchableOpacity>
            </View>

            <View style={styles.enhancedProgressGrid}>
              {/* Streak Circle */}
              <View style={styles.enhancedProgressItem}>
                <View style={styles.circularProgressContainer}>
                  <Svg width="160" height="160" viewBox="0 0 160 160">
                    <Circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#E8F5F1"
                      strokeWidth="12"
                      fill="none"
                    />
                    <AnimatedCircle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#64C59A"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="440"
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      animatedProps={animatedPropsStreak}
                    />
                    <Circle cx="80" cy="80" r="50" fill="#F8FDFC" />
                  </Svg>
                  <View style={styles.progressCenter}>
                    <Text style={styles.enhancedProgressNumber}>{streak}</Text>
                    <Text style={styles.enhancedProgressLabel}>Day Streak</Text>
                  </View>
                </View>
              </View>

              {/* Consistency Circle */}
              <View style={styles.enhancedProgressItem}>
                <View style={styles.circularProgressContainer}>
                  <Svg width="160" height="160" viewBox="0 0 160 160">
                    <Circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#E8F5F1"
                      strokeWidth="12"
                      fill="none"
                    />
                    <AnimatedCircle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#4CAF85"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="440"
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      animatedProps={animatedPropsConsistency}
                    />
                    <Circle cx="80" cy="80" r="50" fill="#F8FDFC" />
                  </Svg>
                  <View style={styles.progressCenter}>
                    <Text style={styles.enhancedProgressNumber}>
                      {consistency}%
                    </Text>
                    <Text style={styles.enhancedProgressLabel}>
                      Consistency
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* About Me */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(800)}
            style={{ paddingHorizontal: 28, marginBottom: 20 }}
          >
            <TouchableOpacity onPress={onNavigateToAboutMe} activeOpacity={0.9}>
              <View
                style={[
                  styles.aboutMeCard,
                  {
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#eee",
                  },
                ]}
              >
                <View
                  style={[
                    styles.aboutMeIconContainer,
                    { backgroundColor: "#F8FDFC" },
                  ]}
                >
                  <Icons.User width={24} height={24} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aboutMeTitle, { color: "#000" }]}>
                    {aboutMeCompleted ? "About Me" : "Start From Here"}
                  </Text>
                  <Text style={[styles.aboutMeSubtitle, { color: "#666" }]}>
                    {aboutMeCompleted
                      ? "View your details"
                      : "We want to get to know you"}
                  </Text>
                </View>
                {!aboutMeCompleted && (
                  <Icons.Check width={24} height={24} color="#000" />
                )}
                {aboutMeCompleted && (
                  <Icons.Forward width={20} height={20} color="#ccc" />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Mindfulness Path Map */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.mapSection}
          >
            <Text style={styles.mapTitle}>Your Path</Text>
            <Text style={styles.mapSubtitle}>Daily • Weekly • Monthly</Text>

            <View style={styles.mapContainer}>
              {/* Path: Start (Top Right) -> Middle (Left) -> End (Bottom Center) */}
              <Svg
                width={width - 56}
                height={400}
                viewBox="0 0 300 400"
                style={styles.mapSvg}
              >
                <Defs>
                  <SvgLinearGradient
                    id="pathGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0" stopColor="#A8E6CF" stopOpacity="0.6" />
                    <Stop offset="1" stopColor="#64C59A" stopOpacity="0.8" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M 220 60 C 220 120, 80 120, 88 200 C 80 280, 170 280, 190 340"
                  stroke="url(#pathGradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="10 6"
                  strokeLinecap="round"
                />
              </Svg>

              {/* Node 1: Daily Sliders (Top Right) -> Sun Icon */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/daily-sliders")}
                style={[styles.mapNode, { top: 20, right: 30 }]}
              >
                <View
                  style={[
                    styles.nodeCircle,
                    dailyDoneToday && styles.nodeCircleDone,
                  ]}
                >
                  <Icons.Sun
                    width={32}
                    height={32}
                    color={dailyDoneToday ? "#fff" : "#FFA500"}
                  />
                </View>
                <View style={styles.nodeLabelContainer}>
                  <Text style={styles.nodeLabel}>Daily Sliders</Text>
                  <Text
                    style={[
                      styles.nodeStatus,
                      dailyDoneToday && styles.nodeStatusDone,
                      !dailyDoneToday && styles.nodeStatusActive,
                    ]}
                  >
                    {dailyDoneToday ? "Completed" : "Start Today"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Node 2: Weekly (Middle Left) -> Feather Icon */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/weekly-whispers")}
                style={[styles.mapNode, { top: 160, left: 30 }]}
              >
                <View
                  style={[
                    styles.nodeCircle,
                    weeklyDoneThisWeek && styles.nodeCircleDone,
                  ]}
                >
                  <Icons.Feather
                    width={32}
                    height={32}
                    color={weeklyDoneThisWeek ? "#fff" : "#64C59A"}
                  />
                </View>
                <View style={styles.nodeLabelContainer}>
                  <Text style={styles.nodeLabel}>Weekly Whispers</Text>
                  <Text
                    style={[
                      styles.nodeStatus,
                      weeklyDoneThisWeek && styles.nodeStatusDone,
                      dailyDoneToday &&
                      !weeklyDoneThisWeek &&
                      styles.nodeStatusActive,
                    ]}
                  >
                    {weeklyDoneThisWeek ? "Completed" : "Start Week"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Node 3: Core Insights (Bottom Center) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/main-questionnaire")}
                style={[
                  styles.mapNode,
                  { top: 310, left: (width - 56 - 150) / 2 },
                ]}
              >
                <View
                  style={[
                    styles.nodeCircle,
                    monthlyDoneThisMonth && styles.nodeCircleDone,
                    styles.nodeCircleLarge,
                  ]}
                >
                  <Icons.Mindfulness
                    width={40}
                    height={40}
                    color={monthlyDoneThisMonth ? "#fff" : "#64C59A"}
                  />
                </View>
                <View style={styles.nodeLabelContainer}>
                  <Text style={styles.nodeLabel}>Core Insights</Text>
                  <Text
                    style={[
                      styles.nodeStatus,
                      monthlyDoneThisMonth && styles.nodeStatusDone,
                      weeklyDoneThisWeek &&
                      !monthlyDoneThisMonth &&
                      styles.nodeStatusActive,
                    ]}
                  >
                    {monthlyDoneThisMonth ? "Completed" : "Monthly Check-in"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Account Modal */}
          <Modal visible={showAccountModal} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAccountModal(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setShowAccountModal(false);
                    router.push("/account");
                  }}
                >
                  <Image
                    source={require("../../assets/images/user.png")}
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalText}>Manage Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalRow, styles.logoutRow]}
                  onPress={handleSignOut}
                >
                  <Icons.Close width={24} height={24} color="#EF4444" />
                  <Text style={[styles.modalText, styles.logoutText]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8F5F1" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitleContainer: { flexDirection: "row", alignItems: "center" },
  mindText: { color: "#3bcc97ff" },
  flowText: { color: "#2E8A66" },
  headerTitle: { fontSize: 36, fontWeight: "900", letterSpacing: 0.5 },
  avatarButton: { padding: 0, borderRadius: 40, overflow: "hidden" },
  avatarImage: {
    width: 48,
    height: 48,
    resizeMode: "cover",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
  },

  tipCard: {
    marginHorizontal: 28,
    marginTop: 10,
    borderRadius: 32,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  tipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipLabel: { color: "#fff", fontSize: 15, fontWeight: "700", opacity: 0.95 },
  tipText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "500",
    textAlign: "left",
    opacity: 0.95,
  },

  section: { paddingHorizontal: 28, marginTop: 32 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: "#64C59A",
    fontWeight: "700",
    marginRight: 6,
  },

  enhancedProgressGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  enhancedProgressItem: { width: "48%", alignItems: "center" },
  circularProgressContainer: { position: "relative" },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedProgressNumber: { fontSize: 32, fontWeight: "900", color: "#2E8A66" },
  enhancedProgressLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 0,
    fontWeight: "600",
  },

  // Advanced Map Styles
  mapSection: { marginHorizontal: 28, marginTop: 10, marginBottom: 40 },
  mapTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
    fontWeight: "500",
  },
  mapContainer: { height: 400, position: "relative", marginTop: 10 },
  mapSvg: { position: "absolute", top: 0, left: 0 },

  mapNode: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nodeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#A8E6CF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#64C59A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  nodeCircleLarge: { width: 80, height: 80, borderRadius: 40 },
  nodeCircleDone: { backgroundColor: "#64C59A", borderColor: "#4CAF85" },

  nodeLabelContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nodeLabel: { fontSize: 15, fontWeight: "700", color: "#333" },
  nodeStatus: { fontSize: 12, fontWeight: "600", color: "#888", marginTop: 2 },
  nodeStatusDone: { color: "#64C59A", fontWeight: "700" },
  nodeStatusActive: { color: "#FFA500", fontWeight: "700" },

  // About Me Card
  aboutMeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  aboutMeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aboutMeTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  aboutMeSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 28,
  },
  modalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 20 },
  modalIcon: { width: 24, height: 24, resizeMode: "contain" },
  logoutRow: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
    paddingTop: 20,
  },
  modalText: { marginLeft: 16, fontSize: 18, color: "#333", fontWeight: "600" },
  logoutText: { color: "#EF4444" },
});
