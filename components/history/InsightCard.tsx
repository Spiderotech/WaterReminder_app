import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import Feather from 'react-native-vector-icons/Feather';

const InsightCard = () => (
  <View style={styles.card}>
    <LinearGradient colors={['#082a5e', '#07132a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardBackground} />
    <View style={styles.cardContent}>
      <HeartWater />
      <View style={styles.copy}>
        <Text style={styles.title}>Great Job 💙</Text>
        <Text style={styles.text}>
          You hydrated <Text style={styles.blueText}>18%</Text> more than last week.
        </Text>
      </View>
      <WaterMascot />
    </View>
  </View>
);

const HeartWater = () => (
  <Svg width={64} height={104} viewBox="0 0 118 126">
    <Defs>
      <SvgGradient id="heartWater" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#8af8ff" />
        <Stop offset="1" stopColor="#0a7dff" />
      </SvgGradient>
    </Defs>
    <Path d="M59 108 C15 72 8 40 25 24 C39 11 55 20 59 35 C63 20 79 11 93 24 C110 40 103 72 59 108 Z" fill="url(#heartWater)" stroke="#a8f6ff" strokeWidth={4} />
    <Path d="M25 63 Q58 80 94 59" stroke="#dcffff" strokeWidth={3} fill="none" opacity={0.78} />
  </Svg>
);

const WaterMascot = () => (
  <Svg width={64} height={110} viewBox="0 0 104 132">
    <Defs>
      <SvgGradient id="mascotDrop" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#75f1ff" />
        <Stop offset="1" stopColor="#0780ff" />
      </SvgGradient>
    </Defs>
    <Path d="M52 5 C35 34 20 56 20 82 C20 108 35 124 52 124 C69 124 84 108 84 82 C84 56 69 34 52 5 Z" fill="url(#mascotDrop)" stroke="#84efff" strokeWidth={3} />
    <Circle cx={40} cy={76} r={5} fill="#09254a" />
    <Circle cx={64} cy={76} r={5} fill="#09254a" />
    <Path d="M42 91 Q52 103 63 91" stroke="#09254a" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Circle cx={31} cy={88} r={5} fill="#ff83bd" opacity={0.75} />
    <Circle cx={73} cy={88} r={5} fill="#ff83bd" opacity={0.75} />
  </Svg>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(7,19,42,0.98)',
    borderColor: '#1075d5',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    minHeight: 178,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 178,
    padding: 18,
  },
  copy: {
    flex: 1,
    marginHorizontal: 14,
  },
  title: {
    color: '#24c2ff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  text: {
    color: '#f8fbff',
    fontSize: 13,
    lineHeight: 24,
  },
  blueText: {
    color: '#1ec4ff',
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#2774b8',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#bfe6ff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default InsightCard;
