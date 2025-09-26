import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

const activityOptions = [
  { key: 'sedentary', title: 'Sedentary', description: 'Limited physical activity, mostly sitting or lying down.', icon: require('../assets/alone.png') },
  { key: 'light', title: 'Light Activity', description: 'Some movement throughout the day, such as light walking or standing.', icon: require('../assets/walk.png') },
  { key: 'moderate', title: 'Moderate Active', description: 'Regular exercise like jogging or cycling.', icon: require('../assets/training.png') },
  { key: 'very', title: 'Very Active', description: 'Intense physical activity like heavy lifting or training.', icon: require('../assets/weightlifting.png') },
];

const climateOptions = [
  { key: 'hot', title: 'Hot', icon: require('../assets/contrast.png') },
  { key: 'temperate', title: 'Temperate', icon: require('../assets/sun.png') },
  { key: 'cold', title: 'Cold', icon: require('../assets/autumn.png') },
];

const isSmallDevice = width < 350 || height < 650;

const padding = isSmallDevice ? 8 : Math.max(18, width * 0.06);
const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
const subtitleFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.045);
const cardPadding = isSmallDevice ? 8 : Math.max(12, width * 0.045);
const cardRadius = isSmallDevice ? 8 : Math.max(12, width * 0.04);
const cardMarginBottom = isSmallDevice ? 8 : Math.max(20, height * 0.03);
const iconSize = isSmallDevice ? 24 : Math.max(36, width * 0.11);
const cardTitleFontSize = isSmallDevice ? 13 : Math.max(15, width * 0.05);
const cardDescFontSize = isSmallDevice ? 10 : Math.max(12, width * 0.035);
const climateTitleMarginTop = isSmallDevice ? 16 : Math.max(32, height * 0.04);

const ActivityLevelAndClimateStep = ({ onDataChange, selectedData = {} }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [activity, setActivity] = useState(selectedData.activityLevel || null);
  const [climate, setClimate] = useState(selectedData.climate || null);

  useEffect(() => {
    if (activity && climate) {
      onDataChange?.({ activityLevel: activity, climate });
    }
  }, [activity, climate]);

  const bgColor = dark ? '#000' : '#fff';
  const cardBg = dark ? '#222' : '#f3f4f6';
  const cardSelectedBg = dark ? '#3498ff' : '#e6f0ff';
  const textColor = dark ? '#fff' : '#000';
  const subtitleColor = dark ? '#aaa' : '#666';
  const descColor = dark ? '#ccc' : '#555';
  const borderColor = dark ? '#3498ff' : '#3498ff';
  

  return (
    <ScrollView style={[styles.container, { padding, backgroundColor: bgColor }]}>
      <Text style={[styles.title, { fontSize: titleFontSize, color: textColor }]}>
       What’s Your Activity Level?
      </Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: subtitleColor }]}>
        Understanding your activity is vital for crafting a personalized hydration plan.
      </Text>

      {activityOptions.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.card,
            { padding: cardPadding, borderRadius: cardRadius, marginBottom: cardMarginBottom, backgroundColor: activity === item.key ? cardSelectedBg : cardBg, borderColor: activity === item.key ? borderColor : 'transparent' },
          ]}
          onPress={() => setActivity(item.key)}
        >
          <Image source={item.icon} style={[styles.icon, { width: iconSize, height: iconSize, marginRight: cardPadding }]} />
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { fontSize: cardTitleFontSize, color: textColor }]}>{item.title}</Text>
            <Text style={[styles.cardDescription, { fontSize: cardDescFontSize, color: descColor }]}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={[styles.title, { fontSize: titleFontSize, marginTop: climateTitleMarginTop, color: textColor }]}>
        What’s The Climate/Weather Like In Your Area?
      </Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: subtitleColor }]}>
        External factors like weather can influence your hydration needs.
      </Text>

      {climateOptions.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.card,
            { padding: cardPadding, borderRadius: cardRadius, marginBottom: cardMarginBottom, backgroundColor: climate === item.key ? cardSelectedBg : cardBg, borderColor: climate === item.key ? borderColor : 'transparent' },
          ]}
          onPress={() => setClimate(item.key)}
        >
          <Image source={item.icon} style={[styles.icon, { width: iconSize, height: iconSize, marginRight: cardPadding }]} />
          <Text style={[styles.cardTitle, { fontSize: cardTitleFontSize, color: textColor }]}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ActivityLevelAndClimateStep;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700', marginBottom: 8 },
  subtitle: { marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  icon: { resizeMode: 'contain' },
  cardText: { flex: 1 },
  cardTitle: { fontWeight: '600' },
  cardDescription: { marginTop: 4 },
});
