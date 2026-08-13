import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { getDigitalMeMessageCatalog } from '../utils/digitalMeMessageUtils';
import { getTodayLogs } from '../utils/waterIntakeUtils';
import { getHydrationGoal, getUserProfile } from '../utils/userUtils';
import { getDailyHydrationState } from '../services/hydrationService';
import { getStreak } from '../services/streakService';
import { getWallet } from '../services/walletService';
import { getLocalDateKey } from '../services/v2Storage';
import { playBackgroundMusic, stopBackgroundMusic } from '../services/backgroundMusicService';
import { getActiveCompetitionLeaderboard } from '../services/competitionService';

type RootStackParamList = Record<string, object | undefined>;
type SlotKey = 'morning' | 'afternoon' | 'evening';

type DigitalState = {
  intake: number;
  goal: number;
  taps: number;
  completedSlots: SlotKey[];
  wallet: { coins: number; diamonds: number };
  streak: { current: number; best: number };
  username: string;
  globalRank: number | null;
  globalParticipants: number;
};

type BodyCondition = {
  key: 'beginner' | 'recovering' | 'active' | 'elite';
  title: string;
  label: string;
  range: string;
  status: string;
  energy: string;
  hint: string;
  color: string;
  image: ImageSourcePropType;
  benefits: string[];
};

const images = {
  avatar: require('../assets/digitalme1.png') as ImageSourcePropType,
  digitalMe1: require('../assets/digitalme1.png') as ImageSourcePropType,
  digitalMe2: require('../assets/digitalme2.png') as ImageSourcePropType,
  digitalMe3: require('../assets/digitalme3.png') as ImageSourcePropType,
  digitalMe4: require('../assets/digitalme4.png') as ImageSourcePropType,
  mascot: require('../assets/hydrationplan.png') as ImageSourcePropType,
  heart: require('../assets/whatnext_2.png') as ImageSourcePropType,
  coin: require('../assets/coin2.png') as ImageSourcePropType,
  diamond: require('../assets/diamond.png') as ImageSourcePropType,
  rank: require('../assets/rank.png') as ImageSourcePropType,
  streak: require('../assets/streak.png') as ImageSourcePropType,
  cup: require('../assets/waterglass.png') as ImageSourcePropType,
  morning: require('../assets/morning.png') as ImageSourcePropType,
  afternoon: require('../assets/afternoon.png') as ImageSourcePropType,
  evening: require('../assets/evening.png') as ImageSourcePropType,
  rewardCoin: require('../assets/ChatGPT_Image_May_12__2026__03_38_40_PM-removebg-preview.png') as ImageSourcePropType,
};

const messageCatalog = getDigitalMeMessageCatalog();
const MESSAGE_ROTATION_MS = 9000;

const bodyConditionLevels: BodyCondition[] = [
  {
    key: 'beginner',
    title: '1. Beginner',
    label: 'BEGINNER',
    range: '0% - 20%',
    status: 'Low Energy\nDehydrated',
    energy: 'Low Energy',
    hint: 'Drink water now and start your first slot.',
    color: '#9b8b70',
    image: images.digitalMe1,
    benefits: ['Fatigue', 'Poor Focus', 'Dry Skin'],
  },
  {
    key: 'recovering',
    title: '2. Recovering',
    label: 'RECOVERING',
    range: '20% - 40%',
    status: 'Energy Improving\nGetting Better',
    energy: 'Energy Improving',
    hint: 'Your body is responding. Complete the next slot.',
    color: '#4fd1b0',
    image: images.digitalMe2,
    benefits: ['Better Mood', 'More Focus', 'Hydrated Skin'],
  },
  {
    key: 'active',
    title: '3. Active',
    label: 'ACTIVE',
    range: '40% - 70%',
    status: 'Strong & Active\nBuilding Momentum',
    energy: 'Strong & Active',
    hint: 'Good rhythm. Keep steady hydration gaps.',
    color: '#35a7ff',
    image: images.digitalMe3,
    benefits: ['High Energy', 'Sharp Focus', 'Healthy Skin'],
  },
  {
    key: 'elite',
    title: '4. Elite',
    label: 'ELITE',
    range: '70% - 90%+',
    status: 'Peak Performance\nUnstoppable',
    energy: 'Peak Performance',
    hint: 'Excellent hydration. Finish remaining slots for rewards.',
    color: '#b65cff',
    image: images.digitalMe4,
    benefits: ['Max Energy', 'Laser Focus', 'Glowing Skin'],
  },
];

