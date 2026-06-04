import AsyncStorage from '@react-native-async-storage/async-storage';
import { SlotKey, V2_KEYS, getLocalDateKey } from './v2Storage';

export type RewardLedgerType =
  | 'slot_completed'
  | 'daily_bonus'
  | 'spin_reward'
  | 'ad_reward'
  | 'competition_reward'
  | 'claim_reward'
  | 'purchase'
  | 'conversion';

export type RewardLedgerEntry = {
  id: string;
  type: RewardLedgerType;
  title: string;
  coins?: number;
  diamonds?: number;
  slot?: SlotKey;
  createdAt: number;
  dateKey: string;
  source: 'local' | 'backend';
  synced?: boolean;
};

export const getRewardLedger = async (): Promise<RewardLedgerEntry[]> => {
  const stored = await AsyncStorage.getItem(V2_KEYS.rewardLedger);
  return stored ? JSON.parse(stored) : [];
};

export const saveRewardLedger = async (entries: RewardLedgerEntry[]) => {
  await AsyncStorage.setItem(V2_KEYS.rewardLedger, JSON.stringify(entries));
  return entries;
};

export const appendRewardLedgerEntry = async (
  entry: Omit<RewardLedgerEntry, 'id' | 'createdAt' | 'dateKey' | 'source' | 'synced'>,
) => {
  const now = Date.now();
  const entries = await getRewardLedger();
  const nextEntry: RewardLedgerEntry = {
    ...entry,
    id: `${entry.type}:${entry.slot || 'general'}:${now}`,
    createdAt: now,
    dateKey: getLocalDateKey(new Date(now)),
    source: 'local',
    synced: false,
  };
  const nextEntries = [nextEntry, ...entries];

  await saveRewardLedger(nextEntries);
  return nextEntry;
};
