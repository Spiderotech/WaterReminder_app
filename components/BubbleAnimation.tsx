import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { HydrationState } from './HydrationBottle';

type BubbleAnimationProps = {
  state: HydrationState;
  width: number;
  height: number;
  color?: string;
};

const countByState: Record<HydrationState, number> = {
  dehydrated: 2,
  balanced: 4,
  hydrated: 6,
  peak_performance: 8,
};

const Bubble = memo(({
  index,
  width,
  height,
  color,
}: {
  index: number;
  width: number;
  height: number;
  color: string;
}) => {
  const drift = useSharedValue(0);
  const opacity = useSharedValue(0);
  const size = 4 + (index % 3) * 2;
  const left = 8 + ((index * 17) % Math.max(width - 18, 18));
  const duration = 2600 + index * 280;

  useEffect(() => {
    drift.value = withDelay(
      index * 220,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 80 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      index * 220,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 520 }),
          withTiming(0.15, { duration: duration - 520 }),
          withTiming(0, { duration: 80 }),
        ),
        -1,
        false,
      ),
    );
  }, [drift, duration, index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: -drift.value * height * 0.85 },
      { translateX: Math.sin(drift.value * Math.PI * 2) * (5 + (index % 2) * 3) },
      { scale: 0.75 + drift.value * 0.35 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          borderColor: color,
          height: size,
          left,
          width: size,
        },
        animatedStyle,
      ]}
    />
  );
});

const BubbleAnimation = ({ state, width, height, color = 'rgba(185,246,255,0.85)' }: BubbleAnimationProps) => {
  const count = countByState[state];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, index) => (
        <Bubble key={index} index={index} width={width} height={height} color={color} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 999,
    borderWidth: 1.2,
    bottom: 4,
    position: 'absolute',
  },
});

export default BubbleAnimation;
