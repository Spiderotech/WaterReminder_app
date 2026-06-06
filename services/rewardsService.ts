import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendRequest, getBackendUserId, refreshBackendWallet } from './backendAuthService';
import { appendRewardLedgerEntry, getRewardLedger, RewardLedgerEntry } from './rewardLedgerService';
import { getStreak, StreakState } from './streakService';
import { addWalletBalance, getWallet, saveWallet, Wallet } from './walletService';
import { V2_KEYS, getLocalDateKey } from './v2Storage';

export type SpinRewardId = 'coins-random' | 'coins-5' | 'coins-10' | 'coins-15' | 'coins-25' | 'extra-spin' | 'hydration';

export type SpinPrize = {
  id: SpinRewardId;
  title: string;
  label: string;
  coins?: number;
  extraSpins?: number;
};

export type SpinState = {
  freeSpinUsed: boolean;
  extraSpinCount: number;
  earnedSpinCredits?: number;
  extraSpinAdUsed?: boolean;
  lastResult?: {
    prizeId: SpinRewardId;
    label: string;
    coins?: number;
    createdAt: number;
  };
};

export type AdRewardState = {
  claimedCount: number;
  limit: number;
};

export type MilestoneRewardId = 'milestone-25' | 'milestone-50' | 'milestone-75' | 'milestone-100';

export type StaticClaimableRewardId = 'daily' | 'competition' | 'voucher' | MilestoneRewardId;

export type PendingRewardSource = 'spin' | 'ad' | 'completion';

export type PendingClaimReward = {
  id: string;
  title: string;
  coins: number;
  source: PendingRewardSource;
  createdAt: number;
};

export type ClaimableRewardId = StaticClaimableRewardId | string;

export type ClaimState = {
  claimedIds: string[];
  pendingRewards: PendingClaimReward[];
};

export type RewardsSnapshot = {
  wallet: Wallet;
  streak: StreakState;
  spinState: SpinState;
  adState: AdRewardState;
  claimState: ClaimState;
  lifetimeClaimState: ClaimState;
  history: RewardLedgerEntry[];
  purchaseHistory: CoinPurchaseHistoryItem[];
};

export type SpinMode = 'free' | 'extra';

export type CoinPackId = 'starter' | 'value' | 'mega';
export type IapProductId = 'coins_500' | 'coins_1500' | 'coins_3000';

export type CoinPurchaseHistoryItem = {
  _id: string;
  platform: 'ios' | 'android';
  productId: IapProductId;
  transactionId?: string | null;
  orderId?: string | null;
  coins: number;
  status: 'verified' | 'failed';
  providerEnvironment: 'sandbox' | 'production';
  verifiedAt: string;
  createdAt: string;
};

const adRewardLimit = 5;
export const diamondConversionCost = 500;

export const spinPrizeTable: SpinPrize[] = [
  { id: 'coins-random', title: 'Free spin reward', label: '5 - 25 Coins', coins: 5 },
  { id: 'coins-random', title: 'Free spin reward', label: '5 - 25 Coins', coins: 5 },
  { id: 'coins-random', title: 'Free spin reward', label: '5 - 25 Coins', coins: 5 },
  { id: 'coins-random', title: 'Free spin reward', label: '5 - 25 Coins', coins: 5 },
  { id: 'extra-spin', title: 'Bonus spin reward', label: '+1 Spin', extraSpins: 1 },
  { id: 'extra-spin', title: 'Bonus spin reward', label: '+1 Spin', extraSpins: 1 },
];

const defaultSpinState: SpinState = {
  freeSpinUsed: false,
  extraSpinCount: 0,
  earnedSpinCredits: 0,
  extraSpinAdUsed: false,
};

const defaultAdRewardState: AdRewardState = {
  claimedCount: 0,
  limit: adRewardLimit,
};

const defaultClaimState: ClaimState = {
  claimedIds: [],
  pendingRewards: [],
};

const claimRewardValues: Record<StaticClaimableRewardId, { title: string; coins: number }> = {
  daily: { title: 'Daily bonus claimed', coins: 10 },
  competition: { title: 'Competition reward claimed', coins: 50 },
  voucher: { title: 'Voucher reward claimed', coins: 20 },
  'milestone-25': { title: '25 day streak milestone claimed', coins: 100 },
  'milestone-50': { title: '50 day streak milestone claimed', coins: 250 },
  'milestone-75': { title: '75 day streak milestone claimed', coins: 500 },
  'milestone-100': { title: '100 day streak milestone claimed', coins: 1000 },
};

