import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  NativeModules,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { RewardLedgerEntry } from '../services/rewardLedgerService';
import {
  AdRewardState,
  ClaimState,
  ClaimableRewardId,
  CoinPurchaseHistoryItem,
  CoinPackId,
  PendingClaimReward,
  SpinMode,
  SpinRewardId,
  SpinState,
  claimAdReward,
  claimReward,
  convertCoinsToDiamond,
  diamondConversionCost,
  getRewardsSnapshot,
  getSpinPrizeById,
  performSpin,
  unlockExtraSpinWithAd,
  coinPackProductIds,
} from '../services/rewardsService';
import { fetchCoinPackStoreProducts, purchaseCoinPackWithStore } from '../services/iapPurchaseService';
import { DailyHydrationState, getDailyHydrationState } from '../services/hydrationService';
import { Wallet } from '../services/walletService';
import { StreakState } from '../services/streakService';
import { SlotKey } from '../services/v2Storage';
import { showRewardedAd } from '../services/adMobService';
import { ensureGoogleBackendUser } from '../services/googleAuthService';
import { getMyVouchers, markVoucherDownloaded, UserVoucher } from '../services/voucherService';

type WalletItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  image: ImageSourcePropType;
};

type CoinPack = {
  id: CoinPackId;
  amount: string;
  price: string;
  image: ImageSourcePropType;
};

type ClaimableReward = {
  id: string;
  title: string;
  value: string;
  image: ImageSourcePropType;
  source?: string;
  claimScope?: 'daily' | 'lifetime';
};

type RewardHistoryItem = {
  id: string;
  title: string;
  time: string;
  amount: string;
  image: ImageSourcePropType;
};

type SpinReward = {
  id: SpinRewardId;
  label: string;
  amount: string;
  image: ImageSourcePropType;
};

type RewardSplashKind = 'coin' | 'diamond' | 'coinBulk';

const { width } = Dimensions.get('window');
const isCompact = width < 390;
const contentPadding = 14;
const screenContentWidth = width - contentPadding * 2;
const spinnerSize = Math.min(156, screenContentWidth * 0.4);
const claimCardWidth = Math.min(138, screenContentWidth * 0.36);

const images = {
  coin: require('../assets/coin1.png'),
  coins: require('../assets/coin2.png'),
  coinStack: require('../assets/coin3.png'),
  diamond: require('../assets/diamond.png'),
  energy: require('../assets/protip2.png'),
  daily: require('../assets/reminderinfo2.png'),
  spinner: require('../assets/spiner.png'),
  ad: require('../assets/reward.png'),
  box: require('../assets/coinbox.png'),
  morning: require('../assets/morning.png'),
  afternoon: require('../assets/afternoon.png'),
  evening: require('../assets/evening.png'),
  challenge: require('../assets/challenge.png'),
  voucher: require('../assets/protip1.png'),
  milestone: require('../assets/streak2.png'),
  water: require('../assets/waterglass.png'),
};

const possibleRewards = [
  { id: 'coins', text: '5 - 25 Coins', image: images.coin },
  { id: 'spin', text: '1 More Spin', image: images.spinner },
];

const spinRewards: SpinReward[] = [
  { id: 'coins-random', label: 'Free spin reward', amount: '5 - 25 Coins', image: images.coin },
  { id: 'extra-spin', label: 'Bonus spin reward', amount: '+1 Spin', image: images.spinner },
];

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

const coinPacks: CoinPack[] = [
  { id: 'starter', amount: '500', price: 'Store price', image: images.coin },
  { id: 'value', amount: '1,500', price: 'Store price', image: images.coins },
  { id: 'mega', amount: '3,000', price: 'Store price', image: images.coinStack },
];

const milestoneRewards: Array<ClaimableReward & { requiredStreak: number }> = [
  { id: 'milestone-25', title: '25 Day Streak', value: '+100 Coins', image: images.milestone, claimScope: 'lifetime', requiredStreak: 25 },
  { id: 'milestone-50', title: '50 Day Streak', value: '+250 Coins', image: images.milestone, claimScope: 'lifetime', requiredStreak: 50 },
  { id: 'milestone-75', title: '75 Day Streak', value: '+500 Coins', image: images.milestone, claimScope: 'lifetime', requiredStreak: 75 },
  { id: 'milestone-100', title: '100 Day Streak', value: '+1000 Coins', image: images.milestone, claimScope: 'lifetime', requiredStreak: 100 },
];

const fallbackRewardHistory: RewardHistoryItem[] = [
  { id: 'morning', title: 'Morning slot completed', time: 'Today, 8:15 AM', amount: '+25', image: images.morning },
  { id: 'daily', title: 'Daily bonus claimed', time: 'Today, 8:15 AM', amount: '+10', image: images.daily },
  { id: 'spin', title: 'Free spin reward', time: 'Yesterday, 8:30 PM', amount: '+25', image: images.spinner },
  { id: 'ad', title: 'Watch ad reward', time: 'Yesterday, 6:45 PM', amount: '+15', image: images.ad },
  { id: 'afternoon', title: 'Afternoon slot completed', time: 'Yesterday, 2:10 PM', amount: '+25', image: images.afternoon },
];

const defaultWallet: Wallet = {
  coins: 0,
  diamonds: 0,
  energyLevel: 7,
};

const defaultStreak: StreakState = {
  current: 0,
  best: 0,
  totalCompletedDays: 0,
};

const defaultSpinState: SpinState = {
  freeSpinUsed: false,
  extraSpinCount: 0,
  earnedSpinCredits: 0,
  extraSpinAdUsed: false,
};

const defaultAdState: AdRewardState = {
  claimedCount: 0,
  limit: 5,
};

const defaultClaimState: ClaimState = {
  claimedIds: [],
  pendingRewards: [],
};

const getSpinRewardDisplay = (prizeId?: SpinRewardId, label?: string) => {
  const prize = getSpinPrizeById(prizeId);
  const display = spinRewards.find(item => item.id === prize.id) || spinRewards[0];
  return {
    ...display,
    amount: label || prize.label || display.amount,
  };
};

const getPendingRewardImage = (reward: PendingClaimReward) => {
  if (reward.source === 'spin') return images.spinner;
  if (reward.source === 'ad') return images.ad;
  return images.daily;
};

const isDailyCompletionPending = (reward: PendingClaimReward) =>
  reward.source === 'completion' &&
  reward.coins === 10 &&
  reward.title.toLowerCase().includes('daily');

