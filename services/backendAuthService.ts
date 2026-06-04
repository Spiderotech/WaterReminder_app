import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getHydrationGoal, getUserProfile } from '../utils/userUtils';
import { saveWallet, Wallet } from './walletService';

const LAN_API_BASE_URL = 'http://192.168.1.2:4000/api';
const LOCALHOST_API_BASE_URL = 'http://localhost:4000/api';
const PRODUCTION_API_BASE_URL = 'https://api.doradrink.com/api';

export const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:4000/api',
      ios: LAN_API_BASE_URL,
      default: LOCALHOST_API_BASE_URL,
    })
  : PRODUCTION_API_BASE_URL;

const API_BASE_URL_CANDIDATES = __DEV__
  ? Platform.select({
      android: ['http://10.0.2.2:4000/api', LAN_API_BASE_URL],
      ios: [LAN_API_BASE_URL, LOCALHOST_API_BASE_URL],
      default: [LOCALHOST_API_BASE_URL],
    }) || [LOCALHOST_API_BASE_URL]
  : [PRODUCTION_API_BASE_URL];

const BACKEND_USER_ID_KEY = 'backendUserId';
const BACKEND_GUEST_ID_KEY = 'backendGuestId';
const BACKEND_AUTH_MODE_KEY = 'backendAuthMode';

type BackendUserResponse = {
  success: boolean;
  data?: {
    user: {
      _id: string;
      authMode?: 'guest' | 'firebase';
    };
    wallet?: Wallet;
  };
  error?: {
    message?: string;
  };
};

const createGuestId = () => `guest:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const buildProfilePayload = async () => {
  const [profile, hydrationGoal] = await Promise.all([
    getUserProfile(),
    getHydrationGoal(),
  ]);

  return {
    username: profile?.username,
    avatar: profile?.avatar,
    country: profile?.country,
    city: profile?.city,
    gender: profile?.gender,
    age: profile?.age,
    height: profile?.height,
    weight: profile?.weight,
    activityLevel: profile?.activityLevel,
    climate: profile?.climate,
    hydrationGoal,
    goalType: 'medium',
  };
};

export const getBackendUserId = () => AsyncStorage.getItem(BACKEND_USER_ID_KEY);
export const getBackendAuthMode = () => AsyncStorage.getItem(BACKEND_AUTH_MODE_KEY);

let pushTokenSyncInProgress: Promise<void> | null = null;

export const syncBackendPushToken = async () => {
  if (pushTokenSyncInProgress) return pushTokenSyncInProgress;

  pushTokenSyncInProgress = (async () => {
    try {
      const { registerPushToken } = require('./pushTokenService');
      await registerPushToken();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown push token sync error.';
      console.warn('[push] Backend user token sync failed:', message);
    } finally {
      pushTokenSyncInProgress = null;
    }
  })();

  return pushTokenSyncInProgress;
};

const scheduleBackendPushTokenSync = () => {
  setTimeout(() => {
    syncBackendPushToken();
  }, 0);
};

export const backendRequest = async (path: string, options: RequestInit = {}) => {
  let lastError: unknown = null;

  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || `Backend request failed: ${response.status}`);
      }

      return json.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Backend request failed.');
};

export const clearBackendUser = async () => {
  await AsyncStorage.multiRemove([BACKEND_USER_ID_KEY, BACKEND_AUTH_MODE_KEY]);
};

export const deleteBackendAccount = async () => {
  const userId = await getBackendUserId();
  if (!userId) return null;

  return backendRequest(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
};

const saveBackendSession = async (response: BackendUserResponse) => {
  const userId = response.data?.user?._id;

  if (!response.success || !userId) {
    throw new Error(response.error?.message || 'Unable to create backend user.');
  }

  await AsyncStorage.setItem(BACKEND_USER_ID_KEY, userId);
  await AsyncStorage.setItem(BACKEND_AUTH_MODE_KEY, response.data?.user.authMode || 'guest');

  if (response.data?.wallet) {
    await saveWallet(response.data.wallet);
  }

  scheduleBackendPushTokenSync();

  return userId;
};

export const ensureBackendGuestUser = async () => {
  const existingUserId = await getBackendUserId();
  if (existingUserId) return existingUserId;

  let guestId = await AsyncStorage.getItem(BACKEND_GUEST_ID_KEY);
  if (!guestId) {
    guestId = createGuestId();
    await AsyncStorage.setItem(BACKEND_GUEST_ID_KEY, guestId);
  }

  const profilePayload = await buildProfilePayload();

  const data = await backendRequest('/users/bootstrap', {
    method: 'POST',
    body: JSON.stringify({
      ...profilePayload,
      guestId,
      username: profilePayload.username || 'Dora User',
    }),
  });

  return saveBackendSession({ success: true, data });
};

export const bootstrapFirebaseUser = async (idToken: string) => {
  const profilePayload = await buildProfilePayload();

  const data = await backendRequest('/auth/firebase/bootstrap', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePayload),
  });

  return saveBackendSession({ success: true, data });
};

export const bootstrapGoogleUser = async (idToken: string) => {
  const profilePayload = await buildProfilePayload();

  const data = await backendRequest('/auth/google/bootstrap', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePayload),
  });

  return saveBackendSession({ success: true, data });
};

export const refreshBackendWallet = async () => {
  const userId = await getBackendUserId();
  if (!userId) return null;

  const data = await backendRequest(`/wallet?userId=${encodeURIComponent(userId)}`);
  if (data.wallet) {
    await saveWallet(data.wallet);
    return data.wallet as Wallet;
  }

  return null;
};