const getBodyCondition = (hydrationPercent: number) => {
  if (hydrationPercent < 20) return bodyConditionLevels[0];
  if (hydrationPercent < 40) return bodyConditionLevels[1];
  if (hydrationPercent < 70) return bodyConditionLevels[2];
  return bodyConditionLevels[3];
};

const DigitalMeScreen = ({ goToTab }: { goToTab?: (tab: string) => void }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const tabTheme = useMainTabTheme();
  const [state, setState] = useState<DigitalState>({
    intake: 0,
    goal: 3000,
    taps: 0,
    completedSlots: [],
    wallet: { coins: 450, diamonds: 1 },
    streak: { current: 0, best: 0 },
    username: 'Username',
    globalRank: null,
    globalParticipants: 0,
  });
  const [messageIndex, setMessageIndex] = useState(0);
  const [bodyInfoVisible, setBodyInfoVisible] = useState(false);
  const [suggestionVisible, setSuggestionVisible] = useState(false);

  const handleBackPress = useCallback(() => {
    if (goToTab) {
      goToTab('home');
      return;
    }
    navigation.goBack();
  }, [goToTab, navigation]);

  useFocusEffect(
    useCallback(() => {
      playBackgroundMusic('digitalMe');
      return () => stopBackgroundMusic();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        const dateKey = getLocalDateKey();
        const [logs, goal, dailyState, wallet, streak, profile, leaderboard] = await Promise.all([
          getTodayLogs(),
          getHydrationGoal(),
          getDailyHydrationState(dateKey),
          getWallet(),
          getStreak(),
          getUserProfile(),
          getActiveCompetitionLeaderboard(1).catch(() => null),
        ]);

        if (!active) return;

        setState({
          intake: logs.reduce((sum, log) => sum + log.amount, 0),
          goal,
          taps: logs.length,
          completedSlots: dailyState.completedSlots || [],
          wallet,
          streak,
          username: profile?.username || 'Username',
          globalRank: leaderboard?.currentUser?.rank || null,
          globalParticipants: leaderboard?.competition?.participants || leaderboard?.leaderboard.length || 0,
        });
      };

      load();

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    const rotation = setInterval(() => {
      setMessageIndex(current => current + 1);
    }, MESSAGE_ROTATION_MS);

    return () => clearInterval(rotation);
  }, []);

  const hydrationPercent = Math.min(Math.round((state.intake / Math.max(state.goal, 1)) * 100), 100);
  const bodyCondition = getBodyCondition(hydrationPercent);
  const bodyVisualImage = bodyCondition.image;

  const supportCards = useMemo(() => [
    {
      title: 'Energy',
      icon: 'lightning-bolt',
      color: '#63f28b',
      text: messageCatalog.energy[messageIndex % messageCatalog.energy.length],
    },
    {
      title: 'Focus',
      icon: 'brain',
      color: '#35a7ff',
      text: messageCatalog.focus[(messageIndex + 2) % messageCatalog.focus.length],
    },
    {
      title: 'Body Support',
      icon: 'shield-plus',
      color: '#d46cff',
      text: messageCatalog.body[(messageIndex + 4) % messageCatalog.body.length],
    },
    {
      title: 'Progress',
      icon: 'chart-line',
      color: '#ffad33',
      text: messageCatalog.progress[(messageIndex + 6) % messageCatalog.progress.length],
    },
  ], [messageIndex]);

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header
            onBackPress={handleBackPress}
            onNotifications={() => navigation.navigate('Notifications')}
            theme={tabTheme}
          />

          <GradientFrame colors={tabTheme.elevatedCard} style={[styles.digitalHero, { borderColor: tabTheme.border, shadowColor: tabTheme.shadow }]} contentStyle={styles.digitalHeroContent}>
            <HeroStats
              hydrationPercent={hydrationPercent}
              intake={state.intake}
              goal={state.goal}
              taps={state.taps}
              streak={state.streak}
              theme={tabTheme}
            />
            <View style={styles.bodyVisual}>
              <Image source={bodyVisualImage} style={styles.bodyImage} resizeMode="contain" />
            </View>
          </GradientFrame>

          <BodyStateCard
            bodyCondition={bodyCondition}
            hydrationPercent={hydrationPercent}
            onBodyInfoPress={() => setBodyInfoVisible(true)}
            onSuggestionPress={() => setSuggestionVisible(true)}
          />

          <View style={styles.supportGrid}>
            {supportCards.map(card => <SupportCard key={card.title} item={card} />)}
          </View>
          <WalletRankRow state={state} />
          <SlotTimeline completedSlots={state.completedSlots} />
          <Encouragement username={state.username} />
        </ScrollView>
        <BodyConditionModal visible={bodyInfoVisible} onClose={() => setBodyInfoVisible(false)} />
        <HydrationSuggestionModal
          visible={suggestionVisible}
          hydrationPercent={hydrationPercent}
          bodyCondition={bodyCondition}
          onClose={() => setSuggestionVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBackPress, onNotifications, theme }: { onBackPress: () => void; onNotifications: () => void; theme: MainTabTheme }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBackPress} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="chevron-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>My Digital Me</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Your Body. Your Progress. Your Best Version.</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onNotifications} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="bell" size={23} color={theme.icon} />
      <View style={styles.notificationDot} />
    </TouchableOpacity>
  </View>
);

