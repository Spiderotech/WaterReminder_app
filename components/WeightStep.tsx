import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');
const WEIGHT_KG = Array.from({ length: 150 }, (_, i) => 30 + i);

const WeightStep = ({ selectedData = {}, onDataChange }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  const [selectedWeight, setSelectedWeight] = useState(selectedData.weight );
  const isSmallDevice = width < 350 || height < 650;

  const padding = isSmallDevice ? 10 : Math.max(16, width * 0.06);
  const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
  const subtitleFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.045);
  const subtitleMarginBottom = isSmallDevice ? 12 : Math.max(18, height * 0.025);
  const bodyImageWidth = isSmallDevice ? 70 : Math.max(90, width * 0.28);
  const bodyImageHeight = isSmallDevice ? 160 : Math.max(220, height * 0.38);
  const weightListMaxHeight = isSmallDevice ? 140 : Math.max(180, height * 0.45);
  const weightItemFontSize = isSmallDevice ? 16 : Math.max(20, width * 0.06);
  const weightItemPaddingV = isSmallDevice ? 2 : Math.max(4, height * 0.008);

  useEffect(() => {
    onDataChange?.({ weight: selectedWeight, weightUnit: 'kg' });
  }, [selectedWeight]);

  return (
    <View style={[styles.container, { padding, backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { fontSize: titleFontSize, color: dark ? '#fff' : '#000' }]}>How much do you weigh?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom, color: dark ? '#aaa' : '#555' }]}>
        Your weight plays a crucial role in determining your hydration needs.
      </Text>

      <View style={styles.bodyRow}>
        <Image
          source={require('../assets/weight.png')}
          style={{ width: bodyImageWidth, height: bodyImageHeight }}
          resizeMode="contain"
        />

        <FlatList
          data={WEIGHT_KG}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: weightListMaxHeight }}
          contentContainerStyle={{ alignItems: 'center' }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedWeight(item)}>
              <Text
                style={{
                  fontSize: weightItemFontSize,
                  paddingVertical: weightItemPaddingV,
                  color: item === selectedWeight ? '#3498ff' : dark ? '#ccc' : '#555',
                  fontWeight: item === selectedWeight ? 'bold' : 'normal',
                }}
              >
                {item} kg
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', paddingHorizontal: 12 },
  bodyRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', flex: 1 },
});

export default WeightStep;
