import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueCompletionReward } from './rewardsService';
import { applyDailyCompletionStreak, getStreak, StreakState } from './streakService';
import { getWallet, Wallet } from './walletService';
import { SlotKey, V2_KEYS, getLocalDateKey, slotOrder } from './v2Storage';

export type DailyHydrationState = {
  completedSlots: SlotKey[];
  bonusClaimed?: boolean;
  allSlotsCompleted?: boolean;
  completedDayAt?: number;
};

export type CompleteSlotResult = {
  completed: boolean;
  dailyState: DailyHydrationState;
  wallet: Wallet;
  streak: StreakState;
  coinsEarned: number;
  dailyBonusEarned: number;
};

const defaultDailyState: DailyHydrationState = {
  completedSlots: [],
  bonusClaimed: false,
  allSlotsCompleted: false,
};

export const getDailyHydrationState = async (dateKey = getLocalDateKey()): Promise<DailyHydrationState> => {
  const stored = await AsyncStorage.getItem(V2_KEYS.dailyHydration(dateKey));
  return stored ? { ...defaultDailyState, ...JSON.parse(stored) } : defaultDailyState;
};

export const saveDailyHydrationState = async (
  dailyState: DailyHydrationState,
  dateKey = getLocalDateKey(),
) => {
  await AsyncStorage.setItem(V2_KEYS.dailyHydration(dateKey), JSON.stringify(dailyState));
  return dailyState;
};

export const completeHydrationSlot = async (
  slot: SlotKey,
  dateKey = getLocalDateKey(),
): Promise<CompleteSlotResult> => {
  const dailyState = await getDailyHydrationState(dateKey);
  const wallet = await getWallet();
  const streak = await getStreak();

  if (dailyState.completedSlots.includes(slot)) {
    return {
      completed: false,
      dailyState,
      wallet,
      streak,
      coinsEarned: 0,
      dailyBonusEarned: 0,
    };
  }

  const completedSlots = [...dailyState.completedSlots, slot];
  const allSlotsCompleted = slotOrder.every(item => completedSlots.includes(item));
  const dailyBonusEarned = allSlotsCompleted && !dailyState.bonusClaimed ? 10 : 0;
  const nextDailyState: DailyHydrationState = {
    ...dailyState,
    completedSlots,
    bonusClaimed: dailyState.bonusClaimed || allSlotsCompleted,
    allSlotsCompleted,
    completedDayAt: allSlotsCompleted ? Date.now() : dailyState.completedDayAt,
  };

  await saveDailyHydrationState(nextDailyState, dateKey);
  await queueCompletionReward({
    title: `${slot.charAt(0).toUpperCase() + slot.slice(1)} slot completed`,
    coins: 25,
  });
  let nextWallet = await getWallet();

  let nextStreak = streak;
  if (dailyBonusEarned) {
    await queueCompletionReward({
      title: 'Daily completion bonus',
      coins: dailyBonusEarned,
    });
    nextWallet = await getWallet();
    nextStreak = await applyDailyCompletionStreak(dateKey);
  }

  return {
    completed: true,
    dailyState: nextDailyState,
    wallet: nextWallet,
    streak: nextStreak,
    coinsEarned: 25,
    dailyBonusEarned,
  };
};
