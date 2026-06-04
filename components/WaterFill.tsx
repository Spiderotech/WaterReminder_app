import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import BubbleAnimation from './BubbleAnimation';
import type { HydrationState } from './HydrationBottle';
import WaveLayer from './WaveLayer';

type WaterFillProps = {
  progress: number;
  width: number;
  height: number;
  state: HydrationState;
  colors: [string, string, string];
  waveColor: string;
  glowColor: string;
};

const WaterFill = ({
  progress,
  width,
  height,
  state,
  colors,
  waveColor,
  glowColor,
}: WaterFillProps) => {
  const animatedProgress = useSharedValue(0);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const hasWater = clampedProgress > 2;

  useEffect(() => {
    animatedProgress.value = withSpring(clampedProgress, {
      damping: 18,
      mass: 0.7,
      stiffness: 95,
    });
  }, [animatedProgress, clampedProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    height: interpolate(animatedProgress.value, [0, 100], [0, height]),
  }));

  const surfaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedProgress.value, [0, 2, 100], [0, 0.65, 1]),
    transform: [{ translateY: interpolate(animatedProgress.value, [0, 100], [8, 0]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedProgress.value, [0, 2, 100], [0, 0.12, 0.72]),
    transform: [{ scale: interpolate(animatedProgress.value, [0, 100], [0.9, 1.12]) }],
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.bottomGlow, { backgroundColor: glowColor, shadowColor: glowColor }, glowStyle]} />
      <Animated.View style={[styles.fill, fillStyle]}>
        <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
        {hasWater ? <BubbleAnimation state={state} width={width} height={height} /> : null}
      </Animated.View>
      {hasWater ? (
        <Animated.View style={[styles.wave, fillStyle, surfaceStyle]}>
          <WaveLayer width={width} color={waveColor} state={state} />
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomGlow: {
    alignSelf: 'center',
    borderRadius: 20,
    bottom: -4,
    height: 16,
    position: 'absolute',
    shadowOpacity: 0.95,
    shadowRadius: 18,
    width: '76%',
  },
  container: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fill: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  wave: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export default WaterFill;
