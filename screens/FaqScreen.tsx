import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

const isSmallDevice = width < 350 || height < 650;

// Responsive values
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const headerIconSize = isSmallDevice ? 18 : Math.max(24, width * 0.065);
const headerMarginB = isSmallDevice ? 10 : Math.max(20, height * 0.025);
const tabPaddingV = isSmallDevice ? 4 : Math.max(6, height * 0.008);
const tabPaddingH = isSmallDevice ? 8 : Math.max(10, width * 0.025);
const tabRadius = isSmallDevice ? 10 : Math.max(14, width * 0.035);
const tabMarginR = isSmallDevice ? 4 : Math.max(6, width * 0.015);
const tabFontSize = isSmallDevice ? 11 : Math.max(13, width * 0.035);
const faqItemPadding = isSmallDevice ? 10 : Math.max(16, width * 0.045);
const faqItemRadius = isSmallDevice ? 7 : Math.max(10, width * 0.03);
const faqItemMarginB = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const faqBorderWidth = 1;
const questionFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const answerFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.04);

const faqData = {
  General: [
    {
      question: 'What is DoraDrink?',
      answer: 'DoraDrink is a hydration tracking app designed to help you monitor and improve your daily water intake.',
    },
    {
      question: 'How does DoraDrink work?',
      answer: 'You log your water intake and DoraDrink tracks your progress toward your daily hydration goal.',
    },
    {
      question: "Is DoraDrink's tracking accurate?",
      answer: 'DoraDrink offers accurate tracking based on your input and recommended intake goals.',
    },
    {
      question: 'Is DoraDrink free to use?',
      answer: 'Yes, DoraDrink is free with optional premium features in the future.',
    },
    {
      question: 'Can I export my DoraDrink data?',
      answer: 'This feature will be available soon in settings.',
    },
  ],
  Account: [
    {
      question: 'How do I update my personal data ?',
      answer: 'Go to Settings > Personal Information to update your  age, weight, height, and other details.',
    },
    {
      question: 'Can I reset my account data?',
      answer: 'Yes, you can reset all your data from Settings > Reset Data. This will erase all your water intake, reminders, and preferences.',
    },
    {
      question: 'How do I change my password?',
      answer: 'Currently, DoraDrink does not require an account or password. All data is stored locally on your device.',
    },
    {
      question: 'Is my data private?',
      answer: 'Yes, your data is stored locally and is not shared with anyone. Please see our Privacy Policy for more details.',
    },
  ],
  Services: [
    {
      question: 'Does DoraDrink send reminders?',
      answer: 'Yes, DoraDrink can send you hydration reminders based on your schedule. You can customize reminders in Settings > Reminder Settings.',
    },
   
    {
      question: 'How do I Contact Supportt?',
      answer: 'Go to Settings > Contact Support to reach out to our team via email.',
    },
    {
      question: 'Is there a premium version?',
      answer: 'All core features are free. Premium features may be introduced in the future.',
    },
  ],
  Help: [
    {
      question: 'The app crashes when I open it.',
      answer: 'Please try reinstalling the app. If the issue persists, Contact Support.',
    },
    {
      question: 'I can\'t log my water intake.',
      answer: 'Make sure you have the latest version of DoraDrink. If the problem continues, Contact Support.',
    },
    {
      question: 'Reminders are not working.',
      answer: 'Check your notification settings and ensure DoraDrink has permission to send notifications.',
    },
    {
      question: 'The app is slow or unresponsive.',
      answer: 'Try clearing the app cache or reinstalling DoraDrink. If issues persist, Contact Support.',
    },
  ],
};

const FaqScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('General');
  const [expanded, setExpanded] = useState<number | null>(null);
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff', padding }]}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: headerMarginB }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={headerIconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: headerTitleFontSize }]}>FAQ</Text>
        <View style={{ width: headerIconSize }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {Object.keys(faqData).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                paddingVertical: tabPaddingV,
                paddingHorizontal: tabPaddingH,
                borderRadius: tabRadius,
                marginRight: tabMarginR,
                backgroundColor: activeTab === tab ? '#007AFF' : '#e0e0e0',
                minWidth: width / 5, // ensure 4 tabs fit on most screens
                alignItems: 'center',
              },
            ]}
            onPress={() => {
              setActiveTab(tab);
              setExpanded(null);
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : '#333', fontWeight: '600', fontSize: tabFontSize }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQ List */}
      <FlatList
        data={faqData[activeTab]}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => setExpanded(expanded === index ? null : index)}
            style={[
              styles.faqItem,
              {
                backgroundColor: dark ? '#111' : '#f9f9f9',
                borderColor: dark ? '#333' : '#ddd',
                padding: faqItemPadding,
                borderRadius: faqItemRadius,
                borderWidth: faqBorderWidth,
                marginBottom: faqItemMarginB,
              },
            ]}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.question, { color: dark ? '#fff' : '#000', fontSize: questionFontSize }]}>
                {item.question}
              </Text>
              <Feather
                name={expanded === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={dark ? '#aaa' : '#666'}
              />
            </View>
            {expanded === index && (
              <Text style={[styles.answer, { color: dark ? '#ccc' : '#555', fontSize: answerFontSize }]}>
                {item.answer}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default FaqScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontWeight: 'bold' },
  tabs: { marginVertical: 16, flexDirection: 'row' },
  tab: {},
  faqItem: {},
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  question: { fontWeight: '600' },
  answer: { marginTop: 10 },
});