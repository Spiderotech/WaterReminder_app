import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { cancelAllHydrationReminders } from '../utils/notificationUtils';
import { getAllLogs } from '../utils/waterIntakeUtils';
import { getUserProfile } from '../utils/userUtils';
import { getRewardLedger } from '../services/rewardLedgerService';
import { getStreak, StreakState } from '../services/streakService';
import { getWallet, Wallet } from '../services/walletService';
import { getActiveCompetitionLeaderboard } from '../services/competitionService';
import { deleteBackendAccount } from '../services/backendAuthService';

type RootStackParamList = Record<string, object | undefined>;

type SummaryStat = {
  id: string;
  image: ImageSourcePropType;
  value: string;
  label: string;
  color: string;
};

type ProfileState = {
  username: string;
  city: string;
  country: string;
  avatarSource: ImageSourcePropType;
  streak: StreakState;
  wallet: Wallet;
  lifetimeWaterLiters: number;
  totalTaps: number;
  coinsEarned: number;
  diamondsEarned: number;
  globalRank: number | null;
};

type OptionItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  route?: string;
  value?: string;
  danger?: boolean;
};

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  items: OptionItem[];
  danger?: boolean;
};

const images = {
  avatar: require('../assets/avatar_male_1.png') as ImageSourcePropType,
  water: require('../assets/waterglass.png') as ImageSourcePropType,
  coin: require('../assets/coin1.png') as ImageSourcePropType,
  trophy: require('../assets/challenge.png') as ImageSourcePropType,
  streak: require('../assets/streak.png') as ImageSourcePropType,
  bestStreak: require('../assets/beststreak.png') as ImageSourcePropType,
  tap: require('../assets/participation.png') as ImageSourcePropType,
  rank: require('../assets/rank.png') as ImageSourcePropType,
   Diamonds: require('../assets/diamond.png') as ImageSourcePropType,
};

const avatarSources: Record<string, ImageSourcePropType> = {
  male_1: require('../assets/avatar_male_1.png') as ImageSourcePropType,
  male_2: require('../assets/avatar_male_2.png') as ImageSourcePropType,
  male_3: require('../assets/avatar_male_3.png') as ImageSourcePropType,
  male_4: require('../assets/avatar_male_4.png') as ImageSourcePropType,
  male_6: require('../assets/avatar_male_6.png') as ImageSourcePropType,
  male_7: require('../assets/avatar_male_7.png') as ImageSourcePropType,
  male_8: require('../assets/avatar_male_8.png') as ImageSourcePropType,
  male_9: require('../assets/avatar_male_9.png') as ImageSourcePropType,
  male_10: require('../assets/avatar_male_10.png') as ImageSourcePropType,
  male_12: require('../assets/avatar_male_12.png') as ImageSourcePropType,
  male_13: require('../assets/avatar_male_13.png') as ImageSourcePropType,
  male_14: require('../assets/avatar_male_14.png') as ImageSourcePropType,
  male_15: require('../assets/avatar_male_15.png') as ImageSourcePropType,
  female_1: require('../assets/avatar_female_1.png') as ImageSourcePropType,
  female_2: require('../assets/avatar_female_2.png') as ImageSourcePropType,
  female_3: require('../assets/avatar_female_3.png') as ImageSourcePropType,
  female_4: require('../assets/avatar_female_4.png') as ImageSourcePropType,
  female_5: require('../assets/avatar_female_5.png') as ImageSourcePropType,
  female_6: require('../assets/avatar_female_6.png') as ImageSourcePropType,
  female_7: require('../assets/avatar_female_7.png') as ImageSourcePropType,
  female_8: require('../assets/avatar_female_8.png') as ImageSourcePropType,
  female_9: require('../assets/avatar_female_9.png') as ImageSourcePropType,
  female_10: require('../assets/avatar_female_10.png') as ImageSourcePropType,
  female_11: require('../assets/avatar_female_11.png') as ImageSourcePropType,
  female_12: require('../assets/avatar_female_12.png') as ImageSourcePropType,
  female_13: require('../assets/avatar_female_13.png') as ImageSourcePropType,
};

const getProfileAvatarSource = (avatarId?: string, gender?: string) => {
  if (avatarId && avatarSources[avatarId]) return avatarSources[avatarId];
  if (gender === 'Female') return avatarSources.female_1;
  return images.avatar;
};