const HeroStats = ({
  hydrationPercent,
  intake,
  goal,
  taps,
  streak,
  theme,
}: {
  hydrationPercent: number;
  intake: number;
  goal: number;
  taps: number;
  streak: { current: number; best: number };
  theme: MainTabTheme;
}) => (
  <>
    <View style={styles.heroHydrationStats}>
      <Text style={styles.heroStatEyebrow}>HYDRATION</Text>
      <Text style={[styles.heroHydrationValue, { color: theme.text }]}>{hydrationPercent}<Text style={styles.heroPercent}>%</Text></Text>
      <Text style={styles.heroHydrationLabel}>Hydrated</Text>
      <View style={styles.heroStatDivider} />
      <Text style={[styles.heroGoal, { color: theme.text }]}>{(intake / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L</Text>
      <Text style={styles.heroGoalLabel}>Today&apos;s Goal</Text>
    </View>

    <View style={styles.heroRightStats}>
      <MaterialCommunityIcons name="water" size={30} color="#35c8ff" />
      <Text style={[styles.heroRightValue, { color: theme.text }]}>{taps}</Text>
      <Text style={[styles.heroRightLabel, { color: theme.mutedText }]}>Taps</Text>
      <View style={styles.heroRightDivider} />
      <Image source={images.streak} style={styles.heroStreakImage} resizeMode="contain" />
      <Text style={[styles.heroLevelValue, { color: theme.text }]}>{streak.current}</Text>
      <Text style={[styles.heroRightLabel, { color: theme.mutedText }]}>Day Streak</Text>
    </View>
  </>
);

const BodyStateCard = ({
  bodyCondition,
  hydrationPercent,
  onBodyInfoPress,
  onSuggestionPress,
}: {
  bodyCondition: BodyCondition;
  hydrationPercent: number;
  onBodyInfoPress: () => void;
  onSuggestionPress: () => void;
}) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.bodyStateCard} contentStyle={styles.bodyStateCardContent}>
    <View style={styles.bodyStateHeader}>
      <View>
        <View style={styles.metricTitleRow}>
          <Text style={styles.metricTitle}>Body State</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={onBodyInfoPress} style={styles.infoTap}>
            <Feather name="info" size={14} color="#8996ba" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.bodyStateText, { color: bodyCondition.color }]}>{bodyCondition.label}</Text>
        <Text style={styles.metricSub}>{bodyCondition.energy}</Text>
      </View>
      <View style={styles.statePercentPill}>
        <Text style={styles.statePercent}>{hydrationPercent}%</Text>
        <Text style={styles.statePercentLabel}>today</Text>
      </View>
    </View>
    <View style={styles.bodyStateFooter}>
      <MaterialCommunityIcons name="water" size={34} color={bodyCondition.color} />
      <Text style={styles.bodyHint}>{bodyCondition.hint}</Text>
      <TouchableOpacity activeOpacity={0.75} onPress={onSuggestionPress} style={styles.infoTap}>
        <Feather name="info" size={14} color="#8996ba" />
      </TouchableOpacity>
    </View>
  </GradientFrame>
);

const BodyConditionModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalFrame, styles.conditionModalFrame]}>
        <LinearGradient colors={['#06142f', '#050915']} style={styles.modalBackground} />
        <View style={styles.conditionModal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Body Conditions</Text>
              <Text style={styles.modalSubtitle}>Hydration changes your Digital Me state.</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.modalClose}>
              <Feather name="x" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conditionList}>
            {bodyConditionLevels.map((level, index) => (
              <View key={level.title} style={styles.conditionItemWrap}>
                <GradientFrame
                  colors={[`${level.color}24`, 'rgba(7,18,40,0.98)']}
                  style={[styles.conditionCard, { borderColor: level.color }]}
                  contentStyle={styles.conditionCardContent}
                >
                  <Text style={styles.conditionTitle}>{level.title}</Text>
                  <Text style={styles.conditionRange}>{level.range}</Text>
                  <Image source={level.image} style={styles.conditionBody} resizeMode="contain" />
                  <Text style={[styles.conditionStatus, { color: level.color }]}>{level.status}</Text>
                  <View style={styles.conditionDivider} />
                  {level.benefits.map(benefit => (
                    <View key={benefit} style={styles.benefitRow}>
                      <View style={[styles.benefitIcon, { backgroundColor: `${level.color}30` }]}>
                        <MaterialCommunityIcons name="star-four-points" size={12} color={level.color} />
                      </View>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </GradientFrame>
                {index < bodyConditionLevels.length - 1 ? <Text style={styles.conditionArrow}>{'>>'}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  </Modal>
);

const HydrationSuggestionModal = ({
  visible,
  hydrationPercent,
  bodyCondition,
  onClose,
}: {
  visible: boolean;
  hydrationPercent: number;
  bodyCondition: BodyCondition;
  onClose: () => void;
}) => {
  const low = hydrationPercent < 40;
  const good = hydrationPercent >= 70;
  const suggestions = low
    ? ['Drink one glass now.', 'Complete your next hydration slot.', 'Keep reminders enabled today.']
    : good
      ? ['Maintain your rhythm.', 'Finish remaining slots for bonus rewards.', 'Avoid long gaps between drinks.']
      : ['Drink 250 ml in the next hour.', 'Aim for one more completed slot.', 'Small consistent taps will raise your state.'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalFrame}>
          <LinearGradient colors={['#071b3d', '#080d20']} style={styles.modalBackground} />
          <View style={styles.suggestionModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Hydration Suggestion</Text>
                <Text style={styles.modalSubtitle}>{bodyCondition.label} - {hydrationPercent}% today</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.modalClose}>
                <Feather name="x" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.suggestionHero}>
              <MaterialCommunityIcons name={good ? 'water-check' : 'water-alert'} size={42} color={good ? '#63f28b' : '#35c8ff'} />
              <Text style={styles.suggestionHeroText}>
                {good ? 'Your body is responding well. Keep the streak alive.' : 'Your Digital Me needs more water support today.'}
              </Text>
            </View>

            {suggestions.map(item => (
              <View key={item} style={styles.suggestionRow}>
                <Feather name="check-circle" size={18} color="#63f28b" />
                <Text style={styles.suggestionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SupportCard = ({ item }: { item: { title: string; icon: string; color: string; text: string } }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={[styles.supportCard, { borderColor: `${item.color}70` }]} contentStyle={styles.supportCardContent}>
    <View style={[styles.supportIcon, { borderColor: item.color, backgroundColor: `${item.color}18` }]}>
      <MaterialCommunityIcons name={item.icon} size={19} color={item.color} />
    </View>
    <View style={styles.supportCopy}>
      <Text style={[styles.supportTitle, { color: item.color }]} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.supportText} numberOfLines={3}>{item.text}</Text>
    </View>
  </GradientFrame>
);

const WalletRankRow = ({ state }: { state: DigitalState }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.walletRow} contentStyle={styles.walletRowContent}>
    <SummaryItem image={images.coin} label="Coins" value={String(state.wallet.coins)} sub="+120" color="#ffbc37" />
    <SummaryItem image={images.diamond} label="Diamonds" value={String(state.wallet.diamonds)} sub="+0" color="#35c8ff" />
    <SummaryItem image={images.streak} label="Current Streak" value={`${state.streak.current}`} sub={`${state.streak.best} best`} color="#63f28b" />
    <SummaryItem
      image={images.rank}
      label="Global Rank"
      value={state.globalRank ? `#${state.globalRank.toLocaleString()}` : '--'}
      sub={getRankSubtext(state.globalRank, state.globalParticipants)}
      color="#b65cff"
    />
  </GradientFrame>
);

const getRankSubtext = (rank: number | null, participants: number) => {
  if (!rank) return '';
  if (!participants) return '';

  const percentile = Math.max(1, Math.round((rank / Math.max(participants, 1)) * 100));
  return `Top ${percentile}%`;
};

const SummaryItem = ({ image, icon, label, value, sub, color }: {
  image?: ImageSourcePropType;
  icon?: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}) => (
  <View style={styles.summaryItem}>
    {image ? <Image source={image} style={styles.summaryImage} resizeMode="contain" /> : <MaterialCommunityIcons name={icon || 'star'} size={28} color={color} />}
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={[styles.summarySub, { color }]}>{sub}</Text>
  </View>
);

const SlotTimeline = ({ completedSlots }: { completedSlots: SlotKey[] }) => (
  <GradientFrame colors={['#0E0B2E', '#061333']} style={styles.slotsCard} contentStyle={styles.slotsCardContent}>
    <View style={styles.sectionHeader}>
      <Text style={styles.slotsTitle}>Today&apos;s Slots</Text>
     
    </View>
    <View style={styles.slotCardsRow}>
      {(['morning', 'afternoon', 'evening'] as SlotKey[]).map((slot, index) => {
        const completed = completedSlots.includes(slot);
        const currentSlot = (['morning', 'afternoon', 'evening'] as SlotKey[]).find(item => !completedSlots.includes(item));
        const isCurrent = currentSlot === slot && !completed;
        const slotImage = slot === 'morning' ? images.morning : slot === 'afternoon' ? images.afternoon : images.evening;

        return (
          <View
            key={slot}
            style={[
              styles.slotCard,
              completed && styles.slotCardCompleted,
              isCurrent && styles.slotCardCurrent,
            ]}
          >
            <Image source={slotImage} style={styles.slotImage} resizeMode="contain" />
            <View style={styles.slotCardText}>
              <Text style={[styles.slotCardTitle, completed && styles.slotDoneText]}>{capitalize(slot)}</Text>
              <Text style={styles.slotStatus}>{completed ? 'Completed' : 'Pending'}</Text>
              {completed ? (
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardText}>+25</Text>
                  <Image source={images.rewardCoin} style={styles.rewardCoin} resizeMode="contain" />
                </View>
              ) : null}
            </View>
            <View style={[styles.slotBadge, completed && styles.slotBadgeDone]}>
              {completed ? <Feather name="check" size={14} color="#ffffff" /> : null}
            </View>
            {index < 2 ? <View style={styles.dottedConnector} /> : null}
          </View>
        );
      })}
    </View>
  </GradientFrame>
);

const Encouragement = ({ username }: { username: string }) => (
  <GradientFrame colors={['rgba(6,38,82,0.98)', 'rgba(4,18,42,0.98)']} style={styles.encouragement} contentStyle={styles.encouragementContent}>
    <Image source={images.mascot} style={styles.mascot} resizeMode="contain" />
    <View style={styles.encouragementCopy}>
      <Text style={styles.encouragementTitle}>You&apos;re doing great, {username}!</Text>
      <Text style={styles.encouragementText}>Your hydration level today is supporting your body&apos;s daily performance.</Text>
      <Text style={styles.encouragementStrong}>Keep it up. Your future self is proud of you!</Text>
    </View>
    <Image source={images.heart} style={styles.heart} resizeMode="contain" />
  </GradientFrame>
);

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const GradientFrame = ({
  children,
  colors,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    <View style={[styles.gradientContent, contentStyle]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingBottom: 36, paddingHorizontal: 14 },
  gradientFrame: {
    backgroundColor: 'rgba(4,13,32,0.98)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientContent: {
    flex: 1,
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
  notificationDot: {
    backgroundColor: '#ff315b',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: 2,
    top: 7,
    width: 12,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600', lineHeight: 32 },
  headerSubtitle: { color: '#b7bdd7', fontSize: 12, marginTop: 2, textAlign: 'center' },
  digitalHero: {
    borderColor: '#1f5c9e',
    borderRadius: 22,
    marginBottom: 14,
    minHeight: 318,
  },
  digitalHeroContent: {
    minHeight: 318,
    position: 'relative',
  },
  metricTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  metricTitle: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  infoTap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  metricSub: { color: '#d4d9eb', fontSize: 12, lineHeight: 18, marginTop: 6 },
  heroHydrationStats: {
    left: 14,
    position: 'absolute',
    top: 42,
    width: 116,
    zIndex: 4,
  },
  heroStatEyebrow: {
    color: '#35d9ff',
    fontSize: 12,
    fontWeight: '900',
  },
  heroHydrationValue: {
    color: '#ffffff',
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 46,
    marginTop: 8,
  },
  heroPercent: {
    fontSize: 22,
  },
  heroHydrationLabel: {
    color: '#35d9ff',
    fontSize: 14,
    fontWeight: '900',
  },
  heroStatDivider: {
    backgroundColor: '#173b65',
    height: 1,
    marginVertical: 14,
    width: 112,
  },
  heroGoal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  heroGoalLabel: {
    color: '#c5cbe0',
    fontSize: 11,
    marginTop: 4,
  },
  updateGoalButton: {
    alignItems: 'center',
    borderColor: '#237de0',
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 6,
  },
  updateGoalText: {
    color: '#b9e4ff',
    fontSize: 11,
    fontWeight: '900',
  },
  heroRightStats: {
    alignItems: 'center',
    position: 'absolute',
    right: 15,
    top: 52,
    width: 78,
    zIndex: 4,
  },
  heroRightValue: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },
  heroRightLabel: {
    color: '#c5cbe0',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  heroRightDivider: {
    backgroundColor: '#173b65',
    height: 1,
    marginVertical: 18,
    width: 62,
  },
  heroStreakImage: {
    height: 34,
    width: 34,
  },
  heroLevelValue: {
    color: '#35d9ff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  bodyVisual: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 318, overflow: 'hidden' },
  ringOuter: {
    borderColor: 'rgba(23,135,255,0.22)',
    borderRadius: 132,
    borderWidth: 1,
    height: 264,
    position: 'absolute',
    width: 264,
  },
  ringInner: {
    borderColor: 'rgba(23,135,255,0.2)',
    borderRadius: 104,
    borderWidth: 1,
    height: 208,
    position: 'absolute',
    width: 208,
  },
  progressArcLeft: {
    borderColor: '#35d9ff',
    borderLeftWidth: 9,
    borderRadius: 126,
    height: 252,
    left: 76,
    position: 'absolute',
    transform: [{ rotate: '20deg' }],
    width: 252,
  },
  progressArcRight: {
    borderColor: '#4558ff',
    borderRightWidth: 9,
    borderRadius: 126,
    height: 252,
    position: 'absolute',
    right: 74,
    transform: [{ rotate: '-20deg' }],
    width: 252,
  },
  bodyImage: { height: 278, width: 204, zIndex: 2 },
  bodyStateCard: {
    borderColor: '#24436e',
    borderRadius: 18,
    marginBottom: 14,
    minHeight: 96,
  },
  bodyStateCardContent: {
    padding: 14,
  },
  bodyStateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyStateText: { color: '#35c8ff', fontSize: 18, fontWeight: '900', marginTop: 9 },
  dehydratedText: { color: '#ff4040' },
  statePercentPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(53,200,255,0.12)',
    borderColor: '#237de0',
    borderRadius: 18,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 72,
  },
  statePercent: {
    color: '#35d9ff',
    fontSize: 17,
    fontWeight: '900',
  },
  statePercentLabel: {
    color: '#aeb8d5',
    fontSize: 9,
  },
  bodyStateFooter: {
    alignItems: 'center',
    borderTopColor: 'rgba(66,98,149,0.28)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
  },
  bodyHint: { color: '#d4d9eb', flex: 1, fontSize: 12, lineHeight: 18 },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalFrame: {
    backgroundColor: 'rgba(5,9,21,0.98)',
    borderColor: '#315f9f',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  conditionModalFrame: {
    maxHeight: '86%',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  conditionModal: {
    padding: 14,
  },
  suggestionModal: {
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#aeb8d5',
    fontSize: 12,
    marginTop: 4,
  },
  modalClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,55,0.86)',
    borderColor: '#315f9f',
    borderRadius: 16,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  conditionList: {
    gap: 10,
    paddingBottom: 2,
  },
  conditionItemWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  conditionCard: {
    borderRadius: 18,
    minHeight: 420,
    width: 178,
  },
  conditionCardContent: {
    padding: 12,
  },
  conditionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  conditionRange: {
    color: '#d2d8ea',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  conditionBody: {
    alignSelf: 'center',
    height: 190,
    marginTop: 12,
    width: 130,
  },
  conditionStatus: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 8,
    minHeight: 46,
    textAlign: 'center',
  },
  conditionDivider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
    marginVertical: 10,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 9,
  },
  benefitIcon: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    marginRight: 8,
    width: 26,
  },
  benefitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  conditionArrow: {
    color: '#8fa1c8',
    fontSize: 25,
    fontWeight: '900',
    marginHorizontal: 7,
  },
  suggestionHero: {
    alignItems: 'center',
    backgroundColor: 'rgba(10,35,76,0.84)',
    borderColor: '#254e85',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 12,
  },
  suggestionHeroText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginLeft: 12,
  },
  suggestionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 11,
  },
  suggestionText: {
    color: '#d4d9eb',
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 10,
  },
  supportGrid: { gap: 8, marginBottom: 14 },
  supportCard: {
    borderRadius: 16,
    minHeight: 76,
    width: '100%',
  },
  supportCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  supportIcon: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 36, justifyContent: 'center', marginRight: 9, width: 36 },
  supportCopy: { flex: 1, minWidth: 0 },
  supportTitle: { fontSize: 13, fontWeight: '900', lineHeight: 16 },
  supportText: { color: '#d2d8ea', fontSize: 11, lineHeight: 15, marginTop: 3 },
  detailsButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 10, paddingHorizontal: 10, paddingVertical: 5 },
  detailsText: { fontSize: 11, fontWeight: '800', marginRight: 4 },
  walletRow: {
    borderColor: '#24436e',
    borderRadius: 18,
    marginBottom: 14,
    minHeight: 82,
  },
  walletRowContent: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryImage: { height: 28, width: 28 },
  summaryLabel: { color: '#d6dbee', fontSize: 11, marginTop: 4 },
  summaryValue: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 2 },
  summarySub: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  slotsCard: {
    borderColor: '#3E2078',
    borderRadius: 20,
    marginBottom: 14,
  },
  slotsCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slotsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  howItWorksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  howItWorks: {
    color: '#B6BCE0',
    fontSize: 10,
  },
  slotCardsRow: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 18,
  },
  slotCard: {
    alignItems: 'center',
    backgroundColor: '#071333',
    borderColor: '#082F75',
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 68,
    overflow: 'visible',
    paddingHorizontal: 9,
    paddingVertical: 1,
  },
  slotCardCompleted: {
    backgroundColor: '#062C28',
    borderColor: '#0B694F',
  },
  slotCardCurrent: {
    backgroundColor: '#06163C',
    borderColor: '#053B9A',
  },
  slotImage: {
    height: 20,
    width: 20,
  },
  slotCardText: {
    flex: 1,
    minWidth: 0,
  },
  slotCardTitle: {
    color: '#D6DDF6',
    fontSize: 10,
    fontWeight: '900',
  },
  slotDoneText: {
    color: '#27E99A',
  },
  slotStatus: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 6,
  },
  rewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  rewardCoin: {
    height: 15,
    width: 15,
  },
  slotBadge: {
    alignItems: 'center',
    borderColor: '#214895',
    borderRadius: 17,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 1,
    top: -10,
    width: 20,
  },
  slotBadgeDone: {
    backgroundColor: '#20D989',
    borderColor: '#11BF77',
    borderStyle: 'solid',
    shadowColor: '#20D989',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  dottedConnector: {
    borderColor: '#8850FF',
    borderStyle: 'dotted',
    borderTopWidth: 3,
    position: 'absolute',
    right: -22,
    top: 34,
    width: 20,
    zIndex: 3,
  },
  encouragement: { borderColor: '#1d79d8', borderRadius: 18, minHeight: 118 },
  encouragementContent: { alignItems: 'center', flexDirection: 'row', padding: 12 },
  mascot: { height: 82, width: 82 },
  encouragementCopy: { flex: 1, marginHorizontal: 10 },
  encouragementTitle: { color: '#35d9ff', fontSize: 15, fontWeight: '900' },
  encouragementText: { color: '#d4d9eb', fontSize: 12, lineHeight: 18, marginTop: 6 },
  encouragementStrong: { color: '#ffffff', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 5 },
  heart: { height: 64, width: 64 },
});

export default DigitalMeScreen;
