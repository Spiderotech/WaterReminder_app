import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  gender: string;
  height: number;
  weight: number;
  age: number;
  wakeTime: string;    // format: HH:mm
  sleepTime: string;   // format: HH:mm
  activityLevel: string;
  climate: string;
}

const USER_PROFILE_KEY = 'userProfile';

/**
 * Convert a string (12h or 24h) or Date object to HH:mm 24-hour format.
 */
const toHHMM = (value: string | Date): string => {
  let date: Date;

  if (typeof value === 'string') {
    // Try parsing time string (supports 12h or 24h)
    const parsed = Date.parse(`1970-01-01T${value}`);
    if (!isNaN(parsed)) {
      date = new Date(parsed);
    } else {
      // Fallback: return unchanged if invalid
      return value;
    }
  } else {
    date = value;
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Save full user profile
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const json = await AsyncStorage.getItem(USER_PROFILE_KEY);
  return json ? JSON.parse(json) : null;
};

/**
 * Update user profile with partial values
 */
export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const current = await getUserProfile();

  const formattedUpdates: Partial<UserProfile> = {
    ...updates,
    wakeTime: updates.wakeTime ? toHHMM(updates.wakeTime) : current?.wakeTime,
    sleepTime: updates.sleepTime ? toHHMM(updates.sleepTime) : current?.sleepTime,
  };

  const updated: UserProfile = {
    ...current!,
    ...formattedUpdates,
  };

  await saveUserProfile(updated);
  return updated;
};

export const getHydrationGoal = async (): Promise<number> => {
  const stored = await AsyncStorage.getItem('hydrationGoal');
  return stored ? parseInt(stored) : 2500; 
};
