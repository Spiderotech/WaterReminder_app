import React from 'react';
import { FlatList, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { competitions } from '../../constants/historyData';

const CompetitionAnalytics = () => (
  <View style={styles.wrap}>
    <Text style={styles.title}>Weekly Challenges</Text>
    <FlatList
      data={competitions}
      keyExtractor={item => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <GradientFrame colors={['#102853', '#07152d']} style={styles.challenge} contentStyle={styles.challengeContent}>
          <MaterialCommunityIcons name={item.icon} size={34} color="#ffd447" />
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.rank}>{item.rank}</Text>
          </View>
          <Text style={styles.reward}>{item.reward}</Text>
        </GradientFrame>
      )}
    />

    <View style={styles.stats}>
      <Stat label="Total competitions" value="18" />
      <Stat label="Best rank" value="#7" />
    </View>

    <GradientFrame colors={['#61400a', '#11172a']} style={styles.ctaCard} contentStyle={styles.ctaCardContent}>
      <Trophy />
      <View style={styles.ctaCopy}>
        <Text style={styles.ctaTitle}>Ready for the next climb?</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.button}>
          <Text style={styles.buttonText}>Join New Competition</Text>
        </TouchableOpacity>
      </View>
    </GradientFrame>
  </View>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <GradientFrame colors={['#10244a', '#07152d']} style={styles.stat} contentStyle={styles.statContent}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
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

const Trophy = () => (
  <Svg width={96} height={104} viewBox="0 0 96 104">
    <Path d="M25 12 H71 V38 C71 55 60 66 48 66 C36 66 25 55 25 38 Z" fill="#ffd447" stroke="#fff1a1" strokeWidth={3} />
    <Path d="M25 20 H8 C8 43 17 52 29 53" fill="none" stroke="#ffd447" strokeWidth={8} strokeLinecap="round" />
    <Path d="M71 20 H88 C88 43 79 52 67 53" fill="none" stroke="#ffd447" strokeWidth={8} strokeLinecap="round" />
    <Path d="M43 66 H53 V82 H70 V94 H26 V82 H43 Z" fill="#f0a51e" />
  </Svg>
);

const styles = StyleSheet.create({
  wrap: {
    padding: 18,
    gap: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
  },
  gradientFrame: {
    backgroundColor: 'rgba(7,21,45,0.98)',
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
  challenge: {
    borderColor: '#315b93',
    borderRadius: 18,
    marginBottom: 12,
    minHeight: 84,
  },
  challengeContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  challengeCopy: {
    flex: 1,
    marginLeft: 12,
  },
  challengeTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
  rank: {
    color: '#b9c3dd',
    fontSize: 16,
    marginTop: 4,
  },
  reward: {
    color: '#ffd447',
    fontSize: 16,
    fontWeight: '900',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    borderColor: '#315b93',
    borderRadius: 17,
    flex: 1,
  },
  statContent: {
    padding: 18,
  },
  statLabel: {
    color: '#b9c3dd',
    fontSize: 15,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },
  ctaCard: {
    borderColor: '#d69a24',
    borderRadius: 20,
  },
  ctaCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 18,
  },
  ctaCopy: {
    flex: 1,
    marginLeft: 14,
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 14,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffd447',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: {
    color: '#2c2208',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default CompetitionAnalytics;
