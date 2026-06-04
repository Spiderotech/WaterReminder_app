import React from 'react';
import { FlatList, Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { donutSegments, rewardBreakdown } from '../../constants/historyData';
import { HistoryAnalyticsSnapshot, HistoryDonutSegment } from '../../services/historyAnalyticsService';

const walletImages: Record<'coins' | 'diamonds' | 'week', ImageSourcePropType> = {
  coins: require('../../assets/coin2.png'),
  diamonds: require('../../assets/diamond.png'),
  week: require('../../assets/reward.png'),
};

const rewardImages: Record<string, ImageSourcePropType> = {
  morning: require('../../assets/morning.png'),
  slots: require('../../assets/morning.png'),
  bonus: require('../../assets/reward.png'),
  challenge: require('../../assets/challenge.png'),
  spin: require('../../assets/spiner.png'),
  ads: require('../../assets/reward.png'),
};

const treasureImage = require('../../assets/coinbox.png');
const coinImage = require('../../assets/coin1.png');

const RewardsAnalytics = ({ snapshot }: { snapshot?: HistoryAnalyticsSnapshot }) => {
  const breakdown = snapshot?.rewardBreakdown.length ? snapshot.rewardBreakdown : rewardBreakdown;
  const segments = snapshot?.donutSegments.length ? snapshot.donutSegments : donutSegments;

  return (
    <View style={styles.wrap}>
    <View style={styles.walletRow}>
      <WalletCard variant="coins" label="Coins" value={(snapshot?.wallet.coins ?? 340).toLocaleString()} border="#b57905" />
      <WalletCard variant="diamonds" label="Diamonds" value={(snapshot?.wallet.diamonds ?? 12).toLocaleString()} border="#037ddd" />
      <WalletCard variant="week" label={snapshot?.periodLabel || 'This Week'} value={`+${snapshot?.rewardsThisWeek ?? 90}`} sub="Rewards" border="#08b767" />
    </View>

    <GradientFrame colors={['rgba(8,28,55,0.95)', 'rgba(7,14,28,0.98)']} style={styles.breakdownCard} contentStyle={styles.breakdownCardContent}>
      <Text style={styles.sectionTitle}>Rewards Breakdown</Text>
      <FlatList
        data={breakdown}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.rewardRow}>
            <RewardIcon id={item.id} />
            <Text style={styles.rewardLabel}>{item.label === 'Spin' ? 'Spin Reward' : item.label}</Text>
            <Text style={styles.rewardValue}>{item.value}</Text>
            <Image source={coinImage} style={styles.rowCoin} resizeMode="contain" />
          </View>
        )}
      />
    </GradientFrame>

    <GradientFrame colors={['rgba(55,35,5,0.92)', 'rgba(7,14,28,0.98)']} style={styles.sourceCard} contentStyle={styles.sourceCardContent}>
      <Text style={styles.sectionTitle}>Rewards Source</Text>
      <View style={styles.sourceBody}>
        <DonutChart segments={segments} />
        <View style={styles.legend}>
          {segments.map(segment => (
            <View key={segment.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendLabel}>{segment.label}</Text>
              <Text style={styles.legendValue}>{segment.value}%</Text>
            </View>
          ))}
        </View>
      </View>
    </GradientFrame>

    <GradientFrame colors={['rgba(7,31,62,0.95)', 'rgba(7,14,28,0.98)']} style={styles.treasureCard} contentStyle={styles.treasureCardContent}>
      <Text style={styles.treasureText}>Keep earning rewards{'\n'}and stay hydrated!</Text>
      <Image source={treasureImage} style={styles.treasureImage} resizeMode="contain" />
    </GradientFrame>
  </View>
  );
};

const WalletCard = ({
  variant,
  label,
  value,
  sub,
  border,
}: {
  variant: 'coins' | 'diamonds' | 'week';
  label: string;
  value: string;
  sub?: string;
  border: string;
}) => (
  <GradientFrame colors={['rgba(8,28,53,0.98)', 'rgba(5,13,28,0.98)']} style={[styles.wallet, { borderColor: border }]} contentStyle={styles.walletContent}>
    <Image source={walletImages[variant]} style={styles.walletImage} resizeMode="contain" />
    <Text style={styles.walletLabel}>{label}</Text>
    <Text style={variant === 'week' ? styles.weekValue : styles.walletValue}>{value}</Text>
    {sub ? <Text style={styles.walletSub}>{sub}</Text> : null}
  </GradientFrame>
);

const GradientFrame = ({
  children,
  colors,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    <View style={[styles.gradientContent, contentStyle]}>
      {children}
    </View>
  </View>
);

const RewardIcon = ({ id }: { id: string }) => (
  <Image source={rewardImages[id] || coinImage} style={styles.rewardIcon} resizeMode="contain" />
);

const DonutChart = ({ segments }: { segments: HistoryDonutSegment[] }) => {
  const center = 68;
  const outerRadius = 58;
  const innerRadius = 30;
  let startAngle = -90;

  return (
    <View style={styles.donutWrap}>
      <Svg width={136} height={136} viewBox="0 0 136 136">
        <Circle cx={center} cy={center} r={outerRadius + 4} fill="#071225" />
        {segments.map(segment => {
          const sweepAngle = segment.value / 100 * 360;
          const path = describeDonutSegment(center, center, outerRadius, innerRadius, startAngle, startAngle + sweepAngle);
          startAngle += sweepAngle;

          return <Path key={segment.label} d={path} fill={segment.color} />;
        })}
        <Circle cx={center} cy={center} r={innerRadius} fill="#06101f" />
      </Svg>
    </View>
  );
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = angleInDegrees * Math.PI / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeDonutSegment = (
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};
const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    padding: 14,
  },
  walletRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gradientFrame: {
    backgroundColor: 'rgba(7,14,28,0.98)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientContent: {
    flex: 1,
  },
  wallet: {
    borderRadius: 16,
    flex: 1,
    minHeight: 172,
  },
  walletContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  walletLabel: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  walletValue: {
    color: '#ffffff',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 8,
  },
  weekValue: {
    color: '#a9fff2',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 8,
  },
  walletSub: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 2,
  },
  walletImage: {
    height: 64,
    width: 64,
  },
  breakdownCard: {
    borderColor: '#26476f',
    borderRadius: 18,
  },
  breakdownCardContent: {
    padding: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  rewardRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(122,156,204,0.16)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  rewardLabel: {
    color: '#ffffff',
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  rewardValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    marginRight: 8,
  },
  rewardIcon: {
    height: 28,
    width: 28,
  },
  rowCoin: {
    height: 20,
    width: 20,
  },
  sourceCard: {
    borderColor: '#b57905',
    borderRadius: 18,
  },
  sourceCardContent: {
    padding: 18,
  },
  sourceBody: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  donutWrap: {
    alignItems: 'center',
    height: 136,
    justifyContent: 'center',
    width: 136,
  },
  legend: {
    flex: 1,
    marginLeft: 18,
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  legendDot: {
    borderRadius: 4,
    height: 13,
    marginRight: 10,
    width: 13,
  },
  legendLabel: {
    color: '#ffffff',
    flex: 1,
    fontSize: 15,
  },
  legendValue: {
    color: '#ffffff',
    fontSize: 15,
  },
  treasureCard: {
    borderColor: '#174a86',
    borderRadius: 18,
    minHeight: 132,
  },
  treasureCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  treasureText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 29,
  },
  treasureImage: {
    height: 112,
    width: 128,
  },
});

export default RewardsAnalytics;
