import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayTotalIntake } from '../utils/waterIntakeUtils';
import { backendRequest, getBackendUserId } from './backendAuthService';
import { ensureGoogleBackendUser } from './googleAuthService';
import { getDailyHydrationState } from './hydrationService';
import { getLocalDateKey, slotOrder } from './v2Storage';
import { saveWallet, Wallet } from './walletService';

const ACTIVE_COMPETITION_ID = 'weekly-hydration-challenge';

export type CompetitionJoinState = {
  hasCompetition?: boolean;
  joined: boolean;
  competitionId: string;
  joinedAt?: number;
  title?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  participants?: number;
  entryFeeDiamonds?: number;
};

export type CompetitionJoinResult = {
  state: CompetitionJoinState;
  wallet?: Wallet;
};

type BackendCompetition = {
  _id?: string;
  title?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  participants?: number;
  entryFeeDiamonds?: number;
};

export type CompetitionScheduleStatus = {
  label: string;
  statLabel: string;
  tone: 'scheduled' | 'active' | 'ended' | 'draft';
  isJoinOpen: boolean;
};

export const getCompetitionScheduleStatus = (competition?: {
  hasCompetition?: boolean;
  status?: string;
  startDate?: string;
  endDate?: string;
} | null): CompetitionScheduleStatus => {
  if (competition?.hasCompetition === false) {
    return { label: 'Challenge coming soon', statLabel: 'None', tone: 'draft', isJoinOpen: false };
  }

  const now = Date.now();
  const startTime = competition?.startDate ? new Date(competition.startDate).getTime() : Number.NaN;
  const endTime = competition?.endDate ? new Date(competition.endDate).getTime() : Number.NaN;
  const status = (competition?.status || '').toLowerCase();

  if (status === 'closed' || (!Number.isNaN(endTime) && endTime <= now)) {
    return { label: 'ENDED', statLabel: 'Ended', tone: 'ended', isJoinOpen: false };
  }

  if (status === 'scheduled' || (!Number.isNaN(startTime) && startTime > now)) {
    return { label: 'SCHEDULED', statLabel: 'Scheduled', tone: 'scheduled', isJoinOpen: true };
  }

  if (status === 'active' || (!Number.isNaN(startTime) && !Number.isNaN(endTime) && startTime <= now && endTime > now)) {
    return { label: 'ACTIVE NOW', statLabel: 'Active', tone: 'active', isJoinOpen: true };
  }

  return { label: 'DRAFT', statLabel: 'Draft', tone: 'draft', isJoinOpen: false };
};

export type PastCompetitionRow = {
  competition: BackendCompetition & {
    status?: string;
  };
  currentUser: {
    entryId: string;
    rank: number | null;
    tapScore: number;
    completedSlotCount: number;
    joinedAt?: string;
    rewardClaimed?: boolean;
  } | null;
};

export type CompetitionLeaderboardRow = {
  entryId: string;
  userId: string;
  username: string;
  profilePictureUrl?: string | null;
  avatar?: string | null;
  country?: string | null;
  diamonds?: number;
  rank: number;
  tapScore: number;
  completedSlotCount: number;
  streak: number;
  lastCompletionAt?: string | null;
  joinedAt?: string;
};

export type CompetitionLeaderboardState = {
  competition: BackendCompetition | null;
  leaderboard: CompetitionLeaderboardRow[];
  currentUser: CompetitionLeaderboardRow | null;
  leaderboardGeneratedAt?: string | null;
};

const joinedCompetitionKey = (competitionId: string) => `v2:competitionJoined:${competitionId}`;

const saveJoinState = async (state: CompetitionJoinState) => {
  await AsyncStorage.setItem(joinedCompetitionKey(state.competitionId), JSON.stringify(state));
  return state;
};

export const getActiveCompetition = async () => {
  const data = await backendRequest('/competitions/active');
  return data.competition;
};

export const getCompetitionJoinState = async (): Promise<CompetitionJoinState> => {
  try {
    const competition: BackendCompetition | null = await getActiveCompetition();
    if (!competition?._id) {
      return {
        hasCompetition: false,
        joined: false,
        competitionId: ACTIVE_COMPETITION_ID,
      };
    }

    const competitionId = competition?._id ? String(competition._id) : ACTIVE_COMPETITION_ID;
    const stored = await AsyncStorage.getItem(joinedCompetitionKey(competitionId));
    const storedState = stored ? JSON.parse(stored) : {};

    return {
      hasCompetition: true,
      joined: Boolean(storedState.joined),
      joinedAt: storedState.joinedAt,
      competitionId,
      title: competition?.title,
      description: competition?.description,
      status: competition?.status,
      startDate: competition?.startDate,
      endDate: competition?.endDate,
      participants: competition?.participants,
      entryFeeDiamonds: competition?.entryFeeDiamonds,
    };
  } catch {
    const stored = await AsyncStorage.getItem(joinedCompetitionKey(ACTIVE_COMPETITION_ID));
    return stored ? JSON.parse(stored) : { joined: false, competitionId: ACTIVE_COMPETITION_ID };
  }
};

