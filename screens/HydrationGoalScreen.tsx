import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../ThemeContext';
import { generateReminders, saveReminders } from '../utils/reminderUtils';
import { scheduleReminderNotifications } from '../utils/notificationUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const HydrationGoalScreen = ({ navigation, route }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const { min, max, userData } = route.params;

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [unit, setUnit] = useState('mL');

  // Responsive values
  const isSmallDevice = width < 350 || height < 650;
  const padding = isSmallDevice ? 16 : Math.max(20, width * 0.06);
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

  useEffect(() => {
    AsyncStorage.getItem('hydrationUnit').then((u) => {
      if (u) setUnit(u);
    });
  }, []);

  const confirmGoal = async () => {
    if (!selectedGoal) return;

    await AsyncStorage.setItem('hydrationGoal', JSON.stringify(selectedGoal));
    await AsyncStorage.setItem('hydrationUnit', unit);
    await AsyncStorage.setItem('hydrationGoalRange', JSON.stringify({ min, max }));

    const choice = selectedGoal === max ? 'max' : 'min';
    await AsyncStorage.setItem('hydrationGoalChoice', choice);

    const reminders = generateReminders(
      userData.wakeUpTime,
      userData.sleepTime,
      selectedGoal
    );
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
        Choose your daily hydration goal
      </Text>

      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === min ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === min ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
          },
        ]}
        onPress={() => setSelectedGoal(min)}
      >
        <MaterialCommunityIcons name="cup-water"  size={iconSize} color={selectedGoal === min ? '#007AFF' : (dark ? '#fff' : '#000')} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.goalText, { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' }]}>
            {min} {unit}
          </Text>
          <Text style={[styles.subText, { fontSize: subTextFontSize, color: dark ? '#aaa' : '#555' }]}>Minimum goal</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === max ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === max ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
          },
        ]}
        onPress={() => setSelectedGoal(max)}
      >
        <MaterialCommunityIcons name="cup-water"  size={iconSize} color={selectedGoal === max ? '#007AFF' : (dark ? '#fff' : '#000')} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.goalText, { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' }]}>
            {max} {unit}
          </Text>
          <Text style={[styles.subText, { fontSize: subTextFontSize, color: dark ? '#aaa' : '#555' }]}>Maximum goal</Text>
        </View>
      </TouchableOpacity>

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
        <Text style={[styles.confirmText, { fontSize: confirmTextFontSize }]}>Let's Hydrate!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    width: '80%',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  goalText: {
    fontWeight: 'bold',
  },
  subText: {
    fontWeight: '500',
  },
  icon: {
    marginRight: 15,
  },
  confirmBtn: {
    marginTop: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HydrationGoalScreen;
