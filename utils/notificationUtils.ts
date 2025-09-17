import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { Reminder } from './reminderUtils';
import {
  checkPermission as checkExactAlarmPermission,
  getPermission as requestExactAlarmPermission,
} from 'react-native-schedule-exact-alarm-permission';

let scheduledNotificationIds: string[] = [];

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
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const exactAlarmGranted = await checkExactAlarmPermission();

    if (!exactAlarmGranted) {
      console.warn('⚠️ SCHEDULE_EXACT_ALARM not granted. Prompting user...');
      Alert.alert(
        'Enable Exact Alarms',
        'To get exact hydration reminders, please enable "Schedule exact alarms" in system settings.',
        [
          {
            text: 'Open Settings',
            onPress: () => requestExactAlarmPermission(),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    console.log('✅ SCHEDULE_EXACT_ALARM permission granted');
  }
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

export async function scheduleReminderNotifications(reminders: Reminder[]) {
  await cancelAllHydrationReminders(); // Cancel before scheduling new ones
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
          sound: 'notification', // file must exist in res/raw as notification.mp3 or .wav
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
