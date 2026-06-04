import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';

type FaqCategory = 'General' | 'Account' | 'Rewards' | 'Services' | 'Help';

type FaqItem = {
  question: string;
  answer: string;
};

const categories: { id: FaqCategory; icon: string }[] = [
  { id: 'General', icon: 'droplet' },
  { id: 'Account', icon: 'user' },
  { id: 'Rewards', icon: 'award' },
  { id: 'Services', icon: 'bell' },
  { id: 'Help', icon: 'help-circle' },
];

const faqData: Record<FaqCategory, FaqItem[]> = {
  General: [
    {
      question: 'What is DoraDrink?',
      answer: 'DoraDrink is a hydration tracking app designed to help you monitor and improve your daily water intake.',
    },
    {
      question: 'How does DoraDrink work?',
      answer: 'Log your water intake, complete hydration slots, and DoraDrink tracks progress toward your daily goal.',
    },
    {
      question: "Is DoraDrink's tracking accurate?",
      answer: 'Tracking is based on your logged intake and goal settings, so the numbers stay accurate when your entries are accurate.',
    },
    {
      question: 'Is DoraDrink free to use?',
      answer: 'Yes. Core hydration tracking features are free, with optional premium features planned for future releases.',
    },
  ],
  Account: [
    {
      question: 'How do I update my personal data?',
      answer: 'Go to Settings > Personal Information to update age, weight, height, and other hydration profile details.',
    },
    {
      question: 'Can I reset my account data?',
      answer: 'Yes. Use Settings > Reset Data to clear water intake, reminders, and local preferences from this device.',
    },
    {
      question: 'How do I change my password?',
      answer: 'DoraDrink currently stores data locally and does not require a password for the main app experience.',
    },
    {
      question: 'Is my data private?',
      answer: 'Yes. Your hydration data is stored locally unless a future sync feature is enabled by you.',
    },
  ],
  Rewards: [
    {
      question: 'How do I set up daily completion?',
      answer: 'Daily completion uses three fixed hydration slots: Morning, Afternoon, and Evening. Set your daily goal and reminder slots from Hydration Goal and Reminder Settings.',
    },
    {
      question: 'How do I complete a hydration slot?',
      answer: 'Open Home during the active slot and tap the Add Water button. The first valid tap in that slot marks it complete and unlocks the slot reward once per day.',
    },
    {
      question: 'How does the leaderboard work?',
      answer: 'The leaderboard ranks hydration and competition progress. Your latest score may update after the next refresh when leaderboard sync is enabled.',
    },
    {
      question: 'How do I collect coins?',
      answer: 'Coins can be earned from completing hydration slots, claiming the daily bonus, spinning rewards, watching rewarded ads, and competition rewards.',
    },
    {
      question: 'Can I earn coins from extra water taps?',
      answer: 'Extra taps still add to your water total, but slot coin rewards are only given once per slot each day.',
    },
    {
      question: 'How do I convert coins to diamonds?',
      answer: 'Open Rewards and use Coin to Diamond. When you have enough coins, tap Convert Now to exchange coins for diamonds.',
    },
    {
      question: 'Why is conversion locked?',
      answer: 'Conversion stays locked until your coin balance reaches the required amount shown on the Rewards screen.',
    },
  ],
  Services: [
    {
      question: 'Does DoraDrink send reminders?',
      answer: 'Yes. You can customize hydration reminders from Settings > Reminder Settings.',
    },
    {
      question: 'How do I contact support?',
      answer: 'Open Settings > Contact Support to email our team or visit the DoraDrink website.',
    },
    {
      question: 'Is there a premium version?',
      answer: 'All core features are free. Premium rewards and advanced insights may be introduced later.',
    },
  ],
  Help: [
    {
      question: 'The app crashes when I open it.',
      answer: 'Restart the app and make sure DoraDrink is updated. If it continues, contact support with your device model.',
    },
    {
      question: "I can't log my water intake.",
      answer: 'Check that you are on the latest version. If the issue continues, contact support from Settings.',
    },
    {
      question: 'Reminders are not working.',
      answer: 'Check notification permissions and confirm your reminder schedule is enabled.',
    },
    {
      question: 'The app is slow or unresponsive.',
      answer: 'Restart the app first. If problems persist, reinstall DoraDrink or contact support.',
    },
  ],
};

const FaqScreen = () => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();
  const [activeTab, setActiveTab] = useState<FaqCategory>('General');
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} theme={tabTheme} />
          <HeroCard />
          <CategoryTabs activeTab={activeTab} onChange={(tab) => {
            setActiveTab(tab);
            setExpanded(0);
          }} />
          <FlatList
            data={faqData[activeTab]}
            keyExtractor={item => item.question}
            scrollEnabled={false}
            contentContainerStyle={styles.faqList}
            renderItem={({ item, index }) => (
              <FaqCard
                item={item}
                active={expanded === index}
                onPress={() => setExpanded(expanded === index ? null : index)}
              />
            )}
          />
          <ContactHint />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, theme }: { onBack: () => void; theme: MainTabTheme }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="arrow-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>FAQ</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Quick answers for your hydration journey</Text>
    </View>
    <View style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border }]}>
      <Feather name="search" size={22} color={theme.icon} />
    </View>
  </View>
);

