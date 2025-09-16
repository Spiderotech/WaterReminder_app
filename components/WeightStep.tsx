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

const { width, height } = Dimensions.get('window');

const WEIGHT_KG = Array.from({ length: 150 }, (_, i) => 30 + i); // 30–179 kg
const WEIGHT_LB = Array.from({ length: 200 }, (_, i) => 66 + i); // 66–265 lb

const WeightStep = ({ selectedData = {}, onDataChange }) => {
  const [unit, setUnit] = useState(selectedData.weightUnit || 'kg');
  const [selectedWeight, setSelectedWeight] = useState(selectedData.weight || 70);

  const weights = unit === 'kg' ? WEIGHT_KG : WEIGHT_LB;

  const isSmallDevice = width < 350 || height < 650;

  const padding = isSmallDevice ? 10 : Math.max(16, width * 0.06);
  const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
  const subtitleFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.045);
  const subtitleMarginBottom = isSmallDevice ? 12 : Math.max(18, height * 0.025);
  const bodyImageWidth = isSmallDevice ? 70 : Math.max(90, width * 0.28);
  const bodyImageHeight = isSmallDevice ? 160 : Math.max(220, height * 0.38);
  const unitButtonPaddingV = isSmallDevice ? 6 : Math.max(8, height * 0.012);
  const unitButtonPaddingH = isSmallDevice ? 12 : Math.max(18, width * 0.07);
  const unitButtonRadius = isSmallDevice ? 12 : Math.max(16, width * 0.06);
  const unitFontSize = isSmallDevice ? 12 : Math.max(15, width * 0.045);
  const weightListMaxHeight = isSmallDevice ? 140 : Math.max(180, height * 0.45);
  const weightItemFontSize = isSmallDevice ? 16 : Math.max(20, width * 0.06);
  const weightItemPaddingV = isSmallDevice ? 2 : Math.max(4, height * 0.008);


  useEffect(() => {
    onDataChange?.({
      weight: selectedWeight,
      weightUnit: unit,
    });
  }, [selectedWeight, unit]);

  return (
    <View style={[styles.container, { padding }]}>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>How much do you weigh?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}>
        Your weight plays a crucial role in determining your hydration needs.
      </Text>

      <View style={styles.bodyRow}>
        <Image
          source={require('../assets/weight.png')}
          style={{ width: bodyImageWidth, height: bodyImageHeight }}
          resizeMode="contain"
        />

        <View style={styles.selectorColumn}>
          <View style={styles.unitSwitch}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                {
                  paddingVertical: unitButtonPaddingV,
                  paddingHorizontal: unitButtonPaddingH,
                  borderRadius: unitButtonRadius,
                },
                unit === 'kg' && styles.activeUnit,
              ]}
              onPress={() => setUnit('kg')}
            >
              <Text style={unit === 'kg'
                ? [styles.activeText, { fontSize: unitFontSize }]
                : [styles.unitText, { fontSize: unitFontSize }]
              }>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                {
                  paddingVertical: unitButtonPaddingV,
                  paddingHorizontal: unitButtonPaddingH,
                  borderRadius: unitButtonRadius,
                },
                unit === 'lb' && styles.activeUnit,
              ]}
              onPress={() => setUnit('lb')}
            >
              <Text style={unit === 'lb'
                ? [styles.activeText, { fontSize: unitFontSize }]
                : [styles.unitText, { fontSize: unitFontSize }]
              }>lb</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={weights}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: weightListMaxHeight }}
            contentContainerStyle={{ alignItems: 'center' }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedWeight(item)}>
                <Text
                  style={[
                    styles.weightItem,
                    {
                      fontSize: weightItemFontSize,
                      paddingVertical: weightItemPaddingV,
                    },
                    item === selectedWeight && styles.selectedWeight,
                  ]}
                >
                  {item} {unit}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </View>
  );
};

export default WeightStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 1,
  },
  bodyImage: {
    // width and height set inline for responsiveness
  },
  selectorColumn: {
    flex: 1,
    alignItems: 'center',
  },
  unitSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  unitButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  activeUnit: {
    backgroundColor: '#3498ff',
    borderColor: '#3498ff',
  },
  unitText: {
    color: '#333',
  },
  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
  weightItem: {
    color: '#999',
  },
  selectedWeight: {
    fontWeight: 'bold',
    color: '#3498ff',
  },
});
