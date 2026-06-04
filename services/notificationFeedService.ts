import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyHydrationState } from './hydrationService';
import { RewardLedgerEntry, getRewardLedger } from './rewardLedgerService';
import { getClaimState } from './rewardsService';
import { getStreak } from './streakService';
import { getLocalDateKey, slotOrder } from './v2Storage';
import { getReminders } from '../utils/reminderUtils';
import { backendRequest, getBackendUserId } from './backendAuthService';

export type NotificationFeedCategory = 'reminders' | 'achievements' | 'system';

export type NotificationFeedItem = {
  id: string;
  group: string;
  category: NotificationFeedCategory;
  title: string;
  body: string;
  time: string;
  accent: string;
  imageKey?: 'mascot' | 'water' | 'streak' | 'coin' | 'trophy' | 'reward';
  icon?: string;
  action?: string;
  reward?: string;
  route?: string;
};

const DISMISSED_KEY = 'v2:dismissedNotifications';
const SHOWN_BACKEND_NOTIFICATIONS_KEY = 'v2:shownBackendNotifications';

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const formatGroup = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const slotLabel = (slot: string) => slot.charAt(0).toUpperCase() + slot.slice(1);

const mapLedgerToNotification = (entry: RewardLedgerEntry): NotificationFeedItem => ({
  id: `ledger:${entry.id}`,
  group: formatGroup(entry.createdAt),
  category: 'achievements',
  title: entry.type === 'conversion' ? 'Diamond Created' : 'Reward Claimed',
  body: entry.title,
  time: formatTime(entry.createdAt),
  accent: entry.diamonds ? '#35c8ff' : '#ffad33',
  imageKey: entry.diamonds ? 'trophy' : 'coin',
  reward: entry.diamonds ? `+${entry.diamonds}` : entry.coins ? `${entry.coins > 0 ? '+' : ''}${entry.coins}` : undefined,
  route: 'Rewards',
});

type BackendNotification = {
  _id: string;
  title: string;
  body: string;
  type?: 'competition' | 'reward' | 'motivation' | 'streak' | 'system';
  route?: string | null;
  publishAt?: string;
  createdAt?: string;
};

const backendTypeConfig: Record<string, Pick<NotificationFeedItem, 'category' | 'accent' | 'imageKey' | 'icon'>> = {
  competition: { category: 'system', accent: '#b65cff', imageKey: 'trophy' },
  reward: { category: 'achievements', accent: '#ffad33', imageKey: 'coin' },
  motivation: { category: 'reminders', accent: '#35c8ff', imageKey: 'water' },
  streak: { category: 'achievements', accent: '#2bd66f', imageKey: 'streak' },
  system: { category: 'system', accent: '#1688ff', icon: 'bell-outline' },
};

const getTimestamp = (item: BackendNotification) => {
  const value = item.publishAt || item.createdAt;
  const timestamp = value ? new Date(value).getTime() : Date.now();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
};

const mapBackendNotification = (item: BackendNotification): NotificationFeedItem => {
  const timestamp = getTimestamp(item);
  const config = backendTypeConfig[item.type || 'system'] || backendTypeConfig.system;

  return {
    id: `backend:${item._id}`,
    group: formatGroup(timestamp),
    category: config.category,
    title: item.title,
    body: item.body,
    time: formatTime(timestamp),
    accent: config.accent,
    imageKey: config.imageKey,
    icon: config.icon,
    route: item.route || undefined,
  };
};

