import AsyncStorage from '@react-native-async-storage/async-storage';
import { V2_KEYS, getLocalDateKey } from './v2Storage';

export type StreakState = {
  current: number;
  best: number;
  lastCompletedDate?: string;
  totalCompletedDays?: number;
};

const defaultStreak: StreakState = {
  current: 0,
  best: 0,
  totalCompletedDays: 0,
};

const getPreviousDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
};

export const getStreak = async (): Promise<StreakState> => {
  const stored = await AsyncStorage.getItem(V2_KEYS.streak);
  return stored ? { ...defaultStreak, ...JSON.parse(stored) } : defaultStreak;
};

export const saveStreak = async (streak: StreakState) => {
  await AsyncStorage.setItem(V2_KEYS.streak, JSON.stringify(streak));
  return streak;
};

export const applyDailyCompletionStreak = async (dateKey = getLocalDateKey()) => {
  const streak = await getStreak();

  if (streak.lastCompletedDate === dateKey) {
    return streak;
  }

  const continued = streak.lastCompletedDate === getPreviousDateKey(dateKey);
  const nextCurrent = !streak.lastCompletedDate ? streak.current + 1 : continued ? streak.current + 1 : 1;
  const nextStreak = {
    ...streak,
    current: nextCurrent,
    best: Math.max(streak.best, nextCurrent),
    lastCompletedDate: dateKey,
    totalCompletedDays: (streak.totalCompletedDays || 0) + 1,
  };

  await saveStreak(nextStreak);
  return nextStreak;
};
