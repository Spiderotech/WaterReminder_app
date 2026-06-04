import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { hydrationTrend } from '../../constants/historyData';
import { HistoryAnalyticsSnapshot, HistoryRecentTap } from '../../services/historyAnalyticsService';
import HistoryChart from './HistoryChart';
import InsightCard from './InsightCard';

const waterImage = require('../../assets/waterglass.png');

const HydrationAnalytics = ({ snapshot }: { snapshot?: HistoryAnalyticsSnapshot }) => {
  const chartData = snapshot?.chart.length ? snapshot.chart : hydrationTrend;
  const average = snapshot?.weeklyAverageLiters || 0;
  const bestDay = snapshot?.bestDay || { label: 'Thursday', liters: 2.6 };
  const recentTaps = snapshot?.recentTaps || [];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Hydration Trend</Text>
          <Feather name="info" size={16} color="#8794bd" />
        </View>
        <View style={styles.unit}>
          <Text style={styles.unitText}>Liters</Text>
          <Feather name="chevron-down" size={18} color="#56cbff" />
        </View>
      </View>

      <HistoryChart data={chartData} />

      <GradientFrame colors={['#081d3d', '#07142c']} style={styles.statsFrame} contentStyle={styles.stats}>
          <Stat icon="glass-cocktail" label="Average" value={`${average.toFixed(2)}L/day`} />
          <View style={styles.divider} />
          <Stat icon="fire" label="Best Day" value={`${bestDay.label} ${bestDay.liters.toFixed(1)}L`} />
          <View style={styles.divider} />
          <Stat icon="target" label="Goal" value="3L/day" />
      </GradientFrame>

      <RecentTaps taps={recentTaps} />

      <InsightCard />
    </View>
  );
};

const Stat = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.stat}>
    <MaterialCommunityIcons name={icon} size={30} color="#35c8ff" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const RecentTaps = ({ taps }: { taps: HistoryRecentTap[] }) => {
  const total = taps.reduce((sum, tap) => sum + tap.amount, 0);

  return (
    <GradientFrame colors={['rgba(6,34,72,0.98)', 'rgba(4,14,33,0.98)']} style={styles.recentFrame} contentStyle={styles.recentCard}>
      <View style={styles.recentHeader}>
        <View>
          <Text style={styles.recentTitle}>Recent Taps</Text>
          <Text style={styles.recentSubtitle}>Latest water entries from today</Text>
        </View>
        <View style={styles.recentBadge}>
          <Text style={styles.recentBadgeText}>{total || 0} ml</Text>
        </View>
      </View>

      {taps.length ? (
        <View style={styles.tapList}>
          {taps.map((tap, index) => (
            <View key={tap.id} style={[styles.tapRow, index === taps.length - 1 && styles.tapRowLast]}>
              <View style={styles.tapIconWrap}>
                <Image source={waterImage} style={styles.tapImage} resizeMode="contain" />
              </View>
              <View style={styles.tapCopy}>
                <Text style={styles.tapTitle}>Water Tap</Text>
                <Text style={styles.tapTime}>{tap.time}</Text>
              </View>
              <Text style={styles.tapAmount}>{tap.amount} ml</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyTaps}>
          <MaterialCommunityIcons name="cup-water" size={30} color="#35c8ff" />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>No taps logged today</Text>
            <Text style={styles.emptyText}>Your latest Home screen taps will appear here.</Text>
          </View>
        </View>
      )}
    </GradientFrame>
  );
};

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

const styles = StyleSheet.create({
  wrap: {
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
  },
  unit: {
    alignItems: 'center',
    backgroundColor: '#091835',
    borderColor: '#2b578e',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  unitText: {
    color: '#ffffff',
    fontSize: 16,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
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
  statsFrame: {
    borderColor: '#214775',
    borderRadius: 18,
  },
  stats: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 96,
    paddingHorizontal: 14,
  },
  recentFrame: {
    borderColor: '#214775',
    borderRadius: 18,
    marginTop: 14,
  },
  recentCard: {
    padding: 14,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  recentSubtitle: {
    color: '#aeb7d1',
    fontSize: 11,
    marginTop: 3,
  },
  recentBadge: {
    backgroundColor: 'rgba(22,192,255,0.15)',
    borderColor: '#16c0ff',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recentBadgeText: {
    color: '#35d9ff',
    fontSize: 12,
    fontWeight: '900',
  },
  tapList: {
    borderColor: 'rgba(48,92,148,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tapRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,21,48,0.74)',
    borderBottomColor: 'rgba(63,103,158,0.34)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 10,
  },
  tapRowLast: {
    borderBottomWidth: 0,
  },
  tapIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(20,137,255,0.14)',
    borderColor: '#1a7bd8',
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginRight: 10,
    width: 38,
  },
  tapImage: {
    height: 27,
    width: 27,
  },
  tapCopy: {
    flex: 1,
  },
  tapTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  tapTime: {
    color: '#aeb7d1',
    fontSize: 11,
    marginTop: 3,
  },
  tapAmount: {
    color: '#35d9ff',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyTaps: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,21,48,0.74)',
    borderColor: 'rgba(48,92,148,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    padding: 12,
  },
  emptyCopy: {
    flex: 1,
    marginLeft: 11,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyText: {
    color: '#aeb7d1',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    color: '#aeb7d1',
    fontSize: 14,
    marginTop: 6,
  },
  statValue: {
    color: '#16c0ff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    backgroundColor: '#203b61',
    height: 54,
    width: 1,
  },
});

export default HydrationAnalytics;
