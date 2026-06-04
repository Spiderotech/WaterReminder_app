import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import { Platform } from 'react-native';
import { backendRequest, getBackendUserId } from './backendAuthService';

const GUEST_INSTALL_ID_KEY = 'v2:guestInstallId';
const LAST_PUSH_TOKEN_KEY = 'v2:lastPushToken';

const firebaseOptions = {
  apiKey: 'AIzaSyDGVfbUoK2zm050NIjxA-Vzi-EfASNztzk',
  appId: '1:1046122049307:ios:94191ee509c18c5add6dbe',
  messagingSenderId: '1046122049307',
  projectId: 'doradrink-75b2c',
  storageBucket: 'doradrink-75b2c.firebasestorage.app',
};

export const ensureFirebaseApp = async () => {
  const firebaseApp = require('@react-native-firebase/app');

  if (firebaseApp.getApps?.().length) {
    return firebaseApp.getApp?.();
  }

  const namespacedApp = firebaseApp.firebase || firebaseApp.default;
  if (namespacedApp?.apps?.length) {
    return namespacedApp.app();
  }

  if (firebaseApp.initializeApp) {
    return firebaseApp.initializeApp(firebaseOptions);
  }

  return namespacedApp.initializeApp(firebaseOptions);
};

const getMessagingModule = () => {
  try {
    return require('@react-native-firebase/messaging');
  } catch {
    return null;
  }
};

const getMessagingInstance = (messagingModule: any) => {
  if (messagingModule.getMessaging) {
    return messagingModule.getMessaging();
  }
  return messagingModule.default();
};

const requestMessagingPermission = (messagingModule: any, messagingInstance: any) => {
  if (messagingModule.requestPermission) {
    return messagingModule.requestPermission(messagingInstance);
  }
  return messagingInstance.requestPermission();
};

const registerRemoteMessages = (messagingModule: any, messagingInstance: any) => {
  if (messagingModule.registerDeviceForRemoteMessages) {
    return messagingModule.registerDeviceForRemoteMessages(messagingInstance);
  }
  return messagingInstance.registerDeviceForRemoteMessages();
};

const getFcmToken = (messagingModule: any, messagingInstance: any) => {
  if (messagingModule.getToken) {
    return messagingModule.getToken(messagingInstance);
  }
  return messagingInstance.getToken();
};

const getApnsToken = (messagingModule: any, messagingInstance: any) => {
  if (messagingModule.getAPNSToken) {
    return messagingModule.getAPNSToken(messagingInstance);
  }
  return messagingInstance.getAPNSToken?.();
};

const waitForApnsToken = async (messagingModule: any, messagingInstance: any) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = await getApnsToken(messagingModule, messagingInstance);
    if (token) return token;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return null;
};

const subscribeToTokenRefresh = (messagingModule: any, messagingInstance: any, callback: (token: string) => void) => {
  if (messagingModule.onTokenRefresh) {
    return messagingModule.onTokenRefresh(messagingInstance, callback);
  }
  return messagingInstance.onTokenRefresh(callback);
};

const subscribeToForegroundMessage = (messagingModule: any, messagingInstance: any, callback: (message: any) => void) => {
  if (messagingModule.onMessage) {
    return messagingModule.onMessage(messagingInstance, callback);
  }
  return messagingInstance.onMessage(callback);
};

export const displayRemotePushNotification = async (message: any) => {
  const title = message?.notification?.title || message?.data?.title;
  const body = message?.notification?.body || message?.data?.body;

  if (!title && !body) return;

  await notifee.displayNotification({
    id: message?.messageId || message?.data?.notificationId,
    title,
    body,
    android: {
      channelId: 'global-updates-channel',
      smallIcon: 'ic_launcher',
      sound: 'notification',
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'notification.wav',
    },
    data: message?.data || {},
  });
};

const getGuestInstallId = async () => {
  const stored = await AsyncStorage.getItem(GUEST_INSTALL_ID_KEY);
  if (stored) return stored;

  const guestInstallId = `guest-install:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(GUEST_INSTALL_ID_KEY, guestInstallId);
  return guestInstallId;
};

export const registerPushToken = async () => {
  try {
    const messaging = getMessagingModule();
    if (!messaging) {
      console.warn('[push] @react-native-firebase/messaging is not linked.');
      return null;
    }

    await ensureFirebaseApp();

    const messagingInstance = getMessagingInstance(messaging);
    await requestMessagingPermission(messaging, messagingInstance);
    if (Platform.OS === 'ios') {
      await registerRemoteMessages(messaging, messagingInstance);
      const apnsToken = await waitForApnsToken(messaging, messagingInstance);
      if (!apnsToken) {
        console.warn('[push] iOS APNs token was not available yet.');
        return null;
      }
    }

    const token = await getFcmToken(messaging, messagingInstance);
    if (!token) {
      console.warn('[push] Firebase Messaging did not return a device token.');
      return null;
    }

    const [guestInstallId, userId] = await Promise.all([
      getGuestInstallId(),
      getBackendUserId(),
    ]);

    await backendRequest('/notifications/device-token', {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown',
        guestInstallId,
        userId: userId || undefined,
      }),
    });

    await AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, token);
    console.log('[push] Device token registered with backend.');

    const unsubscribe = subscribeToTokenRefresh(messaging, messagingInstance, async (nextToken: string) => {
      await backendRequest('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({
          token: nextToken,
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown',
          guestInstallId,
          userId: (await getBackendUserId()) || undefined,
        }),
      });
      await AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, nextToken);
      console.log('[push] Refreshed device token registered with backend.');
    });

    return unsubscribe;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown push registration error.';
    console.warn('[push] Device token registration failed:', message);
    return null;
  }
};

export const subscribeToForegroundPushNotifications = async () => {
  try {
    const messaging = getMessagingModule();
    if (!messaging) return null;

    await ensureFirebaseApp();

    const messagingInstance = getMessagingInstance(messaging);
    return subscribeToForegroundMessage(messaging, messagingInstance, async (message: any) => {
      await displayRemotePushNotification(message);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown foreground push error.';
    console.warn('[push] Foreground push listener failed:', message);
    return null;
  }
};