const coinPackValues: Record<CoinPackId, { title: string; coins: number; price: string }> = {
  starter: { title: 'Starter coin pack', coins: 500, price: 'store price' },
  value: { title: 'Value coin pack', coins: 1500, price: 'store price' },
  mega: { title: 'Mega coin pack', coins: 3000, price: 'store price' },
};

export const coinPackProductIds: Record<CoinPackId, IapProductId> = {
  starter: 'coins_500',
  value: 'coins_1500',
  mega: 'coins_3000',
};

const productIdToPackId = Object.entries(coinPackProductIds).reduce((acc, [packId, productId]) => {
  acc[productId] = packId as CoinPackId;
  return acc;
}, {} as Record<IapProductId, CoinPackId>);

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  const stored = await AsyncStorage.getItem(key);
  return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
};

const writeJson = async <T>(key: string, value: T) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
  return value;
};

export const getSpinState = async (dateKey = getLocalDateKey()): Promise<SpinState> =>
  readJson(V2_KEYS.rewardSpin(dateKey), defaultSpinState);

export const saveSpinState = async (state: SpinState, dateKey = getLocalDateKey()) =>
  writeJson(V2_KEYS.rewardSpin(dateKey), state);

export const getAdRewardState = async (dateKey = getLocalDateKey()): Promise<AdRewardState> =>
  readJson(V2_KEYS.rewardAds(dateKey), defaultAdRewardState);

export const saveAdRewardState = async (state: AdRewardState, dateKey = getLocalDateKey()) =>
  writeJson(V2_KEYS.rewardAds(dateKey), state);

export const getClaimState = async (dateKey = getLocalDateKey()): Promise<ClaimState> =>
  readJson(V2_KEYS.rewardClaims(dateKey), defaultClaimState);

export const saveClaimState = async (state: ClaimState, dateKey = getLocalDateKey()) =>
  writeJson(V2_KEYS.rewardClaims(dateKey), state);

export const getLifetimeClaimState = async (): Promise<ClaimState> =>
  readJson(V2_KEYS.lifetimeRewardClaims, defaultClaimState);

export const saveLifetimeClaimState = async (state: ClaimState) =>
  writeJson(V2_KEYS.lifetimeRewardClaims, state);

export const getRewardsSnapshot = async (): Promise<RewardsSnapshot> => {
  const [wallet, backendWallet, streak, spinState, adState, claimState, lifetimeClaimState, history, purchaseHistory] = await Promise.all([
    getWallet(),
    refreshBackendWallet().catch(() => null),
    getStreak(),
    getSpinState(),
    getAdRewardState(),
    getClaimState(),
    getLifetimeClaimState(),
    getRewardLedger(),
    getCoinPurchaseHistory().catch(() => []),
  ]);

  return {
    wallet: backendWallet || wallet,
    streak,
    spinState,
    adState,
    claimState,
    lifetimeClaimState,
    history,
    purchaseHistory,
  };
};

export const getCoinPurchaseHistory = async (): Promise<CoinPurchaseHistoryItem[]> => {
  const backendUserId = await getBackendUserId();
  if (!backendUserId) return [];

  const data = await backendRequest(`/wallet/iap/history?userId=${encodeURIComponent(backendUserId)}`);
  return data.purchases || [];
};

export const getSpinPrizeById = (prizeId?: SpinRewardId) =>
  spinPrizeTable.find(item => item.id === prizeId) || spinPrizeTable[1];

const randomCoinReward = () => Math.floor(Math.random() * 21) + 5;

const pickSpinPrize = (): SpinPrize => {
  const prize = spinPrizeTable[Math.floor(Math.random() * spinPrizeTable.length)];
  if (prize.id !== 'coins-random') {
    return prize;
  }

  const coins = randomCoinReward();
  return {
    ...prize,
    coins,
    label: `+${coins} Coins`,
  };
};

const addPendingReward = async ({
  title,
  coins,
  source,
}: {
  title: string;
  coins: number;
  source: PendingRewardSource;
}) => {
  const claimState = await getClaimState();
  const pendingReward: PendingClaimReward = {
    id: `${source}:${Date.now()}`,
    title,
    coins,
    source,
    createdAt: Date.now(),
  };
  const nextClaimState: ClaimState = {
    ...claimState,
    pendingRewards: [pendingReward, ...(claimState.pendingRewards || [])],
  };

  await saveClaimState(nextClaimState);
  return {
    pendingReward,
    claimState: nextClaimState,
  };
};

