import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from './waterIntakeUtils';

// Utility to format date string (YYYY-MM-DD)
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


// Utility to get week identifier (e.g., "2025-W27")
const getWeekKey = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber}`;
};

// Utility to get month identifier (e.g., "2025-07")
const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Fetch all logs from storage
const getAllLogs = async (): Promise<WaterLog[]> => {
  const json = await AsyncStorage.getItem('waterLogs');
  return json ? JSON.parse(json) : [];
};

export const generateDailyHistory = async () => {
  const logs = await getAllLogs();
  const dailyTotals: { [date: string]: number } = {};

  logs.forEach((log) => {
    const date = formatDate(log.timestamp);
    dailyTotals[date] = (dailyTotals[date] || 0) + log.amount;
  });

  return Object.entries(dailyTotals).map(([date, total]) => ({
    date,
    total,
  }));
};

export const generateWeeklyHistory = async () => {
  const logs = await getAllLogs();
  const weeklyTotals: { [week: string]: number } = {};

  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    const weekKey = getWeekKey(date);
    weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + log.amount;
  });

  return Object.entries(weeklyTotals).map(([week, total]) => ({
    week,
    total,
  }));
};

export const generateMonthlyHistory = async () => {
  const logs = await getAllLogs();
  const monthlyTotals: { [month: string]: number } = {};

  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    const monthKey = getMonthKey(date);
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + log.amount;
  });

  return Object.entries(monthlyTotals).map(([month, total]) => ({
    month,
    total,
  }));
};
