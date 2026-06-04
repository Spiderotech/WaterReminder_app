import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { HydrationState } from './HydrationBottle';

type BottleGlowProps = {
  state: HydrationState;
  color?: string;
  style?: ViewStyle;
};

const glowByState: Record<HydrationState, { opacity: number; scale: number; duration: number }> = {
  dehydrated: { opacity: 0.1, scale: 1.02, duration: 2600 },
  balanced: { opacity: 0.16, scale: 1.035, duration: 2200 },
  hydrated: { opacity: 0.24, scale: 1.055, duration: 1800 },
  peak_performance: { opacity: 0.34, scale: 1.08, duration: 1350 },
};

const BottleGlow = ({ state, color = '#20d7ff', style }: BottleGlowProps) => {
  const pulse = useSharedValue(0);
  const config = glowByState[state];

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [config.duration, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: config.opacity + pulse.value * 0.08,
    transform: [{ scale: 1 + pulse.value * (config.scale - 1) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          shadowColor: color,
        },
        style,
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  glow: {
    backgroundColor: 'rgba(35, 190, 255, 0.035)',
    borderRadius: 999,
    bottom: 74,
    left: 62,
    position: 'absolute',
    right: 62,
    top: 108,
    shadowOpacity: 0.95,
    shadowRadius: 10,
  },
});

export default BottleGlow;
