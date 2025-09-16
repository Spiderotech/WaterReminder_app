import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WaterLog {
  id: string;
  amount: number;
  timestamp: number;
}

const WATER_LOG_KEY = 'waterLogs';

// 🧠 Get local date string in YYYY-MM-DD format (Timezone-safe)
const getLocalDateString = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-CA'); // e.g., "2025-07-15"
};

// ✅ Save all logs
const saveLogs = async (logs: WaterLog[]) => {
  await AsyncStorage.setItem(WATER_LOG_KEY, JSON.stringify(logs));
};

// ✅ Get all logs
export const getAllLogs = async (): Promise<WaterLog[]> => {
  const json = await AsyncStorage.getItem(WATER_LOG_KEY);
  return json ? JSON.parse(json) : [];
};

// ✅ Log a new intake
export const logWaterIntake = async (amount: number): Promise<WaterLog[]> => {
  const logs = await getAllLogs();
  const now = Date.now();

  const newLog: WaterLog = {
    id: now.toString(),
    amount,
    timestamp: now,
  };

  const updatedLogs = [...logs, newLog];
  await saveLogs(updatedLogs);
  return updatedLogs;
};

// ✅ Get logs only for today (local time)
export const getTodayLogs = async (): Promise<WaterLog[]> => {
  const logs = await getAllLogs();
  const today = getLocalDateString(Date.now());
  return logs.filter(log => getLocalDateString(log.timestamp) === today);
};

// ✅ Get total water intake for today
export const getTodayTotalIntake = async (): Promise<number> => {
  const todayLogs = await getTodayLogs();
  return todayLogs.reduce((sum, log) => sum + log.amount, 0);
};

// ✅ Delete a specific log
export const deleteWaterLog = async (id: string): Promise<WaterLog[]> => {
  const logs = await getAllLogs();
  const updated = logs.filter(log => log.id !== id);
  await saveLogs(updated);
  return updated;
};
