import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import { generateWaterGoal } from '../utils/hydrationUtils';
import { saveUserProfile } from '../utils/userUtils';
import { generateReminders, saveReminders } from '../utils/reminderUtils';
import { scheduleReminderNotifications } from '../utils/notificationUtils';
import { useThemeContext } from '../ThemeContext';


const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 350 || height < 650;

// Responsive values
const padding = isSmallDevice ? 8 : 20;
const titleFontSize = isSmallDevice ? 15 : 20;
const subtitleFontSize = isSmallDevice ? 12 : 16;
const lottieSize = isSmallDevice ? 90 : 150;
const lottieMarginB = isSmallDevice ? 10 : 20;
const footerFontSize = isSmallDevice ? 11 : 14;

const GeneratingPlanScreen = ({ navigation, route }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const { userData } = route.params;

  const progress = useRef(new Animated.Value(0)).current;
  const [displayedPercent, setDisplayedPercent] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const id = progress.addListener(({ value }) => {
      setDisplayedPercent(Math.round(value * 100));
    });

    const timeout = setTimeout(async () => {
      try {
        // 1. Save user profile
        await saveUserProfile(userData);

        // 2. Generate hydration goal
        const goal = generateWaterGoal(userData);
        await AsyncStorage.setItem('hydrationGoal', JSON.stringify(goal));

        // 3. Generate reminders
        console.log(userData.wakeUpTime, userData.sleepTime, goal, 'data from onboarding');

        const reminders = generateReminders(userData.wakeUpTime, userData.sleepTime, goal);

        // 4. Save reminders
        await saveReminders(reminders);
        await scheduleReminderNotifications(reminders);

        // 5. Navigate to hydration goal screen
        navigation.replace('HydrationGoal', { goal });
      } catch (error) {
        console.error('Error during hydration plan generation:', error);
      }
    }, 3000);

    return () => {
      progress.removeListener(id);
      clearTimeout(timeout);
    };
  }, []);

  return (
   <View style={[
      styles.container,
      { backgroundColor: dark ? '#fff' : '#fff', padding }
    ]}>
      <Text style={[
        styles.title,
        { color: dark ? '#000' : '#000', fontSize: titleFontSize }
      ]}>
        Generating personalized hydration plan for you...
      </Text>
      <Text style={[
        styles.subtitle,
        { color: dark ? '#777' : '#777', fontSize: subtitleFontSize }
      ]}>
        Please wait...
      </Text>

      <LottieView
        source={require('../assets/progress.json')}
        autoPlay
        loop
        style={{ width: lottieSize, height: lottieSize, marginBottom: lottieMarginB }}
      />

      <Text style={[
        styles.footer,
        { color: dark ? '#777' : '#777', fontSize: footerFontSize }
      ]}>
        This will just take a moment. Get ready to transform your hydration journey!
      </Text>
    </View>
  );
};

export default GeneratingPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subtitle: { marginBottom: 30 },
  footer: { textAlign: 'center', paddingHorizontal: 10 },
});
