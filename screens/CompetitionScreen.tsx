import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import {
  CompetitionJoinState,
  CompetitionLeaderboardRow,
  PastCompetitionRow,
  getActiveCompetitionLeaderboard,
  getCompetitionJoinState,
  getCompetitionScheduleStatus,
  getPastCompetitions,
  joinActiveCompetition,
  syncActiveCompetitionScore,
} from '../services/competitionService';

type RewardTier = {
  id: string;
  title: string;
  headline: string;
  details: string[];
  image: ImageSourcePropType;
  highlight?: boolean;
};

type CountdownTime = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  ended: boolean;
  mode: 'starts' | 'ends' | 'none';
};

const images = {
  trophy: require('../assets/competion.png'),
  podium: require('../assets/leaderboard_podium.png'),
  diamond: require('../assets/diamonds.png'),
  coins: require('../assets/coin2.png'),
  coinbox: require('../assets/coinbox.png'),
  avatar: require('../assets/avatar_male_1.png'),
  shield: require('../assets/rank.png'),
  water: require('../assets/waterglass.png'),
};

const rewards: RewardTier[] = [
  {
    id: 'first',
    title: '🥇 Rank #1',
    headline: 'Champion Reward',
    details: ['Champion badge', '+2 diamonds', '+300 coins', 'Featured in app', 'Voucher gift'],
    image: images.trophy,
    highlight: true,
  },
  {
    id: 'second-third',
    title: '🥈 Rank #2-3',
    headline: 'Elite Finish',
    details: ['+1 diamond', '+150 coins'],
    image: images.diamond,
  },
  {
    id: 'top-ten',
    title: '🏅 Rank #4-10',
    headline: 'Top 10 Prize',
    details: ['+75 coins'],
    image: images.coins,
  },
  {
    id: 'others',
    title: '🔁 Others',
    headline: 'Participation Back',
    details: ['75% coins credit back', '+20-50 bonus coins'],
    image: images.coinbox,
  },
];

const rules = [
  'Score is based on total taps completed',
  'All 3 daily slots must be completed',
  'More consistency = higher score',
  'Leaderboard updates hourly',
  'Cheating will result in disqualification',
  'Rewards will be distributed fairly',
];

const padTime = (value: number) => String(Math.max(0, value)).padStart(2, '0');

const emptyCountdown: CountdownTime = { days: '--', hours: '--', minutes: '--', seconds: '--', ended: false, mode: 'none' };

const getCountdown = (input?: { status?: string; startDate?: string; endDate?: string; hasCompetition?: boolean }): CountdownTime => {
  if (!input?.hasCompetition) {
    return emptyCountdown;
  }

  const scheduleStatus = getCompetitionScheduleStatus(input);
  const targetDate = scheduleStatus.tone === 'scheduled' ? input.startDate : input.endDate;
  if (!targetDate) {
    return emptyCountdown;
  }

  const targetTime = new Date(targetDate).getTime();
  if (Number.isNaN(targetTime)) {
    return emptyCountdown;
  }

  const remaining = targetTime - Date.now();
  if (remaining <= 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
      ended: scheduleStatus.tone === 'ended',
      mode: scheduleStatus.tone === 'scheduled' ? 'starts' : 'ends',
    };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: padTime(days),
    hours: padTime(hours),
    minutes: padTime(minutes),
    seconds: padTime(seconds),
    ended: false,
    mode: scheduleStatus.tone === 'scheduled' ? 'starts' : 'ends',
  };
};

