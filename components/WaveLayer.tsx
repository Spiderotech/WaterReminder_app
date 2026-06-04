import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { HydrationState } from './HydrationBottle';

type WaveLayerProps = {
  width: number;
  color: string;
  highlightColor?: string;
  state: HydrationState;
};

const speedByState: Record<HydrationState, number> = {
  dehydrated: 3600,
  balanced: 2900,
  hydrated: 2200,
  peak_performance: 1550,
};

const amplitudeByState: Record<HydrationState, number> = {
  dehydrated: 3,
  balanced: 5,
  hydrated: 7,
  peak_performance: 9,
};

const WaveLayer = ({ width, color, highlightColor = '#bff8ff', state }: WaveLayerProps) => {
  const waveOffset = useSharedValue(0);
  const waveWidth = width * 2;
  const amplitude = amplitudeByState[state];

  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(-width, { duration: speedByState[state], easing: Easing.linear }),
      -1,
      false,
    );
  }, [state, waveOffset, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }],
  }));

  const wavePath = `M0 ${22 + amplitude}
    C ${width * 0.18} ${10} ${width * 0.34} ${34 + amplitude} ${width * 0.5} ${22 + amplitude}
    C ${width * 0.68} ${10} ${width * 0.84} ${34 + amplitude} ${width} ${22 + amplitude}
    C ${width * 1.18} ${10} ${width * 1.34} ${34 + amplitude} ${width * 1.5} ${22 + amplitude}
    C ${width * 1.68} ${10} ${width * 1.84} ${34 + amplitude} ${waveWidth} ${22 + amplitude}
    L ${waveWidth} 44 L 0 44 Z`;

  const highlightPath = `M0 ${21 + amplitude}
    C ${width * 0.22} ${15} ${width * 0.33} ${28 + amplitude} ${width * 0.5} ${21 + amplitude}
    C ${width * 0.73} ${14} ${width * 0.86} ${27 + amplitude} ${width} ${21 + amplitude}
    C ${width * 1.22} ${15} ${width * 1.33} ${28 + amplitude} ${width * 1.5} ${21 + amplitude}
    C ${width * 1.73} ${14} ${width * 1.86} ${27 + amplitude} ${waveWidth} ${21 + amplitude}`;

  return (
    <View pointerEvents="none" style={styles.shell}>
      <Animated.View style={[styles.waveTrack, animatedStyle]}>
        <Svg width={waveWidth} height={44}>
          <Path d={wavePath} fill={color} />
          <Path d={highlightPath} stroke={highlightColor} strokeWidth={2.2} fill="none" opacity={0.9} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    height: 44,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: -32,
  },
  waveTrack: {
    height: 44,
    position: 'absolute',
  },
});

export default WaveLayer;
