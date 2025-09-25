import { getTodayTotalIntake } from './waterIntakeUtils'; // your water log utils
import { scheduleReminderNotifications,cancelAllHydrationReminders } from './notificationUtils';
import { getReminders } from './reminderUtils'; // fetch user reminder settings
import AsyncStorage from '@react-native-async-storage/async-storage';


export const checkAndHandleHydrationGoal = async () => {
  const totalIntake = await getTodayTotalIntake();
  const goalStr = await AsyncStorage.getItem('hydrationGoal');
  const goal = goalStr ? parseInt(goalStr, 10) : 0;

  const reminders = await getReminders();

  if (totalIntake >= goal) {
    // ✅ Goal reached → cancel all today's reminders
    console.log('🎯 Daily hydration goal reached. Canceling reminders...');
    await cancelAllHydrationReminders();
  } else {
    // 🔄 Goal not reached → schedule reminders normally
    console.log('💧 Hydration goal not yet reached. Scheduling reminders...');
    await scheduleReminderNotifications(reminders);
  }
};
