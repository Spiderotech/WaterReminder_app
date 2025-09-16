import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const HydrationGoalScreen = ({ navigation, route = {} }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [goal, setGoal] = useState(route.params?.goal || 0);
  const [unit, setUnit] = useState('mL');

  const units = ['mL'];

  // Responsive values
  const isSmallDevice = width < 350 || height < 650;

// Responsive values
const padding = isSmallDevice ? 8 : Math.max(18, width * 0.06);
const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
const unitBtnPaddingH = isSmallDevice ? 8 : Math.max(16, width * 0.045);
const unitBtnPaddingV = isSmallDevice ? 4 : Math.max(8, height * 0.012);
const unitBtnRadius = isSmallDevice ? 12 : Math.max(20, width * 0.06);
const unitTextFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const goalTextFontSize = isSmallDevice ? 22 : Math.max(40, width * 0.13);
const confirmBtnPaddingV = isSmallDevice ? 8 : Math.max(14, height * 0.018);
const confirmBtnPaddingH = isSmallDevice ? 20 : Math.max(40, width * 0.13);
const confirmBtnRadius = isSmallDevice ? 16 : Math.max(30, width * 0.09);
const confirmTextFontSize = isSmallDevice ? 13 : Math.max(18, width * 0.05);
const iconSize = isSmallDevice ? 32 : Math.max(60, width * 0.22);
const iconMarginV = isSmallDevice ? 10 : Math.max(24, height * 0.04);

  useEffect(() => {
    if (!goal) {
      AsyncStorage.getItem('hydrationGoal').then((data) => {
        if (data) setGoal(JSON.parse(data));
      });
    }

    AsyncStorage.getItem('hydrationUnit').then((u) => {
      if (u) setUnit(u);
    });
  }, []);

  const handleUnitChange = async (selectedUnit: string) => {
    setUnit(selectedUnit);
    await AsyncStorage.setItem('hydrationUnit', selectedUnit);
  };

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#fff' : '#fff', padding }]}>
      <Text style={[styles.title, { color: dark ? '#000' : '#000', fontSize: titleFontSize }]}>Your daily goal is</Text>

      {/* Units toggle */}
      <View style={styles.unitRow}>
        {units.map((u) => (
          <TouchableOpacity
            key={u}
            onPress={() => handleUnitChange(u)}
            style={[
              styles.unitBtn,
              {
                backgroundColor: unit === u ? '#007AFF' : 'transparent',
                borderColor: unit === u ? '#007AFF' : dark ? '#555' : '#ccc',
                paddingHorizontal: unitBtnPaddingH,
                paddingVertical: unitBtnPaddingV,
                borderRadius: unitBtnRadius,
              },
            ]}
          >
            <Text
              style={[
                styles.unitText,
                { color: unit === u ? '#fff' : dark ? '#aaa' : '#444', fontSize: unitTextFontSize },
              ]}
            >
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Icon */}
      <MaterialCommunityIcons
        name="cup-water"
        size={iconSize}
        color="#007AFF"
        style={{ marginVertical: iconMarginV }}
      />

      {/* Goal text */}
      <Text style={[styles.goalText, { color: dark ? '#000' : '#000', fontSize: goalTextFontSize }]}>
        {goal} {unit}
      </Text>

      {/* Confirm */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          {
            backgroundColor: '#007AFF',
            paddingVertical: confirmBtnPaddingV,
            paddingHorizontal: confirmBtnPaddingH,
            borderRadius: confirmBtnRadius,
            marginTop: iconMarginV,
          },
        ]}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={[styles.confirmText, { fontSize: confirmTextFontSize }]}>Let's Hydrate!</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HydrationGoalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 20,
  },
  unitRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  unitBtn: {
    borderWidth: 1,
  },
  unitText: {
    fontWeight: '600',
  },
  goalText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmBtn: {},
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});