const defaultProfileState: ProfileState = {
  username: 'user',
  city: 'Ahmedabad',
  country: 'India',
  avatarSource: images.avatar,
  streak: { current: 0, best: 0, totalCompletedDays: 0 },
  wallet: { coins: 0, diamonds: 0, energyLevel: 7 },
  lifetimeWaterLiters: 0,
  totalTaps: 0,
  coinsEarned: 0,
  diamondsEarned: 0,
  globalRank: null,
};

const buildTopStats = (state: ProfileState): SummaryStat[] => [
  { id: 'current', image: images.streak, value: String(state.streak.current), label: 'Current Streak', color: '#ff9b2f' },
  { id: 'best', image: images.bestStreak, value: String(state.streak.best), label: 'Best Streak', color: '#ff7b3d' },
  { id: 'water', image: images.water, value: `${state.lifetimeWaterLiters.toFixed(1)} L`, label: 'Lifetime Water', color: '#35c8ff' },
  { id: 'taps', image: images.tap, value: state.totalTaps.toLocaleString(), label: 'Total Taps', color: '#22d7ff' },
  { id: 'rank', image: images.rank, value: state.globalRank ? `#${state.globalRank.toLocaleString()}` : '--', label: 'Global Rank', color: '#66ff7a' },
];

const buildLifetimeStats = (state: ProfileState) => [
  { id: 'coins', image: images.coin, value: state.coinsEarned.toLocaleString(), label: 'Coins Earned' },
  { id: 'diamond', image: images.Diamonds, value: state.diamondsEarned.toLocaleString(), label: 'Diamonds Earned' },
];

const APP_LINKS = {
  ios: 'https://apps.apple.com/app/id6752671109',
  android: 'https://play.google.com/store/apps/details?id=com.doradrinkwaterreminderapp',
};

const sections: Section[] = [
  {
    id: 'account',
    eyebrow: 'ACCOUNT',
    title: 'Account',
    subtitle: 'Edit profile, personal info, username and more',
    icon: 'account',
    color: '#4aa7ff',
    items: [
      
      { id: 'personal', label: 'Personal Information', subtitle: 'Age, height, weight and activity', icon: 'card-account-details-outline', route: 'PersonalInfo' },
    ],
  },
  {
    id: 'hydration',
    eyebrow: 'HYDRATION',
    title: 'Hydration Settings',
    subtitle: 'Reminders, goal, cup preferences and permissions',
    icon: 'water',
    color: '#19d7ff',
    items: [
      { id: 'reminder', label: 'Reminder Settings', subtitle: 'Slot notifications and timing', icon: 'bell-outline', route: 'ReminderSettings' },
      { id: 'goal', label: 'Hydration Goal', subtitle: 'Daily target and selected plan', icon: 'target', route: 'ProfileHydrationGoal' },
      { id: 'permission', label: 'Notification Permission Status', subtitle: 'Enabled', icon: 'check-decagram-outline', value: 'On' },
      ...(Platform.OS === 'android'
        ? [{ id: 'alarm', label: 'Exact Alarm Permission', subtitle: 'Required for precise reminders', icon: 'alarm-check', value: 'Check' }]
        : []),
    ],
  },
  {
    id: 'app',
    eyebrow: 'APP SETTINGS',
    title: 'App Settings',
    subtitle: 'Theme, notifications, language and app version',
    icon: 'palette',
    color: '#a66cff',
    items: [
      { id: 'theme', label: 'Theme Settings', subtitle: 'Dark, light, or system', icon: 'theme-light-dark', route: 'ThemeSettings' },
      { id: 'share', label: 'Share DoraDrink', subtitle: 'Invite friends to hydrate with you', icon: 'share-variant-outline' },
      { id: 'language', label: 'Language', subtitle: 'English', icon: 'translate', value: 'EN' },
      { id: 'version', label: 'App Version', subtitle: 'DoraDrink V2 preview', icon: 'information-outline', value: '2.0' },
    ],
  },
  {
    id: 'support',
    eyebrow: 'SUPPORT & LEGAL',
    title: 'Support & Legal',
    subtitle: 'FAQ, contact support, privacy policy and terms',
    icon: 'help-circle',
    color: '#63f28b',
    items: [
      { id: 'faq', label: 'FAQ', subtitle: 'Common app questions', icon: 'frequently-asked-questions', route: 'FAQ' },
      { id: 'contact', label: 'Contact Support', subtitle: 'Email DoraDrink support', icon: 'headset', route: 'ContactSupport' },
      { id: 'privacy', label: 'Privacy Policy', subtitle: 'How your data is handled', icon: 'lock-outline', route: 'Privacy' },
      { id: 'terms', label: 'Terms of Service', subtitle: 'Usage terms and conditions', icon: 'file-document-outline', route: 'Terms' },
    ],
  },
  {
    id: 'danger',
    eyebrow: 'DANGER ZONE',
    title: 'Danger Zone',
    subtitle: 'Reset data or delete your account',
    icon: 'delete-outline',
    color: '#ff5269',
    danger: true,
    items: [
      { id: 'reset', label: 'Reset Data', subtitle: 'Clear local hydration data and reminders', icon: 'backup-restore', danger: true },
      { id: 'delete', label: 'Delete Account', subtitle: 'Available when account sync is enabled', icon: 'account-remove-outline', danger: true },
    ],
  },
];