export const joinActiveCompetition = async () => {
  const userId = await ensureGoogleBackendUser();

  const currentState = await getCompetitionJoinState();
  if (!currentState.hasCompetition) {
    throw new Error('No weekly challenge is available right now.');
  }

  const walletData = await backendRequest(`/wallet?userId=${encodeURIComponent(userId)}`);
  if (walletData.wallet) {
    await saveWallet(walletData.wallet);
  }

  if (currentState.joined) {
    return {
      state: currentState,
      wallet: walletData.wallet,
    };
  }

  const entryFeeDiamonds = currentState.entryFeeDiamonds ?? 0;
  const backendDiamonds = walletData.wallet?.diamonds ?? 0;
  if (backendDiamonds < entryFeeDiamonds) {
    throw new Error(`You need ${entryFeeDiamonds} diamonds to join. Your backend wallet has ${backendDiamonds}.`);
  }

  const data = await backendRequest(`/competitions/${currentState.competitionId}/join`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      idempotencyKey: `competition_join:${currentState.competitionId}:${userId}`,
    }),
  });

  const nextWalletData = await backendRequest(`/wallet?userId=${encodeURIComponent(userId)}`);
  if (nextWalletData.wallet) {
    await saveWallet(nextWalletData.wallet);
  }

  const nextState: CompetitionJoinState = {
    joined: true,
    competitionId: currentState.competitionId,
    joinedAt: data.entry?.joinedAt ? new Date(data.entry.joinedAt).getTime() : Date.now(),
    title: currentState.title,
    description: currentState.description,
    startDate: currentState.startDate,
    endDate: currentState.endDate,
    status: currentState.status,
    participants: currentState.participants,
    entryFeeDiamonds: currentState.entryFeeDiamonds,
  };

  return {
    state: await saveJoinState(nextState),
    wallet: nextWalletData.wallet,
  };
};

export const syncActiveCompetitionScore = async () => {
  const userId = await getBackendUserId();
  if (!userId) return null;

  const currentState = await getCompetitionJoinState();
  if (!currentState.hasCompetition || !currentState.joined) return null;
  if (getCompetitionScheduleStatus(currentState).tone !== 'active') return null;

  const [dailyState, todayTotal] = await Promise.all([
    getDailyHydrationState(),
    getTodayTotalIntake(),
  ]);

  const completedSlotSet = new Set(dailyState.completedSlots);
  const completedSlotCount = slotOrder.filter(slot => completedSlotSet.has(slot)).length;
  const streakDay = slotOrder.every(slot => completedSlotSet.has(slot));

  const data = await backendRequest(`/competitions/${currentState.competitionId}/score`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      dateKey: getLocalDateKey(),
      waterMl: todayTotal,
      completedSlotCount,
      streakDay,
      lastCompletionAt: dailyState.completedDayAt ? new Date(dailyState.completedDayAt).toISOString() : new Date().toISOString(),
    }),
  });

  return data.entry;
};

export const getActiveCompetitionLeaderboard = async (limit = 50): Promise<CompetitionLeaderboardState> => {
  const competition = await getActiveCompetition();
  if (!competition?._id) {
    return {
      competition: null,
      leaderboard: [],
      currentUser: null,
      leaderboardGeneratedAt: null,
    };
  }

  const competitionId = competition?._id ? String(competition._id) : ACTIVE_COMPETITION_ID;
  const userId = await getBackendUserId();
  const query = new URLSearchParams({ limit: String(limit) });
  if (userId) query.set('userId', userId);

  const data = await backendRequest(`/competitions/${competitionId}/leaderboard?${query.toString()}`);

  return {
    competition: data.competition || competition || null,
    leaderboard: data.leaderboard || [],
    currentUser: data.currentUser || null,
    leaderboardGeneratedAt: data.leaderboardGeneratedAt,
  };
};

export const getPastCompetitions = async (limit = 10): Promise<PastCompetitionRow[]> => {
  const userId = await getBackendUserId();
  const query = new URLSearchParams({ limit: String(limit) });
  if (userId) query.set('userId', userId);

  const data = await backendRequest(`/competitions/history?${query.toString()}`);
  return data.competitions || [];
};
