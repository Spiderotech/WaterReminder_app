import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from '../components/AppSafeAreaView';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import {
  analyticsTabs,
  HistoryAnalyticsKey,
  periodTabs,
  PeriodKey,
  summaryCards,
} from '../constants/historyData';
import {
  AnalyticsTabs,
  CompetitionAnalytics,
  HydrationAnalytics,
  RewardsAnalytics,
  SlotsAnalytics,
  StreakAnalytics,
  SummaryCard,
} from '../components/history';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import {
  getHistoryAnalyticsSnapshot,
  HistoryAnalyticsSnapshot,
} from '../services/historyAnalyticsService';
import { SummaryCardData } from '../constants/historyData';

const screenPadding = 14;
const summaryGap = 14;

const defaultSnapshot: HistoryAnalyticsSnapshot = {
  period: 'week',
  periodLabel: 'This Week',
  wallet: { coins: 0, diamonds: 0, energyLevel: 7 },
  streak: { current: 0, best: 0, totalCompletedDays: 0 },
  weeklyTotalLiters: 0,
  weeklyAverageLiters: 0,
  bestDay: { label: 'Today', liters: 0 },
  completionRate: 0,
  chart: [],
  recentTaps: [],
  slotMetrics: [],
  weeklyTracker: [false, false, false, false, false, false, false],
  totalSlots: 21,
  rewardsThisWeek: 0,
  rewardBreakdown: [],
  donutSegments: [],
};

const buildSummaryCards = (snapshot: HistoryAnalyticsSnapshot): SummaryCardData[] =>
  summaryCards.map(card => {
    if (card.id === 'water') {
      return {
        ...card,
        value: `${snapshot.weeklyTotalLiters.toFixed(1)} L`,
        caption: snapshot.periodLabel,
        trend: `${snapshot.weeklyAverageLiters.toFixed(2)} L/day`,
      };
    }

    if (card.id === 'streak') {
      return {
        ...card,
        value: String(snapshot.streak.current),
        footer: `Best: ${snapshot.streak.best} days`,
      };
    }

    if (card.id === 'coins') {
      return {
        ...card,
        value: snapshot.rewardsThisWeek.toLocaleString(),
        caption: snapshot.periodLabel,
        trend: `claimed ${snapshot.period === 'today' ? 'today' : snapshot.periodLabel.toLowerCase()}`,
      };
    }

    if (card.id === 'completion') {
      return {
        ...card,
        value: `${snapshot.completionRate}%`,
        caption: snapshot.periodLabel,
        trend: `${snapshot.slotMetrics.reduce((sum, slot) => sum + slot.completed, 0)} / ${snapshot.totalSlots} slots`,
      };
    }

    return card;
  });

