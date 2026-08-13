import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  NativeModules,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from '../components/AppSafeAreaView';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import HydrationBottle, { getHydrationState } from '../components/HydrationBottle';
import { getTodayLogs, logWaterIntake } from '../utils/waterIntakeUtils';
import { getHydrationGoal, getUserProfile } from '../utils/userUtils';
import { useMainTabTheme } from '../constants/mainTabTheme';
import { completeHydrationSlot, DailyHydrationState, getDailyHydrationState } from '../services/hydrationService';
import { getHydrationGoalTypeLabel } from '../services/hydrationPlanService';
import { getStreak, StreakState } from '../services/streakService';
import { getWallet, Wallet } from '../services/walletService';
import { getActiveSlot, SlotKey, slotOrder } from '../services/v2Storage';
import { syncActiveCompetitionScore } from '../services/competitionService';
import { getMyVouchers, markVoucherDownloaded, UserVoucher } from '../services/voucherService';
import { refreshBackendWallet } from '../services/backendAuthService';

const { width, height } = Dimensions.get('window');
const isCompact = width < 370;
const isWideHome = width >= 430;

type HomeInfoKey =
  | 'hydration'
  | 'addWater'
  | 'wallet'
  | 'streak'
  | 'completion'
  | 'slots'
  | 'competition'
  | 'leaderboard';

type HomeInfoContent = {
  title: string;
  body: string;
  bullets: string[];
  accent: string;
  gradient: [string, string];
  border: string;
};


const coinSplashVectors = [
  { x: -86, y: -116, rotate: '-28deg' },
  { x: -48, y: -146, rotate: '18deg' },
  { x: 0, y: -132, rotate: '-12deg' },
  { x: 42, y: -154, rotate: '26deg' },
  { x: 82, y: -112, rotate: '-18deg' },
  { x: -66, y: -74, rotate: '34deg' },
  { x: 58, y: -68, rotate: '-32deg' },
  { x: -118, y: -92, rotate: '14deg' },
  { x: 112, y: -88, rotate: '-24deg' },
  { x: -102, y: -154, rotate: '42deg' },
  { x: 104, y: -158, rotate: '-40deg' },
  { x: -24, y: -184, rotate: '30deg' },
  { x: 24, y: -186, rotate: '-22deg' },
  { x: -8, y: -88, rotate: '10deg' },
  { x: -132, y: -128, rotate: '-34deg' },
  { x: 132, y: -126, rotate: '36deg' },
];

const copyToClipboard = (value?: string | null) => {
  if (!value) return;
  const nativeModules = NativeModules as {
    Clipboard?: { setString?: (text: string) => void };
    RNCClipboard?: { setString?: (text: string) => void };
  };
  const clipboard = nativeModules.Clipboard || nativeModules.RNCClipboard;

  if (clipboard?.setString) {
    clipboard.setString(value);
    Alert.alert('Code copied', 'Voucher code copied to clipboard.');
    return;
  }

  Alert.alert('Copy unavailable', 'Long press the voucher code to copy it.');
};

const slotMeta: Record<SlotKey, { title: string; icon: string; color: string }> = {
  morning: { title: 'Morning', icon: 'weather-sunny', color: '#FFC83D' },
  afternoon: { title: 'Afternoon', icon: 'white-balance-sunny', color: '#B447FF' },
  evening: { title: 'Evening', icon: 'moon-waning-crescent', color: '#9AA7FF' },
};

const slotSchedule: Record<SlotKey, { label: string }> = {
  morning: { label: 'Slot 1' },
  afternoon: { label: 'Slot 2' },
  evening: { label: 'Slot 3' },
};

const slotTimeLabels: Record<SlotKey, string> = {
  morning: '8:00 AM - 12:00 PM',
  afternoon: '12:00 PM - 5:00 PM',
  evening: '5:00 PM - 8:00 PM',
};

const homeInfoContent: Record<HomeInfoKey, HomeInfoContent> = {
  hydration: {
    title: 'Today Hydration',
    body: 'Your daily command center for total water, remaining goal, goal type, and completed hydration slots.',
    bullets: ['Water progress updates from every valid tap.', 'The bottle fill follows your daily goal percentage.', 'Completed slots help unlock rewards and streak progress.'],
    accent: '#18d5ff',
    gradient: ['#031329', '#061f42'],
    border: '#0B4BAB',
  },
  addWater: {
    title: 'Add Water',
    body: 'Use this card to log water quickly without leaving Home.',
    bullets: ['The first valid tap in the active slot completes that slot.', 'A completed slot earns 25 coins once per day.', 'Extra taps still add water, but do not repeat slot rewards.'],
    accent: '#b64dff',
    gradient: ['#100A2B', '#1b0d43'],
    border: '#5522A6',
  },
  wallet: {
    title: 'Wallet Preview',
    body: 'A compact view of your current rewards balance.',
    bullets: ['Coins come from slot completions, daily bonuses, spins, and rewards.', 'Diamonds are premium rewards used for features like competitions.', 'Open Rewards for the full wallet and reward history.'],
    accent: '#ffd15a',
    gradient: ['#0B1230', '#10183c'],
    border: '#2E3A6D',
  },
  streak: {
    title: 'Daily Streak',
    body: 'Streaks are based on full daily completion, not random water taps.',
    bullets: ['Complete Morning, Afternoon, and Evening slots to protect the streak.', 'Best streak tracks your strongest consistency record.', 'Missing all slots can break the streak.'],
    accent: '#ff9a35',
    gradient: ['#03152D', '#10123b'],
    border: '#083B78',
  },
  completion: {
    title: 'Daily Completion',
    body: 'Shows how many of the 3 fixed hydration slots are complete today.',
    bullets: ['Morning, Afternoon, and Evening are the app-wide slot model.', 'Completing all 3 slots unlocks the daily completion bonus.', 'This status also feeds streak and reward logic.'],
    accent: '#20e895',
    gradient: ['#02231F', '#062f33'],
    border: '#0C7B5C',
  },
  slots: {
    title: "Today's Slots",
    body: 'Your fixed daily reward slots for consistent hydration behavior.',
    bullets: ['Completed slots show a checked state and coin reward.', 'The current slot is highlighted until completed.', 'Slot status is reused in History, Digital Me, and Rewards.'],
    accent: '#8c62ff',
    gradient: ['#0E0B2E', '#15103d'],
    border: '#3E2078',
  },
  competition: {
    title: 'Competition Preview',
    body: 'A shortcut into weekly hydration challenges and rank-based rewards.',
    bullets: ['Competitions use hydration consistency and score progress.', 'Joining can require diamonds when backend validation is enabled.', 'Leaderboard scores may update on the next refresh cycle.'],
    accent: '#b540ff',
    gradient: ['#1E0C62', '#2b1177'],
    border: '#7432FF',
  },
  leaderboard: {
    title: 'Leaderboard Preview',
    body: 'Shows the path to rankings, competition score, and social progress.',
    bullets: ['Leaderboard ranking is expected to refresh hourly.', 'Your latest hydration score may appear after the next refresh.', 'Use this card to explore competition standings.'],
    accent: '#ffd15a',
    gradient: ['#10123B', '#181746'],
    border: '#2B2464',
  },
};

const avatarImages = {
  male_1: require('../assets/avatar_male_1.png'),
  male_2: require('../assets/avatar_male_2.png'),
  male_3: require('../assets/avatar_male_3.png'),
  male_4: require('../assets/avatar_male_4.png'),
  male_6: require('../assets/avatar_male_6.png'),
  male_7: require('../assets/avatar_male_7.png'),
  male_8: require('../assets/avatar_male_8.png'),
  male_9: require('../assets/avatar_male_9.png'),
  male_10: require('../assets/avatar_male_10.png'),
  male_12: require('../assets/avatar_male_12.png'),
  male_13: require('../assets/avatar_male_13.png'),
  male_14: require('../assets/avatar_male_14.png'),
  male_15: require('../assets/avatar_male_15.png'),
  female_1: require('../assets/avatar_female_1.png'),
  female_2: require('../assets/avatar_female_2.png'),
  female_3: require('../assets/avatar_female_3.png'),
  female_4: require('../assets/avatar_female_4.png'),
  female_5: require('../assets/avatar_female_5.png'),
  female_6: require('../assets/avatar_female_6.png'),
  female_7: require('../assets/avatar_female_7.png'),
  female_8: require('../assets/avatar_female_8.png'),
  female_9: require('../assets/avatar_female_9.png'),
  female_10: require('../assets/avatar_female_10.png'),
  female_11: require('../assets/avatar_female_11.png'),
  female_12: require('../assets/avatar_female_12.png'),
  female_13: require('../assets/avatar_female_13.png'),
};

type CupOptionAmount = 'default' | 'add' | number;

const cupOptionsBase = [
  { amount: 'default', icon: 'cup-water' },
  { amount: 'add', icon: 'plus-circle-outline' },
] as const;

const formatLiters = (amount: number) => `${(amount / 1000).toFixed(1)}L`;

const getAvatarSource = (profile: any) => {
  const avatarId = profile?.avatar as keyof typeof avatarImages | undefined;
  if (avatarId && avatarImages[avatarId]) {
    return avatarImages[avatarId];
  }

  return (profile?.gender || '').toLowerCase() === 'female'
    ? avatarImages.female_1
    : avatarImages.male_1;
};

const getHomeGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return {
      image: require('../assets/morning.png') as ImageSourcePropType,
      title: 'Good morning',
    };
  }

  if (hour < 17) {
    return {
      image: require('../assets/afternoon.png') as ImageSourcePropType,
      title: 'Good afternoon',
    };
  }

  return {
    image: require('../assets/evening.png') as ImageSourcePropType,
    title: 'Good night',
  };
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const coinSplashValues = React.useRef(coinSplashVectors.map(() => new Animated.Value(0))).current;
  const trophyPulseValue = React.useRef(new Animated.Value(0)).current;
  const tapPulseValue = React.useRef(new Animated.Value(0)).current;
  const tapInProgressRef = React.useRef(false);

  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState(2500);
  const [selectedCup, setSelectedCup] = useState<CupOptionAmount>('default');
  const [modalVisible, setModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customInputVisible, setCustomInputVisible] = useState(false);
  const [customCupOptions, setCustomCupOptions] = useState<Array<{ amount: number; icon: string; custom: true }>>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [goalCelebrated, setGoalCelebrated] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [goalType, setGoalType] = useState('Smart Plan');
  const [wallet, setWallet] = useState<Wallet>({ coins: 0, diamonds: 0, energyLevel: 7 });
  const [dailyState, setDailyState] = useState<DailyHydrationState>({ completedSlots: [] });
  const [dashboardReady, setDashboardReady] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [tapInProgress, setTapInProgress] = useState(false);
  const [streak, setStreak] = useState<StreakState>({ current: 0, best: 0 });
  const [activeInfoKey, setActiveInfoKey] = useState<HomeInfoKey | null>(null);
  const [showCoinSplash, setShowCoinSplash] = useState(false);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [activeVoucher, setActiveVoucher] = useState<UserVoucher | null>(null);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const activeSlot = getActiveSlot();
  const safeGoal = Math.max(goal, 1);
  const defaultSlotAmount = Math.max(Math.round(safeGoal / 3), 1);
  const selectedAmount = selectedCup === 'default'
    ? defaultSlotAmount
    : typeof selectedCup === 'number'
      ? selectedCup
      : defaultSlotAmount;
  const cupOptions = useMemo(
    () => [
      cupOptionsBase[0],
      ...customCupOptions,
      cupOptionsBase[1],
    ],
    [customCupOptions],
  );
  const fillPercent = Math.min((intake / safeGoal) * 100, 100);
  const remaining = Math.max(goal - intake, 0);
  const completedCount = dailyState.completedSlots.length;
  const activeSlotCompleted = dailyState.completedSlots.includes(activeSlot);
  const tapDisabled = !dashboardReady || dashboardLoading || tapInProgress || activeSlotCompleted;
  const showStoredDashboard = dashboardReady;
  const avatarSource = useMemo(() => getAvatarSource(profile), [profile]);
  const firstName = profile?.name || profile?.fullName || profile?.username || 'Username';
  const greetingCopy = useMemo(() => getHomeGreeting(), []);

  const loadWaterData = useCallback(async () => {
    const logs = await getTodayLogs();
    const total = logs.reduce((sum, log) => sum + log.amount, 0);
    setIntake(total);
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [storedProfile, storedGoal, storedGoalType, storedWallet, backendWallet, storedDailyState, storedStreak, storedVouchers] = await Promise.all([
        getUserProfile(),
        getHydrationGoal(),
        getHydrationGoalTypeLabel(),
        getWallet(),
        refreshBackendWallet().catch(() => null),
        getDailyHydrationState(),
        getStreak(),
        getMyVouchers().catch(() => []),
      ]);

      setProfile(storedProfile);
      setGoal(storedGoal);
      setGoalType(storedGoalType);
      setWallet(backendWallet || storedWallet);
      setDailyState(storedDailyState);
      setStreak(storedStreak);
      setVouchers(storedVouchers);
      await loadWaterData();
      setDashboardReady(true);
    } finally {
      setDashboardLoading(false);
    }
  }, [loadWaterData]);

  const featuredVoucher = vouchers[0] || null;

  useFocusEffect(
    useCallback(() => {
      loadDashboard();

      const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        setExitModalVisible(true);
        return true;
      });

      return () => backHandlerSubscription.remove();
    }, [loadDashboard])
  );

  const triggerCoinSplash = useCallback(() => {
    setShowCoinSplash(true);
    coinSplashValues.forEach(value => value.setValue(0));

    Animated.stagger(
      34,
      coinSplashValues.map(value =>
        Animated.timing(value, {
          toValue: 1,
          duration: 940,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start(() => setShowCoinSplash(false));
  }, [coinSplashValues]);

  const completeActiveSlotIfNeeded = async () => {
    const latestDailyState = await getDailyHydrationState();

    if (latestDailyState.completedSlots.includes(activeSlot)) {
      setDailyState(latestDailyState);
      return false;
    }

    const result = await completeHydrationSlot(activeSlot);

    if (result.completed) {
      setDailyState(result.dailyState);
      setWallet(result.wallet);
      setStreak(result.streak);
      syncActiveCompetitionScore().catch(() => undefined);
      triggerCoinSplash();
      return true;
    }

    return false;
  };

  const handleDrink = async () => {
    if (tapDisabled || tapInProgressRef.current) {
      return;
    }

    tapInProgressRef.current = true;
    setTapInProgress(true);
    try {
      const completed = await completeActiveSlotIfNeeded();
      if (!completed) {
        return;
      }

      await logWaterIntake(selectedAmount);
      await loadWaterData();
    } finally {
      tapInProgressRef.current = false;
      setTapInProgress(false);
    }
  };

  const handleSelectCup = (cup: any) => {
    if (cup.amount === 'add') {
      setCustomAmount('');
      setCustomInputVisible(true);
      return;
    }

    setSelectedCup(cup.amount);
    setCustomInputVisible(false);
    setModalVisible(false);
  };

  const confirmCustomAmount = () => {
    const amount = parseInt(customAmount, 10);
    if (!Number.isNaN(amount) && amount > 0) {
      const newCup = { amount, icon: 'cup-water', custom: true as const };
      setCustomCupOptions(prev => {
        const withoutDuplicate = prev.filter(cup => cup.amount !== amount);
        return [...withoutDuplicate, newCup];
      });
      setSelectedCup(amount);
      setModalVisible(false);
      setCustomInputVisible(false);
    }
  };

  const handleRemoveCustomCup = (amountToRemove: number) => {
    setCustomCupOptions(prev => prev.filter(cup => cup.amount !== amountToRemove));
    if (selectedCup === amountToRemove) {
      setSelectedCup('default');
    }
  };

  const handleDownloadVoucher = async (voucher: UserVoucher) => {
    try {
      const updatedVoucher = await markVoucherDownloaded(voucher._id);
      setVouchers(current => current.map(item => item._id === updatedVoucher._id ? updatedVoucher : item));

      await Share.share({
        title: updatedVoucher.title,
        message: [
          updatedVoucher.title,
          `Provider: ${updatedVoucher.provider}`,
          updatedVoucher.valueLabel ? `Value: ${updatedVoucher.valueLabel}` : null,
          `Code: ${updatedVoucher.code}`,
          updatedVoucher.redemptionUrl ? `Redeem: ${updatedVoucher.redemptionUrl}` : null,
          updatedVoucher.expiresAt ? `Expires: ${new Date(updatedVoucher.expiresAt).toLocaleDateString()}` : null,
          updatedVoucher.terms ? `Terms: ${updatedVoucher.terms}` : null,
        ].filter(Boolean).join('\n'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download voucher.';
      Alert.alert('Voucher unavailable', message);
    }
  };

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyPulseValue, {
          toValue: 1,
          duration: 1050,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(trophyPulseValue, {
          toValue: 0,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [trophyPulseValue]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(tapPulseValue, {
          toValue: 1,
          duration: 920,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tapPulseValue, {
          toValue: 0,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    if (!tapDisabled) {
      pulseAnimation.start();
    } else {
      tapPulseValue.setValue(0);
    }

    return () => pulseAnimation.stop();
  }, [tapDisabled, tapPulseValue]);

  useEffect(() => {
    if (intake < goal && goalCelebrated) {
      setGoalCelebrated(false);
      return;
    }

    if (intake >= goal && !goalCelebrated) {
      setGoalCelebrated(true);
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [goal, goalCelebrated, intake]);

  const trophyPulseScale = trophyPulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1.26],
  });
  const trophyPulseOpacity = trophyPulseValue.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.18, 0.38, 0],
  });
  const trophyButtonScale = trophyPulseValue.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 1.06, 1],
  });
  const tapPulseScale = tapPulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.1],
  });
  const tapPulseOpacity = tapPulseValue.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0.22, 0.48, 0.16],
  });
  const tapButtonScale = tapPulseValue.interpolate({
    inputRange: [0, 0.42, 1],
    outputRange: [1, 1.035, 1],
  });
  const joinPulseScale = trophyPulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.16],
  });
  const joinPulseOpacity = trophyPulseValue.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.18, 0.52, 0.12],
  });
  const joinButtonScale = trophyPulseValue.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 1.045, 1],
  });

  return (
    <LinearGradient colors={tabTheme.background} style={styles.container}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View>
              <Image source={avatarSource} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.greetingBlock}>
              <Text style={[styles.greeting, { color: tabTheme.text }]} numberOfLines={1}>Hello, {firstName}</Text>
              <View style={styles.greetingSubtitleRow}>
                <Image source={greetingCopy.image} style={styles.greetingIcon} resizeMode="contain" />
                <Text style={[styles.subtitle, { color: tabTheme.mutedText }]} numberOfLines={1}>{greetingCopy.title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Animated.View style={[styles.trophyButtonWrap, { transform: [{ scale: trophyButtonScale }] }]}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.trophyPulse,
                  {
                    opacity: trophyPulseOpacity,
                    transform: [{ scale: trophyPulseScale }],
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.bellButton, styles.trophyButton, { backgroundColor: tabTheme.headerButton }]}
                onPress={() => navigation.navigate('Competition' as never)}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="trophy-outline" size={22} color="#FFD15A" />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={[styles.bellButton, { backgroundColor: tabTheme.headerButton, borderColor: tabTheme.border, shadowColor: tabTheme.shadow }]} onPress={() => navigation.navigate('Notifications' as never)}>
              <Feather name="bell" size={22} color={tabTheme.icon} />
              <View style={styles.alertDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressCard}>
          <InfoButton onPress={() => setActiveInfoKey('hydration')} />
          <View style={styles.hydrationBottleColumn}>
            <HydrationBottle
              progress={fillPercent}
              mlIntake={intake}
              goalMl={goal}
              height={isWideHome ? 340 : 304}
              state={getHydrationState(fillPercent)}
            />
          </View>

          <View style={styles.progressInfo}>
            <Text style={[styles.literText, !showStoredDashboard && styles.loadingGoalText]}>
              {showStoredDashboard
                ? <>{formatLiters(intake)} <Text style={styles.goalLiterText}>/ {formatLiters(goal)}</Text></>
                : 'Loading goal...'}
            </Text>
            <View style={styles.dailyGoalTrack}>
              <View style={[styles.dailyGoalFill, { width: `${Math.max(fillPercent, intake > 0 ? 8 : 0)}%` }]} />
            </View>
            <Text style={styles.dailyGoalText}>{showStoredDashboard ? `${Math.round(fillPercent)}% of your daily goal` : 'Checking your saved hydration plan'}</Text>
            <View style={styles.remainingCard}>
              <View style={styles.remainingDropBadge}>
                <MaterialCommunityIcons name="water" size={isWideHome ? 38 : 28} color="#B7F8FF" />
              </View>
              <View style={styles.remainingCopy}>
                <Text style={styles.remainingStrong}>{showStoredDashboard ? `${formatLiters(remaining)} remaining` : 'Loading saved goal'}</Text>
                <Text style={styles.remainingSub}>Keep going! You're doing great.</Text>
              </View>
            </View>
            <View style={styles.progressMetaRow}>
              <View style={styles.metaBlock}>
                <MaterialCommunityIcons name="target" size={28} color="#94B4E8" />
                <Text style={styles.metaLabel}>Goal Type</Text>
                <Text style={styles.metaValue}>{showStoredDashboard ? goalType : '--'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaBlock}>
                <MaterialCommunityIcons name="water-check-outline" size={28} color="#94B4E8" />
                <Text style={styles.metaLabel}>Completed Slots</Text>
                <Text style={styles.metaValue}>{showStoredDashboard ? `${completedCount} / 3` : '--'}</Text>
              </View>
            </View>
            
          </View>
          <HydrationSlotProgressStrip
            activeSlot={activeSlot}
            completedSlots={dailyState.completedSlots}
          />
        </View>

        <View style={styles.addWaterCard}>
          <InfoButton onPress={() => setActiveInfoKey('addWater')} />
          <View style={styles.addWaterTopRow}>
            <View style={styles.waterImageWrap}>
              <View style={styles.waterImageGlow} pointerEvents="none" />
              <Image source={require('../assets/waterglass.png')} style={styles.addWaterImage} resizeMode="contain" />
            </View>

            <View style={styles.addWaterInfo}>
              <Text style={styles.addWaterTitle}>Add Water</Text>
              <Text style={styles.addWaterSlotText}>
                Current Slot: <Text style={styles.addWaterSlotValue}>{slotMeta[activeSlot].title}</Text>
              </Text>
              <Text style={styles.addWaterRewardText}>
                {!showStoredDashboard || dashboardLoading
                  ? 'Checking your saved slot status'
                  : activeSlotCompleted
                  ? `${slotMeta[activeSlot].title} reward complete`
                  : `Tap to complete your ${slotMeta[activeSlot].title} reward`}
              </Text>
            </View>

            <Animated.View style={[styles.tapButtonWrap, !tapDisabled && { transform: [{ scale: tapButtonScale }] }]}>
              {!tapDisabled && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.tapButtonPulse,
                    {
                      opacity: tapPulseOpacity,
                      transform: [{ scale: tapPulseScale }],
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={[styles.tapButton, tapDisabled && styles.tapButtonDisabled]}
                onPress={handleDrink}
                disabled={tapDisabled}
                activeOpacity={0.88}
              >
                <GradientFrame
                  colors={tapDisabled ? ['#19375A', '#123053'] : ['#19C9FF', '#5C1ED5']}
                  style={styles.tapButtonGradient}
                >
                  <MaterialCommunityIcons
                    name={activeSlotCompleted ? 'check-circle-outline' : dashboardLoading || tapInProgress ? 'progress-clock' : 'water'}
                    size={isWideHome ? 22 : 18}
                    color={tapDisabled ? '#9CF5FF' : '#FFFFFF'}
                  />
                  <Text style={styles.tapButtonText}>
                    {activeSlotCompleted ? 'Slot Complete' : dashboardLoading ? 'Loading...' : tapInProgress ? 'Saving...' : `Tap ${selectedAmount} mL`}
                  </Text>
                </GradientFrame>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.amountChipRow}
          >
            {cupOptions.map((cup, index) => {
              const isCustomButton = cup.amount === 'add';
              const isSelected = cup.amount === selectedCup;
              const label = isCustomButton
                ? 'Custom'
                : `${cup.amount === 'default' && !showStoredDashboard ? '--' : cup.amount === 'default' ? defaultSlotAmount : cup.amount} mL`;

              return (
                <TouchableOpacity
                  key={`${cup.amount}-${index}`}
                  activeOpacity={0.86}
                  onPress={() => handleSelectCup(cup)}
                  style={[
                    styles.amountChip,
                    isSelected && styles.amountChipSelected,
                    isCustomButton && styles.amountChipCustom,
                  ]}
                >
                  <View style={[styles.amountChipIcon, isCustomButton && styles.amountChipIconCustom]}>
                    {isCustomButton ? (
                      <MaterialCommunityIcons
                        name="plus"
                        size={isWideHome ? 20 : 17}
                        color="#238BFF"
                      />
                    ) : (
                      <Image
                        source={require('../assets/waterglass.png')}
                        style={styles.amountChipGlassImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  <Text style={[styles.amountChipText, isSelected && styles.amountChipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TapEnableStrip
            activeSlot={activeSlot}
            completedSlots={dailyState.completedSlots}
            loading={!showStoredDashboard || dashboardLoading}
            onInfoPress={() => setActiveInfoKey('slots')}
          />

        </View>

        <View style={styles.statsStrip}>
          <InfoButton onPress={() => setActiveInfoKey('wallet')} />
          <View style={styles.statItem}>
            <Image source={require('../assets/ChatGPT_Image_May_12__2026__03_38_40_PM-removebg-preview.png')} style={styles.statImageIcon} />
            <View style={styles.statTextBlock}>
              <Text style={styles.statValue}>{wallet.coins}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <Image source={require('../assets/diamond.png')} style={styles.statImageIcon} />
            <View style={styles.statTextBlock}>
              <Text style={styles.statValue}>{wallet.diamonds}</Text>
              <Text style={styles.statLabel}>Diamonds</Text>
            </View>
          </View>
        </View>

        <View style={styles.streakCard}>
          <InfoButton onPress={() => setActiveInfoKey('streak')} />
          <View style={styles.streakLeft}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.streakTitle}>Daily Streak</Text>
            </View>
            <View style={styles.streakNumberRow}>
              <Image source={require('../assets/streak.png')} style={styles.streakIcon} />
              <View>
                <Text style={styles.streakNumber}>{streak.current}</Text>
                <Text style={styles.smallLabel}>Days</Text>
              </View>
            </View>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.weekBlock}>
            <Text style={styles.bestText}>Best streak: {streak.best} days</Text>
            <View style={styles.weekRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
                const done = index < Math.min(streak.current, 5);
                return (
                  <View key={`${label}-${index}`} style={styles.dayWrap}>
                    <View style={[styles.dayCircle, done ? styles.dayCircleDone : styles.dayCircleEmpty]}>
                      <Text style={styles.dayMark}>{done ? (index === 4 ? 'F' : '✓') : ''}</Text>
                    </View>
                    <Text style={[styles.dayLabel, !done && styles.dayLabelMuted]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.challengeCard}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Competition' as never)}
        >
          <InfoButton onPress={() => setActiveInfoKey('competition')} style={styles.challengeInfoButton} />
          <View style={styles.challengeGlow} pointerEvents="none" />
          <View style={styles.challengeArtworkClip} pointerEvents="none">
            <Image source={require('../assets/challenge.png')} style={styles.challengeArtwork} resizeMode="contain" />
          </View>
          <View style={styles.challengeTextBlock}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.challengeTitle}>Join the Competition!</Text>
            </View>
            <Text style={styles.challengeSub}>Challenge friends and earn amazing rewards.</Text>
          </View>
          <Animated.View style={[styles.joinButtonWrap, { transform: [{ scale: joinButtonScale }] }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.joinButtonPulse,
                {
                  opacity: joinPulseOpacity,
                  transform: [{ scale: joinPulseScale }],
                },
              ]}
            />
            <View style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.leaderboardCard}>
          <InfoButton onPress={() => setActiveInfoKey('leaderboard')} />
          <View style={styles.leaderboardCopy}>
            <View style={styles.leaderboardTitleRow}>
              <MaterialCommunityIcons name="crown" size={isWideHome ? 24 : 18} color="#FFD15A" />
              <Text style={styles.leaderboardTitle}>Leaderboard</Text>
            </View>
            <Text style={styles.leaderboardSub}>Compete with friends and others to earn top rewards!</Text>
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => navigation.navigate('Leaderboard' as never)}
              activeOpacity={0.86}
            >
              <Text style={styles.leaderboardButtonText}>Explore Leaderboard</Text>
              <Feather name="chevron-right" size={isWideHome ? 22 : 16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Image source={require('../assets/leaderboard_podium.png')} style={styles.leaderboardImage} resizeMode="contain"/>
        </View>

      </ScrollView>

      <Modal visible={modalVisible || customInputVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Slot Amount</Text>
            <FlatList
              data={cupOptions}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              renderItem={({ item }) => {
                const isSelected = selectedCup === item.amount;
                return (
                  <View style={styles.cupWrapper}>
                    <TouchableOpacity
                      style={[styles.cupOption, isSelected && styles.cupOptionSelected]}
                      onPress={() => handleSelectCup(item)}
                    >
                      {item.amount === 'add' ? (
                        <View style={styles.cupAddIconWrap}>
                          <MaterialCommunityIcons name="plus" size={26} color="#238BFF" />
                        </View>
                      ) : (
                        <Image
                          source={require('../assets/waterglass.png')}
                          style={styles.cupGlassImage}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={[styles.cupText, isSelected && styles.cupTextSelected]}>
                        {item.amount === 'add'
                          ? 'Custom'
                          : item.amount === 'default'
                            ? `${defaultSlotAmount} mL`
                            : `${item.amount} mL`}
                      </Text>
                    </TouchableOpacity>
                    {'custom' in item && item.custom && typeof item.amount === 'number' && (
                      <TouchableOpacity onPress={() => handleRemoveCustomCup(item.amount)} style={styles.deleteIcon}>
                        <Feather name="x-circle" size={20} color="#FF5A6E" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
            {customInputVisible && (
              <View style={styles.customInputContainer}>
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#8FA2D6"
                  style={styles.input}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
                <TouchableOpacity onPress={confirmCustomAmount} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setCustomInputVisible(false);
            }}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <HomeInfoModal
        content={activeInfoKey ? homeInfoContent[activeInfoKey] : null}
        onClose={() => setActiveInfoKey(null)}
      />

      <ExitAppModal
        visible={exitModalVisible}
        onCancel={() => setExitModalVisible(false)}
        onExit={() => BackHandler.exitApp()}
      />

      {featuredVoucher ? (
        <VoucherBubble voucher={featuredVoucher} onPress={() => setActiveVoucher(featuredVoucher)} />
      ) : null}

      <VoucherModal
        voucher={activeVoucher}
        onClose={() => setActiveVoucher(null)}
        onCopy={() => copyToClipboard(activeVoucher?.code)}
        onDownload={handleDownloadVoucher}
      />

      {showCoinSplash ? <CoinSplashOverlay values={coinSplashValues} /> : null}

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={{ width, height }}
          />
        </View>
      )}
    </SafeAreaView>
    </LinearGradient>
  );
};

const InfoButton = ({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) => (
  <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={[styles.infoButton, style]}>
    <Feather name="info" size={15} color="#9cc5ff" />
  </TouchableOpacity>
);

const ExitAppModal = ({
  visible,
  onCancel,
  onExit,
}: {
  visible: boolean;
  onCancel: () => void;
  onExit: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.exitOverlay}>
      <View style={styles.exitDialogFrame}>
        <LinearGradient colors={['#071f46', '#10082a']} style={styles.exitDialog}>
          <View style={styles.exitIconWrap}>
            <MaterialCommunityIcons name="logout-variant" size={30} color="#9cf5ff" />
          </View>
          <Text style={styles.exitTitle}>Exit DoraDrink?</Text>
          <Text style={styles.exitMessage}>Your hydration progress is saved. Come back soon to keep your streak moving.</Text>
          <View style={styles.exitActions}>
            <TouchableOpacity activeOpacity={0.86} onPress={onCancel} style={styles.exitCancelButton}>
              <Text style={styles.exitCancelText}>Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.86} onPress={onExit} style={styles.exitConfirmButton}>
              <Text style={styles.exitConfirmText}>Exit App</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  </Modal>
);

const HydrationSlotProgressStrip = ({
  activeSlot,
  completedSlots,
}: {
  activeSlot: SlotKey;
  completedSlots: SlotKey[];
}) => (
  <View style={styles.hydrationSlotStrip}>
    {slotOrder.map((slot, index) => {
      const completed = completedSlots.includes(slot);
      const current = slot === activeSlot && !completed;
      const slotImage = slot === 'morning'
        ? require('../assets/morning.png')
        : slot === 'afternoon'
          ? require('../assets/afternoon.png')
          : require('../assets/evening.png');

      return (
        <View key={slot} style={styles.hydrationSlotStripItem}>
          <View style={styles.hydrationSlotStateRail}>
            <View style={[
              styles.hydrationSlotCheck,
              completed && styles.hydrationSlotCheckDone,
              current && styles.hydrationSlotCheckCurrent,
            ]}>
              {completed ? (
                <Feather name="check" size={isWideHome ? 16 : 13} color="#FFFFFF" />
              ) : null}
            </View>
            <View style={[
              styles.hydrationSlotRailLine,
              completed && styles.hydrationSlotRailLineDone,
              current && styles.hydrationSlotRailLineCurrent,
            ]} />
          </View>

          <View style={styles.hydrationSlotMain}>
            <View style={styles.hydrationSlotCopy}>
              <Text style={[
                styles.hydrationSlotNumber,
                (completed || current) && styles.hydrationSlotNumberActive,
              ]}>
                {slotSchedule[slot].label}
              </Text>
              <Text style={[
                styles.hydrationSlotName,
                (completed || current) && styles.hydrationSlotNameActive,
              ]}>
                {slotMeta[slot].title}
              </Text>
              <Image source={slotImage} style={[
                styles.hydrationSlotMiniImage,
                !completed && !current && styles.hydrationSlotMiniImageMuted,
              ]} resizeMode="contain" />
            </View>
          </View>

          {index < slotOrder.length - 1 ? <View style={styles.hydrationSlotDivider} /> : null}
        </View>
      );
    })}
  </View>
);

const HomeInfoModal = ({
  content,
  onClose,
}: {
  content: HomeInfoContent | null;
  onClose: () => void;
}) => (
  <Modal visible={Boolean(content)} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.infoModalOverlay}>
      <GradientFrame
        colors={content?.gradient || ['#071b3d', '#050b1d']}
        style={[styles.infoModalFrame, styles.infoModalCard, { borderColor: content?.border || '#24538f', shadowColor: content?.accent || '#1688ff' }]}
      >
          <View style={styles.infoModalHeader}>
            <View style={[styles.infoModalIcon, { borderColor: content?.accent || '#2b9dff' }]}>
              <Feather name="info" size={22} color={content?.accent || '#35d9ff'} />
            </View>
            <Text style={styles.infoModalTitle} numberOfLines={2}>{content?.title}</Text>
            <TouchableOpacity activeOpacity={0.82} onPress={onClose} style={styles.infoModalClose}>
              <Feather name="x" size={20} color="#dce8ff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoModalBody}>{content?.body}</Text>
          <View style={styles.infoBullets}>
            {content?.bullets.map(item => (
              <View key={item} style={styles.infoBulletRow}>
                <View style={[styles.infoBulletDot, { backgroundColor: content.accent }]} />
                <Text style={styles.infoBulletText}>{item}</Text>
              </View>
            ))}
          </View>
      </GradientFrame>
    </View>
  </Modal>
);

const GradientFrame = ({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    {children}
  </View>
);

const VoucherBubble = ({ voucher, onPress }: { voucher: UserVoucher; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.voucherBubble}>
    <LinearGradient colors={['#FFE38A', '#FF9D2E']} style={styles.voucherBubbleGradient}>
      <PlatformLogo voucher={voucher} size={34} compact />
      <View style={styles.voucherBubbleTextWrap}>
        <Text style={styles.voucherBubbleTitle} numberOfLines={1}>{voucher.provider || 'Voucher'}</Text>
        <Text style={styles.voucherBubbleValue} numberOfLines={1}>{voucher.valueLabel || voucher.provider}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const PlatformLogo = ({
  voucher,
  size,
  compact = false,
}: {
  voucher: UserVoucher | null;
  size: number;
  compact?: boolean;
}) => {
  const logoUrl = voucher?.platformLogoUrl;
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <View style={[
      styles.platformLogoFrame,
      compact && styles.platformLogoFrameCompact,
      { width: size, height: size, borderRadius: size / 2 },
    ]}>
      {logoUrl && !logoFailed ? (
        <Image source={{ uri: logoUrl }} style={styles.platformLogoImage} resizeMode="contain" onError={() => setLogoFailed(true)} />
      ) : (
        <MaterialCommunityIcons name="ticket-percent" size={Math.round(size * 0.56)} color="#432200" />
      )}
    </View>
  );
};

const VoucherModal = ({
  voucher,
  onClose,
  onCopy,
  onDownload,
}: {
  voucher: UserVoucher | null;
  onClose: () => void;
  onCopy: () => void;
  onDownload: (voucher: UserVoucher) => void;
}) => (
  <Modal visible={Boolean(voucher)} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.voucherModalOverlay}>
      <View style={styles.voucherModalFrame}>
        <LinearGradient colors={['#151035', '#07172F']} style={styles.voucherModalCard}>
          <View style={styles.voucherModalHeader}>
            <PlatformLogo voucher={voucher} size={54} />
            <View style={styles.voucherModalTitleBlock}>
              <Text style={styles.voucherModalEyebrow}>Competition Reward</Text>
              <Text style={styles.voucherModalTitle}>{voucher?.title || 'Gift Voucher'}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.82} onPress={onClose} style={styles.voucherModalClose}>
              <Feather name="x" size={20} color="#F7FBFF" />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={['#FFF0B6', '#FFB33E']} style={styles.voucherPreviewCard}>
          <View style={styles.voucherPerforationLeft} />
          <View style={styles.voucherPerforationRight} />
          <Text style={styles.voucherWatermark}>DORA</Text>
          <View style={styles.voucherPreviewBrandRow}>
            <PlatformLogo voucher={voucher} size={42} compact />
            <View style={styles.voucherPreviewCopy}>
              <Text style={styles.voucherPreviewProvider} numberOfLines={1}>{voucher?.provider || 'Gift Voucher'}</Text>
              <Text style={styles.voucherPreviewValue} numberOfLines={1}>{voucher?.valueLabel || 'Reward Voucher'}</Text>
            </View>
            <View style={styles.voucherPreviewBadge}>
              <Text style={styles.voucherPreviewBadgeText}>WINNER</Text>
            </View>
          </View>
          <View style={styles.voucherPreviewCodeRow}>
            <Text style={styles.voucherPreviewCode} selectable numberOfLines={1}>{voucher?.code}</Text>
            <TouchableOpacity activeOpacity={0.82} onPress={onCopy} style={styles.voucherCopyMiniButton}>
              <Feather name="copy" size={15} color="#2D1800" />
            </TouchableOpacity>
          </View>
          </LinearGradient>

          <View style={styles.voucherCodeBox}>
          <View style={styles.voucherCodeHeader}>
            <Text style={styles.voucherCodeLabel}>Voucher Code</Text>
            <TouchableOpacity activeOpacity={0.82} onPress={onCopy} style={styles.voucherCodeCopyButton}>
              <Feather name="copy" size={15} color="#DFFBFF" />
              <Text style={styles.voucherCodeCopyText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.voucherCodeText} selectable>{voucher?.code}</Text>
          </View>

        

          <View style={styles.voucherTermsBox}>
            <Text style={styles.voucherTermsTitle}>Details</Text>
            <Text style={styles.voucherTermsText}>
              {voucher?.expiresAt ? `Expires ${new Date(voucher.expiresAt).toLocaleDateString()}. ` : ''}
              {voucher?.terms || 'Keep this code private. Use it only with the voucher provider.'}
            </Text>
          </View>

          {voucher?.redemptionUrl ? (
            <TouchableOpacity activeOpacity={0.86} onPress={() => Linking.openURL(voucher.redemptionUrl || '')} style={styles.voucherPlatformButton}>
              <Feather name="external-link" size={18} color="#DFFBFF" />
              <Text style={styles.voucherPlatformButtonText}>Open {voucher.provider || 'platform'}</Text>
            </TouchableOpacity>
          ) : null}

          {voucher ? (
            <TouchableOpacity activeOpacity={0.86} onPress={() => onDownload(voucher)} style={styles.voucherDownloadButton}>
              <Feather name="download" size={18} color="#1B1500" />
              <Text style={styles.voucherDownloadText}>{voucher.status === 'downloaded' ? 'Download again' : 'Download voucher'}</Text>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>
      </View>
    </View>
  </Modal>
);

const CoinSplashOverlay = ({ values }: { values: Animated.Value[] }) => (
  <View pointerEvents="none" style={styles.coinSplashOverlay}>
    <View style={styles.coinSplashOrigin}>
      {values.map((value, index) => {
        const vector = coinSplashVectors[index];
        const animatedStyle = {
          opacity: value.interpolate({
            inputRange: [0, 0.12, 0.78, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateX: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0, vector.x],
              }),
            },
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0, vector.y],
              }),
            },
            {
              scale: value.interpolate({
                inputRange: [0, 0.18, 1],
                outputRange: [0.45, 1.12, 0.72],
              }),
            },
            { rotate: vector.rotate },
          ],
        };

        return (
          <Animated.Image
            key={`${vector.x}-${index}`}
            source={require('../assets/ChatGPT_Image_May_12__2026__03_38_40_PM-removebg-preview.png')}
            style={[styles.coinSplashImage, animatedStyle]}
            resizeMode="contain"
          />
        );
      })}
      <Animated.Text
        style={[
          styles.coinSplashText,
          {
            opacity: values[0].interpolate({
              inputRange: [0, 0.15, 0.82, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: values[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -74],
                }),
              },
              {
                scale: values[0].interpolate({
                  inputRange: [0, 0.22, 1],
                  outputRange: [0.85, 1.08, 1],
                }),
              },
            ],
          },
        ]}
      >
        +25
      </Animated.Text>
    </View>
  </View>
);

const slotEnableImages: Record<SlotKey, ImageSourcePropType> = {
  morning: require('../assets/morning.png'),
  afternoon: require('../assets/afternoon.png'),
  evening: require('../assets/evening.png'),
};

const TapEnableStrip = ({
  activeSlot,
  completedSlots,
  loading,
  onInfoPress,
}: {
  activeSlot: SlotKey;
  completedSlots: SlotKey[];
  loading: boolean;
  onInfoPress: () => void;
}) => {
  const activeIndex = slotOrder.indexOf(activeSlot);

  return (
    <View style={styles.tapEnablePanel}>
      <View style={styles.tapEnableHeader}>
        <Text style={styles.tapEnableTitle}>Tap Enable Time</Text>
        <InfoButton onPress={onInfoPress} style={styles.tapEnableInfoButton} />
      </View>
      <View style={styles.tapEnableTrack}>
        {slotOrder.map((slot, index) => {
          const completed = completedSlots.includes(slot);
          const active = !loading && slot === activeSlot && !completed;
          const locked = loading || (index > activeIndex && !completed);

          return (
            <View
              key={slot}
              style={[
                styles.tapEnableSlot,
                completed && styles.tapEnableSlotDone,
                active && styles.tapEnableSlotActive,
                locked && styles.tapEnableSlotLocked,
              ]}
            >
              <View style={styles.tapEnableMainRow}>
                <Image
                  source={slotEnableImages[slot]}
                  style={[styles.tapEnableImage, locked && styles.tapEnableImageLocked]}
                  resizeMode="contain"
                />
                <View style={styles.tapEnableTextBlock}>
                  <Text style={[styles.tapEnableSlotTitle, completed && styles.tapEnableSlotTitleDone]}>{slotMeta[slot].title}</Text>
                  <Text style={styles.tapEnableSlotTime}>{slotTimeLabels[slot]}</Text>
                </View>
              </View>
              <View style={styles.tapEnableStatusRow}>
                <Text style={[styles.tapEnableStatusText, completed && styles.tapEnableStatusTextDone]}>
                  {loading ? 'Checking...' : completed ? 'Completed' : locked ? 'Pending' : 'Tap enabled'}
                </Text>
                {completed && (
                  <View style={styles.tapEnableRewardRow}>
                    <Text style={styles.tapEnableRewardText}>+25</Text>
                    <Image source={require('../assets/ChatGPT_Image_May_12__2026__03_38_40_PM-removebg-preview.png')} style={styles.tapEnableRewardCoin} />
                  </View>
                )}
              </View>
              <View style={[styles.tapEnableBadge, completed && styles.tapEnableBadgeDone]}>
                {completed ? (
                  <Feather name="check" size={isWideHome ? 14 : 11} color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name={locked ? 'lock-outline' : 'timer-sand'} size={isWideHome ? 13 : 10} color="#8BA6E6" />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  profileRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  avatar: {
    borderRadius: 28,
    height: 46,
    width: 46,
  },
  onlineDot: {
    backgroundColor: '#78E747',
    borderColor: '#08101F',
    borderRadius: 8,
    borderWidth: 3,
    bottom: 1,
    height: 17,
    position: 'absolute',
    right: 0,
    width: 17,
  },
  greetingBlock: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: isCompact ? 13 : 17,
    fontWeight: '800',
  },
  subtitle: {
    color: '#ABB3C8',
    fontSize: 10,
  },
  greetingSubtitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 5,
  },
  greetingIcon: {
    height: 15,
    marginRight: 5,
    width: 15,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bellButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 42,
  },
  trophyButtonWrap: {
    height: 42,
    position: 'relative',
    width: 42,
  },
  trophyButton: {
    borderColor: '#FFD15A',
    shadowColor: '#FFD15A',
    shadowOpacity: 0.62,
    shadowRadius: 16,
  },
  trophyPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 209, 90, 0.22)',
    borderColor: 'rgba(255, 209, 90, 0.74)',
    borderRadius: 21,
    borderWidth: 1,
  },
  alertDot: {
    backgroundColor: '#FF375F',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: 1,
    top: 7,
    width: 12,
  },
  progressCard: {
    alignItems: 'center',
    backgroundColor: '#031329',
    borderColor: '#0B4BAB',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 20 : 12,
    minHeight: isWideHome ? 466 : 424,
    overflow: 'hidden',
    paddingHorizontal: isWideHome ? 18 : 10,
    paddingBottom: isWideHome ? 108 : 94,
    paddingTop: isWideHome ? 16 : 12,
    shadowColor: '#117DFF',
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  hydrationBottleColumn: {
    alignItems: 'center',
    height: isWideHome ? 356 : 316,
    justifyContent: 'center',
    width: isWideHome ? 182 : 138,
  },
  progressInfo: {
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingBottom: isWideHome ? 10 : 6,
    paddingLeft: isWideHome ? 14 : 8,
    paddingTop: isWideHome ? 24 : 20,
    zIndex: 2,
  },
  progressTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  infoButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(10,32,70,0.82)',
    borderColor: '#2d6fc8',
    borderRadius: 16,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    shadowColor: '#1688ff',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    top: 12,
    width: 20,
    zIndex: 20,
  },
  literText: {
    color: '#16BFFF',
    fontSize: isCompact ? 34 : isWideHome ? 56 : 43,
    fontWeight: '900',
    marginTop: 0,
  },
  loadingGoalText: {
    fontSize: isCompact ? 18 : isWideHome ? 24 : 20,
    lineHeight: isCompact ? 24 : isWideHome ? 30 : 26,
  },
  goalLiterText: {
    color: '#FFFFFF',
    fontSize: isCompact ? 27 : isWideHome ? 42 : 33,
    fontWeight: '600',
  },
  dailyGoalTrack: {
    backgroundColor: 'rgba(4, 29, 58, 0.94)',
    borderColor: 'rgba(37, 147, 255, 0.38)',
    borderRadius: 12,
    borderWidth: 1,
    height: isWideHome ? 17 : 13,
    marginTop: isWideHome ? 16 : 11,
    overflow: 'hidden',
    shadowColor: '#16BFFF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  dailyGoalFill: {
    backgroundColor: '#1BC8FF',
    borderRadius: 12,
    height: '100%',
    shadowColor: '#2CEAFF',
    shadowOpacity: 0.85,
    shadowRadius: 12,
  },
  dailyGoalText: {
    color: '#8D99B8',
    fontSize: isWideHome ? 15 : 11,
    fontWeight: '700',
    marginTop: isWideHome ? 10 : 7,
  },
  remainingCard: {
    alignItems: 'center',
    borderColor: '#1E3B67',
    borderRadius: isWideHome ? 18 : 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 16 : 10,
    marginTop: isWideHome ? 20 : 14,
    minHeight: isWideHome ? 78 : 62,
    paddingHorizontal: isWideHome ? 18 : 12,
  },
  remainingDropBadge: {
    alignItems: 'center',
    height: isWideHome ? 54 : 40,
    justifyContent: 'center',
    width: isWideHome ? 54 : 40,
  },
  remainingCopy: {
    flex: 1,
    minWidth: 0,
  },
  remainingStrong: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 19 : 15,
    fontWeight: '900',
  },
  remainingSub: {
    color: '#ABB6D1',
    fontSize: isWideHome ? 14 : 10,
    fontWeight: '600',
    marginTop: 3,
  },
  progressMetaRow: {
    borderColor: '#1E3B67',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 16 : 8,
    marginTop: isWideHome ? 20 : 14,
    minHeight: isWideHome ? 96 : 82,
    paddingHorizontal: isWideHome ? 18 : 10,
    paddingVertical: isWideHome ? 14 : 10,
  },
  metaBlock: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  metaDivider: {
    backgroundColor: '#21335D',
    width: 1,
  },
  metaLabel: {
    color: '#A8B0C9',
    fontSize: isWideHome ? 13 : 10,
    marginTop: 8,
    textAlign: 'center',
  },
  metaValue: {
    color: '#16C8FF',
    fontSize: isWideHome ? 21 : 16,
    fontWeight: '900',
    marginTop: 7,
    textAlign: 'center',
  },
  hydrationSlotStrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(3, 16, 35, 0.92)',
    borderColor: 'rgba(38, 133, 255, 0.45)',
    borderRadius: isWideHome ? 22 : 18,
    borderWidth: 1,
    bottom: isWideHome ? 16 : 12,
    flexDirection: 'row',
    left: isWideHome ? 18 : 10,
    minHeight: isWideHome ? 86 : 78,
    overflow: 'hidden',
    paddingHorizontal: isWideHome ? 18 : 10,
    paddingVertical: isWideHome ? 12 : 9,
    position: 'absolute',
    right: isWideHome ? 18 : 10,
    shadowColor: '#0B8DFF',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    zIndex: 4,
  },
  hydrationSlotStripItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    position: 'relative',
  },
  hydrationSlotStateRail: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    marginRight: isWideHome ? 12 : 7,
    width: isWideHome ? 28 : 22,
  },
  hydrationSlotCheck: {
    alignItems: 'center',
    borderColor: '#607197',
    borderRadius: isWideHome ? 14 : 11,
    borderStyle: 'dashed',
    borderWidth: 1.4,
    height: isWideHome ? 28 : 22,
    justifyContent: 'center',
    width: isWideHome ? 28 : 22,
  },
  hydrationSlotCheckDone: {
    backgroundColor: '#128EFF',
    borderColor: '#3FC9FF',
    borderStyle: 'solid',
    shadowColor: '#16BFFF',
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  hydrationSlotCheckCurrent: {
    borderColor: '#28BFFF',
    borderStyle: 'solid',
  },
  hydrationSlotRailLine: {
    backgroundColor: 'rgba(93, 111, 145, 0.45)',
    borderRadius: 8,
    flex: 1,
    marginTop: 5,
    minHeight: isWideHome ? 42 : 34,
    width: 4,
  },
  hydrationSlotRailLineDone: {
    backgroundColor: '#16CFFF',
    shadowColor: '#16CFFF',
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  hydrationSlotRailLineCurrent: {
    backgroundColor: '#0F7FFF',
    opacity: 0.75,
  },
  hydrationSlotMain: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  hydrationSlotCopy: {
    alignItems: 'flex-start',
    minWidth: 0,
  },
  hydrationSlotNumber: {
    color: '#D7E2FF',
    fontSize: isWideHome ? 16 : 12,
    fontWeight: '900',
  },
  hydrationSlotNumberActive: {
    color: '#FFFFFF',
  },
  hydrationSlotName: {
    color: '#8F9AB8',
    fontSize: isWideHome ? 13 : 10,
    fontWeight: '800',
    marginTop: 1,
  },
  hydrationSlotNameActive: {
    color: '#12AFFF',
  },
  hydrationSlotMiniImage: {
    height: isWideHome ? 34 : 25,
    marginTop: 3,
    width: isWideHome ? 34 : 25,
  },
  hydrationSlotMiniImageMuted: {
    opacity: 0.38,
  },
  hydrationSlotDivider: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(76, 105, 157, 0.38)',
    marginHorizontal: isWideHome ? 16 : 9,
    width: 1,
  },
  keepGoingCard: {
    alignItems: 'center',
    borderColor: '#1E3B67',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 12 : 8,
    marginTop: isWideHome ? 16 : 12,
    minHeight: isWideHome ? 78 : 62,
    paddingHorizontal: isWideHome ? 12 : 8,
  },
  keepGoingMascot: {
    height: isWideHome ? 58 : 42,
    width: isWideHome ? 58 : 42,
  },
  keepGoingCopy: {
    flex: 1,
    minWidth: 0,
  },
  keepGoingTitle: {
    color: '#18D5FF',
    fontSize: isWideHome ? 18 : 13,
    fontWeight: '900',
  },
  keepGoingText: {
    color: '#C7D3EF',
    fontSize: isWideHome ? 15 : 11,
    lineHeight: isWideHome ? 21 : 16,
    marginTop: 3,
  },
  addWaterCard: {
    backgroundColor: '#050B20',
    borderColor: '#6D31D8',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden',
    padding: isWideHome ? 18 : 14,
    shadowColor: '#6537FF',
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  addWaterTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 18 : 14,
    fontWeight: '900',
    marginBottom: isWideHome ? 12 : 8,
  },
  addWaterTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: isWideHome ? 14 : 9,
  },
  waterImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: isWideHome ? 132 : 120,
    width: isWideHome ? 124 : 92,
  },
  waterImageGlow: {
    backgroundColor: 'rgba(115, 52, 255, 0.22)',
    borderRadius: 58,
    height: isWideHome ? 116 : 96,
    position: 'absolute',
    shadowColor: '#8B48FF',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    width: isWideHome ? 116 : 96,
  },
  addWaterImage: {
    height: isWideHome ? 120 : 108,
    width: isWideHome ? 118 : 88,
  },
  addWaterInfo: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  addWaterSlotText: {
    color: '#EEF3FF',
    fontSize: isWideHome ? 15 : 12,
    fontWeight: '700',
    lineHeight: isWideHome ? 21 : 17,
  },
  addWaterSlotValue: {
    color: '#D34CFF',
    fontWeight: '900',
  },
  addWaterRewardText: {
    color: '#E5ECFF',
    flexShrink: 1,
    fontSize: isWideHome ? 14 : 11,
    fontWeight: '600',
    lineHeight: isWideHome ? 20 : 16,
    marginTop: isWideHome ? 6 : 4,
  },
  tapButton: {
    borderColor: '#8F48FF',
    borderRadius: isWideHome ? 18 : 15,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: isWideHome ? 70 : 54,
    overflow: 'hidden',
    shadowColor: '#7B38FF',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    width: isWideHome ? 162 : 118,
  },
  tapButtonWrap: {
    flexShrink: 0,
    minHeight: isWideHome ? 70 : 54,
    position: 'relative',
    width: isWideHome ? 162 : 118,
  },
  tapButtonPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 201, 255, 0.22)',
    borderColor: 'rgba(131, 233, 255, 0.72)',
    borderRadius: isWideHome ? 18 : 15,
    borderWidth: 1,
    shadowColor: '#19C9FF',
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  tapButtonGradient: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: isWideHome ? 9 : 6,
    justifyContent: 'center',
    paddingHorizontal: isWideHome ? 12 : 8,
  },
  tapButtonDisabled: {
    borderColor: '#417A99',
    opacity: 0.9,
  },
  tapButtonText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: isWideHome ? 17 : 12,
    fontWeight: '900',
    lineHeight: isWideHome ? 22 : 15,
    textAlign: 'center',
  },
  quickCups: {
    flexDirection: 'row',
    gap: isWideHome ? 14 : 10,
    marginTop: isWideHome ? 16 : 14,
    width: '100%',
  },
  quickCup: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,8,33,0.5)',
    borderColor: '#27304C',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: isWideHome ? 70 : 56,
    paddingHorizontal: isWideHome ? 14 : 8,
  },
  quickCupSelected: {
    borderColor: '#C13CFF',
    shadowColor: '#B135FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  quickCupText: {
    color: '#E8ECFF',
    fontSize: isWideHome ? 14 : 12,
    fontWeight: '700',
  },
  quickCupTextSelected: {
    color: '#FFFFFF',
  },
  tapEnablePanel: {
    backgroundColor: '#0E0B2E',
    borderColor: '#3E2078',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: isWideHome ? 14 : 12,
    paddingHorizontal: isWideHome ? 14 : 10,
    paddingVertical: isWideHome ? 14 : 11,
  },
  tapEnableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isWideHome ? 14 : 11,
  },
  tapEnableInfoButton: {
    position: 'relative',
    right: 0,
    top: 0,
  },
  tapEnableTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 19 : 12,
    fontWeight: '900',
  },
  tapEnableTrack: {
    flexDirection: 'row',
    gap: isWideHome ? 12 : 8,
  },
  tapEnableSlot: {
    alignItems: 'center',
    backgroundColor: '#071333',
    borderColor: '#082F75',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: isWideHome ? 9 : 5,
    minHeight: isWideHome ? 104 : 78,
    overflow: 'visible',
    paddingHorizontal: isWideHome ? 10 : 6,
    paddingVertical: isWideHome ? 9 : 7,
  },
  tapEnableSlotDone: {
    backgroundColor: '#062C28',
    borderColor: '#0B694F',
  },
  tapEnableSlotActive: {
    backgroundColor: '#06163C',
    borderColor: '#053B9A',
    shadowColor: '#1688ff',
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  tapEnableSlotLocked: {
    opacity: 0.72,
  },
  tapEnableMainRow: {
    alignItems: 'center',
    gap: isWideHome ? 7 : 4,
    width: '100%',
  },
  tapEnableImage: {
    alignSelf: 'center',
    height: isWideHome ? 44 : 26,
    width: isWideHome ? 44 : 26,
  },
  tapEnableImageLocked: {
    opacity: 0.72,
  },
  tapEnableTextBlock: {
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
  },
  tapEnableSlotTitle: {
    color: '#D6DDF6',
    fontSize: isWideHome ? 16 : 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  tapEnableSlotTitleDone: {
    color: '#27E99A',
  },
  tapEnableSlotTime: {
    color: '#AEB8DD',
    fontSize: isWideHome ? 10 : 7,
    fontWeight: '700',
    marginTop: isWideHome ? 5 : 3,
    textAlign: 'center',
  },
  tapEnableStatusRow: {
    alignItems: 'center',
    gap: isWideHome ? 5 : 3,
    justifyContent: 'center',
    minHeight: isWideHome ? 36 : 24,
  },
  tapEnableStatusText: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 12 : 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  tapEnableStatusTextDone: {
    color: '#FFFFFF',
  },
  tapEnableRewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  tapEnableRewardText: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 13 : 9,
    fontWeight: '900',
  },
  tapEnableRewardCoin: {
    height: isWideHome ? 18 : 12,
    width: isWideHome ? 18 : 12,
  },
  tapEnableBadge: {
    alignItems: 'center',
    borderColor: '#214895',
    borderRadius: isWideHome ? 16 : 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: isWideHome ? 30 : 22,
    justifyContent: 'center',
    position: 'absolute',
    right: isWideHome ? 7 : 4,
    top: isWideHome ? -9 : -7,
    width: isWideHome ? 30 : 22,
  },
  tapEnableBadgeDone: {
    backgroundColor: '#20D989',
    borderColor: '#11BF77',
    borderStyle: 'solid',
    shadowColor: '#20D989',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  amountChipRow: {
    gap: isWideHome ? 9 : 7,
    paddingRight: 4,
    paddingTop: isWideHome ? 9 : 7,
  },
  amountChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 10, 32, 0.68)',
    borderColor: '#27304C',
    borderRadius: isWideHome ? 14 : 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 9 : 7,
    minHeight: isWideHome ? 48 : 42,
    minWidth: isWideHome ? 122 : 104,
    paddingHorizontal: isWideHome ? 13 : 10,
    shadowColor: '#111A46',
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  amountChipSelected: {
    backgroundColor: 'rgba(58, 18, 86, 0.8)',
    borderColor: '#C13CFF',
    shadowColor: '#B135FF',
    shadowOpacity: 0.42,
    shadowRadius: 12,
  },
  amountChipCustom: {
    borderColor: '#273A66',
  },
  amountChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isWideHome ? 22 : 18,
  },
  amountChipIconCustom: {
    borderColor: '#0B65D8',
    borderRadius: 999,
    borderWidth: 2,
    height: isWideHome ? 28 : 24,
    width: isWideHome ? 28 : 24,
  },
  amountChipGlassImage: {
    height: isWideHome ? 30 : 24,
    width: isWideHome ? 24 : 20,
  },
  amountChipText: {
    color: '#F1F5FF',
    fontSize: isWideHome ? 15 : 12,
    fontWeight: '900',
  },
  amountChipTextSelected: {
    color: '#FFFFFF',
  },
  statsStrip: {
    alignItems: 'center',
    backgroundColor: '#0B1230',
    borderColor: '#2E3A6D',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    minHeight: isWideHome ? 102 : 88,
    overflow: 'hidden',
    paddingHorizontal: isWideHome ? 18 : 10,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: isWideHome ? 14 : 10,
    justifyContent: 'center',
    minWidth: 0,
    width: isWideHome ? '45%' : '44%',
  },
  statTextBlock: {
    flexShrink: 1,
    minWidth: 0,
  },
  statImageIcon: {
    height: isWideHome ? 52 : 38,
    width: isWideHome ? 52 : 38,
  },
  statValue: {
    color: '#EEF8FF',
    fontSize: isWideHome ? 28 : 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#DDE5F4',
    fontSize: isWideHome ? 17 : 13,
    marginTop: 4,
  },
  statSeparator: {
    backgroundColor: '#2C375A',
    height: 56,
    width: 1,
  },
  walletCard: {
    backgroundColor: '#0A1324',
    borderColor: '#17243A',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  walletCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  walletTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  walletBalanceRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  walletBalanceBox: {
    alignItems: 'center',
    backgroundColor: '#081226',
    borderColor: '#14243E',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: isWideHome ? 24 : 10,
    justifyContent: 'center',
    paddingHorizontal: isWideHome ? 16 : 8,
  },
  walletLargeIcon: {
    height: isWideHome ? 58 : 42,
    width: isWideHome ? 58 : 42,
  },
  walletLargeNumber: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 32 : 25,
    fontWeight: '900',
  },
  walletLargeLabel: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 18 : 14,
    fontWeight: '700',
    marginTop: 3,
  },
  walletProgressText: {
    color: '#EEF3FF',
    fontSize: isWideHome ? 18 : 15,
    fontWeight: '900',
    marginTop: 18,
  },
  walletProgressTrack: {
    backgroundColor: '#101A2D',
    borderRadius: 8,
    height: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  walletProgressFill: {
    backgroundColor: '#27C8FF',
    borderRadius: 8,
    height: '100%',
  },
  streakCard: {
    backgroundColor: '#03152D',
    borderColor: '#083B78',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    minHeight: isWideHome ? 176 : 132,
    paddingHorizontal: isWideHome ? 18 : 12,
    paddingVertical: isWideHome ? 18 : 14,
  },
  streakLeft: {
    justifyContent: 'space-between',
    width: isWideHome ? 132 : 95,
  },
  streakTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 18 : 13,
    fontWeight: '900',
  },
  streakNumberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: isWideHome ? 12 : 6,
  },
  streakIcon: {
    height: isWideHome ? 58 : 40,
    width: isWideHome ? 58 : 40,
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 42 : 26,
    fontWeight: '900',
  },
  smallLabel: {
    color: '#DDE3F4',
    fontSize: isWideHome ? 15 : 11,
    marginTop: isWideHome ? 10 : 3,
  },
  verticalDivider: {
    backgroundColor: '#1C355E',
    marginHorizontal: isWideHome ? 18 : 10,
    width: 1,
  },
  weekBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  bestText: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 16 : 12,
    marginBottom: isWideHome ? 20 : 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayWrap: {
    alignItems: 'center',
    gap: isWideHome ? 9 : 6,
    width: isWideHome ? 40 : 24,
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: isWideHome ? 20 : 12,
    height: isWideHome ? 40 : 24,
    justifyContent: 'center',
    width: isWideHome ? 40 : 24,
  },
  dayCircleDone: {
    backgroundColor: '#14AFFF',
  },
  dayCircleEmpty: {
    borderColor: '#33405D',
    borderStyle: 'dashed',
    borderWidth: isWideHome ? 1.5 : 1,
  },
  dayMark: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 17 : 10,
    fontWeight: '900',
  },
  dayLabel: {
    color: '#18BFFF',
    fontSize: isWideHome ? 14 : 10,
  },
  dayLabelMuted: {
    color: '#69728E',
  },
  completionCard: {
    backgroundColor: '#02231F',
    borderColor: '#0C7B5C',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    padding: 18,
  },
  completionSummary: {
    width: 110,
  },
  completionNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  greenText: {
    color: '#20E895',
  },
  verticalDividerGreen: {
    backgroundColor: '#13504A',
    marginHorizontal: 18,
    width: 1,
  },
  slotProgress: {
    flex: 1,
  },
  slotProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  slotProgressLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    marginBottom: 10,
  },
  slotLine: {
    alignItems: 'center',
    borderTopColor: '#18D180',
    borderTopWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slotNode: {
    backgroundColor: '#02231F',
    borderColor: '#13D884',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    marginTop: -15,
    width: 26,
  },
  slotNodeDone: {
    alignItems: 'center',
    backgroundColor: '#20D989',
    borderStyle: 'solid',
    shadowColor: '#20D989',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  completionMessage: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 22,
    marginTop: 10,
  },
  todayProgressCard: {
    backgroundColor: '#0A1230',
    borderColor: '#334178',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    minHeight: isWideHome ? 178 : 148,
    paddingHorizontal: isWideHome ? 24 : 14,
    paddingVertical: isWideHome ? 20 : 16,
  },
  todayProgressTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 21 : 16,
    fontWeight: '900',
    marginBottom: isWideHome ? 24 : 20,
  },
  todayTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  todayLineBase: {
    borderColor: '#4B5482',
    borderStyle: 'dashed',
    borderTopWidth: 3,
    left: '8%',
    position: 'absolute',
    right: '8%',
    top: isWideHome ? 31 : 24,
  },
  todayLineFill: {
    backgroundColor: '#54EF73',
    height: 4,
    left: '8%',
    position: 'absolute',
    top: isWideHome ? 30 : 23,
  },
  todaySlotItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  todayNode: {
    alignItems: 'center',
    borderRadius: isWideHome ? 34 : 26,
    borderWidth: 3,
    height: isWideHome ? 68 : 52,
    justifyContent: 'center',
    width: isWideHome ? 68 : 52,
    zIndex: 2,
  },
  todayNodeDone: {
    backgroundColor: '#149D42',
    borderColor: '#65F27B',
    shadowColor: '#59ED76',
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  todayNodeCurrent: {
    backgroundColor: '#5635BB',
    borderColor: '#8C7CFF',
    shadowColor: '#8C62FF',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  todayNodeUpcoming: {
    backgroundColor: '#1C2553',
    borderColor: '#424A84',
    opacity: 0.82,
  },
  todaySlotLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: isWideHome ? 9 : 5,
    marginTop: isWideHome ? 14 : 10,
  },
  todaySlotTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 17 : 12,
    fontWeight: '800',
  },
  todaySlotStatus: {
    color: '#D8E1FF',
    fontSize: isWideHome ? 15 : 11,
    fontWeight: '700',
    marginTop: 3,
  },
  todaySlotCompleted: {
    color: '#61F783',
  },
  todaySlotCurrent: {
    color: '#26C9FF',
  },
  todaySlotMuted: {
    color: '#8E95BA',
  },
  challengeCard: {
    alignItems: 'center',
    backgroundColor: '#1E0C62',
    borderColor: '#7432FF',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: isWideHome ? 118 : 92,
    marginTop: 18,
    overflow: 'hidden',
    paddingHorizontal: isWideHome ? 24 : 14,
  },
  challengeGlow: {
    backgroundColor: '#3710A8',
    borderRadius: 90,
    height: 150,
    opacity: 0.5,
    position: 'absolute',
    right: -40,
    top: -44,
    width: 220,
  },
  challengeArtworkClip: {
    height: isWideHome ? 102 : 76,
    marginRight: isWideHome ? 22 : 12,
    overflow: 'hidden',
    width: isWideHome ? 122 : 82,
  },
  challengeArtwork: {
    height: isWideHome ? 68 : 80,
    width: isWideHome ? 150 : 90,
  },
  challengeTextBlock: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
  challengeInfoButton: {
    right: isWideHome ? 14 : 10,
    top: isWideHome ? 12 : 9,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 25 : 16,
    fontWeight: '900',
  },
  challengeSub: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 16 : 11,
    lineHeight: isWideHome ? 23 : 16,
    marginTop: 8,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: '#128EFF',
    borderColor: '#63DAFF',
    borderRadius: isWideHome ? 22 : 17,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: isWideHome ? 54 : 38,
    paddingHorizontal: isWideHome ? 28 : 14,
    zIndex: 2,
  },
  joinButtonWrap: {
    justifyContent: 'center',
    marginLeft: isWideHome ? 18 : 10,
    marginRight: isWideHome ? 38 : 26,
    minHeight: isWideHome ? 54 : 38,
    position: 'relative',
    zIndex: 2,
  },
  joinButtonPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 218, 255, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: isWideHome ? 22 : 17,
    borderWidth: 1,
    shadowColor: '#63DAFF',
    shadowOpacity: 0.78,
    shadowRadius: 18,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 19 : 12,
    fontWeight: '900',
  },
  leaderboardCard: {
    alignItems: 'center',
    backgroundColor: '#10123B',
    borderColor: '#2B2464',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    minHeight: isWideHome ? 186 : 142,
    overflow: 'hidden',
    paddingLeft: isWideHome ? 22 : 14,
  },
  leaderboardCopy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: isWideHome ? 22 : 14,
    zIndex: 2,
  },
  leaderboardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  leaderboardTitle: {
    color: '#DDE4F8',
    fontSize: isWideHome ? 22 : 15,
    fontWeight: '900',
  },
  leaderboardSub: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 16 : 11,
    lineHeight: isWideHome ? 24 : 17,
    marginTop: 12,
    maxWidth: isWideHome ? 270 : 170,
  },
  leaderboardButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7030EA',
    borderColor: '#B540FF',
    borderRadius: isWideHome ? 12 : 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: isWideHome ? 10 : 5,
    marginTop: isWideHome ? 22 : 12,
    paddingHorizontal: isWideHome ? 22 : 12,
    paddingVertical: isWideHome ? 12 : 9,
  },
  leaderboardButtonText: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 17 : 11,
    fontWeight: '900',
  },
  leaderboardImage: {
    bottom: 0,
    height: isWideHome ? 178 : 124,
    width: isWideHome ? 360 : 200,
  },
  modalOverlay: {
    backgroundColor: 'rgba(1,5,18,0.76)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#100A2B',
    borderColor: '#5522A6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    shadowColor: '#B135FF',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    padding: 22,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  cupWrapper: {
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
    width: '33%',
  },
  cupOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,8,33,0.58)',
    borderColor: '#27304C',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 88,
    width: '90%',
  },
  cupOptionSelected: {
    backgroundColor: 'rgba(116, 49, 232, 0.2)',
    borderColor: '#C13CFF',
    shadowColor: '#B135FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  cupGlassImage: {
    height: 44,
    width: 34,
  },
  cupAddIconWrap: {
    alignItems: 'center',
    borderColor: '#0B65D8',
    borderRadius: 999,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cupText: {
    color: '#E8ECFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 7,
  },
  cupTextSelected: {
    color: '#F055FF',
    fontWeight: '900',
  },
  deleteIcon: {
    position: 'absolute',
    right: 4,
    top: -4,
  },
  customInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(8,8,33,0.58)',
    borderColor: '#27304C',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  confirmButton: {
    backgroundColor: '#7231E8',
    borderColor: '#974BFF',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalClose: {
    color: '#A7F5FF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
  exitOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(1,5,18,0.78)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exitDialogFrame: {
    borderColor: 'rgba(72, 166, 255, 0.55)',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#16BFFF',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    width: '100%',
  },
  exitDialog: {
    alignItems: 'center',
    padding: isWideHome ? 24 : 20,
  },
  exitIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 191, 255, 0.14)',
    borderColor: 'rgba(156, 245, 255, 0.42)',
    borderRadius: 25,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  exitTitle: {
    color: '#FFFFFF',
    fontSize: isWideHome ? 22 : 19,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },
  exitMessage: {
    color: '#C8D2EE',
    fontSize: isWideHome ? 14 : 12,
    lineHeight: isWideHome ? 21 : 18,
    marginTop: 8,
    textAlign: 'center',
  },
  exitActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  exitCancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 64, 0.92)',
    borderColor: '#315A94',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  exitConfirmButton: {
    alignItems: 'center',
    backgroundColor: '#176CFF',
    borderColor: '#7DD9FF',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  exitCancelText: {
    color: '#D8E4FF',
    fontSize: 14,
    fontWeight: '900',
  },
  exitConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  celebrationOverlay: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 999,
  },
  coinSplashOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 980,
  },
  coinSplashOrigin: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: height * 0.44,
  },
  coinSplashImage: {
    height: 34,
    position: 'absolute',
    width: 34,
  },
  coinSplashText: {
    color: '#ffd15a',
    fontSize: 24,
    fontWeight: '900',
    position: 'absolute',
    textShadowColor: 'rgba(255,180,20,0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  infoModalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  infoModalFrame: {
    borderColor: '#24538f',
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: Math.min(430, width - 48),
    overflow: 'hidden',
    shadowColor: '#1688ff',
    shadowOpacity: 0.36,
    shadowRadius: 20,
    width: '100%',
  },
  infoModalCard: {
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  infoModalClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(220,232,255,0.22)',
    borderWidth: 1,
    borderRadius: 16,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  infoModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 40,
  },
  infoModalIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: '#2b9dff',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  infoModalTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
    minWidth: 0,
  },
  infoModalBody: {
    color: '#c8d3ee',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    minWidth: 0,
  },
  infoBullets: {
    gap: 12,
    marginTop: 18,
  },
  infoBulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  infoBulletDot: {
    backgroundColor: '#26d8ff',
    borderRadius: 4,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  infoBulletText: {
    color: '#eef5ff',
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21,
    minWidth: 0,
  },
  voucherBubble: {
    bottom: 24,
    position: 'absolute',
    right: 16,
    shadowColor: '#FFB743',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    zIndex: 920,
  },
  voucherBubbleGradient: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
    minWidth: 124,
    paddingHorizontal: 13,
  },
  platformLogoFrame: {
    alignItems: 'center',
    backgroundColor: '#FFD15A',
    borderColor: 'rgba(67,34,0,0.18)',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  platformLogoFrameCompact: {
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  platformLogoImage: {
    height: '78%',
    width: '78%',
  },
  voucherBubbleTextWrap: {
    maxWidth: 74,
  },
  voucherBubbleTitle: {
    color: '#3A2200',
    fontSize: 12,
    fontWeight: '900',
  },
  voucherBubbleValue: {
    color: '#5C3100',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  voucherModalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  voucherModalFrame: {
    borderColor: 'rgba(255,216,104,0.42)',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 430,
    overflow: 'hidden',
    shadowColor: '#FFD15A',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    width: '100%',
  },
  voucherModalCard: {
    padding: 20,
    width: '100%',
  },
  voucherModalClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  voucherModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  voucherModalTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  voucherModalEyebrow: {
    color: '#FFD15A',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  voucherModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  voucherPreviewCard: {
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden',
    padding: 16,
  },
  voucherPerforationLeft: {
    backgroundColor: '#151035',
    borderRadius: 16,
    height: 32,
    left: -16,
    position: 'absolute',
    top: '50%',
    width: 32,
  },
  voucherPerforationRight: {
    backgroundColor: '#07172F',
    borderRadius: 16,
    height: 32,
    position: 'absolute',
    right: -16,
    top: '50%',
    width: 32,
  },
  voucherWatermark: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 46,
    fontWeight: '900',
    position: 'absolute',
    right: 10,
    top: 36,
  },
  voucherPreviewBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  voucherPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  voucherPreviewBadge: {
    backgroundColor: 'rgba(45,24,0,0.14)',
    borderColor: 'rgba(45,24,0,0.2)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  voucherPreviewBadgeText: {
    color: '#3B2100',
    fontSize: 10,
    fontWeight: '900',
  },
  voucherPreviewProvider: {
    color: '#2E1A00',
    fontSize: 15,
    fontWeight: '900',
  },
  voucherPreviewValue: {
    color: '#6A3900',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  voucherPreviewCode: {
    color: '#2D1800',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  voucherPreviewCodeRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderColor: 'rgba(67,34,0,0.14)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  voucherCopyMiniButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 12,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  voucherCodeBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  voucherCodeLabel: {
    color: '#AEB9D8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  voucherCodeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voucherCodeCopyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,207,255,0.14)',
    borderColor: 'rgba(34,207,255,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voucherCodeCopyText: {
    color: '#DFFBFF',
    fontSize: 11,
    fontWeight: '900',
  },
  voucherCodeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },
  voucherMetaGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  voucherMetaItem: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  voucherMetaLabel: {
    color: '#9AA8CA',
    fontSize: 11,
    fontWeight: '800',
  },
  voucherMetaValue: {
    color: '#F9FBFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 5,
  },
  voucherTermsBox: {
    marginTop: 14,
  },
  voucherTermsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  voucherTermsText: {
    color: '#C8D3EE',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  voucherPlatformButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,207,255,0.16)',
    borderColor: 'rgba(34,207,255,0.34)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 13,
  },
  voucherPlatformButtonText: {
    color: '#DFFBFF',
    fontSize: 14,
    fontWeight: '900',
  },
  voucherDownloadButton: {
    alignItems: 'center',
    backgroundColor: '#FFD15A',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 14,
  },
  voucherDownloadText: {
    color: '#1B1500',
    fontSize: 15,
    fontWeight: '900',
  },
});
