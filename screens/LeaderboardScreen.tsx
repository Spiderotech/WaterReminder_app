import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BannerAd } from 'react-native-google-mobile-ads/lib/commonjs/ads/BannerAd';
import { BannerAdSize } from 'react-native-google-mobile-ads/lib/commonjs/BannerAdSize';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { getBannerAdUnitId, initializeAdMob } from '../services/adMobService';
import {
  CompetitionLeaderboardRow,
  getCompetitionScheduleStatus,
  getActiveCompetitionLeaderboard,
  syncActiveCompetitionScore,
} from '../services/competitionService';
import { playBackgroundMusic, stopBackgroundMusic } from '../services/backgroundMusicService';

type ScopeTab = 'global' | 'country';

type PodiumUser = {
  id: string;
  name: string;
  score: string;
  diamonds: number;
  streak: number;
  place: 1 | 2 | 3;
  avatar: ImageSourcePropType;
};

type LeaderboardUser = {
  id: string;
  rank: number;
  name: string;
  score: string;
  diamonds: number;
  streak: number;
  badgeColor: string;
  avatar: ImageSourcePropType;
};

const images = {
  trophy: require('../assets/competion.png'),
  diamond: require('../assets/diamond.png'),
  avatarYou: require('../assets/avatar_male_1.png'),
  alex: require('../assets/avatar_male_2.png'),
  ravi: require('../assets/avatar_male_3.png'),
  sarah: require('../assets/avatar_female_1.png'),
  michael: require('../assets/avatar_male_4.png'),
  emma: require('../assets/avatar_female_2.png'),
  david: require('../assets/avatar_male_6.png'),
  sophia: require('../assets/avatar_female_3.png'),
  james: require('../assets/avatar_male_7.png'),
  olivia: require('../assets/avatar_female_4.png'),
  daniel: require('../assets/avatar_male_8.png'),
};

const scopeTabs: { id: ScopeTab; label: string; icon: string }[] = [
  { id: 'global', label: 'Global', icon: 'globe' },
  { id: 'country', label: 'Country', icon: 'flag' },
];

const LEADERBOARD_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const LEADERBOARD_REFRESH_BASE_KEY = 'v2:leaderboardRefreshBaseAt';
const LEADERBOARD_BANNER_AD_UNIT_ID = getBannerAdUnitId();
const avatarPool = [images.alex, images.ravi, images.sarah, images.michael, images.emma, images.david, images.sophia, images.james, images.olivia, images.daniel];
const selectedAvatarImages: Record<string, ImageSourcePropType> = {
  male_1: images.avatarYou,
  male_2: images.alex,
  male_3: images.ravi,
  male_4: images.michael,
  male_6: images.david,
  male_7: images.james,
  male_8: images.daniel,
  female_1: images.sarah,
  female_2: images.emma,
  female_3: images.sophia,
  female_4: images.olivia,
};
const formatNumber = (value?: number) => typeof value === 'number' ? value.toLocaleString() : '--';
const formatScore = (value?: number) => formatNumber(value || 0);
const formatRefreshCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    [String(hours).padStart(2, '0'), 'HRS'],
    [String(minutes).padStart(2, '0'), 'MIN'],
    [String(seconds).padStart(2, '0'), 'SEC'],
  ];
};
const getAvatarSource = (row: CompetitionLeaderboardRow | null | undefined, index = 0): ImageSourcePropType => {
  const profilePictureUrl = row?.profilePictureUrl?.trim();
  if (profilePictureUrl && /^https?:\/\//i.test(profilePictureUrl)) {
    return { uri: profilePictureUrl };
  }

  if (row?.avatar && selectedAvatarImages[row.avatar]) {
    return selectedAvatarImages[row.avatar];
  }

  return avatarPool[index % avatarPool.length];
};

const mapLeaderboardUser = (row: CompetitionLeaderboardRow, index: number): LeaderboardUser => ({
  id: row.entryId || row.userId,
  rank: row.rank,
  name: row.username || 'Dora User',
  score: formatScore(row.tapScore),
  diamonds: row.diamonds || 0,
  streak: row.streak || row.completedSlotCount || 0,
  badgeColor: row.rank <= 3 ? '#ffd33d' : row.rank <= 5 ? '#8d64ff' : row.rank <= 10 ? '#1c95ff' : '#2bd66f',
  avatar: getAvatarSource(row, index),
});