const HistoryScreen = ({ goToTab }: { goToTab?: (tab: string) => void }) => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('week');
  const [activeAnalytics, setActiveAnalytics] = useState<HistoryAnalyticsKey>('hydration');
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<HistoryAnalyticsSnapshot>(defaultSnapshot);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getHistoryAnalyticsSnapshot(activePeriod).then(snapshot => {
        if (isActive) {
          setAnalyticsSnapshot(snapshot);
        }
      });

      return () => {
        isActive = false;
      };
    }, [activePeriod]),
  );

  const currentSummaryCards = useMemo(() => buildSummaryCards(analyticsSnapshot), [analyticsSnapshot]);
  const summaryRows = useMemo(() => {
    const rows: SummaryCardData[][] = [];

    for (let index = 0; index < currentSummaryCards.length; index += 2) {
      rows.push(currentSummaryCards.slice(index, index + 2));
    }

    return rows;
  }, [currentSummaryCards]);

  const handleBackPress = useCallback(() => {
    if (goToTab) {
      goToTab('home');
      return;
    }
    navigation.goBack();
  }, [goToTab, navigation]);

  const renderAnalytics = () => {
    if (activeAnalytics === 'hydration') {
      return <HydrationAnalytics snapshot={analyticsSnapshot} />;
    }

    if (activeAnalytics === 'slots') {
      return <SlotsAnalytics snapshot={analyticsSnapshot} />;
    }

    if (activeAnalytics === 'streaks') {
      return <StreakAnalytics snapshot={analyticsSnapshot} />;
    }

    if (activeAnalytics === 'rewards') {
      return <RewardsAnalytics snapshot={analyticsSnapshot} />;
    }

    return <CompetitionAnalytics />;
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header
            onBackPress={handleBackPress}
            onNotificationPress={() => navigation.navigate('Notifications' as never)}
            theme={tabTheme}
          />

          <PeriodSelector activePeriod={activePeriod} onChange={setActivePeriod} theme={tabTheme} />

          <View style={styles.summaryGrid}>
            {summaryRows.map((row, rowIndex) => (
              <View key={`summary-row-${rowIndex}`} style={[styles.summaryRow, rowIndex > 0 && styles.summaryRowSpaced]}>
                {row.map(item => (
                  <SummaryCard key={item.id} item={item} />
                ))}
              </View>
            ))}
          </View>

          <AnalyticsTabs tabs={analyticsTabs} activeKey={activeAnalytics} onChange={setActiveAnalytics} />

          <View key={activeAnalytics} style={styles.analyticsShell}>
            {renderAnalytics()}
          </View>
        </ScrollView>
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
    <TouchableOpacity activeOpacity={0.85} onPress={onBackPress} style={[styles.iconButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="chevron-left" size={25} color={theme.icon} />
    </TouchableOpacity>

    <View style={styles.headerCenter}>
      <Text style={[styles.title, { color: theme.text }]}>History</Text>
      <Text style={[styles.subtitle, { color: theme.mutedText }]}>Track your hydration journey</Text>
    </View>

    <View style={styles.headerActions}>
      <TouchableOpacity activeOpacity={0.85} onPress={onNotificationPress} style={[styles.notificationButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <Feather name="bell" size={28} color={theme.icon} />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  </View>
);

const PeriodSelector = ({
  activePeriod,
  onChange,
  theme,
}: {
  activePeriod: PeriodKey;
  onChange: (period: PeriodKey) => void;
  theme: MainTabTheme;
}) => (
  <View style={[styles.periodShell, { borderColor: theme.border }]}>
    <LinearGradient colors={theme.segment} style={styles.periodShellBackground} />
    <View style={styles.periodList}>
      {periodTabs.map(period => {
        const active = period === activePeriod;

        return (
          <TouchableOpacity key={period} activeOpacity={0.85} onPress={() => onChange(period)} style={styles.periodTouch}>
            <View style={[styles.periodButton, active && styles.periodButtonActive]}>
              {active ? <LinearGradient colors={['#1787ff', '#095cff']} style={styles.periodButtonBackground} /> : null}
              <Text
                style={[styles.periodText, active ? styles.periodTextActive : theme.isLight ? styles.periodTextLight : styles.periodTextDark]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
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
    paddingHorizontal: screenPadding,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 22,
    paddingTop: 12,
  },
  iconButton: {
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
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 32,
  },
  subtitle: {
    color: '#b7bdd7',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
    backgroundColor: '#ff3f59',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: 1,
    top: 11,
    width: 12,
  },
  periodShell: {
    backgroundColor: 'rgba(2,10,25,0.96)',
    borderColor: '#24436e',
    borderRadius: 38,
    borderWidth: 1,
    minHeight: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  periodShellBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  periodList: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 8,
  },
  periodTouch: {
    flex: 1,
    minWidth: 0,
  },
  periodButton: {
    alignItems: 'center',
    borderRadius: 30,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  periodButtonBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  periodButtonActive: {
    borderColor: '#52b8ff',
   
    shadowColor: '#0d7cff',
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  periodText: {
    color: '#dfe6f9',
    fontSize: 14,
  },
  periodTextDark: {
    color: '#dfe6f9',
  },
  periodTextLight: {
    color: '#10213f',
  },
  periodTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  calendarButton: {
    alignItems: 'center',
    backgroundColor: '#0a1b3b',
    borderColor: '#2864c7',
    borderRadius: 18,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    marginLeft: 8,
    width: 74,
  },
  summaryGrid: {
    paddingTop: 24,
  },
  summaryRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRowSpaced: {
    marginTop: summaryGap,
  },
  analyticsShell: {
    backgroundColor: 'rgba(5,15,34,0.96)',
    borderColor: '#1d4784',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 0,
    overflow: 'hidden',
  },
});

export default HistoryScreen;
