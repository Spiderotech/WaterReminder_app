import { getAllLogs } from './waterIntakeUtils';
import { getHydrationGoal } from './userUtils';

// Local timezone-safe formatter: YYYY-MM-DD
const formatLocalDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getWaterReportStats = async () => {
  const logs = await getAllLogs();
  const goal = await getHydrationGoal();

  const dailyMap: Record<string, number[]> = {};

  // ✅ Group water amounts by local date
  logs.forEach(log => {
    const dateStr = formatLocalDate(log.timestamp);
    if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
    dailyMap[dateStr].push(log.amount);
  });

  const dates = Object.keys(dailyMap).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const last7 = dates.slice(-7);
  const last30 = dates.slice(-30);

  const average = (list: number[]) =>
    list.reduce((a, b) => a + b, 0) / (list.length || 1);

  const weeklyAvg = average(
    last7.map(date => dailyMap[date].reduce((a, b) => a + b, 0))
  );

  const monthlyAvg = average(
    last30.map(date => dailyMap[date].reduce((a, b) => a + b, 0))
  );

  const completionRates = last7.map(date => {
    const total = dailyMap[date].reduce((a, b) => a + b, 0);
    return Math.min((total / goal) * 100, 100);
  });

  const drinkFreq = average(
    last7.map(date => dailyMap[date].length)
  );

  return {
    weeklyAvg: Math.round(weeklyAvg),
    monthlyAvg: Math.round(monthlyAvg),
    avgCompletion: Math.round(average(completionRates)),
    drinkFreq: drinkFreq.toFixed(1),
  };
};
