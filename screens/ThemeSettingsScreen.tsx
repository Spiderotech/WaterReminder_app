import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const paddingHorizontal = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const headerHeight = isSmallDevice ? 40 : Math.max(60, height * 0.08);
const backBtnPadding = isSmallDevice ? 6 : Math.max(10, width * 0.03);
const sectionRadius = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const sectionPaddingV = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const sectionPaddingH = isSmallDevice ? 8 : Math.max(15, width * 0.04);
const optionPaddingV = isSmallDevice ? 10 : Math.max(20, height * 0.025);
const optionTextFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const iconSize = isSmallDevice ? 18 : Math.max(22, width * 0.06);
const iconMarginR = isSmallDevice ? 8 : Math.max(12, width * 0.03);

const ThemeSettingsScreen = () => {
  const navigation = useNavigation();
  const { selectedOption, setThemeOption, theme } = useThemeContext();
  const dark = theme === 'dark';

  const isSelected = (t: 'light' | 'dark' | 'system') => selectedOption === t;

  const renderOption = (
    option: 'light' | 'dark' | 'system',
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      onPress={() => setThemeOption(option)}
      style={[
        styles.optionContainer,
        { paddingVertical: optionPaddingV },
        isSelected(option) && {
          backgroundColor: dark ? '#1a1a1a' : '#e6f0ff',
          borderRadius: 10,
          padding: 10,
        },
      ]}
    >
      <Feather
        name={icon}
        size={iconSize}
        color={dark ? '#007AFF' : '#007AFF'}
        style={{ marginRight: iconMarginR }}
      />
      <Text style={[styles.optionText, { color: dark ? '#ffffff' : '#333', fontSize: optionTextFontSize }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: dark ? '#000000' : '#ffffff', paddingHorizontal },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.headerContainer, { height: headerHeight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { padding: backBtnPadding }]}>
          <Feather name="arrow-left" size={iconSize} color={dark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? '#ffffff' : '#111111', fontSize: headerTitleFontSize }]}>
          Theme Settings
        </Text>
      </View>

      {/* Theme Options */}
      <View style={[
        styles.section,
        {
          backgroundColor: dark ? '#121212' : '#f6f8fa',
          borderRadius: sectionRadius,
          paddingVertical: sectionPaddingV,
          paddingHorizontal: sectionPaddingH,
        }
      ]}>
        {renderOption('light', 'Light Theme', 'sun')}
        {renderOption('dark', 'Dark Theme', 'moon')}
        {renderOption('system', 'System Default', 'smartphone')}
      </View>
    </SafeAreaView>
  );
};

export default ThemeSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    // borderRadius and padding set inline for responsiveness
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  optionText: {
    // fontSize set inline for responsiveness
  },
});