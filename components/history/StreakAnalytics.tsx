import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HistoryAnalyticsSnapshot } from '../../services/historyAnalyticsService';

const streakImages: Record<'fire' | 'medal' | 'shield', ImageSourcePropType> = {
  fire: require('../../assets/streak3.png'),
  medal: require('../../assets/beststreak.png'),
  shield: require('../../assets/streak2.png'),
};

const StreakAnalytics = ({ snapshot }: { snapshot?: HistoryAnalyticsSnapshot }) => {
  const current = snapshot?.streak.current ?? 0;
  const best = snapshot?.streak.best ?? 0;
  const daysToBest = Math.max(best - current + 1, 0);

  return (
    <View style={styles.wrap}>
    <GradientFrame colors={['#34104f', '#11102a']} style={styles.currentCard} contentStyle={styles.currentCardContent}>
        <View style={styles.currentCopy}>
          <Text style={styles.purpleLabel}>Current Streak</Text>
          <View style={styles.valueRow}>
            <Text style={styles.heroNumber}>{current}</Text>
            <Text style={styles.heroUnit}>Days</Text>
          </View>
          <View style={styles.keepPill}>
            <MaterialCommunityIcons name="fire" size={18} color="#ff6938" />
            <Text style={styles.keepText}>Keep it up!</Text>
          </View>
        </View>
        <Image source={streakImages.fire} style={styles.fireImage} resizeMode="contain" />
    </GradientFrame>

    <GradientFrame colors={['#1a1038', '#0b1128']} style={styles.bestCard} contentStyle={styles.bestCardContent}>
        <View>
          <Text style={styles.purpleLabel}>Best Streak</Text>
          <View style={styles.inlineValue}>
            <Text style={styles.bestNumber}>{best}</Text>
            <Text style={styles.bestUnit}>Days</Text>
          </View>
          <View style={styles.recordRow}>
            <MaterialCommunityIcons name="medal-outline" size={18} color="#ba68ff" />
            <Text style={styles.recordText}>Your record!</Text>
          </View>
        </View>
        <Image source={streakImages.medal} style={styles.medalImage} resizeMode="contain" />
    </GradientFrame>

    <GradientFrame colors={['#101039', '#071229']} style={styles.calendarCard} contentStyle={styles.calendarCardContent}>
      <Text style={styles.sectionTitle}>Streak Calendar</Text>
      <View style={styles.calendarDays}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <View key={`${day}-${index}`} style={styles.dayColumn}>
            <Text style={styles.dayText}>{day}</Text>
            <View style={[styles.checkCircle, index < Math.min(current, 7) ? styles.checked : styles.empty]}>
              {index < Math.min(current, 7) ? <MaterialCommunityIcons name="check" size={19} color="#ffffff" /> : null}
            </View>
          </View>
        ))}
      </View>
    </GradientFrame>

    <GradientFrame colors={['#241052', '#111033']} style={styles.messageCard} contentStyle={styles.messageCardContent}>
      <Image source={streakImages.shield} style={styles.shieldImage} resizeMode="contain" />
      <View style={styles.messageCopy}>
        <Text style={styles.messageTitle}>{daysToBest ? `Only ${daysToBest} days left` : 'New record pace'}</Text>
        <Text style={styles.messageTitle}>to beat your best streak!</Text>
        <Text style={styles.messageSub}>{daysToBest ? "You're almost there!" : 'Keep the streak alive!'}</Text>
      </View>
    </GradientFrame>
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
  currentCard: {
    borderColor: '#9340cd',
    borderRadius: 18,
    minHeight: 176,
  },
  currentCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 20,
  },
  currentCopy: {
    flex: 1,
  },
  purpleLabel: {
    color: '#dd80ff',
    fontSize: 18,
    fontWeight: '700',
  },
  pinkLabel: {
    color: '#ffa4ff',
    fontSize: 18,
    fontWeight: '700',
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 12,
  },
  heroNumber: {
    color: '#ffffff',
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
  },
  heroUnit: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 5,
    marginLeft: 8,
  },
  keepPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#a755ef',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  keepText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  fireImage: {
    height: 150,
    marginRight: -8,
    width: 150,
  },
  bestCard: {
    borderColor: '#7536be',
    borderRadius: 18,
    minHeight: 126,
  },
  bestCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  inlineValue: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 8,
  },
  bestNumber: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  bestUnit: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 3,
    marginLeft: 6,
  },
  recordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  recordText: {
    color: '#df82ff',
    fontSize: 15,
  },
  medalImage: {
    height: 92,
    width: 92,
  },
  calendarCard: {
    borderColor: '#5130a1',
    borderRadius: 18,
  },
  calendarCardContent: {
    padding: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 12,
  },
  dayText: {
    color: '#ffffff',
    fontSize: 15,
  },
  checkCircle: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  checked: {
    backgroundColor: '#11c36c',
    shadowColor: '#1cff8c',
    shadowOpacity: 0.65,
    shadowRadius: 12,
  },
  empty: {
    borderColor: '#a666ff',
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  rewardCard: {
    alignItems: 'center',
    borderColor: '#6936bd',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 150,
    overflow: 'hidden',
    padding: 20,
  },
  rewardCopy: {
    flex: 1,
  },
  rewardTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  coinText: {
    color: '#ffd238',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  rewardProgress: {
    backgroundColor: 'rgba(104,116,171,0.28)',
    borderRadius: 6,
    height: 11,
    marginTop: 28,
    overflow: 'hidden',
    width: '88%',
  },
  rewardProgressFill: {
    backgroundColor: '#b44cff',
    borderRadius: 6,
    height: '100%',
    width: '78%',
  },
  daysLeft: {
    bottom: 20,
    color: '#d6d6f8',
    fontSize: 14,
    position: 'absolute',
    right: 22,
  },
  messageCard: {
    borderColor: '#6532b8',
    borderRadius: 18,
    minHeight: 134,
  },
  messageCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 18,
  },
  shieldImage: {
    height: 92,
    width: 92,
  },
  messageCopy: {
    flex: 1,
    marginLeft: 16,
  },
  messageTitle: {
    color: '#ffa4ff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },
  messageSub: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 12,
  },
});

export default StreakAnalytics;
