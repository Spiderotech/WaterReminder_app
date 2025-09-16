import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import GenderStep from '../components/GenderStep';
import HeightStep from '../components/HeightStep';
import WeightStep from '../components/WeightStep';
import AgeStep from '../components/AgeStep';
import WakeUpTimeStep from '../components/WakeUpTimeStep';
import SleepTimeStep from '../components/SleepTimeStep';
import ActivityLevelAndClimateStep from '../components/ActivityLevelAndClimateStep';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [stepData, setStepData] = useState({});
  const scrollX = useState(new Animated.Value(0))[0];

  const handleNext = () => {
    const updatedData = { ...userData, ...stepData };
    setUserData(updatedData);

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      Animated.spring(scrollX, {
        toValue: (currentStep + 1) * screenWidth,
        useNativeDriver: false,
      }).start();
      setStepData({});
    } else {
      navigation.replace('GeneratingPlan', { userData: updatedData });
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
    if (!stepData || Object.keys(stepData).length === 0) return false;

    switch (currentStep) {
      case 0: return !!stepData.gender;
      case 1: return !!stepData.height;
      case 2: return !!stepData.weight;
      case 3: return !!stepData.age;
      case 4: return !!stepData.wakeUpTime;
      case 5: return !!stepData.sleepTime;
      case 6: return !!stepData.activityLevel && !!stepData.climate;
      default: return true;
    }
  };

  // Responsive values
 const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[
        styles.headerRow,
        {
          paddingTop: headerPaddingTop,
          paddingHorizontal: paddingHorizontal,
          marginBottom: marginBottom,
        }
      ]}>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={Math.max(22, width * 0.06)} color="black" />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressTrack,
            {
              height: progressBarHeight,
              borderRadius: progressBarRadius,
              marginRight: progressBarMarginRight,
            }
          ]}>
            <View
              style={[
                styles.progressFill,
                {
                  height: progressBarHeight,
                  borderRadius: progressBarRadius,
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.stepText, { fontSize: stepFontSize }]}>
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
              onDataChange={(data) => setStepData(data)}
              {...(index === 0 && {
                onSelect: (value) => setStepData({ gender: value }),
                gender: stepData.gender || userData.gender,
              })}
              userData={userData}
              selectedData={stepData}
              navigation={navigation}
            />
          </View>
        ))}
      </Animated.View>

      {/* Continue Button */}
      <View style={[
        styles.buttonWrapper,
        {
          paddingHorizontal: paddingHorizontal,
          paddingVertical: paddingVertical,
          marginBottom: marginBottom,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              paddingVertical: continueButtonPadding,
              borderRadius: continueButtonRadius,
            },
            !isStepValid() && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!isStepValid()}
        >
          <Text style={[styles.continueText, { fontSize: continueFontSize }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    backgroundColor: '#3498ff',
  },
  stepText: {
    color: '#666',
    fontWeight: '500',
  },
  slide: {
    flexDirection: 'row',
    flex: 1,
  },
  buttonWrapper: {},
  continueButton: {
    backgroundColor: '#3498ff',
    alignItems: 'center',
  },
  continueText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
