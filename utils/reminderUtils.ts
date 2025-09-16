// utils/reminderUtils.ts (Updated logic)
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface Reminder {
  id: string;
  time: string; // HH:mm:ss
  enabled: boolean;
}

const REMINDER_KEY = 'waterReminders';

export const saveReminders = async (reminders: Reminder[]) => {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
};

export const getReminders = async (): Promise<Reminder[]> => {
  const json = await AsyncStorage.getItem(REMINDER_KEY);
  return json ? JSON.parse(json) : [];
};

export const addReminder = async (time: string) => {
  const reminders = await getReminders();
  const newReminder: Reminder = {
    id: Date.now().toString(),
    time,
    enabled: true,
  };
  const updated = [...reminders, newReminder];
  await saveReminders(updated);
  return updated;
};

export const deleteReminder = async (id: string) => {
  const reminders = await getReminders();
  const updated = reminders.filter((r) => r.id !== id);
  await saveReminders(updated);
  return updated;
};

export const updateReminder = async (id: string, changes: Partial<Reminder>) => {
  const reminders = await getReminders();
  const updated = reminders.map((r) => (r.id === id ? { ...r, ...changes } : r));
  await saveReminders(updated);
  return updated;
};

// Generate reminders based on hydration goal (e.g., 8 reminders/day)
export const generateReminders = (wakeTime: string, sleepTime: string, goal: number): Reminder[] => {
  const reminders: Reminder[] = [];

  const now = new Date();
  console.log(wakeTime, sleepTime, goal, '📌 INPUT');

  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);

  const start = new Date();
  start.setHours(wakeHour, wakeMinute, 0, 0);
  start.setTime(start.getTime() + 60 * 60 * 1000); // Start 1 hour after wake

  const end = new Date();
  end.setHours(sleepHour, sleepMinute, 0, 0);
  end.setTime(end.getTime() - 30 * 60 * 1000); // End 30 minutes before sleep

  // Cross midnight adjustment
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  // If it's already past sleep time today, schedule for tomorrow
  if (now > end) {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
  }

  const totalMs = end.getTime() - start.getTime();
  const MIN_INTERVAL_MS = 75 * 60 * 1000; // 75 minutes
  const maxReminders = Math.floor(totalMs / MIN_INTERVAL_MS);
  const safeReminderCount = Math.min(goal, maxReminders);

  console.log('⏳ Interval Minutes:', (totalMs / 60000).toFixed(2));
  console.log('✅ Max safe reminders:', maxReminders, '→ using', safeReminderCount);

  if (safeReminderCount <= 0) return [];

  const intervalMs = totalMs / safeReminderCount;

  for (let i = 0; i < safeReminderCount; i++) {
    const time = new Date(start.getTime() + i * intervalMs);
    if (time > now) {
      reminders.push({
        id: `${time.getHours()}${time.getMinutes()}${time.getSeconds()}`,
        time: time.toTimeString().split(' ')[0],
        enabled: true,
      });
    }
  }

  console.log('🔔 Final Reminders Generated:', reminders.length);
  return reminders;
};

