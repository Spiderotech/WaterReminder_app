import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import { generateWaterGoal } from '../utils/hydrationUtils';
import { saveUserProfile } from '../utils/userUtils';
import { saveReminders, Reminder } from '../utils/reminderUtils';
import { scheduleReminderNotifications } from '../utils/notificationUtils';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 350 || height < 650;
const isShortDevice = height < 720;

// Responsive values
const padding = isSmallDevice ? 14 : 24;
const titleFontSize = isSmallDevice ? 34 : 42;
const subtitleFontSize = isSmallDevice ? 15 : 18;
const lottieSize = isSmallDevice ? 72 : isShortDevice ? 104 : 150;
const footerFontSize = isSmallDevice ? 11 : 14;
const BLUE = '#16b8ff';
const DEEP_BLUE = '#0058ff';
const CYAN = '#26d7ff';
const PURPLE = '#a46cff';
const BG = '#020918';
const PANEL = 'rgba(7, 24, 62, 0.74)';
const PANEL_SOFT = 'rgba(12, 34, 78, 0.56)';
const BORDER = 'rgba(76, 116, 190, 0.45)';
const MUTED = '#c8d2ee';

const parseTimeToMinutes = (time = '06:30') => {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
};

const normalizeMinutes = (minutes: number) => {
  const day = 24 * 60;
  return ((Math.round(minutes) % day) + day) % day;
};

