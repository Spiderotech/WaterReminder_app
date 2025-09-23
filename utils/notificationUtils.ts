import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { getReminders, Reminder } from './reminderUtils';
import {
  checkPermission as checkExactAlarmPermission,
  getPermission as requestExactAlarmPermission,
} from 'react-native-schedule-exact-alarm-permission';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayTotalIntake } from './waterIntakeUtils';

let scheduledNotificationIds: string[] = [];

const WATER_INTAKE_KEY = 'dailyWaterIntake';
const WATER_GOAL_KEY = 'hydrationGoal';

export async function requestNotificationPermission() {
  // 1. Android 13+ POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn('❌ POST_NOTIFICATIONS permission denied.');
      return;
    }
  }

  // 2. Notifee permission (iOS & Android fallback)
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    console.warn('❌ Notification permission not granted');
    return;
  }

  console.log('✅ Notification permission granted');

  // 3. Android 12+ exact alarm permission (API 31+)
  // if (Platform.OS === 'android' && Platform.Version >= 31) {
  //   const exactAlarmGranted = await checkExactAlarmPermission();

  //   if (!exactAlarmGranted) {
  //     console.warn('⚠️ SCHEDULE_EXACT_ALARM not granted. Prompting user...');
  //     Alert.alert(
  //       'Enable Exact Alarms',
  //       'To get exact hydration reminders, please enable "Schedule exact alarms" in system settings.',
  //       [
  //         {
  //           text: 'Open Settings',
  //           onPress: () => requestExactAlarmPermission(),
  //         },
  //         { text: 'Cancel', style: 'cancel' },
  //       ]
  //     );
  //     return;
  //   }

  //   console.log('✅ SCHEDULE_EXACT_ALARM permission granted');
  // }
}

export async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'hydration-reminder-channel',
    name: 'Hydration Reminders',
    importance: 4,
    sound: 'notification', // ensure this exists in res/raw as notification.mp3 or .wav
  });
}

export async function cancelAllHydrationReminders() {
  await notifee.cancelAllNotifications();
  console.log('🚫 All hydration reminders canceled');
}

const getLocalDateString = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
};

// Cancel only today’s notifications
async function cancelTodaysNotifications() {
  const notifications = await notifee.getTriggerNotifications();
  const todayStr = getLocalDateString(Date.now());

  for (const notif of notifications) {
    const trigger = notif.notification?.trigger as any;
    if (trigger?.type === 'timestamp' && trigger.timestamp) {
      if (getLocalDateString(trigger.timestamp) === todayStr) {
        await notifee.cancelNotification(notif.id);
        console.log(`🚫 Canceled today’s notification: ${notif.id}`);
        
      }
    }
  }
}

export async function scheduleRemindersIfGoalNotReached() {
  const totalIntake = await getTodayTotalIntake();
  const goalStr = await AsyncStorage.getItem('hydrationGoal');
  const goal = goalStr ? parseInt(goalStr) : 0;

  if (totalIntake >= goal) {
    console.log('💧 Daily goal reached, canceling reminders');
    await cancelTodaysNotifications();
    return;
  }

  // Goal not reached → schedule reminders
  const reminders = await getReminders();
  await scheduleReminderNotifications(reminders);
}

export async function scheduleReminderNotifications(reminders: Reminder[]) {
  await cancelAllHydrationReminders(); 
  scheduledNotificationIds = [];

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    const [hourStr, minuteStr, secondStr = '0'] = reminder.time.split(':');
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const second = parseInt(secondStr);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, second, 0);

    // If already passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: true,
    };

    await notifee.createTriggerNotification(
      {
        id: reminder.id,
        title: '💧 Time to Hydrate!',
        body: 'Drink a glass of water and stay fresh!',
        android: {
          channelId: 'hydration-reminder-channel',
          smallIcon: 'ic_launcher',
          sound: 'notification', 
          pressAction: { id: 'default' },
        },
        ios: {
      sound: 'notification.wav', 
    },
      },
      trigger
    );

    scheduledNotificationIds.push(reminder.id);
    console.log(`✅ Scheduled reminder at ${reminder.time} → ${triggerDate.toLocaleString()}`);
  }

  console.log(`📌 Total reminders scheduled: ${scheduledNotificationIds.length}`);
}

export async function testInstantNotification() {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 10000,
    alarmManager: true,
  };

  await notifee.createTriggerNotification(
    {
      title: '🚀 Test Notification',
      body: 'This is a test notification 10 seconds from now.',
      android: {
        channelId: 'hydration-reminder-channel',
        smallIcon: 'ic_launcher',
        sound: 'notification',
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
}
