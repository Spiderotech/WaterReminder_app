import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperty,
} from '@react-native-firebase/analytics';

type AnalyticsParamValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

const sanitizeParams = (params?: AnalyticsParams) => {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
};

const reportAnalyticsWarning = (name: string, error: unknown) => {
  if (!__DEV__) return;

  const message = error instanceof Error ? error.message : 'Unknown error';
  console.warn(`[analytics] ${name} failed:`, message);
};

export const initializeAppAnalytics = async () => {
  try {
    const analytics = getAnalytics();
    await setAnalyticsCollectionEnabled(analytics, true);
    await logEvent(analytics, 'app_open');
  } catch (error) {
    reportAnalyticsWarning('initialization', error);
  }
};

export const trackAnalyticsEvent = async (name: string, params?: AnalyticsParams) => {
  try {
    await logEvent(getAnalytics(), name as never, sanitizeParams(params) as never);
  } catch (error) {
    reportAnalyticsWarning(name, error);
  }
};

export const trackScreenView = async (screenName?: string) => {
  if (!screenName) return;

  await trackAnalyticsEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenName,
  });
};

export const setAnalyticsUser = async (userId?: string | null) => {
  try {
    await setUserId(getAnalytics(), userId || null);
  } catch (error) {
    reportAnalyticsWarning('set user', error);
  }
};

export const setAnalyticsUserProperty = async (name: string, value?: string | null) => {
  try {
    await setUserProperty(getAnalytics(), name, value || null);
  } catch (error) {
    reportAnalyticsWarning(`set property ${name}`, error);
  }
};
