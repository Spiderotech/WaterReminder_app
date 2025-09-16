import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerIconSize = isSmallDevice ? 18 : Math.max(24, width * 0.065);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const sectionTitleFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const textFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const sectionTitleMarginT = isSmallDevice ? 10 : Math.max(20, height * 0.025);
const textMarginT = isSmallDevice ? 6 : Math.max(10, height * 0.012);
const textLineHeight = isSmallDevice ? 16 : Math.max(20, height * 0.028);

const TermsOfServiceScreen = () => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff', padding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={headerIconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: headerTitleFontSize }]}>Terms of Service</Text>
        <View style={{ width: headerIconSize }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          1. Acceptance of Terms
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          By using Dora Drink, you agree to be bound by these Terms of Service.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          2. Usage Guidelines
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          You must use the app responsibly and not for unauthorized or unlawful activities.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          3. Intellectual Property
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          All app content is owned by Dora Drink and protected by applicable laws.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          4. Limitation of Liability
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          Dora Drink is not responsible for any health issues caused by incorrect water intake.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          5. Changes to Terms
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          We may update these Terms at any time. Please check this page regularly.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsOfServiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: 'bold' },
  sectionTitle: { fontWeight: 'bold' },
  text: {},
});
