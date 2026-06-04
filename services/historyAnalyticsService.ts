import { getAllLogs } from '../utils/waterIntakeUtils';
import { PeriodKey } from '../constants/historyData';
import { getDailyHydrationState } from './hydrationService';
import { RewardLedgerEntry, getRewardLedger } from './rewardLedgerService';
import { getStreak, StreakState } from './streakService';
import { getWallet, Wallet } from './walletService';
import { SlotKey, getLocalDateKey, slotOrder } from './v2Storage';

export type HistoryChartMetric = {
  day: string;
  value: number;
  dateKey: string;
};

export type HistoryRecentTap = {
  id: string;
  amount: number;
  time: string;
};

export type HistorySlotMetric = {
  id: SlotKey;
  title: string;
  completed: number;
  total: number;
};

export type HistoryRewardBreakdown = {
  id: string;
  label: string;
  value: string;
  color: string;
};

export type HistoryDonutSegment = {
  label: string;
  value: number;
  color: string;
};

export type HistoryAnalyticsSnapshot = {
  period: PeriodKey;
  periodLabel: string;
  wallet: Wallet;
  streak: StreakState;
  weeklyTotalLiters: number;
  weeklyAverageLiters: number;
  bestDay: {
    label: string;
    liters: number;
  };
  completionRate: number;
  chart: HistoryChartMetric[];
  recentTaps: HistoryRecentTap[];
  slotMetrics: HistorySlotMetric[];
  weeklyTracker: boolean[];
  totalSlots: number;
  rewardsThisWeek: number;
  rewardBreakdown: HistoryRewardBreakdown[];
  donutSegments: HistoryDonutSegment[];
};

const slotTitles: Record<SlotKey, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const rewardColors = {
  slots: '#35d5ff',
  bonus: '#78ff9d',
  challenge: '#ffd447',
  spin: '#b875ff',
  ads: '#79ff9f',
};

const periodConfig: Record<PeriodKey, { days: number; label: string }> = {
  today: { days: 1, label: 'Today' },
  week: { days: 7, label: 'This Week' },
  month: { days: 30, label: 'This Month' },
  year: { days: 365, label: 'This Year' },
};

const getPastDateKeys = (days: number, period: PeriodKey) => {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    return {
      date,
      dateKey: getLocalDateKey(date),
      label: period === 'today'
        ? 'Today'
        : period === 'month'
          ? date.toLocaleDateString([], { day: 'numeric' })
          : period === 'year'
            ? date.toLocaleDateString([], { month: 'short' })
            : date.toLocaleDateString([], { weekday: 'short' }).slice(0, 3),
    };
  });
};

const buildChartItems = (items: Array<{ date: Date; dateKey: string; label: string; liters: number }>, period: PeriodKey): HistoryChartMetric[] => {
  if (period !== 'year') {
    if (period === 'month') {
      return items
        .filter((_, index) => index % 5 === 0 || index === items.length - 1)
        .map(item => ({ day: item.label, value: item.liters, dateKey: item.dateKey }));
    }

    return items.map(item => ({ day: item.label, value: item.liters, dateKey: item.dateKey }));
  }

  const monthTotals = items.reduce<Record<string, HistoryChartMetric>>((totals, item) => {
    const monthKey = `${item.date.getFullYear()}-${item.date.getMonth()}`;
    const existing = totals[monthKey];

    return {
      ...totals,
      [monthKey]: {
        day: item.date.toLocaleDateString([], { month: 'short' }),
        value: (existing?.value || 0) + item.liters,
        dateKey: item.dateKey,
      },
    };
  }, {});

  return Object.values(monthTotals);
};

const getPositiveCoins = (entry: RewardLedgerEntry) => Math.max(entry.coins || 0, 0);

const getRewardSource = (entry: RewardLedgerEntry) => {
  const title = entry.title.toLowerCase();
  if (entry.type === 'slot_completed' || title.includes('slot completed')) return 'slots';
  if (entry.type === 'daily_bonus' || entry.title.toLowerCase().includes('completion bonus')) return 'bonus';
  if (entry.type === 'competition_reward') return 'challenge';
  if (entry.type === 'spin_reward') return 'spin';
  if (entry.type === 'ad_reward') return 'ads';
  return 'other';
};