const mapPodiumUser = (row: CompetitionLeaderboardRow, index: number): PodiumUser => ({
  id: row.entryId || row.userId,
  name: row.username || 'Dora User',
  score: formatScore(row.tapScore),
  diamonds: row.diamonds || 0,
  streak: row.streak || row.completedSlotCount || 0,
  place: row.rank as 1 | 2 | 3,
  avatar: getAvatarSource(row, index),
});

const LeaderboardScreen = ({ goToTab }: { goToTab?: (tab: string) => void }) => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const refreshInFlightRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ScopeTab>('global');
  const [competitionTitle, setCompetitionTitle] = useState('Weekly Hydration Challenge');
  const [competitionDescription, setCompetitionDescription] = useState('Stay consistent, complete your slots, and climb the leaderboard!');
  const [competitionStatus, setCompetitionStatus] = useState<string | undefined>();
  const [competitionStartDate, setCompetitionStartDate] = useState<string | undefined>();
  const [competitionEndDate, setCompetitionEndDate] = useState<string | undefined>();
  const [hasCompetition, setHasCompetition] = useState(false);
  const [participants, setParticipants] = useState<number | undefined>();
  const [entryFeeDiamonds, setEntryFeeDiamonds] = useState(1);
  const [leaderboardRows, setLeaderboardRows] = useState<CompetitionLeaderboardRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CompetitionLeaderboardRow | null>(null);
  const [leaderboardGeneratedAt, setLeaderboardGeneratedAt] = useState<string | null>(null);
  const [refreshRemainingMs, setRefreshRemainingMs] = useState(LEADERBOARD_REFRESH_INTERVAL_MS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleBackPress = useCallback(() => {
    if (goToTab) {
      goToTab('home');
      return;
    }
    navigation.goBack();
  }, [goToTab, navigation]);

  useFocusEffect(
    useCallback(() => {
      playBackgroundMusic('leaderboard');
      return () => stopBackgroundMusic();
    }, []),
  );

  const loadLeaderboard = useCallback(async (options: { resetRefreshTimer?: boolean } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      setLoading(true);
      await syncActiveCompetitionScore();
      const data = await getActiveCompetitionLeaderboard(50);
      const refreshedAt = new Date().toISOString();
      setHasCompetition(Boolean(data.competition));
      setCompetitionTitle(data.competition?.title || 'Weekly Hydration Challenge');
      setCompetitionDescription(data.competition?.description || 'No weekly challenge is scheduled yet. Check back after admin creates the next one.');
      setCompetitionStatus(data.competition?.status);
      setCompetitionStartDate(data.competition?.startDate);
      setCompetitionEndDate(data.competition?.endDate);
      setParticipants(data.competition?.participants);
      setEntryFeeDiamonds(data.competition?.entryFeeDiamonds ?? 1);
      setLeaderboardRows(data.leaderboard || []);
      setCurrentUser(data.currentUser || null);
      if (options.resetRefreshTimer) {
        setLeaderboardGeneratedAt(refreshedAt);
        setRefreshRemainingMs(LEADERBOARD_REFRESH_INTERVAL_MS);
        await AsyncStorage.setItem(LEADERBOARD_REFRESH_BASE_KEY, refreshedAt);
      }
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load leaderboard.';
      setError(message);
    } finally {
      setLoading(false);
      refreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    initializeAdMob().catch(() => undefined);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeLeaderboard = async () => {
      const storedRefreshBase = await AsyncStorage.getItem(LEADERBOARD_REFRESH_BASE_KEY);
      if (!mounted) return;

      if (storedRefreshBase) {
        setLeaderboardGeneratedAt(storedRefreshBase);
        loadLeaderboard({ resetRefreshTimer: false });
        return;
      }

      loadLeaderboard({ resetRefreshTimer: true });
    };

    initializeLeaderboard();
    return () => {
      mounted = false;
    };
  }, [loadLeaderboard]);

  useEffect(() => {
    const tick = () => {
      if (!leaderboardGeneratedAt) {
        setRefreshRemainingMs(LEADERBOARD_REFRESH_INTERVAL_MS);
        return;
      }

      const generatedTime = new Date(leaderboardGeneratedAt).getTime();
      if (Number.isNaN(generatedTime)) {
        setRefreshRemainingMs(LEADERBOARD_REFRESH_INTERVAL_MS);
        return;
      }

      const nextRefreshAt = generatedTime + LEADERBOARD_REFRESH_INTERVAL_MS;
      const remaining = Math.max(nextRefreshAt - Date.now(), 0);
      setRefreshRemainingMs(remaining);

      if (remaining <= 0 && !refreshInFlightRef.current) {
        loadLeaderboard({ resetRefreshTimer: true });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [leaderboardGeneratedAt, loadLeaderboard]);

  const podium = useMemo(() => {
    const topThree = leaderboardRows.slice(0, 3);
    return [topThree[1], topThree[0], topThree[2]]
      .filter(Boolean)
      .map((row, index) => mapPodiumUser(row, index));
  }, [leaderboardRows]);

  const tableRows = useMemo(() => {
    const rows = leaderboardRows.slice(3).map(mapLeaderboardUser);
    if (currentUser && !leaderboardRows.some(row => row.userId === currentUser.userId)) {
      return [...rows, mapLeaderboardUser(currentUser, rows.length)];
    }
    return rows;
  }, [currentUser, leaderboardRows]);
  const hasLeaderboardCompletion = useMemo(() => {
    const rows = currentUser ? [...leaderboardRows, currentUser] : leaderboardRows;
    return rows.some(row => (
      (row.completedSlotCount || 0) > 0 ||
      (row.tapScore || 0) > 0 ||
      (row.streak || 0) > 0
    ));
  }, [currentUser, leaderboardRows]);
  const scheduleStatus = useMemo(
    () => getCompetitionScheduleStatus({
      hasCompetition,
      status: competitionStatus,
      startDate: competitionStartDate,
      endDate: competitionEndDate,
    }),
    [competitionEndDate, competitionStartDate, competitionStatus, hasCompetition],
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
          <RefreshCard
            generatedAt={leaderboardGeneratedAt}
            hasLeaderboardCompletion={hasLeaderboardCompletion}
            loading={loading}
            remainingMs={refreshRemainingMs}
            onRefresh={() => loadLeaderboard({ resetRefreshTimer: true })}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <CompetitionHeroCard
            description={competitionDescription}
            endDate={competitionEndDate}
            hasCompetition={hasCompetition}
            participants={participants}
            startDate={competitionStartDate}
            status={competitionStatus}
            title={competitionTitle}
          />
          <ScopeTabs activeTab={activeTab} onChange={setActiveTab} />
          <CurrentRankCard currentUser={currentUser} participants={participants} />
          <LeaderboardPanel podiumRows={podium} rankingRows={tableRows} />
          <CompetitionCta
            entryFeeDiamonds={entryFeeDiamonds}
            hasCompetition={hasCompetition}
            scheduleLabel={scheduleStatus.statLabel}
            scheduleTone={scheduleStatus.tone}
            title={competitionTitle}
            onJoinPress={() => navigation.navigate('Competition' as never)}
          />
        </ScrollView>
        <FixedBottomBannerAd />
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
      <Text style={[styles.headerTitle, { color: theme.text }]}>Leaderboard</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>
        Compete, climb, and <Text style={styles.cyanText}>be the best!</Text>
      </Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onNotificationPress} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="bell" size={23} color={theme.icon} />
      <View style={styles.notificationDot} />
    </TouchableOpacity>
  </View>
);

const RefreshCard = ({
  generatedAt,
  hasLeaderboardCompletion,
  loading,
  remainingMs,
  onRefresh,
}: {
  generatedAt?: string | null;
  hasLeaderboardCompletion: boolean;
  loading: boolean;
  remainingMs: number;
  onRefresh: () => void;
}) => {
  const countdown = formatRefreshCountdown(remainingMs);

  return (
    <GradientFrame colors={['rgba(31,19,72,0.95)', 'rgba(5,15,36,0.98)']} style={styles.refreshCard} contentStyle={styles.refreshCardContent}>
      <View style={styles.refreshTimer}>
        <MaterialCommunityIcons name={hasLeaderboardCompletion ? 'clock-time-three-outline' : 'podium'} size={38} color="#a761ff" />
        <View>
          {hasLeaderboardCompletion ? (
            <>
              <Text style={styles.refreshLabel}>Next refresh in</Text>
              <View style={styles.timeRow}>
                {countdown.map((time, index) => (
                  <React.Fragment key={time[1]}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeValue}>{time[0]}</Text>
                      <Text style={styles.timeUnit}>{time[1]}</Text>
                    </View>
                    {index < 2 ? <Text style={styles.timeColon}>:</Text> : null}
                  </React.Fragment>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.refreshLabel}>Leaderboard status</Text>
              <Text style={styles.noLeaderboardTitle}>No leaderboard generated yet</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.refreshDivider} />
      <View style={styles.refreshCopy}>
        <Text style={styles.refreshCopyTitle}>
          {loading
            ? 'Refreshing leaderboard...'
            : hasLeaderboardCompletion
              ? 'Leaderboard is live.'
              : 'Waiting for first completion.'}
        </Text>
        <Text style={styles.refreshCopyText}>
          {hasLeaderboardCompletion
            ? generatedAt
              ? `Last refresh ${new Date(generatedAt).toLocaleTimeString()}`
              : 'Your latest score syncs when you complete slots.'
            : 'Complete a hydration slot to generate leaderboard rankings.'}
        </Text>
      </View>
      <TouchableOpacity activeOpacity={0.85} onPress={onRefresh} disabled={loading}>
        <Feather name="refresh-cw" size={18} color={loading ? '#646b80' : '#b7bdd3'} />
      </TouchableOpacity>
    </GradientFrame>
  );
};

const CompetitionHeroCard = ({
  description,
  endDate,
  hasCompetition,
  participants,
  startDate,
  status,
  title,
}: {
  description: string;
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
        <Text style={styles.heroBody}>{description}</Text>
        <View style={styles.heroStats}>
          <HeroStat icon="account-group" value={formatNumber(participants)} label="Participants" />
          <HeroStat icon="water" value={scheduleStatus.statLabel} label="Status" />
        </View>
      </View>
      <Image source={images.trophy} style={styles.heroImage} resizeMode="contain" />
    </GradientFrame>
  );
};

const HeroStat = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <View style={styles.heroStat}>
    <View style={styles.heroStatIcon}>
      <MaterialCommunityIcons name={icon} size={22} color={icon === 'water' ? '#35c8ff' : '#8e7cff'} />
    </View>
    <View>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  </View>
);

const ScopeTabs = ({ activeTab, onChange }: { activeTab: ScopeTab; onChange: (tab: ScopeTab) => void }) => (
  <GradientFrame colors={['rgba(5,20,45,0.98)', 'rgba(2,11,27,0.98)']} style={styles.scopeTabs} contentStyle={styles.scopeTabsContent}>
    {scopeTabs.map(tab => {
      const active = activeTab === tab.id;
      return (
        <TouchableOpacity key={tab.id} activeOpacity={0.88} style={styles.scopeTabWrap} onPress={() => onChange(tab.id)}>
          {active ? (
            <View style={styles.scopeTabActive}>
              <LinearGradient colors={['#1e75ff', '#155be8']} style={styles.scopeTabBackground} />
              <ScopeTabIcon tab={tab} active={active} />
              <Text style={styles.scopeTabActiveText}>{tab.label}</Text>
            </View>
          ) : (
            <View style={styles.scopeTabInactive}>
              <ScopeTabIcon tab={tab} active={active} />
              <Text style={styles.scopeTabText}>{tab.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </GradientFrame>
);

const ScopeTabIcon = ({ tab, active }: { tab: { id: ScopeTab; icon: string }; active: boolean }) => {
  const color = active ? '#ffffff' : '#aeb4ca';
  return <Feather name={tab.icon} size={18} color={color} />;
};

const CurrentRankCard = ({
  currentUser,
  participants,
}: {
  currentUser: CompetitionLeaderboardRow | null;
  participants?: number;
}) => {
  const percentile = currentUser && participants
    ? Math.max(1, Math.round(currentUser.rank / Math.max(participants, 1) * 100))
    : null;

  return (
  <GradientFrame colors={['rgba(4,48,95,0.94)', 'rgba(5,15,36,0.98)']} style={styles.currentCard} contentStyle={styles.currentCardContent}>
    <View style={styles.currentLeft}>
      <AvatarWithBadge source={currentUser ? getAvatarSource(currentUser) : images.avatarYou} badge={currentUser ? String(currentUser.rank) : '-'} size={64} badgeStyle={styles.currentBadge} />
      <View style={styles.currentTextBlock}>
        <Text style={styles.currentLabel}>Your Rank</Text>
        <Text style={styles.currentRank}>{currentUser ? `#${currentUser.rank}` : '--'}</Text>
        <Text style={styles.currentHint}>
          {currentUser ? currentUser.username : 'Join the competition to rank.'}
          <Text style={styles.cyanText}>{currentUser ? `  ◆ ${currentUser.diamonds || 0} diamonds` : ''}</Text>
        </Text>
      </View>
    </View>
    <View style={styles.currentDivider} />
    <View style={styles.scoreBlock}>
      <Text style={styles.currentLabel}>Your Score</Text>
      <Text style={styles.currentScore}>💧 {formatScore(currentUser?.tapScore)}</Text>
      <Text style={styles.currentHint}>
        {percentile ? <>Top <Text style={styles.cyanText}>{percentile}%</Text> globally</> : 'Complete slots to sync score'}
        {currentUser ? <> · <Text style={styles.cyanText}>{currentUser.streak || currentUser.completedSlotCount || 0} streak</Text></> : null}
      </Text>
    </View>
  </GradientFrame>
  );
};

const LeaderboardPanel = ({
  podiumRows,
  rankingRows,
}: {
  podiumRows: PodiumUser[];
  rankingRows: LeaderboardUser[];
}) => (
  <GradientFrame colors={['rgba(13,16,56,0.98)', 'rgba(3,15,35,0.99)']} style={styles.leaderboardPanel} contentStyle={styles.leaderboardPanelContent}>
    <View style={styles.podiumStage}>
      {podiumRows.length > 0 ? podiumRows.map(user => (
        <PodiumUserCard key={user.id} user={user} />
      )) : <Text style={styles.emptyLeaderboardText}>No ranked users yet.</Text>}
    </View>
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
      <Text style={[styles.tableHeaderText, styles.userColumn]}>User</Text>
      <Text style={[styles.tableHeaderText, styles.levelColumn]}>Streak</Text>
      <Text style={[styles.tableHeaderText, styles.tapColumn]}>Tap Score</Text>
    </View>
    <FlatList
      data={rankingRows}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <RankingRow item={item} />}
      scrollEnabled={false}
      ItemSeparatorComponent={RankingRowSeparator}
      ListEmptyComponent={<Text style={styles.emptyLeaderboardText}>Join and complete slots to appear here.</Text>}
    />
    <View style={styles.leaderboardNote}>
      <Feather name="info" size={17} color="#8992b1" />
      <Text style={styles.noteText}>Leaderboard updates every hour</Text>
    </View>
  </GradientFrame>
);

const RankingRowSeparator = () => <View style={styles.rowSeparator} />;

const PodiumUserCard = ({ user }: { user: PodiumUser }) => {
  const isFirst = user.place === 1;
  const medalColor = user.place === 1 ? '#ffd33d' : user.place === 2 ? '#b8cff5' : '#ff9c54';
  const stageStyle = user.place === 1 ? styles.stageFirst : user.place === 2 ? styles.stageSecond : styles.stageThird;

  return (
    <View style={[styles.podiumUser, isFirst && styles.podiumFirstUser]}>
      {isFirst ? <FontAwesome5 name="crown" size={18} color="#ffd33d" style={styles.crown} /> : null}
      <AvatarWithBadge source={user.avatar} badge={String(user.place)} size={isFirst ? 72 : 62} badgeStyle={{ backgroundColor: medalColor }} />
      <Text style={[styles.podiumName, user.place === 3 && styles.bronzeText]} numberOfLines={1}>{user.name}</Text>
      <Text style={styles.podiumScore}>💧 {user.score}</Text>
      <View style={styles.podiumMetaRow}>
        <Text style={styles.podiumMetaText}>💎 {user.diamonds}</Text>
        <Text style={styles.podiumMetaText}>🔥 {user.streak}</Text>
      </View>
      <LinearGradient colors={user.place === 1 ? ['#ffd65f', '#9a5b0f'] : user.place === 2 ? ['#d7e6ff', '#58739d'] : ['#d58b54', '#723611']} style={[styles.stageBase, stageStyle]}>
        <Text style={styles.stageNumber}>{user.place}</Text>
      </LinearGradient>
    </View>
  );
};

const RankingRow = ({ item }: { item: LeaderboardUser }) => (
  <GradientFrame colors={['rgba(7,29,66,0.72)', 'rgba(5,14,34,0.76)']} style={styles.rankingRow} contentStyle={styles.rankingRowContent}>
    <Text style={[styles.rankText, styles.rankColumn]}>{item.rank}</Text>
    <View style={[styles.userInfo, styles.userColumn]}>
      <Image source={item.avatar} style={styles.rowAvatar} resizeMode="cover" />
      <View style={styles.userNameWrap}>
        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.userSmallScore}>💧 {item.score}  💎 {item.diamonds}</Text>
      </View>
    </View>
    <View style={[styles.levelInfo, styles.levelColumn]}>
      <MaterialCommunityIcons name="fire" size={18} color="#ff9b2f" />
      <Text style={styles.levelText}>{item.streak}</Text>
    </View>
    <View style={[styles.tapInfo, styles.tapColumn]}>
      <Text style={styles.tapScore}>{item.score}</Text>
      <View style={[styles.badgeMini, { borderColor: item.badgeColor, backgroundColor: `${item.badgeColor}30` }]}>
        <MaterialCommunityIcons name="shield-star" size={14} color={item.badgeColor} />
      </View>
    </View>
  </GradientFrame>
);

const CompetitionCta = ({
  entryFeeDiamonds,
  hasCompetition,
  onJoinPress,
  scheduleLabel,
  scheduleTone,
  title,
}: {
  entryFeeDiamonds: number;
  hasCompetition: boolean;
  onJoinPress: () => void;
  scheduleLabel: string;
  scheduleTone: 'scheduled' | 'active' | 'ended' | 'draft';
  title: string;
}) => {
  const isEnded = scheduleTone === 'ended';
  const isActive = scheduleTone === 'active';
  const isScheduled = scheduleTone === 'scheduled';

  return (
  <GradientFrame colors={['rgba(30,14,76,0.98)', 'rgba(5,16,38,0.99)']} style={styles.ctaCard} contentStyle={styles.ctaCardContent}>
    <View style={[styles.liveBadge, !isActive && styles.ctaMutedBadge]}>
      <View style={[styles.liveDot, !isActive && styles.ctaMutedDot]} />
      <Text style={styles.liveText}>{isEnded ? 'FINAL' : isScheduled ? 'SCHEDULED' : hasCompetition ? scheduleLabel.toUpperCase() : 'NONE'}</Text>
    </View>
    <Image source={images.trophy} style={styles.ctaTrophy} resizeMode="contain" />
    <View style={styles.ctaCopy}>
      <Text style={styles.ctaTitle}>
        {isEnded ? `${title} final results` : isScheduled ? `${title} is scheduled` : hasCompetition ? `${title} is live 🔥` : 'Challenge coming soon'}
      </Text>
      <Text style={styles.ctaSubtitle}>
        {isEnded
          ? 'The leaderboard is locked with the final participant ranks.'
          : isScheduled
            ? 'Join from the competition screen and get ready before it starts.'
            : hasCompetition
              ? 'Compete with others and win amazing rewards!'
              : 'The next leaderboard appears after admin creates a challenge.'}
      </Text>
      {hasCompetition && !isEnded ? <View style={styles.entryRow}>
        <Image source={images.diamond} style={styles.entryDiamond} resizeMode="contain" />
        <View>
          <Text style={styles.entryLabel}>Entry Fee</Text>
          <Text style={styles.entryValue}>{entryFeeDiamonds} Diamond{entryFeeDiamonds === 1 ? '' : 's'}</Text>
        </View>
      </View> : null}
    </View>
    <TouchableOpacity activeOpacity={0.88} style={[styles.joinNowButton, !hasCompetition && styles.joinNowButtonDisabled]} onPress={onJoinPress} disabled={!hasCompetition}>
      <Text style={styles.joinNowText}>{isEnded ? 'View Challenge' : isScheduled ? 'View Details' : hasCompetition ? 'Join Now' : 'Challenge coming soon'}</Text>
    </TouchableOpacity>
  </GradientFrame>
  );
};

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

const AvatarWithBadge = ({
  source,
  badge,
  size,
  badgeStyle,
}: {
  source: ImageSourcePropType;
  badge: string;
  size: number;
  badgeStyle?: object;
}) => (
  <View style={[styles.avatarFrame, { height: size, width: size, borderRadius: size / 2 }]}>
    <Image source={source} style={[styles.avatarImage, { height: size - 8, width: size - 8, borderRadius: (size - 8) / 2 }]} resizeMode="cover" />
    <View style={[styles.placeBadge, badgeStyle]}>
      <Text style={styles.placeBadgeText}>{badge}</Text>
    </View>
  </View>
);

const FixedBottomBannerAd = () => (
  <View style={styles.fixedAdWrap} pointerEvents="box-none">
    <View style={styles.fixedAdSlot}>
      <BannerAd
        unitId={LEADERBOARD_BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
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
    paddingBottom: 118,
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
  errorText: {
    backgroundColor: 'rgba(255,49,91,0.12)',
    borderColor: 'rgba(255,49,91,0.35)',
    borderRadius: 14,
    borderWidth: 1,
    color: '#ffd8e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
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
    position: 'relative',
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
    right: 1,
    top: 7,
    width: 12,
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
  cyanText: {
    color: '#12d8ff',
  },
  refreshCard: {
    borderColor: '#2b3566',
    borderRadius: 20,
    marginBottom: 12,
    minHeight: 88,
  },
  refreshCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  refreshTimer: {
    alignItems: 'center',
    flex: 1.08,
    flexDirection: 'row',
    gap: 7,
  },
  refreshLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 4,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 26,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  timeUnit: {
    color: '#c4cadb',
    fontSize: 9,
  },
  timeColon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    paddingBottom: 11,
    paddingHorizontal: 2,
  },
  noLeaderboardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  refreshDivider: {
    backgroundColor: '#24345f',
    height: 50,
    marginHorizontal: 8,
    width: 1,
  },
  refreshCopy: {
    flex: 0.95,
  },
  refreshCopyTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  refreshCopyText: {
    color: '#c6ccdf',
    fontSize: 9,
    lineHeight: 16,
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
  heroStatValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#ffffff',
    fontSize: 11,
  },
  scopeTabs: {
    borderColor: '#0b244f',
    borderRadius: 20,
    marginBottom: 14,
  },
  scopeTabsContent: {
    flexDirection: 'row',
    gap: 5,
    padding: 6,
  },
  scopeTabWrap: {
    flex: 1,
  },
  scopeTabActive: {
    alignItems: 'center',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 6,
    height: 38,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scopeTabBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  scopeTabInactive: {
    alignItems: 'center',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 6,
    height: 38,
    justifyContent: 'center',
  },
  scopeTabActiveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scopeTabText: {
    color: '#b6bdd1',
    fontSize: 12,
    fontWeight: '600',
  },
  currentCard: {
    borderColor: '#008cff',
    borderRadius: 20,
    marginBottom: 14,
    minHeight: 96,
  },
  currentCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 96,
    padding: 12,
  },
  currentLeft: {
    alignItems: 'center',
    flex: 1.42,
    flexDirection: 'row',
  },
  currentTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  currentLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 4,
  },
  currentRank: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  currentHint: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
  },
  currentDivider: {
    backgroundColor: '#274574',
    height: 58,
    marginHorizontal: 12,
    width: 1,
  },
  scoreBlock: {
    flex: 1,
  },
  currentScore: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  currentBadge: {
    backgroundColor: '#176cff',
  },
  leaderboardPanel: {
    borderColor: '#5b38d8',
    borderRadius: 20,
    marginBottom: 14,
  },
  leaderboardPanelContent: {
    padding: 10,
    paddingTop: 12,
  },
  podiumStage: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 214,
    paddingHorizontal: 2,
  },
  emptyLeaderboardText: {
    alignSelf: 'center',
    color: '#b6bdd1',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 18,
    textAlign: 'center',
  },
  podiumUser: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirstUser: {
    marginBottom: 12,
  },
  crown: {
    marginBottom: 3,
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: '#081b3f',
    borderColor: '#26a7ff',
    borderWidth: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    backgroundColor: '#cfd9e9',
  },
  placeBadge: {
    alignItems: 'center',
    backgroundColor: '#176cff',
    borderColor: '#214b8c',
    borderRadius: 9,
    borderWidth: 2,
    bottom: -2,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    width: 24,
  },
  placeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  podiumName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    maxWidth: 92,
    textAlign: 'center',
  },
  bronzeText: {
    color: '#ffb178',
  },
  podiumScore: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  podiumMetaRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  podiumMetaText: {
    color: '#d6deef',
    fontSize: 10,
    fontWeight: '800',
  },
  stageBase: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  stageFirst: {
    height: 58,
  },
  stageSecond: {
    height: 46,
  },
  stageThird: {
    height: 38,
  },
  stageNumber: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 26,
    fontWeight: '900',
  },
  tableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  tableHeaderText: {
    color: '#b6bdd1',
    fontSize: 11,
  },
  rankColumn: {
    width: 34,
  },
  userColumn: {
    flex: 1.5,
  },
  levelColumn: {
    flex: 0.72,
  },
  tapColumn: {
    flex: 1.02,
  },
  rankingRow: {
    borderColor: 'rgba(49,93,154,0.35)',
    borderRadius: 12,
    minHeight: 48,
  },
  rankingRowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  rowAvatar: {
    borderRadius: 17,
    height: 34,
    marginRight: 8,
    width: 34,
  },
  userNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  userSmallScore: {
    color: '#0fd8ff',
    fontSize: 10,
    marginTop: 2,
  },
  levelInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tapInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
  },
  tapScore: {
    color: '#ffffff',
    fontSize: 11,
  },
  badgeMini: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  rowSeparator: {
    height: 6,
  },
  leaderboardNote: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
  },
  noteText: {
    color: '#8f98b6',
    fontSize: 11,
    marginLeft: 6,
  },
  ctaCard: {
    borderColor: '#914cff',
    borderRadius: 20,
    minHeight: 140,
  },
  ctaCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 140,
    padding: 12,
    position: 'relative',
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#7c37df',
    borderRadius: 12,
    flexDirection: 'row',
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '-8deg' }],
    zIndex: 2,
  },
  liveDot: {
    backgroundColor: '#16e372',
    borderRadius: 4,
    height: 8,
    marginRight: 5,
    width: 8,
  },
  ctaMutedBadge: {
    backgroundColor: '#354461',
  },
  ctaMutedDot: {
    backgroundColor: '#9aa7bd',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  ctaTrophy: {
    height: 86,
    marginRight: 8,
    marginTop: 14,
    width: 86,
  },
  ctaCopy: {
    flex: 1,
    minWidth: 0,
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 20,
  },
  ctaSubtitle: {
    color: '#d5daeb',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },
  entryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  entryDiamond: {
    height: 30,
    width: 30,
  },
  entryLabel: {
    color: '#aeb7d4',
    fontSize: 11,
  },
  entryValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  joinNowButton: {
    alignItems: 'center',
    backgroundColor: '#7135e9',
    borderColor: '#b37aff',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 100,
    paddingHorizontal: 12,
  },
  joinNowButtonDisabled: {
    backgroundColor: '#34415d',
    borderColor: '#596881',
  },
  joinNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  fixedAdWrap: {
    alignItems: 'center',
    bottom: 8,
    left: 0,
    paddingHorizontal: 10,
    position: 'absolute',
    right: 0,
  },
  fixedAdSlot: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,10,24,0.94)',
    borderColor: 'rgba(76,119,199,0.5)',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: 5,
    width: '100%',
  },
});

export default LeaderboardScreen;
