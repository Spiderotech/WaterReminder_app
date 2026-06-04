/**
 * @format
 */
import { AppRegistry, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

AppRegistry.registerComponent(appName, () => App);

(async () => {
  try {
    const { displayRemotePushNotification, ensureFirebaseApp } = require('./services/pushTokenService');
    await ensureFirebaseApp();

    const messaging = require('@react-native-firebase/messaging');
    const messagingInstance = messaging.getMessaging ? messaging.getMessaging() : messaging.default();
    const setBackgroundMessageHandler = messaging.setBackgroundMessageHandler
      ? messaging.setBackgroundMessageHandler
      : messagingInstance.setBackgroundMessageHandler?.bind(messagingInstance);

    setBackgroundMessageHandler?.(async remoteMessage => {
      await displayRemotePushNotification(remoteMessage);
    });
  } catch {
    // Firebase Messaging is optional during local setup.
  }
})();

try {
  const notifeeModule = require('@notifee/react-native');
  const notifee = notifeeModule.default || notifeeModule;
  const { EventType } = notifeeModule;

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    if (type === EventType.ACTION_PRESS && pressAction?.id === 'mark-as-read') {
      await notifee.cancelNotification(notification.id);
      console.log('🔕 Notification handled in background');
    }
  });
} catch {
  // Notifee is optional during local setup.
}