const ProfileScreen = ({ goToTab }: { goToTab?: (tab: string) => void }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const tabTheme = useMainTabTheme();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState>(defaultProfileState);

  const handleBackPress = useCallback(() => {
    if (goToTab) {
      goToTab('home');
      return;
    }
    navigation.goBack();
  }, [goToTab, navigation]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfileState = async () => {
        const [profile, streak, wallet, logs, ledger, leaderboard] = await Promise.all([
          getUserProfile(),
          getStreak(),
          getWallet(),
          getAllLogs(),
          getRewardLedger(),
          getActiveCompetitionLeaderboard(1).catch(() => null),
        ]);

        if (!isActive) return;

        const coinsEarned = ledger.reduce((sum, entry) => sum + Math.max(entry.coins || 0, 0), 0);
        const diamondsEarned = ledger.reduce((sum, entry) => sum + Math.max(entry.diamonds || 0, 0), 0);

        setProfileState({
          username: profile?.username || defaultProfileState.username,
          city: profile?.city || defaultProfileState.city,
          country: profile?.country || defaultProfileState.country,
          avatarSource: getProfileAvatarSource(profile?.avatar, profile?.gender),
          streak,
          wallet,
          lifetimeWaterLiters: logs.reduce((sum, log) => sum + log.amount, 0) / 1000,
          totalTaps: logs.length,
          coinsEarned,
          diamondsEarned,
          globalRank: leaderboard?.currentUser?.rank || null,
        });
      };

      loadProfileState();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const expandedSection = useMemo(
    () => sections.find(section => section.id === openSection),
    [openSection],
  );

  const handleOptionPress = (item: OptionItem) => {
    if (item.id === 'reset') {
      setResetModalVisible(true);
      return;
    }

    if (item.id === 'delete') {
      handleDeleteAccount();
      return;
    }

    if (item.id === 'share') {
      handleShare();
      return;
    }

    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const handleShare = async () => {
    try {
      const storeLink = Platform.OS === 'ios' ? APP_LINKS.ios : APP_LINKS.android;

      await Share.share({
        message: `Stay hydrated with DoraDrink!\n\nDownload now:\n${storeLink}`,
        url: storeLink,
        title: 'DoraDrink - Stay Hydrated',
      });
    } catch (error) {
      console.error('Profile share failed:', error);
    }
  };

  const handleReset = async () => {
    try {
      await cancelAllHydrationReminders();
      await AsyncStorage.clear();
      setResetModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Profile reset failed:', error);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteInProgress) return;

    Alert.alert(
      'Delete account?',
      'This will delete your DoraDrink account data and clear local app data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteInProgress(true);
            try {
              await deleteBackendAccount();
              await cancelAllHydrationReminders();
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unable to delete your account right now.';
              Alert.alert('Delete account failed', message);
            } finally {
              setDeleteInProgress(false);
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header
            onBackPress={handleBackPress}
            onNotificationPress={() => navigation.navigate('Notifications')}
            theme={tabTheme}
          />
          <ProfileHero theme={tabTheme} profileState={profileState} />
          <StatsStrip stats={buildTopStats(profileState)} />
          <LifetimeSummary items={buildLifetimeStats(profileState)} />
          {sections.map(section => (
            <ProfileSection
              key={section.id}
              section={section}
              expanded={openSection === section.id}
              onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
              onOptionPress={handleOptionPress}
            />
          ))}
        </ScrollView>
        <ResetModal
          visible={resetModalVisible}
          onCancel={() => setResetModalVisible(false)}
          onReset={handleReset}
          sectionTitle={expandedSection?.title}
        />
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
    <TouchableOpacity activeOpacity={0.85} onPress={onBackPress} style={[styles.notificationButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="chevron-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Manage your account and preferences</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onNotificationPress} style={[styles.notificationButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="bell" size={25} color={theme.icon} />
      <View style={styles.notificationDot} />
    </TouchableOpacity>
  </View>
);

const ProfileHero = ({ theme, profileState }: { theme: MainTabTheme; profileState: ProfileState }) => (
  <View style={styles.profileHero}>
    <View style={styles.avatarColumn}>
      <GradientFrame colors={['#65ecff', '#155dff']} style={styles.avatarFrame}>
        <Image source={profileState.avatarSource} style={styles.avatar} resizeMode="cover" />
      </GradientFrame>
    </View>

    <View style={styles.identityBlock}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: theme.text }]}>{profileState.username}</Text>
        
      </View>
      <View style={styles.infoLine}>
        <MaterialCommunityIcons name="map-marker" size={19} color="#9ba7cf" />
        <Text style={[styles.infoText, { color: theme.mutedText }]}>{[profileState.city, profileState.country].filter(Boolean).join(', ')}</Text>
        <Text style={styles.flag}>🇮🇳</Text>
      </View>
      <View style={styles.infoLine}>
        <MaterialCommunityIcons name="calendar-month" size={18} color="#9ba7cf" />
        <Text style={[styles.infoText, { color: theme.mutedText }]}>Member since Mar 2025</Text>
      </View>
    </View>
  </View>
);



const StatsStrip = ({ stats }: { stats: SummaryStat[] }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.statsStrip}>
    {stats.map((stat, index) => (
      <View key={stat.id} style={styles.statItem}>
        <Image source={stat.image} style={styles.statImage} resizeMode="contain" />
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
        {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
      </View>
    ))}
  </GradientFrame>
);

const LifetimeSummary = ({ items }: { items: Array<{ id: string; image: ImageSourcePropType; value: string; label: string }> }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.lifetimeCard}>
   
    <View style={styles.lifetimeGrid}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.lifetimeItem}>
          <Image source={item.image} style={styles.lifetimeImage} resizeMode="contain" />
          <View>
            <Text style={styles.lifetimeValue}>{item.value}</Text>
            <Text style={styles.lifetimeLabel}>{item.label}</Text>
          </View>
          {index < items.length - 1 ? <View style={styles.lifetimeDivider} /> : null}
        </View>
      ))}
    </View>
  </GradientFrame>
);