const getDismissedIds = async (): Promise<string[]> => {
  const stored = await AsyncStorage.getItem(DISMISSED_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const dismissNotificationFeedItems = async (ids: string[]) => {
  const dismissed = await getDismissedIds();
  const nextDismissed = Array.from(new Set([...dismissed, ...ids]));
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(nextDismissed));
};

const getBackendNotifications = async (): Promise<NotificationFeedItem[]> => {
  try {
    const userId = await getBackendUserId();
    const query = userId ? `?${new URLSearchParams({ userId }).toString()}` : '';
    const data = await backendRequest(`/notifications/public${query}`);
    return (data.notifications || []).map(mapBackendNotification);
  } catch {
    return [];
  }
};

export const getNotificationFeed = async (): Promise<NotificationFeedItem[]> => {
  const now = Date.now();
  const [dailyState, claimState, ledger, streak, reminders, dismissedIds, backendNotifications] = await Promise.all([
    getDailyHydrationState(),
    getClaimState(),
    getRewardLedger(),
    getStreak(),
    getReminders(),
    getDismissedIds(),
    getBackendNotifications(),
  ]);
  const dismissed = new Set(dismissedIds);
  const completedSlots = dailyState.completedSlots || [];
  const remainingSlots = slotOrder.filter(slot => !completedSlots.includes(slot));
  const enabledReminders = reminders.filter(reminder => reminder.enabled).slice(0, 3);
  const feed: NotificationFeedItem[] = [];

  feed.push(...backendNotifications);

  if (remainingSlots.length) {
    const nextSlot = remainingSlots[0];
    const reminder = enabledReminders.find(item => item.id === nextSlot) || enabledReminders[completedSlots.length];

    feed.push({
      id: `reminder:${nextSlot}:${getLocalDateKey()}`,
      group: 'Today',
      category: 'reminders',
      title: `Time for your ${slotLabel(nextSlot)} slot`,
      body: `You have ${remainingSlots.length} slot${remainingSlots.length > 1 ? 's' : ''} remaining for today.`,
      time: reminder?.time ? reminder.time.slice(0, 5) : formatTime(now),
      accent: '#1688ff',
      imageKey: 'water',
      action: 'Log Water',
      route: 'Home',
    });
  } else {
    feed.push({
      id: `hydration-complete:${getLocalDateKey()}`,
      group: 'Today',
      category: 'achievements',
      title: 'Daily hydration complete',
      body: 'All 3 hydration slots are complete. Claim your rewards from the Rewards screen.',
      time: dailyState.completedDayAt ? formatTime(dailyState.completedDayAt) : formatTime(now),
      accent: '#2bd66f',
      imageKey: 'mascot',
      route: 'Rewards',
    });
  }

  if ((claimState.pendingRewards || []).length) {
    const totalPendingCoins = claimState.pendingRewards.reduce((sum, reward) => sum + reward.coins, 0);

    feed.push({
      id: `pending-rewards:${getLocalDateKey()}:${claimState.pendingRewards.length}`,
      group: 'Today',
      category: 'achievements',
      title: 'Rewards ready to claim',
      body: `${claimState.pendingRewards.length} reward${claimState.pendingRewards.length > 1 ? 's are' : ' is'} waiting in Claimable Rewards.`,
      time: formatTime(claimState.pendingRewards[0].createdAt),
      accent: '#ffad33',
      imageKey: 'coin',
      reward: `+${totalPendingCoins}`,
      action: 'Claim',
      route: 'Rewards',
    });
  }

  if (streak.current > 0) {
    feed.push({
      id: `streak:${streak.current}:${streak.lastCompletedDate || 'active'}`,
      group: 'Today',
      category: 'achievements',
      title: `${streak.current} Day Streak`,
      body: `Best streak: ${streak.best} days. Keep your hydration rhythm alive.`,
      time: streak.lastCompletedDate === getLocalDateKey() ? formatTime(now) : 'Active',
      accent: '#2bd66f',
      imageKey: 'streak',
      route: 'History',
    });
  }

  if (enabledReminders.length) {
    feed.push({
      id: `system:reminders:${enabledReminders.map(reminder => reminder.time).join('|')}`,
      group: 'Today',
      category: 'system',
      title: `${enabledReminders.length} reminders scheduled`,
      body: enabledReminders.map(reminder => reminder.time.slice(0, 5)).join(' • '),
      time: 'Updated',
      accent: '#ffad33',
      icon: 'bell-check-outline',
      route: 'ReminderSettings',
    });
  }

  feed.push(
    ...ledger
      .slice(0, 5)
      .filter(entry => entry.coins || entry.diamonds)
      .map(mapLedgerToNotification),
  );

  feed.push({
    id: `system:weekly-report:${getLocalDateKey()}`,
    group: 'Today',
    category: 'system',
    title: 'Progress report ready',
    body: 'Open History to review your latest hydration, slot, and reward analytics.',
    time: formatTime(now),
    accent: '#1688ff',
    icon: 'chart-line',
    route: 'History',
  });

  return feed.filter(item => !dismissed.has(item.id));
};

export const getUnshownBackendNotifications = async () => {
  const [shownStored, feed] = await Promise.all([
    AsyncStorage.getItem(SHOWN_BACKEND_NOTIFICATIONS_KEY),
    getBackendNotifications(),
  ]);
  const shownIds = new Set<string>(shownStored ? JSON.parse(shownStored) : []);
  return feed.filter(item => !shownIds.has(item.id));
};

export const markBackendNotificationsShown = async (ids: string[]) => {
  const stored = await AsyncStorage.getItem(SHOWN_BACKEND_NOTIFICATIONS_KEY);
  const current = stored ? JSON.parse(stored) : [];
  await AsyncStorage.setItem(SHOWN_BACKEND_NOTIFICATIONS_KEY, JSON.stringify(Array.from(new Set([...current, ...ids]))));
};
