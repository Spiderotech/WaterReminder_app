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
import { generateReminders, saveReminders } from '../utils/reminderUtils';
import { scheduleReminderNotifications } from '../utils/notificationUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const HydrationGoalScreen = ({ navigation, route }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const { min, max, userData } = route.params;

  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [unit, setUnit] = useState('mL');
  const [customGoal, setCustomGoal] = useState('');
  const [error, setError] = useState('');


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
  const subTextFontSize1 = isSmallDevice ? 13 : Math.max(14, width * 0.03);

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

    let choice: 'min' | 'max' | 'custom' = 'min';
    if (selectedGoal === max) choice = 'max';
    if (customGoal && selectedGoal === parseInt(customGoal)) choice = 'custom';

    await AsyncStorage.setItem('hydrationGoalChoice', choice);

    // 👇 Decide reminder count
    let reminderCount = 5;
    if (choice === 'max') {
      reminderCount = 8;
    } else if (choice === 'custom') {
      reminderCount = selectedGoal > 1000 ? 5 : 3;
    }

    const reminders = generateReminders(
      userData.wakeUpTime,
      userData.sleepTime,
      reminderCount
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

      {/* Minimum option */}
      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === min ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === min ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
        onPress={() => {
          setSelectedGoal(min);
          setCustomGoal('');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="cup-water"
            size={iconSize}
            color={selectedGoal === min ? '#007AFF' : (dark ? '#fff' : '#000')}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.goalText,
                { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' },
              ]}
            >
              {min} {unit}
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
          5 reminders to help you achieve it
        </Text>
      </TouchableOpacity>

      {/* Maximum option */}
      <TouchableOpacity
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === max ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === max ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
        onPress={() => {
          setSelectedGoal(max);
          setCustomGoal('');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="cup-water"
            size={iconSize}
            color={selectedGoal === max ? '#007AFF' : (dark ? '#fff' : '#000')}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.goalText,
                { fontSize: goalTextFontSize, color: dark ? '#fff' : '#000' },
              ]}
            >
              {max} {unit}
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
          8 reminders to help you achieve it
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
        Or set your custom goal
      </Text>

      {/* Custom goal option */}
      <View
        style={[
          styles.goalOption,
          {
            padding: goalOptionPadding,
            borderRadius: goalOptionRadius,
            borderColor: selectedGoal === parseInt(customGoal) ? '#007AFF' : (dark ? '#333' : '#ccc'),
            backgroundColor: selectedGoal === parseInt(customGoal) ? (dark ? '#007AFF15' : '#e6f0ff') : 'transparent',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="cup-water"
            size={iconSize}
            color={selectedGoal === parseInt(customGoal) ? '#007AFF' : (dark ? '#fff' : '#000')}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <TextInput
              style={[
                styles.goalText,
                {
                  fontSize: goalTextFontSize,
                  color: dark ? '#fff' : '#000',
                  borderBottomWidth: 1,
                  borderBottomColor: dark ? '#666' : '#ccc',
                  minWidth: 80,
                },
              ]}
              keyboardType="numeric"
              placeholder="Custom"
              placeholderTextColor={dark ? '#888' : '#aaa'}
              value={customGoal}
              onChangeText={(val) => {
                // Remove non-numeric
                const cleaned = val.replace(/[^0-9]/g, '');
                setCustomGoal(val); // keep original input for user
                const num = parseInt(cleaned);

                if (val && cleaned !== val) {
                  setError('Please enter numbers only');
                  setSelectedGoal(null);
                } else if (!isNaN(num)) {
                  if (num < 500 || num > 1500) {
                    setError('Enter a value between 500 and 1500');
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
            {selectedGoal > 1000 ? '5 reminders' : '3 reminders'} will be created
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    width: '80%',
    marginBottom: 20,
  },
  textContainer: { alignItems: 'center', flex: 1 },
  goalText: { fontWeight: 'bold' },
  subText: { fontWeight: '500' },
  icon: { marginRight: 15 },
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