const formatCompetitionDate = (value?: string) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatCompetitionRange = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Completed';

  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startLabel} - ${endLabel}`;
};

const formatNumber = (value?: number) => typeof value === 'number' ? value.toLocaleString() : '--';

const CompetitionScreen = () => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const [joinState, setJoinState] = useState<CompetitionJoinState>({
    hasCompetition: false,
    joined: false,
    competitionId: 'weekly-hydration-challenge',
  });
  const [backendDiamonds, setBackendDiamonds] = useState<number | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<CompetitionLeaderboardRow | null>(null);
  const [pastCompetitionRows, setPastCompetitionRows] = useState<PastCompetitionRow[]>([]);
  const [pastCompetitionsLoading, setPastCompetitionsLoading] = useState(true);
  const [countdown, setCountdown] = useState<CountdownTime>(getCountdown());
  const [isJoining, setIsJoining] = useState(false);

  const loadJoinState = useCallback(async () => {
    setJoinState(await getCompetitionJoinState());
  }, []);

  const loadCurrentRank = useCallback(async () => {
    try {
      await syncActiveCompetitionScore();
      const leaderboard = await getActiveCompetitionLeaderboard(50);
      setCurrentUserRank(leaderboard.currentUser);
      if (leaderboard.competition) {
        setJoinState(current => ({
          ...current,
          participants: leaderboard.competition?.participants,
          status: leaderboard.competition?.status || current.status,
          startDate: leaderboard.competition?.startDate || current.startDate,
          endDate: leaderboard.competition?.endDate || current.endDate,
        }));
      }
    } catch {
      setCurrentUserRank(null);
    }
  }, []);

  const loadPastCompetitions = useCallback(async () => {
    setPastCompetitionsLoading(true);
    try {
      setPastCompetitionRows(await getPastCompetitions(10));
    } catch {
      setPastCompetitionRows([]);
    } finally {
      setPastCompetitionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJoinState();
  }, [loadJoinState]);

  useFocusEffect(
    useCallback(() => {
      loadJoinState();
      loadCurrentRank();
      loadPastCompetitions();
    }, [loadCurrentRank, loadJoinState, loadPastCompetitions]),
  );

  useEffect(() => {
    setCountdown(getCountdown(joinState));
    const timer = setInterval(() => {
      setCountdown(getCountdown(joinState));
    }, 1000);

    return () => clearInterval(timer);
  }, [joinState]);

  const handleJoin = async () => {
    if (isJoining || joinState.joined) return;

    setIsJoining(true);
    try {
      const result = await joinActiveCompetition();
      setJoinState(result.state);
      if (typeof result.wallet?.diamonds === 'number') {
        setBackendDiamonds(result.wallet.diamonds);
      }
      await loadCurrentRank();
      Alert.alert('Competition joined', `You are in ${result.state.title || 'the competition'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join competition right now.';
      Alert.alert('Join unavailable', message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} theme={tabTheme} />
          <HeroCard
            description={joinState.description}
            hasCompetition={joinState.hasCompetition ?? false}
            participants={joinState.participants}
            status={joinState.status}
            startDate={joinState.startDate}
            endDate={joinState.endDate}
            title={joinState.title || 'Weekly Hydration Challenge'}
          />
          <JoinStatusCard
            entryFeeDiamonds={joinState.entryFeeDiamonds ?? 1}
            backendDiamonds={backendDiamonds}
            currentUserRank={currentUserRank}
            hasCompetition={joinState.hasCompetition ?? false}
            isJoined={joinState.joined}
            isJoining={isJoining}
            onLeaderboardPress={() => navigation.navigate('Leaderboard' as never)}
            onJoin={handleJoin}
          />
          <CountdownCard countdown={countdown} endDate={joinState.endDate} startDate={joinState.startDate} />
          <RewardsTable />
          <RankingRules />
          <CurrentPosition currentUser={currentUserRank} isJoined={joinState.joined} participants={joinState.participants} />
          <PastCompetitions isLoading={pastCompetitionsLoading} rows={pastCompetitionRows} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, theme }: { onBack: () => void; theme: MainTabTheme }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="arrow-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Competition</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Compete weekly and win amazing rewards!</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="info" size={23} color={theme.icon} />
    </TouchableOpacity>
  </View>
);

