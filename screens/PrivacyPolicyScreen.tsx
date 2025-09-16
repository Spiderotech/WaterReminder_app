import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerIconSize = isSmallDevice ? 18 : Math.max(24, width * 0.065);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const sectionTitleFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const textFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const sectionTitleMarginT = isSmallDevice ? 10 : Math.max(20, height * 0.025);
const textMarginT = isSmallDevice ? 6 : Math.max(10, height * 0.012);
const textLineHeight = isSmallDevice ? 16 : Math.max(20, height * 0.028);

const PrivacyPolicyScreen = () => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff', padding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={headerIconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: headerTitleFontSize }]}>Privacy Policy</Text>
        <View style={{ width: headerIconSize }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          1. Introduction
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          We value your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when using Dora Drink.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          2. Information We Collect
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          We collect personal information like age, weight, gender, and activity level to calculate your hydration goals.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          3. Permissions and Access
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          Dora Drink requests access to notifications and exact alarm settings to provide timely hydration reminders. Notification access is used solely to alert you at your chosen times, and exact alarm permission (if required by your device) ensures reminders are delivered accurately, even if your device is in battery saver or do not disturb mode. We do not use these permissions for any other purpose.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          4. Data Storage
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          All data is stored locally on your device using secure storage mechanisms.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          5. Sharing Data
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          We do not share your personal data with third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#000', fontSize: sectionTitleFontSize, marginTop: sectionTitleMarginT }]}>
          6. Contact
        </Text>
        <Text style={[styles.text, { color: dark ? '#ccc' : '#444', fontSize: textFontSize, marginTop: textMarginT, lineHeight: textLineHeight }]}>
          For questions, contact support@doradrink.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

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