export const performSpin = async (mode: SpinMode) => {
  const spinState = await getSpinState();

  if (mode === 'free' && spinState.freeSpinUsed) {
    throw new Error('Your free spin is already used today.');
  }

  const earnedSpinCredits = spinState.earnedSpinCredits || 0;

  if (mode === 'extra' && earnedSpinCredits <= 0) {
    throw new Error('Watch an ad to unlock an extra spin first.');
  }

  const prize = pickSpinPrize();
  const now = Date.now();
  const nextSpinState: SpinState = {
    freeSpinUsed: mode === 'free' ? true : spinState.freeSpinUsed,
    extraSpinCount: mode === 'extra' ? spinState.extraSpinCount + 1 : spinState.extraSpinCount,
    earnedSpinCredits:
      Math.max(earnedSpinCredits - (mode === 'extra' ? 1 : 0), 0) +
      (prize.extraSpins || 0),
    lastResult: {
      prizeId: prize.id,
      label: prize.label,
      coins: prize.coins,
      createdAt: now,
    },
  };

  await saveSpinState(nextSpinState);

  const claimResult = prize.coins
    ? await addPendingReward({
        title: prize.title,
        coins: prize.coins,
        source: 'spin',
      })
    : undefined;

  return {
    prize,
    spinState: nextSpinState,
    claimState: claimResult?.claimState,
  };
};

export const unlockExtraSpinWithAd = async () => {
  const spinState = await getSpinState();
  const earnedSpinCredits = spinState.earnedSpinCredits || 0;

  if (spinState.extraSpinAdUsed) {
    throw new Error('Your ad extra spin is already unlocked today.');
  }

  const nextSpinState: SpinState = {
    ...spinState,
    earnedSpinCredits: earnedSpinCredits + 1,
    extraSpinAdUsed: true,
  };

  await saveSpinState(nextSpinState);
  return nextSpinState;
};

export const claimAdReward = async () => {
  const adState = await getAdRewardState();

  if (adState.claimedCount >= adRewardLimit) {
    throw new Error('You have used all ad rewards for today.');
  }

  const nextAdState: AdRewardState = {
    claimedCount: adState.claimedCount + 1,
    limit: adRewardLimit,
  };

  await saveAdRewardState(nextAdState);
  const claimResult = await addPendingReward({
    title: 'Watch ad reward',
    coins: 15,
    source: 'ad',
  });

  return {
    adState: nextAdState,
    claimState: claimResult.claimState,
  };
};

export const queueCompletionReward = async ({ title, coins }: { title: string; coins: number }) =>
  addPendingReward({
    title,
    coins,
    source: 'completion',
  });

const isMilestoneReward = (rewardId: ClaimableRewardId): rewardId is MilestoneRewardId =>
  rewardId === 'milestone-25' ||
  rewardId === 'milestone-50' ||
  rewardId === 'milestone-75' ||
  rewardId === 'milestone-100';

const getBackendClaimRewardType = (rewardId: ClaimableRewardId, pendingReward?: PendingClaimReward) => {
  if (pendingReward?.source === 'spin') return 'spin_reward';
  if (pendingReward?.source === 'ad') return 'ad_reward';
  if (pendingReward?.source === 'completion') return 'slot_completion';
  if (rewardId === 'daily') return 'daily_bonus';
  if (rewardId === 'competition') return 'competition_reward';
  return 'manual_adjustment';
};

export const claimReward = async (rewardId: ClaimableRewardId) => {
  const usesLifetimeClaimState = isMilestoneReward(rewardId);
  const claimState = usesLifetimeClaimState ? await getLifetimeClaimState() : await getClaimState();

  if (claimState.claimedIds.includes(rewardId)) {
    throw new Error(usesLifetimeClaimState ? 'This milestone reward is already claimed.' : 'This reward is already claimed today.');
  }

  const pendingReward = (claimState.pendingRewards || []).find(reward => reward.id === rewardId);
  const staticReward = claimRewardValues[rewardId as StaticClaimableRewardId];
  const reward = pendingReward || staticReward;

  if (!reward) {
    throw new Error('Reward is not available.');
  }

  const backendUserId = await getBackendUserId();
  let wallet: Wallet;
  let backendReward: unknown = null;

  if (backendUserId) {
    const data = await backendRequest('/wallet/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({
        userId: backendUserId,
        coins: reward.coins,
        title: reward.title,
        rewardType: getBackendClaimRewardType(rewardId, pendingReward),
        idempotencyKey: `mobile_claim:${backendUserId}:${rewardId}:${usesLifetimeClaimState ? 'lifetime' : getLocalDateKey()}`,
        metadata: {
          rewardId,
          source: pendingReward?.source || 'static',
        },
      }),
    });

    wallet = data.wallet;
    backendReward = data.reward;
    if (wallet) {
      await saveWallet(wallet);
    }
  } else {
    wallet = await addWalletBalance({ coins: reward.coins });
  }

  const entry = await appendRewardLedgerEntry({
    type: pendingReward?.source === 'spin'
      ? 'spin_reward'
      : pendingReward?.source === 'ad'
        ? 'ad_reward'
        : rewardId === 'competition'
          ? 'competition_reward'
          : isMilestoneReward(rewardId)
            ? 'claim_reward'
          : 'claim_reward',
    title: reward.title,
    coins: reward.coins,
  });
  const nextClaimState: ClaimState = {
    claimedIds: [...claimState.claimedIds, rewardId],
    pendingRewards: (claimState.pendingRewards || []).filter(item => item.id !== rewardId),
  };

  if (usesLifetimeClaimState) {
    await saveLifetimeClaimState(nextClaimState);
  } else {
    await saveClaimState(nextClaimState);
  }

  return {
    wallet,
    claimState: nextClaimState,
    entry,
    backendReward,
  };
};