const HeroCard = ({
  description,
  endDate,
  hasCompetition,
  participants,
  startDate,
  status,
  title,
}: {
  description?: string;
  endDate?: string;
  hasCompetition: boolean;
  participants?: number;
  startDate?: string;
  status?: string;
  title: string;
}) => {
  const scheduleStatus = getCompetitionScheduleStatus({ hasCompetition, status, startDate, endDate });

  return (
    <GradientFrame colors={['rgba(50,18,93,0.95)', 'rgba(7,14,31,0.98)']} style={styles.heroCard} contentStyle={styles.heroCardContent}>
      <View style={styles.heroCopy}>
        <View style={[
          styles.activeBadge,
          scheduleStatus.tone === 'scheduled' && styles.scheduledBadge,
          scheduleStatus.tone === 'ended' && styles.endedBadge,
          scheduleStatus.tone === 'draft' && styles.draftBadge,
        ]}>
          <View style={[
            styles.activeDot,
            scheduleStatus.tone === 'scheduled' && styles.scheduledDot,
            scheduleStatus.tone === 'ended' && styles.endedDot,
            scheduleStatus.tone === 'draft' && styles.draftDot,
          ]} />
          <Text style={styles.activeText}>{scheduleStatus.label}</Text>
        </View>
        <Text style={styles.heroTitle}>{title} 🏆</Text>
        <Text style={styles.heroBody}>{description || 'Stay consistent, complete your slots, and climb the leaderboard!'}</Text>
        <View style={styles.heroStats}>
          <HeroStat icon="account-group" value={formatNumber(participants)} label="Participants" />
          <HeroStat image={images.water} value={scheduleStatus.statLabel} label="Status" />
        </View>
      </View>
      <Image source={images.trophy} style={styles.heroImage} resizeMode="contain" />
    </GradientFrame>
  );
};

const HeroStat = ({
  icon,
  image,
  value,
  label,
}: {
  icon?: string;
  image?: ImageSourcePropType;
  value: string;
  label: string;
}) => (
  <View style={styles.heroStat}>
    <View style={styles.heroStatIcon}>
      {image ? <Image source={image} style={styles.statImage} resizeMode="contain" /> : <MaterialCommunityIcons name={icon || 'star'} size={28} color="#8e7cff" />}
    </View>
    <View>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  </View>
);

