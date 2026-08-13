import {
  getCrashlytics,
  log,
  recordError,
  setAttributes,
  setCrashlyticsCollectionEnabled,
  setUserId,
} from '@react-native-firebase/crashlytics';

type CrashAttributeValue = string | number | boolean | null | undefined;
type CrashAttributes = Record<string, CrashAttributeValue>;

const stringifyAttributes = (attributes?: CrashAttributes) => {
  if (!attributes) return undefined;

  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
};

const reportCrashlyticsWarning = (name: string, error: unknown) => {
  if (!__DEV__) return;

  const message = error instanceof Error ? error.message : 'Unknown error';
  console.warn(`[crashlytics] ${name} failed:`, message);
};

export const initializeCrashReporting = async () => {
  try {
    const crashlytics = getCrashlytics();
    await setCrashlyticsCollectionEnabled(crashlytics, true);
    log(crashlytics, 'WaterReminder app initialized.');
  } catch (error) {
    reportCrashlyticsWarning('initialization', error);
  }
};

export const addCrashLog = (message: string) => {
  try {
    log(getCrashlytics(), message);
  } catch (error) {
    reportCrashlyticsWarning('log', error);
  }
};

export const reportHandledError = (
  error: unknown,
  context?: string,
  attributes?: CrashAttributes,
) => {
  try {
    const crashlytics = getCrashlytics();
    const normalizedError =
      error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');

    if (context) {
      log(crashlytics, context);
    }

    const crashAttributes = stringifyAttributes(attributes);
    if (crashAttributes && Object.keys(crashAttributes).length > 0) {
      void setAttributes(crashlytics, crashAttributes);
    }

    recordError(crashlytics, normalizedError, context);
  } catch (reportError) {
    reportCrashlyticsWarning('record error', reportError);
  }
};

export const setCrashReportingUser = async (userId?: string | null) => {
  if (!userId) return;

  try {
    await setUserId(getCrashlytics(), userId);
  } catch (error) {
    reportCrashlyticsWarning('set user', error);
  }
};

export const setCrashReportingAttributes = async (attributes: CrashAttributes) => {
  try {
    const crashAttributes = stringifyAttributes(attributes);
    if (!crashAttributes || Object.keys(crashAttributes).length === 0) return;

    await setAttributes(getCrashlytics(), crashAttributes);
  } catch (error) {
    reportCrashlyticsWarning('set attributes', error);
  }
};
