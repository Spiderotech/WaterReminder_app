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

const HEIGHT_CM = Array.from({ length: 101 }, (_, i) => 140 + i); // 140–240 cm
const HEIGHT_INCH = Array.from({ length: 91 }, (_, i) => 55 + i); // 55–145 in

const HeightStep = ({ selectedData = {}, onDataChange }) => {
  const [unit, setUnit] = useState(selectedData.unit || 'cm');
  const [selectedHeight, setSelectedHeight] = useState(selectedData.height );

  const heights = unit === 'cm' ? HEIGHT_CM : HEIGHT_INCH;

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
const heightListMaxHeight = isSmallDevice ? 140 : Math.max(180, height * 0.45);
const heightItemFontSize = isSmallDevice ? 16 : Math.max(20, width * 0.06);
const heightItemPaddingV = isSmallDevice ? 2 : Math.max(4, height * 0.008);


  // Call parent callback when height or unit changes
  useEffect(() => {
    onDataChange?.({ height: selectedHeight, heightUnit: unit });
  }, [selectedHeight, unit]);

  return (
    <View style={[styles.container, { padding }]}>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>How tall are you?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}>
        Your height is another key factor in customizing your hydration plan.
      </Text>

      <View style={styles.bodyRow}>
        <Image
          source={require('../assets/height.png')}
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
                unit === 'cm' && styles.activeUnit,
              ]}
              onPress={() => setUnit('cm')}
            >
              <Text style={unit === 'cm'
                ? [styles.activeText, { fontSize: unitFontSize }]
                : [styles.unitText, { fontSize: unitFontSize }]
              }>cm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                {
                  paddingVertical: unitButtonPaddingV,
                  paddingHorizontal: unitButtonPaddingH,
                  borderRadius: unitButtonRadius,
                },
                unit === 'ft' && styles.activeUnit,
              ]}
              onPress={() => setUnit('ft')}
            >
              <Text style={unit === 'ft'
                ? [styles.activeText, { fontSize: unitFontSize }]
                : [styles.unitText, { fontSize: unitFontSize }]
              }>ft</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={heights}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: heightListMaxHeight }}
            contentContainerStyle={{ alignItems: 'center' }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedHeight(item)}>
                <Text
                  style={[
                    styles.heightItem,
                    {
                      fontSize: heightItemFontSize,
                      paddingVertical: heightItemPaddingV,
                    },
                    item === selectedHeight && styles.selectedHeight,
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
  heightItem: {
    color: '#999',
  },
  selectedHeight: {
    fontWeight: 'bold',
    color: '#3498ff',
  },
});

export default HeightStep;