export const getHistoryAnalyticsSnapshot = async (period: PeriodKey = 'week'): Promise<HistoryAnalyticsSnapshot> => {
  const config = periodConfig[period];
  const dateItems = getPastDateKeys(config.days, period);
  const dateKeySet = new Set(dateItems.map(item => item.dateKey));
  const [logs, ledger, wallet, streak, dailyStates] = await Promise.all([
    getAllLogs(),
    getRewardLedger(),
    getWallet(),
    getStreak(),
    Promise.all(dateItems.map(item => getDailyHydrationState(item.dateKey))),
  ]);

  const litersByDate = dateItems.map(item => {
    const totalMl = logs
      .filter(log => getLocalDateKey(new Date(log.timestamp)) === item.dateKey)
      .reduce((sum, log) => sum + log.amount, 0);

    return {
      ...item,
      liters: totalMl / 1000,
    };
  });
  const weeklyTotalLiters = litersByDate.reduce((sum, item) => sum + item.liters, 0);
  const bestDay = litersByDate.reduce(
    (best, item) => (item.liters > best.liters ? { label: item.label, liters: item.liters } : best),
    { label: dateItems[0]?.label || 'Today', liters: 0 },
  );
  const completedSlotsCount = dailyStates.reduce((sum, state) => sum + state.completedSlots.length, 0);
  const totalSlots = dateItems.length * slotOrder.length;
  const completionRate = Math.round(completedSlotsCount / totalSlots * 100);
  const recentTaps = logs
    .filter(log => dateKeySet.has(getLocalDateKey(new Date(log.timestamp))))
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4)
    .map(log => ({
      id: log.id,
      amount: log.amount,
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  const slotMetrics = slotOrder.map(slot => ({
    id: slot,
    title: slotTitles[slot],
    completed: dailyStates.filter(state => state.completedSlots.includes(slot)).length,
    total: dateItems.length,
  }));
  const weeklyTracker = dailyStates.map(state => slotOrder.every(slot => state.completedSlots.includes(slot)));
  const weeklyLedger = ledger.filter(entry => dateKeySet.has(entry.dateKey));
  const rewardTotals = weeklyLedger.reduce<Record<string, number>>((totals, entry) => {
    const source = getRewardSource(entry);
    if (source === 'other') return totals;

    return {
      ...totals,
      [source]: (totals[source] || 0) + getPositiveCoins(entry),
    };
  }, {});
  const rewardsThisWeek = Object.values(rewardTotals).reduce((sum, value) => sum + value, 0);
  const rewardBreakdown: HistoryRewardBreakdown[] = [
    { id: 'slots', label: 'Slot claims', value: `+${rewardTotals.slots || 0}`, color: rewardColors.slots },
    { id: 'bonus', label: 'Daily bonus', value: `+${rewardTotals.bonus || 0}`, color: rewardColors.bonus },
    { id: 'challenge', label: 'Challenge', value: `+${rewardTotals.challenge || 0}`, color: rewardColors.challenge },
    { id: 'spin', label: 'Spin rewards', value: `+${rewardTotals.spin || 0}`, color: rewardColors.spin },
    { id: 'ads', label: 'Ad rewards', value: `+${rewardTotals.ads || 0}`, color: rewardColors.ads },
  ];
  const sourceTotal = Object.values(rewardTotals).reduce((sum, value) => sum + value, 0);
  const donutSegments = [
    { label: 'Slots', value: rewardTotals.slots || 0, color: '#ffd447' },
    { label: 'Challenge', value: rewardTotals.challenge || 0, color: '#39dcff' },
    { label: 'Ads', value: rewardTotals.ads || 0, color: '#79ff9f' },
    { label: 'Spin', value: rewardTotals.spin || 0, color: '#b875ff' },
  ].map(segment => ({
    ...segment,
    value: sourceTotal ? Math.round(segment.value / sourceTotal * 100) : segment.label === 'Slots' ? 100 : 0,
  }));
  const chartItems = buildChartItems(litersByDate, period);

  return {
    period,
    periodLabel: config.label,
    wallet,
    streak,
    weeklyTotalLiters,
    weeklyAverageLiters: weeklyTotalLiters / dateItems.length,
    bestDay,
    completionRate,
    chart: chartItems,
    recentTaps,
    slotMetrics,
    weeklyTracker,
    totalSlots,
    rewardsThisWeek,
    rewardBreakdown,
    donutSegments,
  };
};