const JoinStatusCard = ({
  backendDiamonds,
  currentUserRank,
  entryFeeDiamonds,
  hasCompetition,
  isJoined,
  isJoining,
  onLeaderboardPress,
  onJoin,
}: {
  backendDiamonds: number | null;
  currentUserRank: CompetitionLeaderboardRow | null;
  entryFeeDiamonds: number;
  hasCompetition: boolean;
  isJoined: boolean;
  isJoining: boolean;
  onLeaderboardPress: () => void;
  onJoin: () => void;
}) => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.joinCard} contentStyle={styles.joinCardContent}>
    <View style={[styles.joinColumn, styles.joinLeft]}>
      <Text style={styles.mutedBold}>{isJoined ? 'Entry confirmed' : 'Not joined yet'}</Text>
      <Text style={styles.joinTitle}>
        {!hasCompetition ? 'No weekly challenge available' : isJoined ? 'You joined the competition' : 'Join the competition'}
      </Text>
      <Text style={styles.bodyText}>
        {!hasCompetition
          ? 'The next weekly challenge will appear here after admin creates it.'
          : isJoined
            ? 'Complete hydration slots to climb the rank.'
            : 'Top performers win big rewards!'}
      </Text>
      <Text style={styles.entryLabel}>Entry Fee</Text>
      <View style={styles.entryRow}>
        <Image source={images.diamond} style={styles.entryDiamond} resizeMode="contain" />
        <Text style={styles.entryText}>{entryFeeDiamonds} Diamond{entryFeeDiamonds === 1 ? '' : 's'}</Text>
      </View>
      <Text style={styles.walletHint}>
        Backend wallet: {backendDiamonds === null ? 'Sign in to check' : `${backendDiamonds} Diamond${backendDiamonds === 1 ? '' : 's'}`}
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!hasCompetition || isJoined || isJoining}
        onPress={onJoin}
        style={[styles.joinButton, (!hasCompetition || isJoined || isJoining) && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>
          {!hasCompetition ? 'No challenge' : isJoined ? 'Joined' : isJoining ? 'Joining...' : `Join for ${entryFeeDiamonds} Diamond${entryFeeDiamonds === 1 ? '' : 's'}`}
        </Text>
      </TouchableOpacity>
    </View>
    <View style={styles.orDivider} />
    <View style={styles.orCircle}>
      <Text style={styles.orText}>OR</Text>
    </View>
    <View style={[styles.joinColumn, styles.joinRight]}>
      <View style={styles.statusRow}>
        <View style={styles.statusCopy}>
          <Text style={styles.greenText}>{isJoined ? "You're in!" : 'Join to rank'}</Text>
          <Text style={styles.bodyText}>{!hasCompetition ? 'Waiting for next challenge' : isJoined ? 'You are Rank' : 'Current Rank'}</Text>
          <Text style={styles.rankNumber}>{currentUserRank ? `#${currentUserRank.rank}` : '--'}</Text>
          <Text style={styles.bodyText}>
            {currentUserRank
              ? `Score ${formatNumber(currentUserRank.tapScore)}\n${currentUserRank.completedSlotCount} slots completed`
              : isJoined
                ? 'Complete slots to update your rank.'
                : hasCompetition
                  ? 'Your rank appears after joining.'
                  : 'No leaderboard is open yet.'}
          </Text>
        </View>
        <Image source={images.shield} style={styles.shieldImage} resizeMode="contain" />
      </View>
      <TouchableOpacity activeOpacity={0.85} style={styles.leaderboardButton} onPress={onLeaderboardPress}>
        <Text style={styles.leaderboardText}>View Leaderboard</Text>
      </TouchableOpacity>
    </View>
  </GradientFrame>
);

const CountdownCard = ({
  countdown,
  endDate,
  startDate,
}: {
  countdown: CountdownTime;
  endDate?: string;
  startDate?: string;
}) => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.countdownCard} contentStyle={styles.countdownCardContent}>
    <View style={styles.countLeft}>
      <Text style={styles.bodyText}>
        {countdown.mode === 'none' ? 'No weekly challenge scheduled' : countdown.mode === 'starts' ? 'Competition starts in' : countdown.ended ? 'Competition ended' : 'Competition ends in'}
      </Text>
      <View style={styles.timerRow}>
        {[
          [countdown.days, 'DAYS'],
          [countdown.hours, 'HRS'],
          [countdown.minutes, 'MINS'],
          [countdown.seconds, 'SECS'],
        ].map((item, index) => (
          <React.Fragment key={item[1]}>
            <View style={styles.timerItem}>
              <Text style={styles.timerValue}>{item[0]}</Text>
              <Text style={styles.timerLabel}>{item[1]}</Text>
            </View>
            {index < 3 ? <Text style={styles.timerColon}>:</Text> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
    <View style={styles.countDivider} />
    <View style={styles.endsRow}>
      <Feather name="calendar" size={32} color="#a64dff" />
      <View>
        <Text style={styles.bodyText}>Challenge window</Text>
        <Text style={styles.dateText}>Starts {formatCompetitionDate(startDate)}</Text>
        <Text style={styles.bodyText}>Ends {formatCompetitionDate(endDate)}</Text>
      </View>
    </View>
  </GradientFrame>
);

const RewardsTable = () => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.rewardsCard} contentStyle={styles.rewardsCardContent}>
    <Text style={styles.sectionTitle}>🏆 Rewards System</Text>
    <FlatList
      horizontal
      data={rewards}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rewardList}
      renderItem={({ item }) => <RewardTierCard item={item} />}
    />
    <Text style={styles.infoNote}>ⓘ Rewards will be sent within 24 hours after the competition ends.</Text>
  </GradientFrame>
);

const RewardTierCard = ({ item }: { item: RewardTier }) => (
  <GradientFrame colors={['rgba(20,27,46,0.96)', 'rgba(5,23,50,0.98)']} style={[styles.rewardTier, item.highlight && styles.rewardTierHighlight]} contentStyle={styles.rewardTierContent}>
    <Text style={[styles.tierTitle, item.highlight && styles.goldText]}>{item.title}</Text>
    <Image source={item.image} style={styles.tierImage} resizeMode="contain" />
    <Text style={[styles.tierPrize, item.highlight && styles.goldText]}>{item.headline}</Text>
    <View style={styles.rewardDetails}>
      {item.details.map(detail => (
        <View key={detail} style={styles.rewardDetailRow}>
          <View style={[styles.rewardDetailDot, item.highlight && styles.rewardDetailDotGold]} />
          <Text style={styles.rewardDetailText}>{detail}</Text>
        </View>
      ))}
    </View>
  </GradientFrame>
);

