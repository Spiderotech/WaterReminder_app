import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { getReminders, Reminder } from './reminderUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayTotalIntake } from './waterIntakeUtils';
import { getUnshownBackendNotifications, markBackendNotificationsShown } from '../services/notificationFeedService';

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


}

export async function checkNotificationEnabled() {
  if (Platform.OS === 'android' && Platform.Version < 33) {
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        'Enable Notifications',
        'Notifications are turned off for this app. Please enable them in settings for reminders to work properly.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel' }
        ]
      );
    }
  }
}

export async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'hydration-reminder-channel',
    name: 'Hydration Reminders',
    importance: 4,
    sound: 'notification', // ensure this exists in res/raw as notification.mp3 or .wav
  });
  await notifee.createChannel({
    id: 'global-updates-channel',
    name: 'DoraDrink Updates',
    importance: 4,
    sound: 'notification',
  });
}

export async function cancelAllHydrationReminders() {
  await notifee.cancelAllNotifications();
  console.log('🚫 All hydration reminders canceled');
}



export async function scheduleRemindersIfGoalNotReached() {
  const reminders = await getReminders();
  await scheduleReminderNotifications(reminders);
}

const getLocalDateString = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
};

export async function scheduleReminderNotifications(reminders: Reminder[]) {
  await cancelAllHydrationReminders();
  scheduledNotificationIds = [];
  const slotReminders = reminders.filter(reminder => reminder.enabled).slice(0, 3);

  const todayStr = getLocalDateString(Date.now());
  const totalIntake = await getTodayTotalIntake();
  const goalStr = await AsyncStorage.getItem('hydrationGoal');
  const goal = goalStr ? parseInt(goalStr, 10) : 0;

  for (const reminder of slotReminders) {
    const [hourStr, minuteStr, secondStr = '0'] = reminder.time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const second = parseInt(secondStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, second, 0);

    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const notifId = `${reminder.id}_${getLocalDateString(triggerDate.getTime())}`;

    const bodyText =
      getLocalDateString(triggerDate.getTime()) === todayStr && totalIntake >= goal
        ? "🎉 Congratulations! You've reached your goal today!"
        : 'Drink a glass of water and stay fresh!';

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: true,
    };

    await notifee.createTriggerNotification(
      {
        id: notifId,
        title: '💧 Hydration Reminder',
        body: bodyText,
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

    scheduledNotificationIds.push(notifId);
    console.log(`✅ Scheduled reminder at ${reminder.time} → ${triggerDate.toLocaleString()} (ID: ${notifId})`);
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

export async function showUnseenBackendNotifications() {
  const notifications = await getUnshownBackendNotifications();
  if (!notifications.length) return;

  for (const notification of notifications.slice(0, 3)) {
    await notifee.displayNotification({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      android: {
        channelId: 'global-updates-channel',
        smallIcon: 'ic_launcher',
        sound: 'notification',
        pressAction: { id: 'default' },
      },
      ios: {
        sound: 'notification.wav',
      },
      data: {
        route: notification.route || '',
      },
    });
  }

  await markBackendNotificationsShown(notifications.map(notification => notification.id));
}