const HeroCard = () => (
  <GradientFrame colors={['rgba(8,47,91,0.96)', 'rgba(25,12,67,0.96)']} style={styles.heroCard} contentStyle={styles.heroCardContent}>
    <View style={styles.heroIcon}>
      <MaterialCommunityIcons name="message-question-outline" size={34} color="#35d9ff" />
    </View>
    <View style={styles.heroCopy}>
      <Text style={styles.heroTitle}>Need a quick answer?</Text>
      <Text style={styles.heroText}>Browse common DoraDrink questions by topic.</Text>
    </View>
  </GradientFrame>
);

const CategoryTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: FaqCategory;
  onChange: (tab: FaqCategory) => void;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
    {categories.map(category => {
      const active = activeTab === category.id;
      return (
        <TouchableOpacity key={category.id} activeOpacity={0.88} onPress={() => onChange(category.id)}>
          <GradientFrame
            colors={active ? ['#1787ff', '#095cff'] : ['rgba(7,22,50,0.95)', 'rgba(5,13,32,0.95)']}
            style={[styles.tab, active && styles.tabActive]}
            contentStyle={styles.tabContent}
          >
            <Feather name={category.icon} size={15} color={active ? '#ffffff' : '#9db0d7'} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{category.id}</Text>
          </GradientFrame>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const FaqCard = ({ item, active, onPress }: { item: FaqItem; active: boolean; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
    <GradientFrame
      colors={active ? ['rgba(5,45,88,0.98)', 'rgba(7,17,42,0.98)'] : ['rgba(7,22,50,0.95)', 'rgba(4,12,29,0.98)']}
      style={[styles.faqCard, active && styles.faqCardActive]}
      contentStyle={styles.faqCardContent}
    >
      <View style={styles.faqHeader}>
        <View style={styles.questionIcon}>
          <Feather name="help-circle" size={17} color={active ? '#35d9ff' : '#8fa1c8'} />
        </View>
        <Text style={styles.question}>{item.question}</Text>
        <Feather name={active ? 'chevron-up' : 'chevron-down'} size={20} color="#b7c5e9" />
      </View>
      {active ? <Text style={styles.answer}>{item.answer}</Text> : null}
    </GradientFrame>
  </TouchableOpacity>
);

const ContactHint = () => (
  <GradientFrame colors={['rgba(26,13,65,0.96)', 'rgba(4,21,47,0.98)']} style={styles.contactHint} contentStyle={styles.contactHintContent}>
    <MaterialCommunityIcons name="headset" size={34} color="#a66cff" />
    <View style={styles.contactCopy}>
      <Text style={styles.contactTitle}>Still need help?</Text>
      <Text style={styles.contactText}>Our support team can help with account, reminders, rewards, and tracking questions.</Text>
    </View>
  </GradientFrame>
);

const GradientFrame = ({
  children,
  colors,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    <View style={[styles.gradientContent, contentStyle]}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 14,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientContent: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 22,
    paddingTop: 12,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,55,0.86)',
    borderColor: '#315f9f',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#1679ff',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 44,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 32,
  },
  headerSubtitle: {
    color: '#b7bdd7',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  heroCard: {
    borderColor: '#315f9f',
    borderRadius: 20,
    marginBottom: 14,
    minHeight: 96,
  },
  heroCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 96,
    padding: 14,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,137,255,0.16)',
    borderColor: '#188cff',
    borderRadius: 18,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    marginRight: 12,
    width: 58,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  heroText: {
    color: '#c4cbe1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  tabs: {
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    borderColor: '#1d3a68',
    borderRadius: 16,
    borderWidth: 1,
    height: 38,
    paddingHorizontal: 13,
  },
  tabContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  tabActive: {
    borderColor: '#56b7ff',
    shadowColor: '#1688ff',
    shadowOpacity: 0.65,
    shadowRadius: 12,
  },
  tabText: {
    color: '#b8c2dd',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderColor: '#203f70',
    borderRadius: 18,
  },
  faqCardContent: {
    padding: 14,
  },
  faqCardActive: {
    borderColor: '#1787ff',
    shadowColor: '#1688ff',
    shadowOpacity: 0.32,
    shadowRadius: 14,
  },
  faqHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  questionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(20,57,105,0.72)',
    borderRadius: 12,
    height: 30,
    justifyContent: 'center',
    marginRight: 10,
    width: 30,
  },
  question: {
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  answer: {
    color: '#c9d3ef',
    fontSize: 12,
    lineHeight: 19,
    marginLeft: 40,
    marginTop: 10,
  },
  contactHint: {
    borderColor: '#5f35c8',
    borderRadius: 20,
    marginTop: 14,
  },
  contactHintContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  contactCopy: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  contactText: {
    color: '#c5cbe0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});

export default FaqScreen;