const RankingRules = () => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.rulesCard} contentStyle={styles.rulesCardContent}>
    <Text style={styles.sectionTitle}>🛡 Ranking Rules</Text>
    <View style={styles.rulesGrid}>
      {rules.map(rule => (
        <View key={rule} style={styles.ruleRow}>
          <Feather name="check-circle" size={19} color="#9c6dff" />
          <Text style={styles.ruleText}>{rule}</Text>
        </View>
      ))}
    </View>
  </GradientFrame>
);

const CurrentPosition = ({
  currentUser,
  isJoined,
  participants,
}: {
  currentUser: CompetitionLeaderboardRow | null;
  isJoined: boolean;
  participants?: number;
}) => {
  const percentile = currentUser && participants
    ? Math.max(1, Math.round(currentUser.rank / Math.max(participants, 1) * 100))
    : null;

  return (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.positionCard} contentStyle={styles.positionCardContent}>
    <Text style={styles.sectionTitle}>▰ Your Current Position</Text>
    <View style={styles.positionRow}>
      <View style={styles.avatarWrap}>
        <Image source={images.avatar} style={styles.avatar} resizeMode="cover" />
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{currentUser ? currentUser.rank : '-'}</Text>
        </View>
      </View>
      <View style={styles.positionBlock}>
        <Text style={styles.positionLabel}>{currentUser?.username || 'You'}</Text>
        <Text style={styles.positionValue}>💧 {formatNumber(currentUser?.tapScore)}</Text>
        <Text style={styles.bodyText}>Total Score</Text>
      </View>
      <View style={styles.positionDivider} />
      <View style={styles.positionBlock}>
        <Text style={styles.positionValueWhite}>{percentile ? `Top ${percentile}%` : '--'}</Text>
        <Text style={styles.bodyText}>Percentile</Text>
      </View>
      <View style={styles.positionDivider} />
      <View style={styles.positionBlock}>
        <Text style={styles.upText}>{currentUser ? `${currentUser.completedSlotCount} / 3` : '--'}</Text>
        <Text style={styles.bodyText}>{isJoined ? 'Slots completed' : 'Join to rank'}</Text>
      </View>
    </View>
  </GradientFrame>
  );
};

const PastCompetitions = ({
  isLoading,
  rows,
}: {
  isLoading: boolean;
  rows: PastCompetitionRow[];
}) => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.pastCard} contentStyle={styles.pastCardContent}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>↺ Past Competitions</Text>
      <Text style={styles.linkText}>View All ›</Text>
    </View>
    {isLoading ? (
      <Text style={styles.emptyPastText}>Loading completed competitions...</Text>
    ) : rows.length ? (
      <FlatList
        horizontal
        data={rows}
        keyExtractor={item => String(item.competition._id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pastList}
        renderItem={({ item }) => <PastCompetitionCard item={item} />}
      />
    ) : (
      <Text style={styles.emptyPastText}>Completed competitions will appear here after the backend closes them.</Text>
    )}
    <Text style={styles.infoNote}>ⓘ Past cards use your saved backend rank and score from completed competitions.</Text>
  </GradientFrame>
);

