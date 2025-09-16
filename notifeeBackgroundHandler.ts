// notifeeBackgroundHandler.ts
import notifee, { EventType } from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS && pressAction?.id === 'default') {
    console.log('🔁 Notification action pressed in background:', notification?.id);
  } else if (type === EventType.DISMISSED) {
    console.log('🗑️ Notification dismissed in background:', notification?.id);
  }
});
