import React from 'react';
import {
  Linking,
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

type SupportAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
  color: string;
};

const supportActions: SupportAction[] = [
  {
    id: 'email',
    title: 'Customer Support',
    subtitle: 'Email us for app, account, or rewards help',
    icon: 'headset',
    url: 'mailto:support@doradrink.com',
    color: '#35d9ff',
  },
  {
    id: 'website',
    title: 'DoraDrink Website',
    subtitle: 'Visit help articles, updates, and announcements',
    icon: 'web',
    url: 'https://doradrink.com',
    color: '#a66cff',
  },
];

const tips = [
  { icon: 'cellphone', label: 'Device model' },
  { icon: 'alert-circle-outline', label: 'Issue details' },
  { icon: 'clock-time-four-outline', label: 'Time it happened' },
];

const ContactSupportScreen = () => {
  const navigation = useNavigation();
  const tabTheme = useMainTabTheme();

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} theme={tabTheme} />
          <HeroCard />
          <ResponseCard />
          <View style={styles.actions}>
            {supportActions.map(action => (
              <SupportActionCard key={action.id} item={action} onPress={() => handleLinkPress(action.url)} />
            ))}
          </View>
          <PrepCard />
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
      <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Support</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>We are here to help DoraDrink flow smoothly</Text>
    </View>
    <View style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border }]}>
      <Feather name="info" size={23} color={theme.icon} />
    </View>
  </View>
);

const HeroCard = () => (
  <GradientFrame colors={['rgba(6,47,91,0.98)', 'rgba(26,14,68,0.97)']} style={styles.heroCard} contentStyle={styles.heroCardContent}>
    <View style={styles.heroGlow}>
      <MaterialCommunityIcons name="lifebuoy" size={44} color="#35d9ff" />
    </View>
    <View style={styles.heroCopy}>
      <Text style={styles.heroTitle}>Need help with DoraDrink?</Text>
      <Text style={styles.heroText}>Reach support for reminders, rewards, tracking, and app setup questions.</Text>
    </View>
  </GradientFrame>
);

const ResponseCard = () => (
  <GradientFrame colors={['rgba(8,25,58,0.96)', 'rgba(4,14,33,0.98)']} style={styles.responseCard} contentStyle={styles.responseCardContent}>
    <View style={styles.responseItem}>
      <MaterialCommunityIcons name="timer-sand" size={25} color="#35d9ff" />
      <View>
        <Text style={styles.responseValue}>24h</Text>
        <Text style={styles.responseLabel}>Typical reply</Text>
      </View>
    </View>
    <View style={styles.responseDivider} />
    <View style={styles.responseItem}>
      <MaterialCommunityIcons name="shield-check-outline" size={25} color="#61ff91" />
      <View>
        <Text style={styles.responseValue}>Secure</Text>
        <Text style={styles.responseLabel}>Support channel</Text>
      </View>
    </View>
  </GradientFrame>
);

const SupportActionCard = ({ item, onPress }: { item: SupportAction; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
    <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.actionCard} contentStyle={styles.actionCardContent}>
      <View style={[styles.actionIcon, { borderColor: item.color, backgroundColor: `${item.color}20` }]}>
        <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={22} color="#9cb2df" />
    </GradientFrame>
  </TouchableOpacity>
);

const PrepCard = () => (
  <GradientFrame colors={['rgba(26,13,65,0.96)', 'rgba(4,21,47,0.98)']} style={styles.prepCard} contentStyle={styles.prepCardContent}>
    <View style={styles.prepHeader}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={26} color="#a66cff" />
      <Text style={styles.prepTitle}>For faster support</Text>
    </View>
    <Text style={styles.prepText}>Include these details when you contact us.</Text>
    <View style={styles.tipGrid}>
      {tips.map(tip => (
        <View key={tip.label} style={styles.tipPill}>
          <MaterialCommunityIcons name={tip.icon} size={18} color="#35d9ff" />
          <Text style={styles.tipText}>{tip.label}</Text>
        </View>
      ))}
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
    minHeight: 124,
  },
  heroCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 124,
    padding: 16,
  },
  heroGlow: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,137,255,0.16)',
    borderColor: '#188cff',
    borderRadius: 24,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#18cfff',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    width: 76,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  heroText: {
    color: '#c4cbe1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  responseCard: {
    borderColor: '#24436e',
    borderRadius: 20,
    marginBottom: 14,
  },
  responseCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  responseItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },
  responseDivider: {
    backgroundColor: '#274574',
    height: 42,
    width: 1,
  },
  responseValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  responseLabel: {
    color: '#aeb8d5',
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    gap: 10,
  },
  actionCard: {
    borderColor: '#203f70',
    borderRadius: 18,
    minHeight: 76,
  },
  actionCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 76,
    padding: 13,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  actionSubtitle: {
    color: '#c4cbe1',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  prepCard: {
    borderColor: '#5f35c8',
    borderRadius: 20,
    marginTop: 14,
  },
  prepCardContent: {
    padding: 14,
  },
  prepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  prepTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  prepText: {
    color: '#c5cbe0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tipPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.82)',
    borderColor: '#254e85',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  tipText: {
    color: '#dce8ff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ContactSupportScreen;
