import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { slotProgress, weeklyTracker } from '../../constants/historyData';
import { HistoryAnalyticsSnapshot, HistorySlotMetric } from '../../services/historyAnalyticsService';

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const slotImages: Record<string, ImageSourcePropType> = {
  morning: require('../../assets/morning.png'),
  afternoon: require('../../assets/afternoon.png'),
  evening: require('../../assets/evening.png'),
};

const bottomCardImages = {
  bestSlot: require('../../assets/whatnext_3.png'),
  rewards: require('../../assets/coin3.png'),
};

const slotTheme = {
  morning: {
    border: '#c89215',
    icon: '#ffcf35',
    fill: '#f4ae19',
    bg: ['rgba(61,38,4,0.9)', 'rgba(6,14,28,0.95)'],
  },
  afternoon: {
    border: '#047ee8',
    icon: '#4ecaff',
    fill: '#43c8ff',
    bg: ['rgba(5,50,96,0.9)', 'rgba(6,14,28,0.95)'],
  },
  evening: {
    border: '#7c3cff',
    icon: '#965cff',
    fill: '#8a53ff',
    bg: ['rgba(39,17,82,0.9)', 'rgba(6,14,28,0.95)'],
  },
};

type SlotMetric = Omit<HistorySlotMetric, 'id'> & {
  id: keyof typeof slotTheme;
};

const SlotsAnalytics = ({ snapshot }: { snapshot?: HistoryAnalyticsSnapshot }) => {
  const slotItems: SlotMetric[] = (snapshot?.slotMetrics.length ? snapshot.slotMetrics : slotProgress).map(item => ({
    id: item.id as keyof typeof slotTheme,
    title: item.title,
    completed: item.completed,
    total: item.total,
  }));
  const tracker = (snapshot?.weeklyTracker.length ? snapshot.weeklyTracker : weeklyTracker).slice(-7);
  const bestSlot = slotItems.reduce<SlotMetric>((best, item) => (item.completed > best.completed ? item : best), slotItems[0]);
  const slotCoins = slotItems.reduce((sum: number, item: SlotMetric) => sum + item.completed * 25, 0);

  return (
    <View style={styles.wrap}>
      {slotItems.map(item => {
      const theme = slotTheme[item.id as keyof typeof slotTheme];
      const remaining = item.total - item.completed;

      return (
        <GradientFrame key={item.id} colors={theme.bg} style={[styles.slotCard, { borderColor: theme.border }]} contentStyle={styles.slotCardContent}>
          <View style={[styles.slotIconRing, { borderColor: theme.border }]}>
            <SlotIcon id={item.id} />
          </View>
          <View style={styles.slotCopy}>
            <Text style={styles.slotTitle}>{item.title}</Text>
            <Text style={styles.slotStatus}>Completed</Text>
            <Text style={styles.slotValue}>{item.completed} / {item.total}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: item.completed, backgroundColor: theme.fill }]} />
              <View style={{ flex: remaining }} />
            </View>
          </View>
        </GradientFrame>
      );
      })}

      <GradientFrame colors={['rgba(8,34,64,0.92)', 'rgba(6,14,28,0.95)']} style={styles.weeklyCard} contentStyle={styles.weeklyCardContent}>
        <Text style={styles.sectionTitle}>Weekly Slot Activity</Text>
        <View style={styles.daysRow}>
          {tracker.map((done, index) => (
            <View key={`${dayLabels[index]}-${index}`} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{dayLabels[index]}</Text>
              <View style={[styles.dayCircle, done ? styles.dayDone : styles.dayMissed]}>
                <MaterialCommunityIcons name={done ? 'check' : 'close'} size={20} color={done ? '#ffffff' : '#ff4f5d'} />
              </View>
            </View>
          ))}
        </View>
      </GradientFrame>

      <View style={styles.statRow}>
        <GradientFrame colors={['rgba(0,76,48,0.9)', 'rgba(5,24,32,0.95)']} style={[styles.infoCard, styles.greenCard]} contentStyle={styles.infoCardContent}>
          <View style={styles.infoTopRow}>
            <Image source={bottomCardImages.bestSlot} style={styles.infoImage} resizeMode="contain" />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Best Slot</Text>
              <Text style={styles.greenValue}>{bestSlot?.title || 'Morning'}</Text>
            </View>
          </View>
          <Text style={styles.infoText}>You perform best in this slot!</Text>
        </GradientFrame>

        <GradientFrame colors={['rgba(72,44,3,0.95)', 'rgba(12,17,28,0.95)']} style={[styles.infoCard, styles.goldCard]} contentStyle={styles.infoCardContent}>
          <View style={styles.infoTopRow}>
            <Image source={bottomCardImages.rewards} style={styles.infoImage} resizeMode="contain" />
            <View style={styles.infoCopy}>
              <Text style={[styles.infoLabel, styles.goldLabel]}>Rewards Earned</Text>
              <Text style={styles.goldValue}>{slotCoins}</Text>
              <Text style={styles.goldSub}>Coins</Text>
            </View>
          </View>
          <Text style={styles.infoText}>From slot completions</Text>
        </GradientFrame>
      </View>
    </View>
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

const SlotIcon = ({ id }: { id: string }) => (
  <Image source={slotImages[id]} style={styles.slotImage} resizeMode="contain" />
);

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    padding: 14,
  },
  gradientFrame: {
    backgroundColor: 'rgba(6,14,28,0.95)',
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
  slotCard: {
    borderRadius: 18,
    minHeight: 116,
  },
  slotCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  slotIconRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 44,
    borderWidth: 2,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  slotImage: {
    height: 68,
    width: 68,
  },
  slotCopy: {
    flex: 1,
    marginLeft: 18,
  },
  slotTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  slotStatus: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 4,
  },
  slotValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
  },
  progressTrack: {
    backgroundColor: 'rgba(157,173,211,0.22)',
    borderRadius: 5,
    flexDirection: 'row',
    height: 7,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 5,
  },
  weeklyCard: {
    borderColor: '#17558d',
    borderRadius: 18,
  },
  weeklyCardContent: {
    padding: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  dayDone: {
    backgroundColor: '#0fc36d',
    borderColor: '#52ffad',
    shadowColor: '#21ff8a',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  dayMissed: {
    backgroundColor: 'transparent',
    borderColor: '#ff4f5d',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    borderRadius: 18,
    flex: 1,
    minHeight: 164,
  },
  infoCardContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  greenCard: {
    borderColor: '#0ed67a',
  },
  goldCard: {
    borderColor: '#b77a0a',
  },
  infoTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoImage: {
    height: 58,
    width: 58,
  },
  infoCopy: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  goldLabel: {
    color: '#ffd23c',
  },
  greenValue: {
    color: '#29ff99',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
  },
  goldValue: {
    color: '#ffd23c',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: 8,
  },
  goldSub: {
    color: '#ffd23c',
    fontSize: 12,
    fontWeight: '800',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 27,
    marginTop: 24,
  },
  
});

export default SlotsAnalytics;