const ProfileSection = ({
  section,
  expanded,
  onToggle,
  onOptionPress,
}: {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
  onOptionPress: (item: OptionItem) => void;
}) => (
  <GradientFrame
    colors={section.danger ? ['rgba(45,10,24,0.94)', 'rgba(5,13,32,0.98)'] : ['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']}
    style={[styles.profileSection, section.danger && styles.dangerSection]}
  >
    <TouchableOpacity activeOpacity={0.88} onPress={onToggle} style={styles.sectionHero}>
      <View style={[styles.sectionIcon, { backgroundColor: `${section.color}1f` }]}>
        <MaterialCommunityIcons name={section.icon} size={33} color={section.color} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionEyebrow, { color: section.color }]}>{section.eyebrow}</Text>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      </View>
      <Feather name={expanded ? 'chevron-up' : 'chevron-right'} size={27} color={section.danger ? '#ff5269' : '#aab5d4'} />
    </TouchableOpacity>

    {expanded ? (
      <View style={styles.optionList}>
        {section.items.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.86} onPress={() => onOptionPress(item)} style={styles.optionRow}>
            <View style={[styles.optionIcon, item.danger && styles.optionIconDanger]}>
              <MaterialCommunityIcons name={item.icon} size={21} color={item.danger ? '#ff5269' : section.color} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={[styles.optionLabel, item.danger && styles.dangerText]}>{item.label}</Text>
              {item.subtitle ? <Text style={styles.optionSubtitle}>{item.subtitle}</Text> : null}
            </View>
            {item.value ? <Text style={styles.optionValue}>{item.value}</Text> : null}
            {item.route || item.id === 'reset' || item.id === 'share' ? <Feather name="chevron-right" size={20} color="#8fa1c8" /> : null}
          </TouchableOpacity>
        ))}
      </View>
    ) : null}
  </GradientFrame>
);