export const purchaseCoinPack = async (packId: CoinPackId, backendUserId?: string) => {
  const pack = coinPackValues[packId];

  if (backendUserId) {
    const data = await backendRequest('/wallet/coin-packs/purchase', {
      method: 'POST',
      body: JSON.stringify({
        userId: backendUserId,
        packId,
        idempotencyKey: `coin_pack:${backendUserId}:${packId}:${Date.now()}`,
      }),
    });

    if (data.wallet) {
      await saveWallet(data.wallet);
    }

    const entry = await appendRewardLedgerEntry({
      type: 'purchase',
      title: `${pack.title} (${pack.price})`,
      coins: pack.coins,
    });

    return {
      wallet: data.wallet,
      entry,
      backendReward: data.reward,
    };
  }

  const wallet = await addWalletBalance({ coins: pack.coins });
  const entry = await appendRewardLedgerEntry({
    type: 'purchase',
    title: `${pack.title} (${pack.price})`,
    coins: pack.coins,
  });

  return {
    wallet,
    entry,
  };
};

export const verifyIapCoinPurchase = async (input: {
  backendUserId: string;
  platform: 'ios' | 'android';
  productId: IapProductId;
  transactionId?: string | null;
  purchaseToken?: string | null;
  packageName?: string | null;
}) => {
  const packId = productIdToPackId[input.productId];
  const pack = coinPackValues[packId];
  const data = await backendRequest('/wallet/iap/verify', {
    method: 'POST',
    body: JSON.stringify({
      userId: input.backendUserId,
      platform: input.platform,
      productId: input.productId,
      transactionId: input.transactionId || undefined,
      purchaseToken: input.purchaseToken || undefined,
      packageName: input.packageName || undefined,
    }),
  });

  if (data.wallet) {
    await saveWallet(data.wallet);
  }

  const entry = data.alreadyClaimed ? null : await appendRewardLedgerEntry({
    type: 'purchase',
    title: `${pack.title} (${pack.price})`,
    coins: pack.coins,
  });

  return {
    wallet: data.wallet,
    entry,
    backendReward: data.reward,
    transaction: data.transaction,
    alreadyClaimed: Boolean(data.alreadyClaimed),
  };
};

export const convertCoinsToDiamond = async (backendUserId?: string) => {
  if (backendUserId) {
    const data = await backendRequest('/wallet/convert/diamond', {
      method: 'POST',
      body: JSON.stringify({
        userId: backendUserId,
        idempotencyKey: `coin_convert:${backendUserId}:${Date.now()}`,
      }),
    });

    if (data.wallet) {
      await saveWallet(data.wallet);
    }

    const entry = await appendRewardLedgerEntry({
      type: 'conversion',
      title: 'Coin to diamond conversion',
      coins: -diamondConversionCost,
      diamonds: 1,
    });

    return {
      wallet: data.wallet,
      entry,
      backendReward: data.reward,
    };
  }

  const wallet = await getWallet();

  if (wallet.coins < diamondConversionCost) {
    throw new Error('Not enough coins to convert.');
  }

  const nextWallet = await saveWallet({
    ...wallet,
    coins: wallet.coins - diamondConversionCost,
    diamonds: wallet.diamonds + 1,
  });
  const entry = await appendRewardLedgerEntry({
    type: 'conversion',
    title: 'Coin to diamond conversion',
    coins: -diamondConversionCost,
    diamonds: 1,
  });

  return {
    wallet: nextWallet,
    entry,
  };
};