const getClaimableRewards = ({
  claimState,
  lifetimeClaimState,
  dailyState,
  streak,
}: {
  claimState: ClaimState;
  lifetimeClaimState: ClaimState;
  dailyState: DailyHydrationState;
  streak: StreakState;
}): ClaimableReward[] => {
  const pendingRewards = (claimState.pendingRewards || []).map(reward => ({
    id: reward.id,
    title: reward.title,
    value: `+${reward.coins} Coins`,
    image: getPendingRewardImage(reward),
    source: reward.source,
    claimScope: 'daily' as const,
  }));
  const hasDailyPendingReward = (claimState.pendingRewards || []).some(isDailyCompletionPending);
  const dailyReward =
    dailyState.allSlotsCompleted && !hasDailyPendingReward && !claimState.claimedIds.includes('daily')
      ? [{ id: 'daily', title: 'Daily Bonus', value: '+10 Coins', image: images.daily, claimScope: 'daily' as const }]
      : [];
  const bestStreak = Math.max(streak.current || 0, streak.best || 0);
  const eligibleMilestones = milestoneRewards.filter(
    reward => bestStreak >= reward.requiredStreak && !lifetimeClaimState.claimedIds.includes(reward.id),
  );

  return [...pendingRewards, ...dailyReward, ...eligibleMilestones];
};

const formatLedgerTime = (createdAt: number) => {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
};

const getLedgerImage = (entry: RewardLedgerEntry) => {
  if (entry.slot === 'morning') return images.morning;
  if (entry.slot === 'afternoon') return images.afternoon;
  if (entry.slot === 'evening') return images.evening;
  if (entry.type === 'spin_reward') return images.spinner;
  if (entry.type === 'ad_reward') return images.ad;
  if (entry.type === 'daily_bonus') return images.daily;
  if (entry.type === 'competition_reward') return images.challenge;
  if (entry.diamonds) return images.diamond;
  return images.coin;
};

const formatLedgerAmount = (entry: RewardLedgerEntry) => {
  if (entry.diamonds) return `+${entry.diamonds}`;
  if (entry.coins) return `+${entry.coins}`;
  return '+0';
};

const formatPurchaseTime = (purchase: CoinPurchaseHistoryItem) => {
  const timestamp = purchase.verifiedAt || purchase.createdAt;
  return timestamp ? formatLedgerTime(new Date(timestamp).getTime()) : 'Pending';
};

const formatPurchaseStoreId = (purchase: CoinPurchaseHistoryItem) => {
  const storeId = purchase.orderId || purchase.transactionId;
  if (!storeId) return purchase.platform === 'ios' ? 'App Store' : 'Google Play';
  return storeId.length > 18 ? `${storeId.slice(0, 8)}...${storeId.slice(-6)}` : storeId;
};

const mapLedgerToHistory = (entries: RewardLedgerEntry[]): RewardHistoryItem[] =>
  entries.slice(0, 5).map(entry => ({
    id: entry.id,
    title: entry.title,
    time: formatLedgerTime(entry.createdAt),
    amount: formatLedgerAmount(entry),
    image: getLedgerImage(entry),
  }));

