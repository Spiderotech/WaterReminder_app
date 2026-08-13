import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../ThemeContext';
import { Reminder, saveReminders } from '../utils/reminderUtils';
import { scheduleReminderNotifications } from '../utils/notificationUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserProfile } from '../utils/userUtils';

const { width, height } = Dimensions.get('window');

type PlanType = 'smart' | 'performance' | 'custom';

type ReminderPlanItem = {
  id: 'morning' | 'afternoon' | 'evening';
  time: string;
  label: string;
  icon: string;
};

type StoredHydrationPlan = {
  planType?: PlanType;
  dailyGoal?: number;
  unit?: string;
  reminders?: ReminderPlanItem[];
};

const parseStoredNumber = (value: string | null) => {
  if (!value) return undefined;
  const parsed = JSON.parse(value);
  return typeof parsed === 'number' ? parsed : Number(parsed);
};

const parseTimeToMinutes = (time = '06:30') => {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
};

const normalizeMinutes = (minutes: number) => {
  const day = 24 * 60;
  return ((Math.round(minutes) % day) + day) % day;
};

const minutesToHHMM = (minutes: number) => {
  const normalized = normalizeMinutes(minutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const buildThreeReminderPlan = (
  wakeTime = '06:30',
  sleepTime = '23:00',
  planType: PlanType = 'smart',
): ReminderPlanItem[] => {
  const wake = parseTimeToMinutes(wakeTime);
  let sleep = parseTimeToMinutes(sleepTime);

  if (sleep <= wake) {
    sleep += 24 * 60;
  }

  const activeWindow = Math.max(6 * 60, sleep - wake);
  const offsets = planType === 'performance'
    ? [30, activeWindow * 0.45, activeWindow - 210]
    : [60, activeWindow * 0.48, activeWindow - 180];
  const labels = planType === 'performance'
    ? ['Early Hydration', 'Mid-Day Boost', 'Post Activity']
    : planType === 'custom'
      ? ['Custom', 'Custom', 'Custom']
      : ['Morning Boost', 'Focus Time', 'Evening Recovery'];

  return [
    { id: 'morning', time: minutesToHHMM(wake + offsets[0]), label: labels[0], icon: 'sunrise' },
    { id: 'afternoon', time: minutesToHHMM(wake + offsets[1]), label: labels[1], icon: 'sun' },
    { id: 'evening', time: minutesToHHMM(wake + offsets[2]), label: labels[2], icon: 'moon' },
  ];
};

const toReminderRecords = (plan: ReminderPlanItem[]): Reminder[] => (
  plan.slice(0, 3).map((item) => ({
    id: item.id,
    time: `${item.time}:00`,
    enabled: true,
  }))
);

const HydrationGoalScreen = ({ navigation, route }: any) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const routeParams = route?.params || {};
  const routeUserData = routeParams.userData || {};

  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [unit, setUnit] = useState('mL');
  const [customGoal, setCustomGoal] = useState('');
  const [error, setError] = useState('');
  const [minGoal, setMinGoal] = useState(Number(routeParams.min) || 2000);
  const [maxGoal, setMaxGoal] = useState(Number(routeParams.max) || 3000);
  const [profileTimes, setProfileTimes] = useState({
    wakeTime: routeUserData.wakeUpTime || routeUserData.wakeTime || '06:30',
    sleepTime: routeUserData.sleepTime || '23:00',
  });
  const parsedCustomGoal = parseInt(customGoal, 10);


  // Responsive values
  const isSmallDevice = width < 350 || height < 650;
  const padding = isSmallDevice ? 16 : Math.max(20, width * 0.09);
  const titleFontSize = isSmallDevice ? 18 : Math.max(22, width * 0.06);
  const goalOptionPadding = isSmallDevice ? 12 : Math.max(16, width * 0.04);
  const goalOptionRadius = isSmallDevice ? 10 : Math.max(12, width * 0.035);
  const goalTextFontSize = isSmallDevice ? 22 : Math.max(24, width * 0.07);
  const subTextFontSize = isSmallDevice ? 13 : Math.max(14, width * 0.04);
  const confirmBtnPaddingV = isSmallDevice ? 12 : Math.max(14, height * 0.018);
  const confirmBtnPaddingH = isSmallDevice ? 30 : Math.max(40, width * 0.13);
  const confirmBtnRadius = isSmallDevice ? 20 : Math.max(30, width * 0.09);
  const confirmTextFontSize = isSmallDevice ? 15 : Math.max(16, width * 0.05);
  const iconSize = isSmallDevice ? 32 : Math.max(38, width * 0.1);
  const subTextFontSize1 = isSmallDevice ? 13 : Math.max(12, width * 0.03);

  useEffect(() => {
    const loadStoredGoalData = async () => {
      try {
        const [storedPlan, storedGoal, storedUnit, storedRange, profile] = await Promise.all([
          AsyncStorage.getItem('selectedHydrationPlan'),
          AsyncStorage.getItem('hydrationGoal'),
          AsyncStorage.getItem('hydrationUnit'),
          AsyncStorage.getItem('hydrationGoalRange'),
          getUserProfile(),
        ]);

        const parsedPlan: StoredHydrationPlan = storedPlan ? JSON.parse(storedPlan) : {};
        const parsedGoal = parseStoredNumber(storedGoal);
        const parsedRange = storedRange ? JSON.parse(storedRange) : {};
        const nextUnit = parsedPlan.unit || storedUnit || routeUserData.dailyGoalUnit || 'mL';
        const nextGoal = parsedPlan.dailyGoal || parsedGoal || routeUserData.dailyGoal;
        const nextMin = Number(routeParams.min) || Number(parsedRange.min) || (parsedPlan.planType === 'smart' ? parsedPlan.dailyGoal : undefined) || 2000;
        const nextMax = Number(routeParams.max) || Number(parsedRange.max) || (parsedPlan.planType === 'performance' ? parsedPlan.dailyGoal : undefined) || Math.max(nextMin, 3000);

        setUnit(nextUnit);
        setMinGoal(nextMin);
        setMaxGoal(nextMax);
        setProfileTimes({
          wakeTime: routeUserData.wakeUpTime || routeUserData.wakeTime || (profile as any)?.wakeUpTime || profile?.wakeTime || '06:30',
          sleepTime: routeUserData.sleepTime || profile?.sleepTime || '23:00',
        });

        if (nextGoal) {
          setSelectedGoal(nextGoal);
          if (nextGoal !== nextMin && nextGoal !== nextMax) {
            setCustomGoal(String(nextGoal));
          }
        }
      } catch (loadError) {
        console.error('Failed to load hydration goal data:', loadError);
      }
    };

    loadStoredGoalData();
  }, [routeParams.max, routeParams.min, routeUserData.dailyGoal, routeUserData.dailyGoalUnit, routeUserData.sleepTime, routeUserData.wakeTime, routeUserData.wakeUpTime]);

  const confirmGoal = async () => {
    if (!selectedGoal) return;

    await AsyncStorage.setItem('hydrationGoal', JSON.stringify(selectedGoal));
    await AsyncStorage.setItem('hydrationUnit', unit);
    await AsyncStorage.setItem('hydrationGoalRange', JSON.stringify({ min: minGoal, max: maxGoal }));

    let choice: PlanType = 'smart';
    if (selectedGoal === maxGoal) choice = 'performance';
    if (customGoal && selectedGoal === parseInt(customGoal, 10)) choice = 'custom';

    await AsyncStorage.setItem('hydrationGoalChoice', choice);

    const reminderPlan = buildThreeReminderPlan(profileTimes.wakeTime, profileTimes.sleepTime, choice);
    const reminders = toReminderRecords(reminderPlan);
    await AsyncStorage.setItem('selectedHydrationPlan', JSON.stringify({
      planType: choice,
      dailyGoal: selectedGoal,
      unit,
      reminders: reminderPlan,
    }));
    await saveReminders(reminders);
    await scheduleReminderNotifications(reminders);

    navigation.replace('Home');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: dark ? '#000' : '#fff', padding },
      ]}
    >
      <Text
        style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: titleFontSize }]}
      >
        Choose Your Daily Hydration Goal
      </Text>

      {/* Minimum option */}
      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === minGoal ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === minGoal ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
        onPress={() => {
          setSelectedGoal(minGoal);
          setCustomGoal('');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="glass-cocktail"
            size={iconSize}
            color={selectedGoal === minGoal ? '#007AFF' : (dark ? '#fff' : '#000')}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.goalText,
                { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' },
              ]}
            >
              {minGoal} {unit}
            </Text>
            <Text
              style={[
                styles.subText,
                { fontSize: subTextFontSize, color: dark ? '#aaa' : '#555', marginTop: 3 },
              ]}
            >
              Minimum goal
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.subText,
            {
              fontSize: subTextFontSize1,
              color: dark ? '#aaa' : '#555',
              marginTop: 6,
            },
          ]}
        >
          Smart plan reminders based on your saved wake and sleep time
        </Text>
      </TouchableOpacity>

      {/* Maximum option */}
      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === maxGoal ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === maxGoal ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
        onPress={() => {
          setSelectedGoal(maxGoal);
          setCustomGoal('');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="cup"
            size={iconSize}
            color={selectedGoal === maxGoal ? '#007AFF' : (dark ? '#fff' : '#000')}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.goalText,
                { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' },
              ]}
            >
              {maxGoal} {unit}
            </Text>
            <Text
              style={[
                styles.subText,
                { fontSize: subTextFontSize, color: dark ? '#aaa' : '#555', marginTop: 3 },
              ]}
            >
              Maximum goal
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.subText,
            {
              fontSize: subTextFontSize1,
              color: dark ? '#aaa' : '#555',
              marginTop: 6,
            },
          ]}
        >
          Performance plan reminders based on your saved wake and sleep time
        </Text>
      </TouchableOpacity>

      {/* Custom goal option */}

      {/* Custom goal heading */}
      <Text
        style={[
          styles.customHeading,
          { color: dark ? '#fff' : '#000', fontSize: subTextFontSize },
        ]}
      >
        Or Set Your Custom Goal
      </Text>

      {/* Custom goal option */}
      <View
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === parsedCustomGoal ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor:
              selectedGoal === parsedCustomGoal
                ? dark
                  ? '#007AFF15'
                  : '#e6f0ff'
                : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center'  }}>
          <MaterialCommunityIcons
            name="cup-outline"
            size={iconSize}
            color={
              selectedGoal === parsedCustomGoal
                ? '#007AFF'
                : dark
                  ? '#fff'
                  : '#000'
            }
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            {/* Input + mL on same line */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[
                  styles.goalText,
                  {
                    fontSize: goalTextFontSize,
                    color: dark ? '#fff' : '#000',
                    borderBottomWidth: 1,
                    borderBottomColor: dark ? '#666' : '#ccc',
                    minWidth: 80,
                    paddingRight: 5,
                  },
                ]}
                keyboardType="numeric"
                placeholder="Custom"
                placeholderTextColor={dark ? '#888' : '#aaa'}
                value={customGoal}
                maxLength={4}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setCustomGoal(val);
                  const num = parseInt(cleaned, 10);

                  if (val && cleaned !== val) {
                    setError('Please enter numbers only');
                    setSelectedGoal(null);
                  } else if (!isNaN(num)) {
                    if (num < minGoal || num > maxGoal) {
                      setError(`Enter a value between ${minGoal} and ${maxGoal}`);
                      setSelectedGoal(null);
                    } else {
                      setError('');
                      setSelectedGoal(num);
                    }
                  } else {
                    setError('');
                    setSelectedGoal(null);
                  }
                }}
              />
              <Text
               style={[
                styles.goalText,
                { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' },
              ]}
              >
                {unit}
              </Text>
            </View>

            {/* Label under input */}
            <Text
              style={[
                styles.subText,
                { fontSize: subTextFontSize, color: dark ? '#aaa' : '#555', marginTop: 3 },
              ]}
            >
              Custom goal
            </Text>
          </View>
        </View>

        {error ? (
          <Text
            style={[
              styles.errorText,
              { fontSize: subTextFontSize1, color: 'red', marginTop: 6 },
            ]}
          >
            {error}
          </Text>
        ) : selectedGoal && customGoal ? (
          <Text
            style={[
              styles.subText,
              {
                fontSize: subTextFontSize1,
                color: dark ? '#aaa' : '#555',
                marginTop: 6,
              },
            ]}
          >
            Custom plan reminders based on your saved wake and sleep time
          </Text>
        ) : null}
      </View>



      {/* Confirm button */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          {
            backgroundColor: selectedGoal ? '#007AFF' : '#ccc',
            paddingVertical: confirmBtnPaddingV,
            paddingHorizontal: confirmBtnPaddingH,
            borderRadius: confirmBtnRadius,
          },
        ]}
        disabled={!selectedGoal}
        onPress={confirmGoal}
      >
        <Text style={[styles.confirmText, { fontSize: confirmTextFontSize }]}>
          Let's Hydrate!
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '600', marginBottom: 30, textAlign: 'center' },
  goalOption: {
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    marginBottom: 20,
  },
  textContainer: { justifyContent: 'flex-start', flex: 1, minWidth: 0 },
  icon: { marginRight: 20 },
  goalText: { flexShrink: 1, fontWeight: 'bold' },
  subText: { flexShrink: 1, fontWeight: '500' },
  confirmBtn: {
    marginTop: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  confirmText: { color: '#fff', fontWeight: '600' },
  customHeading: {
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',   // 👈 centers text
    width: '100%',         // 👈 makes sure it spans the screen
  },
  errorText: {
    fontWeight: '500',
  },

});

export default HydrationGoalScreen;
