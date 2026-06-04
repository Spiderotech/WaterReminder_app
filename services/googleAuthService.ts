import { Platform } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, isGoogleAuthConfigured, isGoogleIosAuthConfigured } from '../constants/authConfig';
import { bootstrapGoogleUser, getBackendAuthMode, getBackendUserId, syncBackendPushToken } from './backendAuthService';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

const getGoogleSignInModule = (): GoogleSignInModule => {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(
      'Google Sign-In is not linked in the app build. Rebuild the mobile app after installing @react-native-google-signin/google-signin.',
    );
  }
};

const configureGoogleSignin = () => {
  if (configured) return;

  if (!isGoogleAuthConfigured()) {
    throw new Error('Google login is not configured. Add your Firebase web client ID in constants/authConfig.ts.');
  }
  if (Platform.OS === 'ios' && !isGoogleIosAuthConfigured()) {
    throw new Error('Google iOS login is not configured. Add your iOS client ID and reversed client ID in constants/authConfig.ts and Info.plist.');
  }

  const { GoogleSignin } = getGoogleSignInModule();
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : undefined,
    offlineAccess: false,
  });
  configured = true;
};

const getGoogleIdToken = async () => {
  configureGoogleSignin();

  const { GoogleSignin } = getGoogleSignInModule();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken || (await GoogleSignin.getTokens()).idToken;

  if (!idToken) {
    throw new Error('Google login did not return an ID token.');
  }

  return idToken;
};

export const ensureGoogleBackendUser = async () => {
  const [backendUserId, authMode] = await Promise.all([
    getBackendUserId(),
    getBackendAuthMode(),
  ]);

  if (backendUserId && authMode === 'firebase') {
    syncBackendPushToken();
    return backendUserId;
  }

  try {
    const googleIdToken = await getGoogleIdToken();
    return bootstrapGoogleUser(googleIdToken);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    const statusCodes = (() => {
      try {
        return getGoogleSignInModule().statusCodes;
      } catch {
        return null;
      }
    })();
    if (code === statusCodes?.SIGN_IN_CANCELLED || code === 'SIGN_IN_CANCELLED') {
      throw new Error('Google login was cancelled.');
    }
    if (code === statusCodes?.IN_PROGRESS || code === 'IN_PROGRESS') {
      throw new Error('Google login is already in progress.');
    }
    if (code === 'DEVELOPER_ERROR') {
      throw new Error('Google login setup is invalid. Check the iOS client ID, reversed client ID URL scheme, bundle ID, and Android SHA fingerprints.');
    }
    throw error;
  }
};