const minutesToHHMM = (minutes: number) => {
  const normalized = normalizeMinutes(minutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatTime12 = (time = '06:30') => {
  const [hourValue = '0', minuteValue = '0'] = time.split(':');
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
};

const buildThreeReminderPlan = (wakeTime = '06:30', sleepTime = '23:00', planType = 'smart') => {
  const wake = parseTimeToMinutes(wakeTime);
  let sleep = parseTimeToMinutes(sleepTime);

  if (sleep <= wake) {
    sleep += 24 * 60;
  }

  const activeWindow = Math.max(6 * 60, sleep - wake);
  const offsets = planType === 'performance'
    ? [30, activeWindow * 0.45, activeWindow - 210]
    : [60, activeWindow * 0.48, activeWindow - 180];
  const labels = planType === 'performance'
    ? ['Early Hydration', 'Mid-Day Boost', 'Post Activity']
    : ['Morning Boost', 'Focus Time', 'Evening Recovery'];

  return [
    { id: 'morning', time: minutesToHHMM(wake + offsets[0]), label: labels[0] },
    { id: 'afternoon', time: minutesToHHMM(wake + offsets[1]), label: labels[1] },
    { id: 'evening', time: minutesToHHMM(wake + offsets[2]), label: labels[2] },
  ];
};

const toReminderRecords = (plan: Array<{ id: string; time: string }>): Reminder[] => (
  plan.map((item) => ({
    id: item.id,
    time: `${item.time}:00`,
    enabled: true,
  }))
);

const GeneratingPlanScreen = ({ navigation, route }: any) => {
  const { userData = {} } = route.params || {};

  const progress = useRef(new Animated.Value(0)).current;
  const [displayedPercent, setDisplayedPercent] = useState(0);
  const planType = userData.planType || 'smart';
  const dailyGoal = userData.dailyGoal || 2000;
  const unit = userData.dailyGoalUnit || 'mL';
  const planName = planType === 'performance'
    ? 'Performance Plan'
    : planType === 'custom'
      ? 'Custom Plan'
      : 'Smart Plan';
  const planAccent = planType === 'performance'
    ? PURPLE
    : planType === 'custom'
      ? CYAN
      : BLUE;
  const reminderPlan = useMemo(() => (
    userData.reminderPlan?.length
      ? userData.reminderPlan
      : buildThreeReminderPlan(userData.wakeUpTime, userData.sleepTime, planType)
  ), [planType, userData]);
  const progressFillStyle = useMemo(() => ({
    width: `${displayedPercent}%` as `${number}%`,
  }), [displayedPercent]);
  const lottieStyle = useMemo(() => ({
    width: lottieSize,
    height: lottieSize,
  }), []);
  const planAccentTextStyle = useMemo(() => ({
    color: planAccent,
  }), [planAccent]);
  const planAccentBorderStyle = useMemo(() => ({
    borderColor: planAccent,
  }), [planAccent]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const id = progress.addListener(({ value }) => {
      setDisplayedPercent(Math.round(value * 100));
    });

    const timeout = setTimeout(async () => {
      try {
        // 1. Save user profile
        await saveUserProfile(userData);

        // 2. Generate fallback hydration goal range
        const { min, max } = generateWaterGoal(userData);
        const selectedGoal = userData.dailyGoal || 2000;
        const selectedPlan = userData.planType || 'smart';
        const selectedReminderPlan = userData.reminderPlan?.length
          ? userData.reminderPlan
          : buildThreeReminderPlan(userData.wakeUpTime, userData.sleepTime, selectedPlan);
        const reminders = toReminderRecords(selectedReminderPlan);

        // Save selected onboarding plan and fixed 3 reminders.
        await AsyncStorage.setItem('hydrationGoal', JSON.stringify(selectedGoal));
        await AsyncStorage.setItem('hydrationUnit', userData.dailyGoalUnit || 'mL');
        await AsyncStorage.setItem('hydrationGoalRange', JSON.stringify({ min, max }));
        await AsyncStorage.setItem('hydrationGoalChoice', selectedPlan);
        await AsyncStorage.setItem('selectedHydrationPlan', JSON.stringify({
          planType: selectedPlan,
          dailyGoal: selectedGoal,
          unit: userData.dailyGoalUnit || 'mL',
          reminders: selectedReminderPlan,
        }));
        await saveReminders(reminders);
        await scheduleReminderNotifications(reminders);

        // 3. Go straight into the app. Goal selection now happens in onboarding.
        navigation.replace('Home');
      } catch (error) {
        console.error('Error during hydration plan generation:', error);
      }
    }, 3000);

    return () => {
      progress.removeListener(id);
      clearTimeout(timeout);
    };
  }, [navigation, progress, userData]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: padding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loaderCard}>
          <View style={styles.lottieHalo}>
            <LottieView
              source={require('../assets/progress.json')}
              autoPlay
              loop
              style={lottieStyle}
            />
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Generating plan</Text>
            <Text style={styles.percentText}>{displayedPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressFillStyle]} />
          </View>
          <Text style={[styles.footer, styles.footerSize]}>
            Saving profile, water target, and reminder schedule.
          </Text>
        </View>

        <View style={[styles.planCard, planAccentBorderStyle]}>
          <View style={styles.planHeader}>
            <View style={styles.planIcon}>
              <Image
                source={require('../assets/info1.png')}
                style={styles.planIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.planTitleWrap}>
              <Text style={[styles.planBadge, planAccentTextStyle]}>Selected plan</Text>
              <Text style={styles.planTitle}>{planName}</Text>
            </View>
            <View style={styles.goalWrap}>
              <Text style={[styles.goalValue, planAccentTextStyle]}>{dailyGoal}</Text>
              <Text style={styles.goalUnit}>{unit}/day</Text>
            </View>
          </View>

          <View style={styles.reminderDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>3 REMINDERS PER DAY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.reminderRow}>
            {reminderPlan.slice(0, 3).map((item: { id: string; time: string; label: string }) => (
              <View key={item.id} style={styles.reminderItem}>
                <Text style={styles.reminderIcon}>
                  {item.id === 'evening' ? '☾' : '☀'}
                </Text>
                <Text style={styles.reminderTime}>{formatTime12(item.time)}</Text>
                <Text style={styles.reminderLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusCheck}>✓</Text>
            <Text style={styles.statusText}>Personal profile prepared</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusCheck}>✓</Text>
            <Text style={styles.statusText}>Daily water target calculated</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusCheck}>✓</Text>
            <Text style={styles.statusText}>Reminder notifications scheduled</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GeneratingPlanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    justifyContent: 'center',
    minHeight: height,
    paddingBottom: isSmallDevice ? 14 : 24,
    paddingTop: isSmallDevice ? 14 : 24,
  },
  topGlow: {
    position: 'absolute',
    top: -130,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 116, 255, 0.28)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(31, 216, 255, 0.16)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  heroCopy: {
    flex: 1,
  },
  heroImage: {
    width: width * 0.31,
    height: width * 0.28,
    marginLeft: 10,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    lineHeight: titleFontSize * 1.12,
  },
  titleSize: {
    fontSize: titleFontSize,
  },
  titleAccent: {
    color: BLUE,
  },
  subtitle: {
    color: MUTED,
    lineHeight: subtitleFontSize * 1.42,
    marginTop: 12,
  },
  subtitleSize: {
    fontSize: subtitleFontSize,
  },
  loaderCard: {
    alignItems: 'center',
    backgroundColor: PANEL,
    borderColor: BLUE,
    borderRadius: isSmallDevice ? 22 : 28,
    borderWidth: 1,
    padding: isSmallDevice ? 14 : isShortDevice ? 18 : 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  lottieHalo: {
    width: isSmallDevice ? 96 : isShortDevice ? 132 : 184,
    height: isSmallDevice ? 96 : isShortDevice ? 132 : 184,
    borderRadius: isSmallDevice ? 48 : isShortDevice ? 66 : 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 88, 255, 0.18)',
    marginBottom: isSmallDevice ? 8 : 12,
  },
  progressHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: isSmallDevice ? 2 : 6,
    marginBottom: isSmallDevice ? 8 : 10,
  },
  progressLabel: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : 18,
    fontWeight: '700',
  },
  percentText: {
    color: BLUE,
    fontSize: isSmallDevice ? 20 : 28,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: isSmallDevice ? 9 : 12,
    borderRadius: 99,
    backgroundColor: 'rgba(82, 103, 159, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: DEEP_BLUE,
    borderColor: CYAN,
    borderWidth: 1,
  },
  footer: {
    color: MUTED,
    textAlign: 'center',
    marginTop: isSmallDevice ? 10 : 14,
  },
  footerSize: {
    fontSize: footerFontSize,
  },
  planCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: isSmallDevice ? 20 : 26,
    borderWidth: 1,
    marginTop: isSmallDevice ? 12 : 18,
    padding: isSmallDevice ? 12 : 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    width: isSmallDevice ? 46 : 66,
    height: isSmallDevice ? 46 : 66,
    borderRadius: isSmallDevice ? 23 : 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 88, 255, 0.28)',
    marginRight: isSmallDevice ? 9 : 14,
  },
  planIconImage: {
    width: isSmallDevice ? 34 : 48,
    height: isSmallDevice ? 34 : 48,
  },
  planTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  planBadge: {
    fontSize: isSmallDevice ? 11 : 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  planTitle: {
    color: '#fff',
    fontSize: isSmallDevice ? 17 : 25,
    fontWeight: '800',
  },
  goalWrap: {
    alignItems: 'flex-end',
  },
  goalValue: {
    fontSize: isSmallDevice ? 24 : 36,
    fontWeight: '900',
  },
  goalUnit: {
    color: MUTED,
    fontSize: isSmallDevice ? 11 : 14,
  },
  reminderDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isSmallDevice ? 10 : 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(47, 190, 255, 0.25)',
  },
  dividerText: {
    color: BLUE,
    fontSize: isSmallDevice ? 9 : 12,
    fontWeight: '800',
    marginHorizontal: isSmallDevice ? 6 : 10,
  },
  reminderRow: {
    flexDirection: 'row',
  },
  reminderItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 2 : 4,
  },
  reminderIcon: {
    color: BLUE,
    fontSize: isSmallDevice ? 18 : 25,
    marginBottom: isSmallDevice ? 3 : 6,
  },
  reminderTime: {
    color: '#fff',
    fontSize: isSmallDevice ? 11 : 15,
    fontWeight: '800',
  },
  reminderLabel: {
    color: MUTED,
    fontSize: isSmallDevice ? 9 : 12,
    lineHeight: isSmallDevice ? 12 : 16,
    textAlign: 'center',
    marginTop: 3,
  },
  statusCard: {
    backgroundColor: 'rgba(5, 20, 50, 0.72)',
    borderColor: BORDER,
    borderRadius: isSmallDevice ? 18 : 22,
    borderWidth: 1,
    marginTop: isSmallDevice ? 12 : 18,
    padding: isSmallDevice ? 12 : 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isSmallDevice ? 3 : 5,
  },
  statusCheck: {
    width: isSmallDevice ? 22 : 26,
    height: isSmallDevice ? 22 : 26,
    borderRadius: isSmallDevice ? 11 : 13,
    backgroundColor: BLUE,
    color: '#fff',
    fontSize: isSmallDevice ? 14 : 17,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 22 : 26,
    marginRight: isSmallDevice ? 9 : 12,
  },
  statusText: {
    color: MUTED,
    flex: 1,
    fontSize: isSmallDevice ? 13 : 15,
  },
});
