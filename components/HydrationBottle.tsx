import React, { useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import BottleGlow from './BottleGlow';
import WaterFill from './WaterFill';

export type HydrationState = 'dehydrated' | 'balanced' | 'hydrated' | 'peak_performance';

export type HydrationBottleProps = {
  progress: number;
  mlIntake: number;
  goalMl?: number;
  bottleSource?: ImageSourcePropType;
  height?: number;
  state?: HydrationState;
  colors?: Partial<Record<HydrationState, [string, string, string]>>;
  showReadout?: boolean;
  style?: ViewStyle;
};

const defaultBottleSource = require('../assets/hydaration.png') as ImageSourcePropType;

const fillColors: Record<HydrationState, [string, string, string]> = {
  dehydrated: ['rgba(54,155,229,0.54)', 'rgba(0,94,202,0.7)', 'rgba(0,45,136,0.86)'],
  balanced: ['rgba(85,216,255,0.66)', 'rgba(6,133,255,0.78)', 'rgba(0,65,179,0.9)'],
  hydrated: ['rgba(106,239,255,0.82)', 'rgba(0,162,255,0.88)', 'rgba(0,79,218,0.96)'],
  peak_performance: ['rgba(161,255,255,0.92)', 'rgba(22,207,255,0.94)', 'rgba(42,91,255,0.98)'],
};

const waveColors: Record<HydrationState, string> = {
  dehydrated: 'rgba(48,170,255,0.86)',
  balanced: 'rgba(63,207,255,0.92)',
  hydrated: 'rgba(104,238,255,0.98)',
  peak_performance: 'rgba(158,255,255,1)',
};

const glowColors: Record<HydrationState, string> = {
  dehydrated: '#126fff',
  balanced: '#16b8ff',
  hydrated: '#28dcff',
  peak_performance: '#72f8ff',
};

export const getHydrationState = (progress: number): HydrationState => {
  if (progress < 33) return 'dehydrated';
  if (progress < 66) return 'balanced';
  if (progress < 90) return 'hydrated';
  return 'peak_performance';
};

const HydrationBottle = ({
  progress,
  mlIntake,
  goalMl = 3000,
  bottleSource = defaultBottleSource,
  height = 310,
  state,
  colors,
  showReadout = false,
  style,
}: HydrationBottleProps) => {
  const resolvedState = state || getHydrationState(progress);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const bottleWidth = Math.round(height * 0.43);
  const maskWidth = Math.round(bottleWidth * 0.5);
  const maskHeight = Math.round(height * 0.66);
  const idle = useSharedValue(0);

  React.useEffect(() => {
    idle.value = withRepeat(withTiming(1, { duration: 3200 }), -1, true);
  }, [idle]);

  const idleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(idle.value, [0, 1], [0, -3]) },
      { scale: interpolate(idle.value, [0, 1], [1, 1.01]) },
    ],
  }));

  const stateColors = useMemo(
    () => ({
      fill: colors?.[resolvedState] || fillColors[resolvedState],
      wave: waveColors[resolvedState],
      glow: glowColors[resolvedState],
    }),
    [colors, resolvedState],
  );

  return (
    <View style={[styles.shell, { height, width: bottleWidth + 36 }, style]}>
      <BottleGlow state={resolvedState} color={stateColors.glow} />
      <Animated.View style={[styles.bottleStage, idleStyle]}>
        <View
          style={[
            styles.innerMask,
            {
              bottom: Math.round(height * 0.055),
              height: maskHeight,
              width: maskWidth,
            },
          ]}
        >
          <WaterFill
            progress={clampedProgress}
            width={maskWidth}
            height={maskHeight}
            state={resolvedState}
            colors={stateColors.fill}
            waveColor={stateColors.wave}
            glowColor={stateColors.glow}
          />
        </View>
        <Image source={bottleSource} style={[styles.bottleImage, { height, width: bottleWidth }]} resizeMode="contain" />
      </Animated.View>
      {showReadout ? (
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{Math.round(clampedProgress)}%</Text>
          <Text style={styles.readoutLabel}>{mlIntake} / {goalMl} ml</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bottleImage: {
    zIndex: 3,
  },
  bottleStage: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  innerMask: {
    alignSelf: 'center',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 1,
  },
  readout: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  readoutLabel: {
    color: '#b9c7e6',
    fontSize: 11,
    marginTop: 2,
  },
  readoutValue: {
    color: '#35d9ff',
    fontSize: 18,
    fontWeight: '900',
  },
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HydrationBottle;
