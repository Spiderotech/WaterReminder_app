import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, AppState } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from './screens/Splashscreen';
import LoginScreen from './screens/LoginScreen';
import IntroScreen from './screens/IntroScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PersonalInformationScreen from './screens/PersonalInformationScreen';
import RemindersettingsScreen from './screens/RemindersettingsScreen';
import HistoryScreen from './screens/HistoryScreen';
import RewardsScreen from './screens/RewardsScreen';
import CompetitionScreen from './screens/CompetitionScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ThemeSettingsScreen from './screens/ThemeSettingsScreen';
import FaqScreen from './screens/FaqScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProfileHydrationGoalScreen from './screens/ProfileHydrationGoalScreen';
import DigitalMeScreen from './screens/DigitalMeScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { ThemeProvider, useThemeContext } from './ThemeContext';
import GeneratingPlanScreen from './screens/GeneratingPlanScreen';
import HydrationGoalScreen from './screens/HydrationGoalScreen';
import { checkNotificationEnabled, createNotificationChannel, requestNotificationPermission, scheduleRemindersIfGoalNotReached, showUnseenBackendNotifications } from './utils/notificationUtils';
import ExactAlarmPermissionModal from './components/ExactAlarmPermissionModal';
import { needsExactAlarmPermission } from './utils/exactAlarmPermission';
import MainTabs from './components/MainTabs';
import { registerPushToken, subscribeToForegroundPushNotifications } from './services/pushTokenService';




const Stack = createNativeStackNavigator();

const MainApp = () => {
  const { theme } = useThemeContext();
  const [showExactAlarmModal, setShowExactAlarmModal] = useState(false);

  const runNotificationTask = async (name: string, task: () => Promise<unknown>) => {
    try {
      await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[notifications] ${name} failed:`, message);
    }
  };

  const checkExactAlarm = async () => {
    const needPermission = await needsExactAlarmPermission();
    setShowExactAlarmModal(needPermission);
  };


 useEffect(() => {
  let unsubscribeForegroundPush: null | (() => void) = null;
  let isMounted = true;

  const initNotifications = async () => {
    await runNotificationTask('permission request', requestNotificationPermission);
    await runNotificationTask('notification settings check', checkNotificationEnabled);
    await runNotificationTask('channel creation', createNotificationChannel);
    await runNotificationTask('push token registration', registerPushToken);
    const unsubscribe = await subscribeToForegroundPushNotifications();
    if (isMounted) {
      unsubscribeForegroundPush = unsubscribe;
    } else if (unsubscribe) {
      unsubscribe();
    }

    // ✅ Check and show exact alarm modal if needed
    await runNotificationTask('exact alarm check', checkExactAlarm);

    await runNotificationTask('hydration reminder scheduling', scheduleRemindersIfGoalNotReached);
    await runNotificationTask('backend notification display', showUnseenBackendNotifications);
  };
  initNotifications();

  return () => {
    isMounted = false;
    unsubscribeForegroundPush?.();
  };
}, []);



  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        runNotificationTask('exact alarm check', checkExactAlarm);
        runNotificationTask('push token registration', registerPushToken);
        runNotificationTask('backend notification display', showUnseenBackendNotifications);
      }
    });

    return () => subscription.remove();
  }, []);


  return (
    <>
      <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme} >
        <StatusBar
          backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'} // ← Fix here
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          translucent={Platform.OS === 'ios'}
        />
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="GeneratingPlan" component={GeneratingPlanScreen} />
          <Stack.Screen name="HydrationGoal" component={HydrationGoalScreen} />
          <Stack.Screen name="Home" component={MainTabs} />
          <Stack.Screen name="PersonalInfo" component={PersonalInformationScreen} />
          <Stack.Screen name="ReminderSettings" component={RemindersettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="Competition" component={CompetitionScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
          <Stack.Screen name="FAQ" component={FaqScreen} />
          <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
          <Stack.Screen name="Terms" component={TermsOfServiceScreen} />
          <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ProfileHydrationGoal" component={ProfileHydrationGoalScreen} />
          <Stack.Screen name="DigitalMe" component={DigitalMeScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ExactAlarmPermissionModal
        visible={showExactAlarmModal}
        onClose={() => setShowExactAlarmModal(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
