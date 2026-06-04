export const getLocalDateKey = (date = new Date()) => date.toLocaleDateString('en-CA');

export const V2_KEYS = {
  wallet: 'v2:wallet',
  streak: 'v2:streak',
  rewardLedger: 'v2:rewardLedger',
  dailyHydration: (dateKey = getLocalDateKey()) => `v2:dailyHydration:${dateKey}`,
  rewardSpin: (dateKey = getLocalDateKey()) => `v2:rewardSpin:${dateKey}`,
  rewardAds: (dateKey = getLocalDateKey()) => `v2:rewardAds:${dateKey}`,
  rewardClaims: (dateKey = getLocalDateKey()) => `v2:rewardClaims:${dateKey}`,
  lifetimeRewardClaims: 'v2:lifetimeRewardClaims',
};

export type SlotKey = 'morning' | 'afternoon' | 'evening';

export const slotOrder: SlotKey[] = ['morning', 'afternoon', 'evening'];

export const getActiveSlot = (date = new Date()): SlotKey => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};
