import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from './screens/Splashscreen';
import IntroScreen from './screens/IntroScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import PersonalInformationScreen from './screens/PersonalInformationScreen';
import RemindersettingsScreen from './screens/RemindersettingsScreen';
import HistoryScreen from './screens/HistoryScreen';
import ThemeSettingsScreen from './screens/ThemeSettingsScreen';
import FaqScreen from './screens/FaqScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import { ThemeProvider, useThemeContext } from './ThemeContext';
import GeneratingPlanScreen from './screens/GeneratingPlanScreen';
import HydrationGoalScreen from './screens/HydrationGoalScreen';
import { createNotificationChannel, requestNotificationPermission, scheduleReminderNotifications } from './utils/notificationUtils';
import { getReminders } from './utils/reminderUtils';



const Stack = createNativeStackNavigator();

const MainApp = () => {
  const { theme } = useThemeContext();
 useEffect(() => {
  const initNotifications = async () => {
    await requestNotificationPermission();
    await createNotificationChannel();
    const reminders = await getReminders(); // 🆕
    await scheduleReminderNotifications(reminders); // 🆕
  };
  initNotifications();
}, []);
 

  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme} >
      <StatusBar
        backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'} // ← Fix here
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        translucent={Platform.OS === 'ios'}
      />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="GeneratingPlan" component={GeneratingPlanScreen} />
        <Stack.Screen name="HydrationGoal" component={HydrationGoalScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInformationScreen} />
        <Stack.Screen name="ReminderSettings" component={RemindersettingsScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
        <Stack.Screen name="FAQ" component={FaqScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="Terms" component={TermsOfServiceScreen} />
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

