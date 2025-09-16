import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { width, height } = Dimensions.get('window');

const GenderStep = ({ gender, onSelect }) => {
  const isDark = useColorScheme() === 'dark';

  // Responsive values
 const isSmallDevice = width < 350 || height < 650;

const paddingHorizontal = isSmallDevice ? 10 : Math.max(16, width * 0.05);
const paddingTop = isSmallDevice ? 24 : Math.max(40, height * 0.08);
const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
const subtitleFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.04);
const subtitleMarginBottom = isSmallDevice ? 16 : Math.max(24, height * 0.04);
const optionsGap = isSmallDevice ? 12 : Math.max(20, width * 0.08);
const optionsMarginBottom = isSmallDevice ? 12 : Math.max(20, height * 0.035);
const iconCircleSize = isSmallDevice ? 50 : Math.max(70, Math.min(width * 0.25, height * 0.14));
const iconSize = isSmallDevice ? 18 : Math.max(22, iconCircleSize * 0.24);
const genderLabelFontSize = isSmallDevice ? 11 : Math.max(13, width * 0.045);
const genderLabelMarginTop = isSmallDevice ? 6 : Math.max(8, height * 0.012);
const skipPaddingH = isSmallDevice ? 10 : Math.max(16, width * 0.06);
const skipPaddingV = isSmallDevice ? 6 : Math.max(8, height * 0.012);
const skipFontSize = isSmallDevice ? 11 : Math.max(13, width * 0.04);
const skipRadius = isSmallDevice ? 12 : Math.max(16, width * 0.06);


  const genders = [
    { label: 'Male', icon: 'mars', value: 'Male' },
    { label: 'Female', icon: 'venus', value: 'Female' },
  ];

  return (
    <View style={[styles.container, { paddingHorizontal, paddingTop }]}>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>What’s your gender?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}>
        Dora Drink is here to tailor a hydration plan just for you! Let’s kick things off by getting to know you better.
      </Text>

      <View style={[styles.optionsRow, { gap: optionsGap, marginBottom: optionsMarginBottom }]}>
        {genders.map((g) => {
          const selected = gender === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[
                styles.genderOption,
                selected && styles.genderOptionSelected,
              ]}
              onPress={() => onSelect(g.value)}
            >
              <View style={[
                styles.iconCircle,
                {
                  width: iconCircleSize,
                  height: iconCircleSize,
                  borderRadius: iconCircleSize / 2,
                },
                selected ? styles.iconCircleSelected : styles.iconCircleUnselected,
              ]}>
                <FontAwesome5
                  name={g.icon}
                  size={iconSize}
                  color={selected ? '#fff' : '#000'}
                />
              </View>
              <Text style={[
                styles.genderLabel,
                { fontSize: genderLabelFontSize, marginTop: genderLabelMarginTop },
                selected && styles.genderLabelSelected,
              ]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.skipButton,
          {
            paddingHorizontal: skipPaddingH,
            paddingVertical: skipPaddingV,
            borderRadius: skipRadius,
          }
        ]}
        onPress={() => onSelect('Prefer not to say')}
      >
        <Text style={[styles.skipText, { fontSize: skipFontSize }]}>Prefer not to say</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GenderStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  genderOption: {
    alignItems: 'center',
  },
  iconCircle: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSelected: {
    backgroundColor: '#3498ff',
    borderColor: '#3498ff',
  },
  iconCircleUnselected: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  genderLabel: {
    fontWeight: '500',
    color: '#000',
  },
  genderLabelSelected: {
    color: '#3498ff',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  skipText: {
    color: '#000',
  },
});