const ResetModal = ({
  visible,
  onCancel,
  onReset,
}: {
  visible: boolean;
  onCancel: () => void;
  onReset: () => void;
  sectionTitle?: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalFrame}>
        <GradientFrame colors={['#081b3d', '#13091f']} style={[styles.modalSurface, styles.modalCard]}>
          <View style={styles.modalIcon}>
            <MaterialCommunityIcons name="alert" size={30} color="#ff5269" />
          </View>
          <Text style={styles.modalTitle}>Reset All Data?</Text>
          <Text style={styles.modalText}>
            This will erase local water intake, rewards progress, reminders, and preferences from this device.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity activeOpacity={0.88} onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.88} onPress={onReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </GradientFrame>
      </View>
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
  headerSide: {
    height: 44,
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
    lineHeight: 32,
  },
  headerSubtitle: {
    color: '#b7bdd7',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  notificationButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 44,
  },
  notificationDot: {
    backgroundColor: '#ff315b',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: 7,
    top: 7,
    width: 12,
  },
  profileHero: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatarColumn: {
    position: 'relative',
  },
  avatarFrame: {
    alignItems: 'center',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  avatar: {
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#155dce',
    borderColor: '#4aa7ff',
    borderRadius: 22,
    borderWidth: 1,
    bottom: -3,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    width: 42,
  },
  identityBlock: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(20,62,128,0.78)',
    borderColor: '#20579e',
    borderRadius: 9,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: 10,
    width: 32,
  },
  infoLine: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  infoText: {
    color: '#cbd3e7',
    fontSize: 12,
    marginLeft: 8,
  },
  flag: {
    fontSize: 14,
    marginLeft: 8,
  },
  energyCard: {
    borderColor: '#263f78',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 112,
    padding: 13,
    width: 145,
  },
  energyTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  energyTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  energyValueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 7,
  },
  energyValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 35,
  },
  energyLevel: {
    color: '#c7cee3',
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 6,
  },
  progressTrack: {
    backgroundColor: '#12325d',
    borderRadius: 8,
    height: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 8,
    height: 8,
    width: '72%',
  },
  energyXp: {
    color: '#d4d9e8',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  statsStrip: {
    borderColor: '#284e87',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    minHeight: 94,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  statImage: {
    height: 28,
    width: 28,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  statLabel: {
    color: '#d0d7ea',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    backgroundColor: '#274574',
    bottom: 8,
    position: 'absolute',
    right: 0,
    top: 8,
    width: 1,
  },
  lifetimeCard: {
    borderColor: '#284e87',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  lifetimeGrid: {
    flexDirection: 'row',
  },
  lifetimeItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  lifetimeImage: {
    height: 31,
    marginRight: 7,
    width: 31,
  },
  lifetimeValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  lifetimeLabel: {
    color: '#bfc8de',
    fontSize: 9,
    marginTop: 4,
  },
  lifetimeDivider: {
    backgroundColor: '#274574',
    bottom: 2,
    position: 'absolute',
    right: 0,
    top: 2,
    width: 1,
  },
  profileSection: {
    borderColor: '#203f70',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  dangerSection: {
    borderColor: '#7d2338',
  },
  sectionHero: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 86,
    padding: 14,
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: 23,
    height: 58,
    justifyContent: 'center',
    marginRight: 13,
    width: 58,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#c4cbe1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  optionList: {
    borderTopColor: 'rgba(84,116,171,0.3)',
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  optionRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(66,98,149,0.28)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingVertical: 8,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,44,91,0.72)',
    borderRadius: 13,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  optionIconDanger: {
    backgroundColor: 'rgba(255,82,105,0.13)',
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: '#9faac6',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  optionValue: {
    color: '#35d9ff',
    fontSize: 12,
    fontWeight: '900',
    marginRight: 8,
  },
  dangerText: {
    color: '#ff7586',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.66)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalFrame: {
    borderColor: '#7d2338',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  modalSurface: {
    width: '100%',
  },
  modalCard: {
    alignItems: 'center',
    padding: 20,
  },
  modalIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,82,105,0.14)',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 14,
  },
  modalText: {
    color: '#c5cbe0',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,38,76,0.94)',
    borderColor: '#294d82',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#d92d4b',
    borderColor: '#ff7586',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#d8e4ff',
    fontSize: 14,
    fontWeight: '900',
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default ProfileScreen;
