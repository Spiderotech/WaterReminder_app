import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useThemeContext } from '../ThemeContext';

import GenderStep from '../components/GenderStep';
import HeightStep from '../components/HeightStep';
import WeightStep from '../components/WeightStep';
import AgeStep from '../components/AgeStep';
import WakeUpTimeStep from '../components/WakeUpTimeStep';
import SleepTimeStep from '../components/SleepTimeStep';
import ActivityLevelAndClimateStep from '../components/ActivityLevelAndClimateStep';

const { width, height } = Dimensions.get('window');

const steps = [
  GenderStep,
  HeightStep,
  WeightStep,
  AgeStep,
  WakeUpTimeStep,
  SleepTimeStep,
  ActivityLevelAndClimateStep,
];

const screenWidth = width;

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const scrollX = useState(new Animated.Value(0))[0];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      Animated.spring(scrollX, {
        toValue: (currentStep + 1) * screenWidth,
        useNativeDriver: false,
      }).start();
    } else {
      navigation.replace('GeneratingPlan', { userData });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      Animated.spring(scrollX, {
        toValue: (currentStep - 1) * screenWidth,
        useNativeDriver: false,
      }).start();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !!userData.gender;
      case 1: return !!userData.height;
      case 2: return !!userData.weight;
      case 3: return !!userData.age;
      case 4: return !!userData.wakeUpTime;
      case 5: return !!userData.sleepTime;
      case 6: return !!userData.activityLevel && !!userData.climate;
      default: return true;
    }
  };

  // Responsive values
  const isSmallDevice = width < 350 || height < 650;
  const paddingHorizontal = isSmallDevice ? 8 : Math.max(16, width * 0.05);
  const paddingVertical = isSmallDevice ? 4 : Math.max(8, height * 0.012);
  const marginBottom = isSmallDevice ? 10 : Math.max(20, height * 0.03);
  const headerPaddingTop = isSmallDevice ? 12 : Math.max(24, height * 0.04);
  const progressBarHeight = isSmallDevice ? 4 : Math.max(6, height * 0.009);
  const progressBarRadius = progressBarHeight * 1.25;
  const progressBarMarginRight = isSmallDevice ? 4 : Math.max(8, width * 0.02);
  const stepFontSize = isSmallDevice ? 11 : Math.max(13, width * 0.037);
  const continueButtonPadding = isSmallDevice ? 8 : Math.max(14, height * 0.018);
  const continueButtonRadius = isSmallDevice ? 22 : Math.max(36, width * 0.13);
  const continueFontSize = isSmallDevice ? 12 : Math.max(15, width * 0.045);

  const bgColor = dark ? '#161515ff' : '#f8f9fb';
  const progressTrackColor = dark ? '#333' : '#e0e0e0';
  const progressFillColor = dark ? '#3498ff' : '#3498ff';
  const stepTextColor = dark ? '#ccc' : '#666';
  const backIconColor = dark ? '#fff' : 'black';
  const continueBgColor = dark ? '#3498ff' : '#3498ff';
  const continueDisabledColor = dark ? '#555' : '#ccc';
  const continueTextColor = '#fff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: headerPaddingTop,
            paddingHorizontal: paddingHorizontal,
            marginBottom: marginBottom,
          },
        ]}
      >
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={Math.max(22, width * 0.06)} color={backIconColor} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              {
                height: progressBarHeight,
                borderRadius: progressBarRadius,
                marginRight: progressBarMarginRight,
                backgroundColor: progressTrackColor,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  height: progressBarHeight,
                  borderRadius: progressBarRadius,
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: progressFillColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.stepText, { fontSize: stepFontSize, color: stepTextColor }]}>
            {currentStep + 1} / {steps.length}
          </Text>
        </View>
      </View>

      {/* Step Screens */}
      <Animated.View
        style={[
          styles.slide,
          {
            transform: [{ translateX: Animated.multiply(scrollX, -1) }],
            width: screenWidth * steps.length,
          },
        ]}
      >
        {steps.map((Step, index) => (
          <View key={index} style={{ width: screenWidth }}>
            <Step
              onDataChange={(data) => setUserData((prev) => ({ ...prev, ...data }))} // 👈 always merge into userData
              userData={userData}
              navigation={navigation}
            />
          </View>
        ))}
      </Animated.View>

      {/* Continue Button */}
      <View
        style={{
          paddingHorizontal,
          paddingVertical,
          marginBottom,
        }}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              paddingVertical: continueButtonPadding,
              borderRadius: continueButtonRadius,
              backgroundColor: isStepValid() ? continueBgColor : continueDisabledColor,
            },
          ]}
          onPress={handleNext}
          disabled={!isStepValid()}
        >
          <Text style={[styles.continueText, { fontSize: continueFontSize, color: continueTextColor }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 10 },
  progressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1 },
  progressFill: {},
  stepText: { fontWeight: '500' },
  slide: { flexDirection: 'row', flex: 1 },
  continueButton: { alignItems: 'center' },
  continueText: { fontWeight: '600' },
});