const PastCompetitionCard = ({ item }: { item: PastCompetitionRow }) => (
  <GradientFrame colors={['rgba(31,19,72,0.95)', 'rgba(6,28,58,0.98)']} style={styles.pastItem} contentStyle={styles.pastItemContent}>
    <View style={styles.pastTop}>
      <Text style={styles.pastDate}>{formatCompetitionRange(item.competition.startDate, item.competition.endDate)}</Text>
      <Text style={styles.completedBadge}>Completed</Text>
    </View>
    <Text style={styles.pastTitle}>🏆 {item.competition.title || 'Weekly Challenge'}</Text>
    <View style={styles.pastStats}>
      <View>
        <Text style={styles.bodyText}>Your Rank</Text>
        <Text style={styles.pastValue}>{item.currentUser?.rank ? `#${item.currentUser.rank}` : '--'}</Text>
      </View>
      <View style={styles.smallDivider} />
      <View>
        <Text style={styles.bodyText}>Score</Text>
        <Text style={styles.pastValue}>{formatNumber(item.currentUser?.tapScore)}</Text>
      </View>
      <View style={styles.smallDivider} />
      <View>
        <Text style={styles.bodyText}>Slots</Text>
        <Text style={styles.pastValue}>{item.currentUser ? `${item.currentUser.completedSlotCount}` : '--'}</Text>
      </View>
    </View>
  </GradientFrame>
);

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
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 14,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
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
    textAlign: 'center',
  },
  heroCard: {
    borderColor: '#ad42ef',
    borderRadius: 20,
    marginBottom: 14,
    minHeight: 178,
  },
  heroCardContent: {
    flexDirection: 'row',
    minHeight: 178,
    padding: 14,
  },
  joinCard: {
    borderColor: '#29528e',
    borderRadius: 20,
    marginBottom: 14,
    minHeight: 158,
  },
  joinCardContent: {
    flexDirection: 'row',
    minHeight: 158,
    paddingHorizontal: 14,
    paddingVertical: 16,
    position: 'relative',
  },
  heroCopy: {
    flex: 1.1,
    zIndex: 2,
  },
  activeBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7a32d8',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scheduledBadge: {
    backgroundColor: '#195c95',
  },
  endedBadge: {
    backgroundColor: '#3d4961',
  },
  draftBadge: {
    backgroundColor: '#5a647b',
  },
  activeDot: {
    backgroundColor: '#e055ff',
    borderRadius: 5,
    height: 8,
    marginRight: 7,
    width: 8,
  },
  scheduledDot: {
    backgroundColor: '#35c8ff',
  },
  endedDot: {
    backgroundColor: '#9aa7bd',
  },
  draftDot: {
    backgroundColor: '#c8d3ee',
  },
  activeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  heroBody: {
    color: '#d8ddec',
    fontSize: 10,
    lineHeight: 19,
    marginTop: 8,
  },
  heroImage: {
    alignSelf: 'center',
    flex: 1,
    height: 122,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  heroStat: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroStatIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(32,35,90,0.85)',
    borderColor: '#2f458a',
    borderRadius: 9,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginRight: 7,
    width: 38,
  },
  statImage: {
    height: 26,
    width: 26,
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#ffffff',
    fontSize: 11,
  },
  joinColumn: {
    flex: 1,
  },
  joinLeft: {
    paddingRight: 22,
  },
  mutedBold: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  joinTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 7,
  },
  bodyText: {
    color: '#d3d9eb',
    fontSize: 10,
    lineHeight: 18,
  },
  entryLabel: {
    color: '#a9b2d0',
    fontSize: 12,
    marginTop: 15,
  },
  entryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  entryDiamond: {
    height: 22,
    marginRight: 8,
    width: 22,
  },
  entryText: {
    color: '#9edcff',
    fontSize: 14,
    fontWeight: '700',
  },
  walletHint: {
    color: '#a9b2d0',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: '#8b25dc',
    borderColor: '#d25cff',
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#b339ff',
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  disabledButton: {
    opacity: 0.58,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  orDivider: {
    backgroundColor: '#274574',
    bottom: 20,
    left: '50%',
    position: 'absolute',
    top: 20,
    width: 1,
  },
  orCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#101a3c',
    borderColor: '#3f4d8c',
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -19,
    marginTop: -19,
    position: 'absolute',
    top: '50%',
    width: 38,
    zIndex: 3,
  },
  orText: {
    color: '#ffffff',
    fontSize: 12,
  },
  joinRight: {
    justifyContent: 'space-between',
    paddingLeft: 26,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusCopy: {
    flex: 1,
    paddingRight: 8,
  },
  greenText: {
    color: '#66ff79',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  rankNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  shieldImage: {
    height: 62,
    width: 62,
  },
  leaderboardButton: {
    alignItems: 'center',
    borderColor: '#1879d5',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginTop: 12,
  },
  leaderboardText: {
    color: '#9fddff',
    fontSize: 14,
    fontWeight: '900',
  },
  countdownCard: {
    borderColor: '#284e87',
    borderRadius: 20,
    marginBottom: 14,
  },
  countdownCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  countLeft: {
    flex: 1,
  },
  timerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  timerItem: {
    alignItems: 'center',
  },
  timerValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  timerLabel: {
    color: '#ffffff',
    fontSize: 10,
  },
  timerColon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginHorizontal: 8,
  },
  countDivider: {
    backgroundColor: '#203b6c',
    height: 54,
    marginHorizontal: 16,
    width: 1,
  },
  endsRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  dateText: {
    color: '#9edcff',
    fontSize: 12,
    fontWeight: '900',
  },
  rewardsCard: {
    borderColor: '#274a83',
    borderRadius: 20,
    marginBottom: 14,
  },
  rewardsCardContent: {
    padding: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  rewardList: {
    gap: 8,
    paddingTop: 16,
  },
  rewardTier: {
    borderColor: '#354d82',
    borderRadius: 12,
    minHeight: 196,
    width: 176,
  },
  rewardTierContent: {
    alignItems: 'flex-start',
    padding: 12,
  },
  rewardTierHighlight: {
    borderColor: '#f4c21f',
    shadowColor: '#ffd84c',
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  tierTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  goldText: {
    color: '#ffe533',
  },
  tierImage: {
    alignSelf: 'center',
    height: 54,
    marginTop: 12,
    width: 74,
  },
  tierPrize: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  rewardDetails: {
    gap: 6,
    marginTop: 10,
    width: '100%',
  },
  rewardDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rewardDetailDot: {
    backgroundColor: '#8edcff',
    borderRadius: 4,
    height: 7,
    marginRight: 7,
    width: 7,
  },
  rewardDetailDotGold: {
    backgroundColor: '#ffe533',
  },
  rewardDetailText: {
    color: '#dce6ff',
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  infoNote: {
    color: '#b8c0dc',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  rulesCard: {
    borderColor: '#274a83',
    borderRadius: 20,
    marginBottom: 14,
  },
  rulesCardContent: {
    padding: 14,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  ruleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    width: '50%',
  },
  ruleText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
  },
  positionCard: {
    borderColor: '#274a83',
    borderRadius: 20,
    marginBottom: 14,
  },
  positionCardContent: {
    padding: 14,
  },
  positionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  avatarWrap: {
    borderColor: '#4ebaff',
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    marginRight: 14,
    padding: 3,
    width: 68,
  },
  avatar: {
    borderRadius: 29,
    height: '100%',
    width: '100%',
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: '#173866',
    borderColor: '#5bbcff',
    borderRadius: 14,
    borderWidth: 2,
    bottom: -4,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
    width: 32,
  },
  rankBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  positionBlock: {
    flex: 1,
  },
  positionLabel: {
    color: '#d3d9eb',
    fontSize: 14,
  },
  positionValue: {
    color: '#8ddcff',
    fontSize: 18,
    fontWeight: '900',
  },
  positionValueWhite: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  upText: {
    color: '#6aff72',
    fontSize: 16,
    fontWeight: '900',
  },
  positionDivider: {
    backgroundColor: '#243d67',
    height: 42,
    marginHorizontal: 12,
    width: 1,
  },
  pastCard: {
    borderColor: '#274a83',
    borderRadius: 20,
  },
  pastCardContent: {
    padding: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#23c9ff',
    fontSize: 12,
    fontWeight: '900',
  },
  pastList: {
    gap: 10,
    paddingTop: 16,
  },
  pastItem: {
    borderColor: '#24528c',
    borderRadius: 10,
    minHeight: 132,
    width: 184,
  },
  pastItemContent: {
    padding: 10,
  },
  pastTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pastDate: {
    color: '#ffc1ff',
    fontSize: 11,
  },
  completedBadge: {
    backgroundColor: '#166b2e',
    borderColor: '#48d95d',
    borderRadius: 12,
    borderWidth: 1,
    color: '#b8ffb6',
    fontSize: 9,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 16,
  },
  pastStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  emptyPastText: {
    color: '#aeb8dd',
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 18,
  },
  smallDivider: {
    backgroundColor: '#253e68',
    width: 1,
  },
  pastValue: {
    color: '#8ddcff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
});

export default CompetitionScreen;
