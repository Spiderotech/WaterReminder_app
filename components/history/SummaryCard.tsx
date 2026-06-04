import React from 'react';
import { Dimensions, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SummaryCardData } from '../../constants/historyData';

interface SummaryCardProps {
  item: SummaryCardData;
}

const accentByVariant = {
  water: '#39d9ff',
  streak: '#e26bff',
  coins: '#ffd24d',
  completion: '#5cff91',
};

const iconByVariant = {
  water: 'water',
  streak: 'fire',
  coins: 'star-circle',
  completion: 'target',
};

const artByVariant: Record<SummaryCardData['variant'], ImageSourcePropType> = {
  water: require('../../assets/waterglass.png'),
  streak: require('../../assets/streak2.png'),
  coins: require('../../assets/coin2.png'),
  completion: require('../../assets/protip1.png'),
};

const { width } = Dimensions.get('window');
const screenPadding = 14;
const summaryGap = 14;
const isPhoneWidth = width < 430;
const cardWidth = (width - screenPadding * 2 - summaryGap) / 2;
const cardMinHeight = Math.max(178, Math.min(194, width * 0.44));

const SummaryCard = ({ item }: SummaryCardProps) => {
  const accent = accentByVariant[item.variant];

  return (
    <View style={styles.wrap}>
      <View style={[styles.cardFrame, { borderColor: accent }]}>
        <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardBackground} />
        <View style={styles.cardContent}>
          <View style={styles.contentRow}>
            <View style={styles.copy}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons name={iconByVariant[item.variant]} size={22} color={accent} style={styles.labelIcon} />
                <Text style={[styles.title, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{item.value}</Text>
              <Text style={styles.caption} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{item.caption}</Text>
            </View>
            <View style={styles.art}>
              <Image source={artByVariant[item.variant]} style={styles.artImage} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.divider} />
          {item.trend ? <TrendText trend={item.trend} /> : (
            <Text style={[styles.trend, styles.footerText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.footer}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const TrendText = ({ trend }: { trend: string }) => {
  if (!trend.startsWith('+') && !trend.startsWith('-')) {
    return <Text style={[styles.trend, styles.trendMuted]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{trend}</Text>;
  }

  const [percentage, ...rest] = trend.split(' ');

  return (
    <Text style={[styles.trend, styles.trendText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
      ↑ {percentage} <Text style={styles.trendMuted}>{rest.join(' ')}</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: cardWidth,
  },
  cardFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: cardMinHeight,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    minHeight: cardMinHeight,
    paddingHorizontal: isPhoneWidth ? 12 : 14,
    paddingVertical: 13,
    width: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 104,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  labelIcon: {
    marginRight: 7,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: isPhoneWidth ? 10.5 : 11,
    fontWeight: '800',
  },
  value: {
    color: '#eff7ff',
    fontSize: isPhoneWidth ? 24 : 26,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
    marginTop: 17,
    textShadowColor: 'rgba(145, 215, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  caption: {
    color: '#eef2ff',
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 5,
  },
  divider: {
    backgroundColor: 'rgba(180,210,255,0.12)',
    height: 1,
    marginTop: 11,
    width: '72%',
  },
  trend: {
    fontWeight: '800',
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 8,
  },
  trendText: {
    color: '#40ff91',
  },
  trendMuted: {
    color: '#b9bfd4',
    fontWeight: '500',
  },
  footerText: {
    color: '#ff8cff',
  },
  art: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    marginLeft: 4,
    width: isPhoneWidth ? 62 : 74,
  },
  artImage: {
    height: isPhoneWidth ? 62 : 72,
    width: isPhoneWidth ? 62 : 72,
  },
});

export default SummaryCard;