const RewardsScreen = ({ goToTab }: { goToTab?: (tab: string) => void }) => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const [wallet, setWallet] = useState<Wallet>(defaultWallet);
  const [streak, setStreak] = useState<StreakState>(defaultStreak);
  const [spinState, setSpinState] = useState<SpinState>(defaultSpinState);
  const [adState, setAdState] = useState<AdRewardState>(defaultAdState);
  const [claimState, setClaimState] = useState<ClaimState>(defaultClaimState);
  const [lifetimeClaimState, setLifetimeClaimState] = useState<ClaimState>(defaultClaimState);
  const [dailyState, setDailyState] = useState<DailyHydrationState>({ completedSlots: [] });
  const [history, setHistory] = useState<RewardLedgerEntry[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<CoinPurchaseHistoryItem[]>([]);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const coinSplashValues = useRef(coinSplashVectors.map(() => new Animated.Value(0))).current;
  const [showCoinSplash, setShowCoinSplash] = useState(false);
  const [coinSplashAmount, setCoinSplashAmount] = useState('+0');
  const [rewardSplashKind, setRewardSplashKind] = useState<RewardSplashKind>('coin');

  const handleBackPress = useCallback(() => {
    if (goToTab) {
      goToTab('home');
      return;
    }
    navigation.goBack();
  }, [goToTab, navigation]);

  const triggerRewardSplash = useCallback((amount: string, kind: RewardSplashKind = 'coin') => {
    setCoinSplashAmount(amount);
    setRewardSplashKind(kind);
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

  const loadRewards = useCallback(async () => {
    const [snapshot, storedDailyState, storedVouchers] = await Promise.all([
      getRewardsSnapshot(),
      getDailyHydrationState(),
      getMyVouchers().catch(() => []),
    ]);
    setWallet(snapshot.wallet);
    setStreak(snapshot.streak);
    setSpinState(snapshot.spinState);
    setAdState(snapshot.adState);
    setClaimState(snapshot.claimState);
    setLifetimeClaimState(snapshot.lifetimeClaimState);
    setDailyState(storedDailyState);
    setHistory(snapshot.history);
    setPurchaseHistory(snapshot.purchaseHistory);
    setVouchers(storedVouchers);
  }, []);

  const handleDownloadVoucher = useCallback(async (voucher: UserVoucher) => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([getRewardsSnapshot(), getDailyHydrationState(), getMyVouchers().catch(() => [])]).then(([snapshot, storedDailyState, storedVouchers]) => {
        if (!isActive) return;
        setWallet(snapshot.wallet);
        setStreak(snapshot.streak);
        setSpinState(snapshot.spinState);
        setAdState(snapshot.adState);
        setClaimState(snapshot.claimState);
        setLifetimeClaimState(snapshot.lifetimeClaimState);
        setDailyState(storedDailyState);
        setHistory(snapshot.history);
        setPurchaseHistory(snapshot.purchaseHistory);
        setVouchers(storedVouchers);
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header
            onBackPress={handleBackPress}
            onNotificationPress={() => navigation.navigate('Notifications' as never)}
            theme={tabTheme}
          />
          <WalletRow theme={tabTheme} wallet={wallet} streak={streak} />
          <DailyBonusCard dailyState={dailyState} />
          <SpinSection spinState={spinState} onRewardsChanged={loadRewards} onRewardEarned={triggerRewardSplash} />
          <AdRewardCard adState={adState} onRewardsChanged={loadRewards} onRewardEarned={triggerRewardSplash} />
          <CoinBuyingSection
            onRewardsChanged={loadRewards}
            onPurchaseSuccess={amount => triggerRewardSplash(amount, 'coinBulk')}
          />
          <CoinPurchaseHistorySection purchases={purchaseHistory} />
          <ConversionCard
            wallet={wallet}
            onRewardsChanged={loadRewards}
            onDiamondConverted={() => triggerRewardSplash('+1 Diamond', 'diamond')}
          />
          <VoucherRewardsSection
            vouchers={vouchers}
            onCopy={copyToClipboard}
            onDownload={handleDownloadVoucher}
          />
          <ClaimableRewards
            claimState={claimState}
            lifetimeClaimState={lifetimeClaimState}
            dailyState={dailyState}
            streak={streak}
            onWalletChanged={setWallet}
            onRewardsChanged={loadRewards}
            onRewardClaimed={triggerRewardSplash}
          />
          <RewardHistoryPreview history={mapLedgerToHistory(history)} />
        </ScrollView>
        {showCoinSplash ? <CoinSplashOverlay amount={coinSplashAmount} values={coinSplashValues} kind={rewardSplashKind} /> : null}
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({
  onBackPress,
  onNotificationPress,
  theme,
}: {
  onBackPress: () => void;
  onNotificationPress: () => void;
  theme: MainTabTheme;
}) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBackPress} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="chevron-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Rewards</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Earn, spin, and grow your progress.</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onNotificationPress} style={[styles.bellButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="bell" size={23} color={theme.icon} />
      <View style={styles.notificationDot} />
    </TouchableOpacity>
  </View>
);

const WalletRow = ({ theme, wallet, streak }: { theme: MainTabTheme; wallet: Wallet; streak: StreakState }) => {
  const walletItems: WalletItem[] = [
    { id: 'coins', label: 'Coins', value: wallet.coins.toLocaleString(), sub: 'Coins', image: images.coin },
    { id: 'diamonds', label: 'Diamonds', value: wallet.diamonds.toLocaleString(), sub: 'Diamonds', image: images.diamond },
    { id: 'streak', label: 'Streak', value: `${streak.current}`, sub: `Best ${streak.best}`, image: images.milestone },
  ];

  return (
    <GradientFrame colors={theme.elevatedCard} style={[styles.walletRow, { borderColor: theme.border, shadowColor: theme.shadow }]}>
      {walletItems.map((item, index) => (
        <View key={item.id} style={styles.walletItem}>
          <Image source={item.image} style={styles.walletIcon} resizeMode="contain" />
          <View>
            <Text style={[styles.walletValue, { color: theme.text }]}>{item.value}</Text>
            <Text style={[styles.walletLabel, { color: theme.mutedText }]}>{item.sub}</Text>
          </View>
          {index < walletItems.length - 1 ? <View style={styles.walletDivider} /> : null}
        </View>
      ))}
    </GradientFrame>
  );
};

const DailyBonusCard = ({ dailyState }: { dailyState: DailyHydrationState }) => (
  <GradientFrame colors={['rgba(57,21,108,0.95)', 'rgba(18,19,64,0.98)']} style={styles.dailyCard}>
    <Image source={images.daily} style={styles.dailyImage} resizeMode="contain" />
    <View style={styles.dailyCopy}>
      <Text style={styles.cardTitle}>Daily Bonus</Text>
      <Text style={styles.bodyText}>Complete all 3 hydration slots{'\n'}to unlock +10 coins</Text>
    </View>
    <SlotProgress dailyState={dailyState} />
  </GradientFrame>
);

const SlotProgress = ({ dailyState }: { dailyState: DailyHydrationState }) => (
  <View style={styles.slotProgress}>
    {([
      { id: 'morning', image: images.morning },
      { id: 'afternoon', image: images.afternoon },
      { id: 'evening', image: images.evening },
    ] as Array<{ id: SlotKey; image: ImageSourcePropType }>).map((slot, index) => (
      <View key={index} style={styles.slotStep}>
        {index > 0 ? <View style={styles.slotLine} /> : null}
        <View style={styles.slotBubble}>
          <Image source={slot.image} style={styles.slotImage} resizeMode="contain" />
          {dailyState.completedSlots.includes(slot.id) ? (
            <View style={styles.slotCheck}>
              <Feather name="check" size={9} color="#0cff76" />
            </View>
          ) : null}
        </View>
      </View>
    ))}
  </View>
);

const SpinSection = ({
  spinState,
  onRewardsChanged,
  onRewardEarned,
}: {
  spinState: SpinState;
  onRewardsChanged: () => Promise<void>;
  onRewardEarned: (amount: string) => void;
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinnerFocusValue = useRef(new Animated.Value(0)).current;
  const spinCycles = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isUnlockingExtraSpin, setIsUnlockingExtraSpin] = useState(false);
  const [lastReward, setLastReward] = useState<SpinReward>(
    getSpinRewardDisplay(spinState.lastResult?.prizeId, spinState.lastResult?.label),
  );
  const [lastSpinTime, setLastSpinTime] = useState(
    spinState.lastResult ? formatLedgerTime(spinState.lastResult.createdAt) : 'No spins yet',
  );

  useEffect(() => {
    setLastReward(getSpinRewardDisplay(spinState.lastResult?.prizeId, spinState.lastResult?.label));
    setLastSpinTime(spinState.lastResult ? formatLedgerTime(spinState.lastResult.createdAt) : 'No spins yet');
  }, [spinState.lastResult]);

  const spinRotation = useMemo(
    () =>
      spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spinValue],
  );
  const spinnerFocusStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: spinnerFocusValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
          }),
        },
        {
          scale: spinnerFocusValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.26],
          }),
        },
      ],
    }),
    [spinnerFocusValue],
  );

  const handleSpin = async (mode: SpinMode) => {
    if (isSpinning) {
      return;
    }

    setIsSpinning(true);
    let reward = spinRewards[1];
    let rewardIndex = 1;
    let earnedCoins = 0;

    try {
      const result = await performSpin(mode);
      reward = getSpinRewardDisplay(result.prize.id, result.prize.label);
      rewardIndex = spinRewards.findIndex(item => item.id === result.prize.id);
      earnedCoins = result.prize.coins || 0;
      await onRewardsChanged();
    } catch {
      setIsSpinning(false);
      return;
    }

    const extraTurns = 10 + Math.max(rewardIndex, 0) / spinRewards.length;
    const nextSpinValue = spinCycles.current + extraTurns;

    Animated.timing(spinnerFocusValue, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(spinValue, {
      toValue: nextSpinValue,
      duration: 5400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        Animated.timing(spinnerFocusValue, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        setIsSpinning(false);
        return;
      }

      spinCycles.current = nextSpinValue;
      setLastReward(reward);
      setLastSpinTime('Just now');
      if (earnedCoins > 0) {
        onRewardEarned(`+${earnedCoins}`);
      }
      Animated.timing(spinnerFocusValue, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
      });
    });
  };

  const freeSpinAvailable = !spinState.freeSpinUsed;
  const earnedSpinCredits = spinState.earnedSpinCredits || 0;
  const extraSpinAvailable = earnedSpinCredits > 0 || !spinState.extraSpinAdUsed;
  const extraSpinButtonText = isUnlockingExtraSpin
    ? 'Loading Ad'
    : earnedSpinCredits > 0
      ? 'Spin Again'
      : !spinState.extraSpinAdUsed
        ? 'Watch Ad'
        : 'Used';

  const handleExtraSpinPress = async () => {
    if (isSpinning || isUnlockingExtraSpin) return;

    if (earnedSpinCredits > 0) {
      await handleSpin('extra');
      return;
    }

    if (spinState.extraSpinAdUsed) return;

    setIsUnlockingExtraSpin(true);
    try {
      await showRewardedAd();
      await unlockExtraSpinWithAd();
      await onRewardsChanged();
      Alert.alert('Extra spin unlocked', 'Your bonus spin is ready.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ad was not completed. Please try again.';
      Alert.alert('Extra spin not unlocked', message);
    } finally {
      setIsUnlockingExtraSpin(false);
    }
  };

  return (
    <GradientFrame colors={['rgba(3,41,85,0.98)', 'rgba(5,15,35,0.98)']} style={styles.spinCard}>
      <View style={styles.spinTopRow}>
        <View style={styles.spinTitleBlock}>
          <Text style={styles.sectionTitle}>Spin & Win</Text>
          <Text style={styles.bodyText}>1 free spin every day!</Text>
        </View>

        <View style={styles.spinFreeBlock}>
          <Text style={styles.freeText}>
            {isSpinning ? 'Spinning...' : freeSpinAvailable ? 'Free Spin Available' : 'Come Back Tomorrow'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSpinning || !freeSpinAvailable}
            onPress={() => handleSpin('free')}
            style={[styles.spinButton, (isSpinning || !freeSpinAvailable) && styles.spinButtonDisabled]}
          >
            <Text style={styles.primaryButtonText}>{isSpinning ? 'Spinning' : freeSpinAvailable ? 'Spin Free' : 'Used Today'}</Text>
          </TouchableOpacity>
          <Text style={styles.smallMuted}>{freeSpinAvailable ? '1 free spin left today' : '0 free spins left today'}</Text>
        </View>
      </View>

      <View style={styles.rewardBoard}>
        <Text style={styles.previewTitleCentered}>Possible Rewards</Text>
        <View style={styles.spinMainRow}>
          <View style={styles.spinWheelColumn}>
            <Animated.View style={[styles.spinWheelLift, spinnerFocusStyle, isSpinning && styles.spinWheelLiftActive]}>
              <View style={[styles.spinWheelHalo, isSpinning && styles.spinWheelHaloActive]}>
                <View style={[styles.spinWheelFrame, isSpinning && styles.spinWheelFrameActive]}>
                  <Animated.Image
                    source={images.spinner}
                    style={[styles.spinnerImage, { transform: [{ rotate: spinRotation }] }]}
                    resizeMode="contain"
                  />
                  <View style={[styles.spinGlowBadge, isSpinning && styles.spinGlowBadgeActive]}>
                    <Text style={styles.spinGlowText}>{isSpinning ? 'SPIN' : 'READY'}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        <View style={styles.rewardGrid}>
          {possibleRewards.map(item => (
            <GradientFrame key={item.id} colors={['rgba(8,34,75,0.95)', 'rgba(3,15,35,0.98)']} style={styles.rewardPill}>
              <Image source={item.image} style={styles.previewIcon} resizeMode="contain" />
              <Text style={styles.previewText}>{item.text}</Text>
            </GradientFrame>
          ))}
        </View>
      </View>

      <View style={styles.extraSpinPanel}>
        <View style={styles.extraSpinCopy}>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <Text style={styles.extraTitle}>Extra Spin</Text>
          <Text style={styles.bodyTextCenter}>
            {earnedSpinCredits > 0
              ? `${earnedSpinCredits} bonus spin ready`
              : spinState.extraSpinAdUsed
                ? 'Extra spin used today'
                : 'Watch ad to get an extra spin'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSpinning || isUnlockingExtraSpin || !extraSpinAvailable}
          onPress={handleExtraSpinPress}
          style={[styles.watchPurple, (isSpinning || isUnlockingExtraSpin || !extraSpinAvailable) && styles.disabledButton]}
        >
          <Image source={images.ad} style={styles.buttonImage} resizeMode="contain" />
          <Text style={styles.primaryButtonText}>{extraSpinButtonText}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lastSpinRow}>
        <Text style={styles.smallMuted}>Last Spin Result</Text>
        <Image source={lastReward.image} style={styles.historyCoin} resizeMode="contain" />
        <Text style={styles.historyAmount}>{lastReward.amount}</Text>
        <Text style={styles.lastSpinTime}>{lastSpinTime}</Text>
      </View>
    </GradientFrame>
  );
};

