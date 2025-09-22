import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');
const AGE_RANGE = Array.from({ length: 91 }, (_, i) => 10 + i); // Age 10 to 100

const AgeStep = ({ onDataChange, selectedData = {} }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [selectedAge, setSelectedAge] = useState(selectedData.age);

  // Responsive values
  const isSmallDevice = width < 350 || height < 650;

  const padding = isSmallDevice ? 8 : Math.max(16, width * 0.06);
  const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
  const subtitleFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.045);
  const subtitleMarginBottom = isSmallDevice ? 12 : Math.max(20, height * 0.025);
  const listMaxHeight = isSmallDevice ? 140 : Math.max(180, height * 0.45);
  const listMarginVertical = isSmallDevice ? 12 : Math.max(18, height * 0.03);
  const ageItemFontSize = isSmallDevice ? 16 : Math.max(20, width * 0.06);
  const selectedAgeFontSize = isSmallDevice ? 18 : Math.max(22, width * 0.07);
  const ageItemPadding = isSmallDevice ? 2 : Math.max(4, height * 0.008);

  useEffect(() => {
    onDataChange?.({ age: selectedAge });
  }, [selectedAge]);

  return (
    <View style={[styles.container, { padding, backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { fontSize: titleFontSize, color: dark ? '#fff' : '#000' }]}>
        What's your age?
      </Text>
      <Text
        style={[
          styles.subtitle,
          { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom, color: dark ? '#aaa' : '#555' },
        ]}
      >
        Age also impacts your body's hydration needs. Scroll and select your age:
      </Text>

      <FlatList
        data={AGE_RANGE}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: listMaxHeight, marginVertical: listMarginVertical }}
        contentContainerStyle={{ alignItems: 'center' }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAge(item)}>
            <Text
              style={[
                styles.ageItem,
                {
                  fontSize: ageItemFontSize,
                  padding: ageItemPadding,
                  color: dark ? '#ccc' : '#999',
                },
                item === selectedAge && {
                  ...styles.selectedAge,
                  fontSize: selectedAgeFontSize,
                  color: '#007aff',
                },
              ]}
            >
              {item} years
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default AgeStep;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', paddingHorizontal: 12 },
  ageItem: {},
  selectedAge: { fontWeight: 'bold' },
});
