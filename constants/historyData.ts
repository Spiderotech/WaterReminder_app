export type PeriodKey = 'today' | 'week' | 'month' | 'year';

export type HistoryAnalyticsKey =
  | 'hydration'
  | 'slots'
  | 'streaks'
  | 'rewards'
  | 'competitions';

export interface SummaryCardData {
  id: string;
  title: string;
  value: string;
  caption: string;
  trend?: string;
  footer?: string;
  variant: 'water' | 'streak' | 'coins' | 'completion';
  colors: string[];
}

export interface ChartPoint {
  day: string;
  value: number;
}

export interface AnalyticsTabData {
  key: HistoryAnalyticsKey;
  label: string;
  icon: string;
}

export interface SlotProgressData {
  id: string;
  title: string;
  icon: string;
  completed: number;
  total: number;
  colors: string[];
}

export interface RewardBreakdownData {
  id: string;
  label: string;
  value: string;
  color: string;
}

export interface CompetitionData {
  id: string;
  title: string;
  rank: string;
  reward: string;
  icon: string;
}

export const periodTabs: PeriodKey[] = ['today', 'week', 'month', 'year'];

export const summaryCards: SummaryCardData[] = [
  {
    id: 'water',
    title: 'Total Water',
    value: '14.8 L',
    caption: 'This Week',
    trend: '+12% vs last week',
    variant: 'water',
    colors: ['#062c70', '#08172d'],
  },
  {
    id: 'streak',
    title: 'Longest Streak',
    value: '0',
    caption: 'Days',
    footer: 'Best: 0 days',
    variant: 'streak',
    colors: ['#32155c', '#101225'],
  },
  {
    id: 'coins',
    title: 'Coins Earned',
    value: '230',
    caption: 'This Week',
    trend: '+18%',
    variant: 'coins',
    colors: ['#4b2700', '#11131c'],
  },
  {
    id: 'completion',
    title: 'Completion Rate',
    value: '82%',
    caption: 'This Week',
    trend: '+11% vs last week',
    variant: 'completion',
    colors: ['#063d2d', '#091a20'],
  },
];

export const analyticsTabs: AnalyticsTabData[] = [
  { key: 'hydration', label: 'Hydration', icon: 'water' },
  { key: 'slots', label: 'Slots', icon: 'calendar-clock' },
  { key: 'streaks', label: 'Streaks', icon: 'fire' },
  { key: 'rewards', label: 'Rewards', icon: 'gift-outline' },
];

export const hydrationTrend: ChartPoint[] = [
  { day: 'Mon', value: 1.8 },
  { day: 'Tue', value: 2.4 },
  { day: 'Wed', value: 2.1 },
  { day: 'Thu', value: 2.6 },
  { day: 'Fri', value: 2.0 },
  { day: 'Sat', value: 1.7 },
  { day: 'Sun', value: 2.2 },
];

export const slotProgress: SlotProgressData[] = [
  {
    id: 'morning',
    title: 'Morning',
    icon: 'weather-sunny',
    completed: 6,
    total: 7,
    colors: ['#26d7ff', '#0b4f95'],
  },
  {
    id: 'afternoon',
    title: 'Afternoon',
    icon: 'white-balance-sunny',
    completed: 5,
    total: 7,
    colors: ['#ffd35a', '#d97913'],
  },
  {
    id: 'evening',
    title: 'Evening',
    icon: 'weather-night',
    completed: 3,
    total: 7,
    colors: ['#8e7cff', '#332477'],
  },
];

export const weeklyTracker = [true, true, true, true, false, true, false];

export const rewardBreakdown: RewardBreakdownData[] = [
  { id: 'morning', label: 'Morning slot', value: '+25', color: '#35d5ff' },
  { id: 'bonus', label: 'Daily bonus', value: '+10', color: '#78ff9d' },
  { id: 'challenge', label: 'Challenge', value: '+50', color: '#ffd447' },
  { id: 'spin', label: 'Spin', value: '+5', color: '#b875ff' },
];

export const donutSegments = [
  { label: 'Slots', value: 55, color: '#ffd447' },
  { label: 'Challenge', value: 20, color: '#39dcff' },
  { label: 'Ads', value: 15, color: '#79ff9f' },
  { label: 'Spin', value: 10, color: '#b875ff' },
];

export const competitions: CompetitionData[] = [
  {
    id: 'spring',
    title: 'Spring Challenge',
    rank: 'Rank #24',
    reward: '+50 coins',
    icon: 'flower-tulip-outline',
  },
  {
    id: 'hero',
    title: 'Hydration Hero',
    rank: 'Rank #12',
    reward: '+2 Diamonds',
    icon: 'shield-star-outline',
  },
];