const AdRewardCard = ({
  adState,
  onRewardsChanged,
  onRewardEarned,
}: {
  adState: AdRewardState;
  onRewardsChanged: () => Promise<void>;
  onRewardEarned: (amount: string) => void;
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [statusText, setStatusText] = useState('Watch a short ad to unlock a claim');
  const leftToday = Math.max(adState.limit - adState.claimedCount, 0);

  const handleClaimAd = async () => {
    if (isClaiming || leftToday <= 0) return;

    setIsClaiming(true);
    setStatusText('Loading rewarded ad...');
    try {
      await showRewardedAd();
      await claimAdReward();
      await onRewardsChanged();
      onRewardEarned('+15');
      setStatusText('Reward unlocked. Claim it below.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ad was not completed. Please try again.';
      setStatusText(message);
      Alert.alert('Ad reward not unlocked', message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <GradientFrame colors={['rgba(39,18,89,0.95)', 'rgba(5,15,35,0.98)']} style={styles.adCard}>
      <Image source={images.ad} style={styles.adImage} resizeMode="contain" />
      <View style={styles.adCopy}>
          <Text style={styles.cardTitle}>Watch Ad: +15 Coins</Text>
          <Text style={styles.bodyText}>{statusText}</Text>
      </View>
      <View style={styles.adCount}>
        <Text style={styles.adCountMain}>{leftToday} / {adState.limit}</Text>
        <Text style={styles.smallMuted}>left today</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isClaiming || leftToday <= 0}
        onPress={handleClaimAd}
        style={[styles.blueButton, (isClaiming || leftToday <= 0) && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>{isClaiming ? 'Loading...' : leftToday > 0 ? 'Watch Ad' : 'Done'}</Text>
      </TouchableOpacity>
    </GradientFrame>
  );
};

const CoinBuyingSection = ({
  onRewardsChanged,
  onPurchaseSuccess,
}: {
  onRewardsChanged: () => Promise<void>;
  onPurchaseSuccess: (amount: string) => void;
}) => {
  const [buyingPackId, setBuyingPackId] = useState<CoinPackId | null>(null);
  const [storePrices, setStorePrices] = useState<Partial<Record<CoinPackId, string>>>({});

  useEffect(() => {
    let isMounted = true;

    fetchCoinPackStoreProducts()
      .then(productsById => {
        if (!isMounted) return;
        setStorePrices(
          coinPacks.reduce((acc, pack) => {
            const productId = coinPackProductIds[pack.id];
            const storePrice = productsById[productId]?.price;
            if (storePrice) {
              acc[pack.id] = storePrice;
            }
            return acc;
          }, {} as Partial<Record<CoinPackId, string>>),
        );
      })
      .catch(() => {
        // Keep fallback labels when products are not active in the store yet.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBuyPack = async (packId: CoinPackId) => {
    if (buyingPackId) return;

    setBuyingPackId(packId);
    try {
      const backendUserId = await ensureGoogleBackendUser();
      await purchaseCoinPackWithStore(packId, backendUserId);
      await onRewardsChanged();
      const purchasedPack = coinPacks.find(pack => pack.id === packId);
      if (purchasedPack) {
        onPurchaseSuccess(`+${purchasedPack.amount} Coins`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to buy coins right now.';
      Alert.alert('Coin purchase unavailable', message);
    } finally {
      setBuyingPackId(null);
    }
  };

  return (
    <GradientFrame colors={['rgba(9,26,58,0.96)', 'rgba(8,13,34,0.98)']} style={styles.buyCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Buy Coins</Text>
      </View>
      <View style={styles.packRow}>
        {coinPacks.map(pack => {
          const displayPrice = storePrices[pack.id] || pack.price;
          return (
            <GradientFrame
              key={pack.id}
              colors={['rgba(4,54,103,0.95)', 'rgba(8,22,51,0.98)']}
              style={styles.packCard}
            >
              <Image source={pack.image} style={styles.packImage} resizeMode="contain" />
              <Text style={styles.packAmount}>{pack.amount}</Text>
              <Text style={styles.walletLabel}>Coins</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={Boolean(buyingPackId)}
                onPress={() => handleBuyPack(pack.id)}
                style={[styles.priceButton, buyingPackId === pack.id && styles.disabledButton]}
              >
                <Text style={styles.priceText}>{buyingPackId === pack.id ? 'Opening...' : displayPrice}</Text>
              </TouchableOpacity>
            </GradientFrame>
          );
        })}
      </View>
    </GradientFrame>
  );
};

const CoinPurchaseHistorySection = ({ purchases }: { purchases: CoinPurchaseHistoryItem[] }) => {
  const displayPurchases = purchases.slice(0, 5);

  return (
    <GradientFrame colors={['rgba(7,32,69,0.96)', 'rgba(7,15,35,0.98)']} style={styles.purchaseHistoryCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Coin Purchase History</Text>
        <Text style={styles.smallMuted}>{displayPurchases.length ? 'Latest store orders' : 'No purchases yet'}</Text>
      </View>

      {displayPurchases.length ? displayPurchases.map(purchase => (
        <View key={purchase._id} style={styles.purchaseHistoryRow}>
          <Image source={images.coinStack} style={styles.historyIcon} resizeMode="contain" />
          <View style={styles.purchaseHistoryCopy}>
            <Text style={styles.historyTitle}>{purchase.productId.replace('_', ' ')}</Text>
            <Text style={styles.historyTime}>{formatPurchaseStoreId(purchase)}</Text>
          </View>
          <View style={styles.purchaseHistoryMeta}>
            <Text style={styles.historyAmount}>+{purchase.coins}</Text>
            <Text style={styles.historyTime}>{formatPurchaseTime(purchase)}</Text>
          </View>
        </View>
      )) : (
        <View style={styles.emptyPurchaseHistory}>
          <Image source={images.coin} style={styles.historyIcon} resizeMode="contain" />
          <Text style={styles.historyTitle}>Your verified coin purchases will appear here.</Text>
        </View>
      )}
    </GradientFrame>
  );
};

const ConversionCard = ({
  wallet,
  onRewardsChanged,
  onDiamondConverted,
}: {
  wallet: Wallet;
  onRewardsChanged: () => Promise<void>;
  onDiamondConverted: () => void;
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const remainingCoins = Math.max(diamondConversionCost - wallet.coins, 0);
  const canConvert = wallet.coins >= diamondConversionCost;
  const progressPercent = `${Math.min((wallet.coins / diamondConversionCost) * 100, 100)}%` as `${number}%`;

  const handleConvert = async () => {
    if (!canConvert || isConverting) return;

    setIsConverting(true);
    try {
      const backendUserId = await ensureGoogleBackendUser();
      await convertCoinsToDiamond(backendUserId);
      await onRewardsChanged();
      onDiamondConverted();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to convert coins right now.';
      Alert.alert('Conversion unavailable', message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <GradientFrame colors={['rgba(3,50,103,0.96)', 'rgba(6,18,44,0.98)']} style={styles.conversionCard}>
      <View style={styles.conversionTop}>
        <GradientFrame colors={['rgba(48,192,255,0.24)', 'rgba(83,57,255,0.12)']} style={styles.conversionIconWrap}>
          <Image source={images.diamond} style={styles.conversionImage} resizeMode="contain" />
        </GradientFrame>

        <View style={styles.conversionCopy}>
          <Text style={styles.cardTitle}>Coin to Diamond</Text>
          <Text style={styles.bodyText}>Convert coins into premium diamonds</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} disabled={!canConvert || isConverting} onPress={handleConvert}>
          <GradientFrame
            colors={canConvert ? ['rgba(20,117,84,0.98)', 'rgba(6,73,48,0.98)'] : ['rgba(7,42,83,0.95)', 'rgba(5,20,49,0.98)']}
            style={[styles.diamondReward, (!canConvert || isConverting) && styles.disabledButton]}
          >
            <Feather name="arrow-up" size={14} color="#35c8ff" />
            <Image source={images.diamond} style={styles.miniDiamond} resizeMode="contain" />
            <Text style={styles.rewardDiamondText}>{isConverting ? '...' : '1'}</Text>
          </GradientFrame>
        </TouchableOpacity>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            {canConvert ? 'Ready to convert 500 coins into 1 Diamond' : `${remainingCoins} more coins to get 1 Diamond`}
          </Text>
          <Text style={styles.progressValue}>{wallet.coins} / {diamondConversionCost}</Text>
        </View>
        <View style={styles.progressTrackOuter}>
          <View style={styles.progressTrack}>
            <LinearGradient colors={['#39c5ff', '#a64dff']} style={[styles.progressFill, { width: progressPercent }]} />
          </View>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!canConvert || isConverting}
        onPress={handleConvert}
        style={[styles.convertButton, (!canConvert || isConverting) && styles.convertButtonDisabled]}
      >
        <Text style={styles.convertButtonText}>
          {isConverting ? 'Converting...' : canConvert ? 'Convert Now' : 'Earn More Coins'}
        </Text>
      </TouchableOpacity>
    </GradientFrame>
  );
};

const VoucherLogo = ({ voucher, size = 46 }: { voucher: UserVoucher; size?: number }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = voucher.platformLogoUrl;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <View style={[styles.voucherLogoFrame, { height: size, width: size, borderRadius: size / 2 }]}>
      {logoUrl && !logoFailed ? (
        <Image source={{ uri: logoUrl }} style={styles.voucherLogoImage} resizeMode="contain" onError={() => setLogoFailed(true)} />
      ) : (
        <MaterialCommunityIcons name="ticket-percent" size={Math.round(size * 0.54)} color="#3D2300" />
      )}
    </View>
  );
};

const VoucherRewardsSection = ({
  vouchers,
  onCopy,
  onDownload,
}: {
  vouchers: UserVoucher[];
  onCopy: (code?: string | null) => void;
  onDownload: (voucher: UserVoucher) => void;
}) => {
  if (!vouchers.length) return null;

  return (
    <GradientFrame colors={['rgba(8,30,61,0.96)', 'rgba(6,14,34,0.98)']} style={styles.voucherSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>My Vouchers</Text>
          <Text style={styles.voucherSectionSub}>Competition gift rewards</Text>
        </View>
        <Text style={styles.voucherCountText}>{vouchers.length} active</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voucherCardRow}>
        {vouchers.map(voucher => (
          <GradientFrame key={voucher._id} colors={['rgba(255,255,255,0.96)', 'rgba(223,243,255,0.92)']} style={styles.rewardVoucherCard}>
            <View style={styles.rewardVoucherHeader}>
              <VoucherLogo voucher={voucher} />
              <View style={styles.rewardVoucherCopy}>
                <Text style={styles.rewardVoucherProvider} numberOfLines={1}>{voucher.provider || 'Gift Voucher'}</Text>
                <Text style={styles.rewardVoucherValue} numberOfLines={1}>{voucher.valueLabel || voucher.title || 'Reward Voucher'}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.86} onPress={() => onCopy(voucher.code)} style={styles.rewardVoucherIconButton}>
                <Feather name="copy" size={15} color="#0B1A32" />
              </TouchableOpacity>
            </View>

            <View style={styles.rewardVoucherCodeBox}>
              <Text style={styles.rewardVoucherCode} selectable numberOfLines={1}>{voucher.code}</Text>
            </View>

            <View style={styles.rewardVoucherActions}>
              {voucher.redemptionUrl ? (
                <TouchableOpacity activeOpacity={0.86} onPress={() => Linking.openURL(voucher.redemptionUrl || '')} style={styles.rewardVoucherAction}>
                  <Feather name="external-link" size={14} color="#DFFBFF" />
                  <Text style={styles.rewardVoucherActionText}>Open</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity activeOpacity={0.86} onPress={() => onDownload(voucher)} style={styles.rewardVoucherAction}>
                <Feather name="download" size={14} color="#DFFBFF" />
                <Text style={styles.rewardVoucherActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </GradientFrame>
        ))}
      </ScrollView>
    </GradientFrame>
  );
};

const ClaimableRewards = ({
  claimState,
  lifetimeClaimState,
  dailyState,
  streak,
  onRewardsChanged,
  onRewardClaimed,
  onWalletChanged,
}: {
  claimState: ClaimState;
  lifetimeClaimState: ClaimState;
  dailyState: DailyHydrationState;
  streak: StreakState;
  onRewardsChanged: () => Promise<void>;
  onRewardClaimed: (amount: string) => void;
  onWalletChanged: (wallet: Wallet) => void;
}) => {
  const rewards = getClaimableRewards({ claimState, lifetimeClaimState, dailyState, streak });

  return (
    <GradientFrame colors={['rgba(7,32,69,0.96)', 'rgba(7,15,35,0.98)']} style={styles.claimCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Claimable Rewards</Text>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>{rewards.length} Ready</Text>
         
        </View>
      </View>
      <FlatList
        horizontal
        data={rewards}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.claimList}
        ListEmptyComponent={<EmptyClaimState />}
        renderItem={({ item }) => (
          <ClaimCard
            item={item}
            isClaimed={
              item.claimScope === 'lifetime'
                ? lifetimeClaimState.claimedIds.includes(item.id)
                : claimState.claimedIds.includes(item.id)
            }
            onWalletChanged={onWalletChanged}
            onRewardsChanged={onRewardsChanged}
            onRewardClaimed={onRewardClaimed}
          />
        )}
      />
    </GradientFrame>
  );
};

const EmptyClaimState = () => (
  <View style={styles.emptyClaimState}>
    <Text style={styles.emptyClaimTitle}>No rewards ready</Text>
    <Text style={styles.emptyClaimText}>Complete all 3 slots, watch ads, spin, or reach streak milestones.</Text>
  </View>
);

const ClaimCard = ({
  item,
  isClaimed,
  onRewardsChanged,
  onRewardClaimed,
  onWalletChanged,
}: {
  item: ClaimableReward;
  isClaimed: boolean;
  onRewardsChanged: () => Promise<void>;
  onRewardClaimed: (amount: string) => void;
  onWalletChanged: (wallet: Wallet) => void;
}) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (isClaimed || isClaiming) return;

    setIsClaiming(true);
    try {
      const result = await claimReward(item.id as ClaimableRewardId);
      onWalletChanged(result.wallet);
      await onRewardsChanged();
      onRewardClaimed(item.value.replace(' Coins', ''));
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <GradientFrame colors={['rgba(52,27,95,0.95)', 'rgba(7,32,69,0.98)']} style={styles.claimItem}>
      <Image source={item.image} style={styles.claimImage} resizeMode="contain" />
      <Text style={styles.claimTitle}>{item.title}</Text>
      <Text style={styles.claimValue}>{item.value}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isClaimed || isClaiming}
        onPress={handleClaim}
        style={[styles.claimButton, (isClaimed || isClaiming) && styles.claimButtonDisabled]}
      >
        <Text style={styles.claimButtonText}>{isClaimed ? 'CLAIMED' : 'CLAIM'}</Text>
      </TouchableOpacity>
    </GradientFrame>
  );
};

const getRewardSplashImage = (kind: RewardSplashKind, index: number) => {
  if (kind === 'diamond') return images.diamond;
  if (kind === 'coinBulk') {
    if (index % 5 === 0) return images.coinStack;
    if (index % 3 === 0) return images.coins;
  }
  return images.coin;
};

const CoinSplashOverlay = ({
  amount,
  values,
  kind,
}: {
  amount: string;
  values: Animated.Value[];
  kind: RewardSplashKind;
}) => (
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
            source={getRewardSplashImage(kind, index)}
            style={[styles.coinSplashImage, animatedStyle]}
            resizeMode="contain"
          />
        );
      })}
      <Animated.Text
        style={[
          styles.coinSplashText,
          kind === 'diamond' && styles.diamondSplashText,
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
        {amount}
      </Animated.Text>
    </View>
  </View>
);

const RewardHistoryPreview = ({ history }: { history: RewardHistoryItem[] }) => {
  const displayHistory = history.length ? history : fallbackRewardHistory;

  return (
    <GradientFrame colors={['rgba(7,32,69,0.96)', 'rgba(7,15,35,0.98)']} style={styles.historyCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Rewards History</Text>
      </View>
      {displayHistory.map(item => (
        <View key={item.id} style={styles.historyRow}>
          <Image source={item.image} style={styles.historyIcon} resizeMode="contain" />
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyTime}>{item.time}</Text>
          <Text style={styles.historyAmount}>{item.amount}</Text>
          <Image source={item.image === images.diamond ? images.diamond : images.coin} style={styles.historyCoin} resizeMode="contain" />
        </View>
      ))}
    </GradientFrame>
  );
};

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

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: contentPadding,
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
    paddingBottom: 22,
    paddingTop: 12,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,55,0.86)',
    borderColor: '#315f9f',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#1679ff',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 44,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 32,
  },
  headerSubtitle: {
    color: '#b7bdd7',
    fontSize: 12,
    marginTop: 2,
  },
  bellButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,55,0.86)',
    borderColor: '#315f9f',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#1679ff',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 44,
  },
  notificationDot: {
    backgroundColor: '#ff405d',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: 4,
    top: 4,
    width: 12,
  },
  walletRow: {
    borderColor: '#2b4c88',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    minHeight: isCompact ? 66 : 74,
    paddingHorizontal: isCompact ? 8 : 12,
  },
  walletItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  walletIcon: {
    height: isCompact ? 30 : 30,
    marginRight: isCompact ? 7 : 12,
    width: isCompact ? 30 : 30,
  },
  walletValue: {
    color: '#ffffff',
    fontSize: isCompact ? 16 : 20,
    fontWeight: '900',
  },
  walletLabel: {
    color: '#ffffff',
    fontSize: isCompact ? 10 : 12,
  },
  walletDivider: {
    backgroundColor: '#2d3d70',
    height: 44,
    position: 'absolute',
    right: 0,
    width: 1,
  },
  dailyCard: {
    alignItems: 'center',
    borderColor: '#7f35ff',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: isCompact ? 'column' : 'row',
    marginBottom: 14,
    minHeight: isCompact ? 152 : 108,
    paddingHorizontal: isCompact ? 14 : 14,
    paddingVertical: isCompact ? 12 : 14,
  },
  dailyImage: {
    height: isCompact ? 28 : 35,
    width: isCompact ? 28 : 35,
  },
  dailyCopy: {
    flex: 1,
    marginLeft: isCompact ? 0 : 10,
    marginTop: isCompact ? 6 : 0,
    width: isCompact ? '100%' : undefined,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  bodyText: {
    color: '#d7dcee',
    fontSize: 9,
    lineHeight: 10,
    marginTop: 5,
  },
  slotProgress: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: isCompact ? 0 : 16,
    marginTop: isCompact ? 12 : 0,
    width: isCompact ? '100%' : undefined,
  },
  slotStep: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  slotLine: {
    backgroundColor: '#2bd898',
    height: 3,
    width: isCompact ? 42 : 42,
  },
  slotBubble: {
    alignItems: 'center',
    backgroundColor: '#171451',
    borderColor: '#6137c4',
    borderRadius: isCompact ? 17 : 24,
    borderWidth: 1,
    height: isCompact ? 32 : 28,
    justifyContent: 'center',
    width: isCompact ? 32 : 28,
  },
  slotImage: {
    height: isCompact ? 22 : 20,
    width: isCompact ? 22 : 20,
  },
  slotCheck: {
    alignItems: 'center',
    backgroundColor: '#061e17',
    borderColor: '#0cff76',
    borderRadius: 10,
    borderWidth: 1,
    bottom: isCompact ? -3 : -4,
    height: isCompact ? 10 : 12,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: isCompact ? 10 : 12,
  },
  lockCircle: {
    alignItems: 'center',
    borderColor: '#724de4',
    borderRadius: 25,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginTop: isCompact ? 14 : 0,
    width: 40,
  },
  spinCard: {
    borderColor: '#075fae',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  spinTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spinTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  spinFreeBlock: {
    alignItems: 'center',
    width: 132,
  },
  spinMainRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: spinnerSize + 72,
  },
  spinWheelColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: spinnerSize + 58,
  },
  spinWheelLift: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  spinWheelLiftActive: {
    zIndex: 10,
  },
  spinWheelHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(23,123,255,0.10)',
    borderColor: 'rgba(78,216,255,0.30)',
    borderRadius: (spinnerSize + 14) / 2,
    borderWidth: 1,
    height: spinnerSize + 14,
    justifyContent: 'center',
    shadowColor: '#169dff',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: spinnerSize + 14,
  },
  spinWheelHaloActive: {
    backgroundColor: 'rgba(45,210,255,0.18)',
    borderColor: '#72f2ff',
    shadowOpacity: 0.95,
    shadowRadius: 24,
  },
  spinWheelFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(1,9,24,0.48)',
    borderColor: 'rgba(92,222,255,0.52)',
    borderRadius: spinnerSize / 2,
    borderWidth: 2,
    height: spinnerSize,
    justifyContent: 'center',
    width: spinnerSize,
    overflow: 'hidden',
  },
  spinWheelFrameActive: {
    backgroundColor: 'rgba(30,150,255,0.12)',
    borderColor: '#56d8ff',
    shadowColor: '#29c8ff',
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
  spinHeaderRow: {
    alignItems: isCompact ? 'flex-start' : 'center',
    flexDirection: isCompact ? 'column' : 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinSide: {
    alignItems: 'center',
    alignSelf: isCompact ? 'stretch' : 'auto',
    marginTop: isCompact ? 16 : 0,
    width: isCompact ? '100%' : 156,
  },
  freeText: {
    color: '#59ff65',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  spinButton: {
    alignItems: 'center',
    backgroundColor: '#097a37',
    borderColor: '#3aff78',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: '100%',
  },
  spinButtonDisabled: {
    backgroundColor: '#0b4d2c',
    borderColor: '#1cae55',
    opacity: 0.82,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  smallMuted: {
    color: '#b8bfd5',
    fontSize: 10,
  },
  spinBody: {
    alignItems: 'stretch',
    flexDirection: isCompact ? 'column' : 'row',
    marginTop: isCompact ? 16 : -8,
  },
  rewardPreview: {
    backgroundColor: 'rgba(4,16,37,0.7)',
    borderColor: '#143c6c',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 9,
  },
  rewardBoard: {
    backgroundColor: 'rgba(2,12,31,0.58)',
    borderColor: '#15558f',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  previewTitleCentered: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  rewardSideColumn: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  rewardPill: {
    alignItems: 'center',
    borderColor: '#1c5f9c',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '48%',
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 10,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 5,
  },
  previewIcon: {
    height: 20,
    marginRight: 8,
    width: 20,
  },
  previewText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  spinnerImage: {
    height: spinnerSize,
    width: spinnerSize,
  },
  spinGlowBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,12,28,0.78)',
    borderColor: '#3ed8ff',
    borderRadius: 12,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    width: 54,
  },
  spinGlowBadgeActive: {
    backgroundColor: 'rgba(8,43,78,0.9)',
    borderColor: '#b9fbff',
  },
  spinGlowText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  extraSpinPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,18,42,0.62)',
    borderColor: '#183e72',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  extraSpinCopy: {
    flex: 1,
    paddingRight: 12,
  },
  extraSpin: {
    alignItems: 'center',
    width: isCompact ? '100%' : 190,
  },
  orRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
    width: 96,
  },
  orLine: {
    backgroundColor: '#2c456c',
    flex: 1,
    height: 1,
  },
  orText: {
    color: '#d7dcee',
    fontSize: 11,
    marginHorizontal: 8,
  },
  extraTitle: {
    color: '#67eaff',
    fontSize: 13,
    fontWeight: '900',
  },
  bodyTextCenter: {
    color: '#d7dcee',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  watchPurple: {
    alignItems: 'center',
    backgroundColor: '#7034d7',
    borderColor: '#b27cff',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 38,
    justifyContent: 'center',
    width: 118,
  },
  buttonImage: {
    height: 22,
    width: 22,
  },
  lastSpinRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,23,52,0.85)',
    borderColor: '#183e72',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  historyCoin: {
    height: 24,
    marginHorizontal: 8,
    width: 24,
  },
  historyAmount: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  lastSpinTime: {
    color: '#b8bfd5',
    flex: 1,
    fontSize: 11,
    textAlign: 'right',
  },
  adCard: {
    alignItems: 'center',
    borderColor: '#6731cc',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    minHeight: 66,
    padding: isCompact ? 10 : 12,
  },
  adImage: {
    height: isCompact ? 34 : 40,
    width: isCompact ? 34 : 40,
  },
  adCopy: {
    flex: 1,
    marginLeft: isCompact ? 10 : 16,
  },
  adCount: {
    alignItems: 'center',
    marginHorizontal: isCompact ? 8 : 22,
  },
  adCountMain: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  blueButton: {
    alignItems: 'center',
    backgroundColor: '#0869d8',
    borderColor: '#31b6ff',
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: isCompact ? 76 : 80,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buyCard: {
    borderColor: '#4135a7',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  secureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  packRow: {
    flexDirection: 'row',
    gap: isCompact ? 8 : 12,
  },
  packCard: {
    alignItems: 'center',
    borderColor: '#136bbe',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: isCompact ? 118 : 128,
    padding: isCompact ? 8 : 10,
  },
  packImage: {
    height: isCompact ? 38 : 48,
    width: isCompact ? 54 : 66,
  },
  packAmount: {
    color: '#ffffff',
    fontSize: isCompact ? 17 : 22,
    fontWeight: '900',
  },
  priceButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,33,72,0.95)',
    borderColor: '#1d4f8f',
    borderRadius: 9,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  priceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  conversionCard: {
    borderColor: '#0868bb',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 128,
    padding: isCompact ? 12 : 14,
  },
  conversionTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  conversionIconWrap: {
    alignItems: 'center',
    borderColor: 'rgba(53,200,255,0.35)',
    borderRadius: 18,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  conversionImage: {
    height: 46,
    width: 46,
  },
  conversionCopy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  diamondReward: {
    alignItems: 'center',
    borderColor: 'rgba(53,200,255,0.35)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 10,
    width: 54,
  },
  progressBlock: {
    marginTop: 14,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  progressTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    paddingRight: 10,
  },
  progressTrackOuter: {
    backgroundColor: 'rgba(2,10,27,0.48)',
    borderColor: 'rgba(53,200,255,0.18)',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
  },
  progressTrack: {
    backgroundColor: '#18305f',
    borderRadius: 6,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '87%',
  },
  progressValue: {
    color: '#11d8ff',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  convertButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#087c52',
    borderColor: '#23f3a0',
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
  },
  convertButtonDisabled: {
    backgroundColor: 'rgba(12,42,76,0.85)',
    borderColor: '#22598f',
  },
  convertButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  voucherSection: {
    borderColor: 'rgba(53,200,255,0.26)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    padding: 12,
  },
  voucherSectionSub: {
    color: '#8FA2C8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  voucherCountText: {
    color: '#35c8ff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  voucherCardRow: {
    gap: 10,
    paddingRight: 8,
  },
  rewardVoucherCard: {
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 128,
    overflow: 'hidden',
    padding: 12,
    width: Math.min(260, screenContentWidth - 28),
  },
  rewardVoucherHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  voucherLogoFrame: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(11,26,50,0.12)',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  voucherLogoImage: {
    height: '78%',
    width: '78%',
  },
  rewardVoucherCopy: {
    flex: 1,
    minWidth: 0,
  },
  rewardVoucherProvider: {
    color: '#0B1A32',
    fontSize: 14,
    fontWeight: '900',
  },
  rewardVoucherValue: {
    color: '#51637E',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  rewardVoucherIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,26,50,0.07)',
    borderColor: 'rgba(11,26,50,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  rewardVoucherCodeBox: {
    backgroundColor: 'rgba(11,26,50,0.06)',
    borderColor: 'rgba(11,26,50,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rewardVoucherCode: {
    color: '#0B1A32',
    fontSize: 14,
    fontWeight: '900',
  },
  rewardVoucherActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  rewardVoucherAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,36,73,0.92)',
    borderColor: 'rgba(53,200,255,0.24)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rewardVoucherActionText: {
    color: '#DFFBFF',
    fontSize: 11,
    fontWeight: '900',
  },
  miniDiamond: {
    height: 24,
    width: 24,
  },
  rewardDiamondText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  claimCard: {
    borderColor: '#1d5da2',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  linkText: {
    color: '#24c8ff',
    fontSize: 12,
    fontWeight: '800',
  },
  claimList: {
    gap: 12,
  },
  emptyClaimState: {
    borderColor: '#254c86',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 112,
    padding: 12,
    width: Math.min(260, screenContentWidth - 28),
  },
  emptyClaimTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyClaimText: {
    color: '#9fb0d8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
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
    top: width * 0.92,
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
  diamondSplashText: {
    color: '#8fe9ff',
    textShadowColor: 'rgba(95,220,255,0.82)',
  },
  claimItem: {
    alignItems: 'center',
    borderColor: '#426ac9',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 130,
    padding: 10,
    width: claimCardWidth,
  },
  claimImage: {
    height: 40,
    width: 40,
  },
  claimTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  claimValue: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
  },
  claimButton: {
    alignItems: 'center',
    backgroundColor: '#078a43',
    borderColor: '#20f281',
    borderRadius: 7,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  claimButtonDisabled: {
    backgroundColor: '#1c4f40',
    borderColor: '#4e8e79',
    opacity: 0.72,
  },
  claimButtonText: {
    color: '#c9ffe4',
    fontSize: 12,
    fontWeight: '900',
  },
  historyCard: {
    borderColor: '#244c89',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  purchaseHistoryCard: {
    borderColor: '#244c89',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  purchaseHistoryRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(132,162,212,0.18)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  purchaseHistoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  purchaseHistoryMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  emptyPurchaseHistory: {
    alignItems: 'center',
    borderColor: 'rgba(132,162,212,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  historyRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(132,162,212,0.18)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
  },
  historyIcon: {
    height: 28,
    marginRight: 12,
    width: 28,
  },
  historyTitle: {
    color: '#ffffff',
    flex: isCompact ? 1.4 : 1.2,
    fontSize: isCompact ? 12 : 11,
    fontWeight: '800',
  },
  historyTime: {
    color: '#b8bfd5',
    flex: 1,
    fontSize: isCompact ? 10 : 10,
  },
});

export default RewardsScreen;
