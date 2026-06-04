import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeContext } from '../ThemeContext';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { getStreak, StreakState } from '../services/streakService';

type ThemeOption = 'dark' | 'light' | 'system';

type ThemeCard = {
  id: ThemeOption;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

const { width } = Dimensions.get('window');
const cardWidth = Math.max(108, (width - 48) / 3);

const images = {
  dark: require('../assets/evening.png'),
  light: require('../assets/morning.png'),
  auto: require('../assets/slotafternoon.png'),
  morning: require('../assets/morning.png'),
  afternoon: require('../assets/afternoon.png'),
  evening: require('../assets/evening.png'),
  energy: require('../assets/streak2.png'),
  streak: require('../assets/streak3.png'),
};

const themeCards: ThemeCard[] = [
  { id: 'dark', title: 'Dark', description: 'Easy on the eyes in low light.', image: images.dark },
  { id: 'light', title: 'Light', description: 'Clean and bright for daytime.', image: images.light },
  { id: 'system', title: 'Auto', description: 'Automatically switches with your system.', image: images.auto },
];

const slotPreview = [
  { id: 'morning', title: 'Morning', amount: '600 ml', image: images.morning },
  { id: 'afternoon', title: 'Afternoon', amount: '900 ml', image: images.afternoon },
  { id: 'evening', title: 'Evening', amount: '900 ml', image: images.evening },
];

const accentColors = ['#16d7ff', '#1768ff'];

const ThemeSettingsScreen = () => {
  const navigation = useNavigation();
  const { selectedOption, setThemeOption, theme } = useThemeContext();
  const tabTheme = useMainTabTheme();
  const [pendingTheme, setPendingTheme] = useState<ThemeOption>(selectedOption);
  const [streak, setStreak] = useState<StreakState>({ current: 0, best: 0, totalCompletedDays: 0 });
  const previewMode: Exclude<ThemeOption, 'system'> = pendingTheme === 'system' ? theme : pendingTheme;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadStreak = async () => {
        const currentStreak = await getStreak();
        if (active) {
          setStreak(currentStreak);
        }
      };

      loadStreak();

      return () => {
        active = false;
      };
    }, []),
  );

  const applyTheme = () => {
    setThemeOption(pendingTheme);
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} theme={tabTheme} />
          <SectionTitle icon="palette" label="Choose Theme" />
          <ThemeSelector selected={pendingTheme} resolvedTheme={theme} onSelect={setPendingTheme} />
          <PreviewSection mode={previewMode} streak={streak} />
          <TouchableOpacity activeOpacity={0.88} onPress={applyTheme}>
            <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyButton}>
              <Feather name="check-circle" size={22} color="#ffffff" />
              <Text style={styles.applyText}>Apply Theme</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.footerNote}>
            <Feather name="clock" size={18} color="#9fa8c7" />
            <Text style={styles.footerText}>Changes will be applied immediately.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, theme }: { onBack: () => void; theme: MainTabTheme }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="chevron-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Theme Settings</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Choose a theme that matches your style.</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="info" size={23} color={theme.icon} />
    </TouchableOpacity>
  </View>
);

const SectionTitle = ({
  icon,
  label,
  iconColor = '#8e62ff',
  textColor = '#ffffff',
}: {
  icon: string;
  label: string;
  iconColor?: string;
  textColor?: string;
}) => (
  <View style={styles.sectionTitleRow}>
    <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
    <Text style={[styles.sectionTitle, { color: textColor }]}>{label}</Text>
  </View>
);

const ThemeSelector = ({
  selected,
  resolvedTheme,
  onSelect,
}: {
  selected: ThemeOption;
  resolvedTheme: Exclude<ThemeOption, 'system'>;
  onSelect: (theme: ThemeOption) => void;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeCards}>
    {themeCards.map(card => (
      <ThemeOptionCard
        key={card.id}
        card={card}
        resolvedTheme={resolvedTheme}
        selected={selected === card.id}
        onPress={() => onSelect(card.id)}
      />
    ))}
  </ScrollView>
);

const ThemeOptionCard = ({
  card,
  resolvedTheme,
  selected,
  onPress,
}: {
  card: ThemeCard;
  resolvedTheme: Exclude<ThemeOption, 'system'>;
  selected: boolean;
  onPress: () => void;
}) => {
  const previewMode = card.id === 'system' ? resolvedTheme : card.id;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <GradientFrame
        colors={selected ? ['rgba(11,42,89,0.98)', 'rgba(6,14,36,0.99)'] : ['rgba(10,21,47,0.98)', 'rgba(5,15,34,0.98)']}
        style={[styles.themeCard, selected && styles.themeCardSelected]}
        contentStyle={styles.themeCardContent}
      >
        <View style={[styles.checkRing, selected && styles.checkRingSelected]}>
          {selected ? <Feather name="check" size={14} color="#ffffff" /> : null}
        </View>
        <PhonePreview mode={previewMode} />
        <View style={styles.themeLabelRow}>
          <Image source={card.image} style={styles.themeIconImage} resizeMode="contain" />
          <Text style={styles.themeName}>{card.title}</Text>
        </View>
        <Text style={styles.themeDescription}>{card.description}</Text>
      </GradientFrame>
    </TouchableOpacity>
  );
};

const PhonePreview = ({ mode }: { mode: Exclude<ThemeOption, 'system'> }) => {
  const light = mode === 'light';

  return (
    <View style={[styles.phonePreview, light && styles.phonePreviewLight]}>
      <View style={styles.previewTopBar} />
      <View style={styles.miniProgress}>
        <Text style={[styles.miniToday, light && styles.darkMiniText]}>Today</Text>
        <Text style={[styles.miniLiters, light && styles.darkMiniText]}>2.4 L</Text>
        <Text style={[styles.miniGoal, light && styles.darkMiniText]}>of 2.5 L</Text>
      </View>
      <View style={styles.miniSlots}>
        {['Morning', 'Afternoon', 'Evening'].map(item => (
          <View key={item} style={styles.miniSlot}>
            <View style={styles.miniCheck}>
              <Feather name="check" size={10} color="#7fffd0" />
            </View>
            <Text style={[styles.miniSlotText, light && styles.darkMiniText]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const PreviewSection = ({ mode, streak }: { mode: Exclude<ThemeOption, 'system'>; streak: StreakState }) => {
  const light = mode === 'light';
  const cardColors = light
    ? ['rgba(248,251,255,0.98)', 'rgba(222,235,255,0.98)']
    : ['rgba(7,28,62,0.94)', 'rgba(5,16,37,0.98)'];
  const panelStyle = light ? styles.lightPreviewPanel : null;
  const textStyle = light ? styles.lightPreviewText : null;
  const mutedStyle = light ? styles.lightPreviewMuted : null;

  return (
    <GradientFrame colors={cardColors} style={[styles.previewCard, light && styles.lightPreviewCard]} contentStyle={styles.previewCardContent}>
      <SectionTitle icon="eye" label="Preview" iconColor="#8e76ff" textColor={light ? '#071b3d' : '#ffffff'} />
      <View style={styles.previewGrid}>
        <View style={[styles.todayPreview, panelStyle]}>
          <View style={[styles.bigProgressRing, { borderRightColor: accentColors[0], borderTopColor: accentColors[0] }]}>
            <Text style={[styles.previewMuted, mutedStyle]}>Today</Text>
            <Text style={[styles.previewLiters, textStyle]}>2.4 L</Text>
            <Text style={[styles.previewGoal, textStyle]}>of 2.5 L</Text>
          </View>
        </View>
        <View style={styles.previewMiddle}>
          <SmallPreviewCard title="Current Streak" value={`${streak.current}`} suffix="Days" image={images.streak} light={light} streakCount={streak.current} />
          <SmallPreviewCard title="Best Streak" value={`${streak.best}`} suffix="Days" image={images.energy} light={light} streakCount={streak.best} />
        </View>
        <View style={[styles.slotPreviewCard, panelStyle]}>
          <Text style={[styles.slotPreviewTitle, textStyle]}>Slots</Text>
          {slotPreview.map(slot => (
            <View key={slot.id} style={styles.slotPreviewRow}>
              <Image source={slot.image} style={styles.slotImage} resizeMode="contain" />
              <View style={styles.slotTextWrap}>
                <Text style={[styles.slotTitle, { color: accentColors[0] }]}>{slot.title}</Text>
                <Text style={[styles.slotAmount, mutedStyle]}>{slot.amount}</Text>
              </View>
              <LinearGradient colors={accentColors} style={styles.slotCheck}>
                <Feather name="check" size={12} color="#ffffff" />
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>
    </GradientFrame>
  );
};

const SmallPreviewCard = ({
  title,
  value,
  suffix,
  image,
  light,
  streakCount,
}: {
  title: string;
  value: string;
  suffix: string;
  image: ImageSourcePropType;
  light: boolean;
  streakCount?: number;
}) => (
  <GradientFrame
    colors={light ? ['rgba(255,255,255,0.98)', 'rgba(230,241,255,0.98)'] : ['rgba(8,34,75,0.95)', 'rgba(5,19,45,0.98)']}
    style={[styles.smallPreviewCard, light && styles.lightPreviewPanel]}
    contentStyle={styles.smallPreviewCardContent}
  >
    <View style={styles.smallPreviewTitleRow}>
      <Image source={image} style={styles.smallPreviewImage} resizeMode="contain" />
      <Text style={[styles.smallPreviewTitle, light && styles.lightPreviewText]}>{title}</Text>
    </View>
    <View style={styles.smallPreviewValueRow}>
      <Text style={[styles.smallPreviewValue, { color: accentColors[0] }]}>{value}</Text>
      <Text style={[styles.smallPreviewSuffix, light && styles.lightPreviewMuted]}>{suffix}</Text>
    </View>
    {typeof streakCount === 'number' ? (
      <View style={styles.streakDots}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <View key={`${day}-${index}`} style={[styles.streakDot, index < Math.min(streakCount, 7) && { backgroundColor: accentColors[1] }]}>
            <Text style={styles.streakDotText}>{day}</Text>
          </View>
        ))}
      </View>
    ) : (
      <View style={styles.energyTrack}>
        <LinearGradient colors={accentColors} style={styles.energyFill} />
      </View>
    )}
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
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 32,
  },
  headerSubtitle: {
    color: '#b7bdd7',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  themeCards: {
    gap: 14,
    paddingBottom: 18,
    paddingTop: 16,
  },
  themeCard: {
    borderColor: '#26375f',
    borderRadius: 20,
    minHeight: 264,
    width: cardWidth,
  },
  themeCardContent: {
    minHeight: 264,
    padding: 10,
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#7f45ff',
    shadowColor: '#126dff',
    shadowOpacity: 0.65,
    shadowRadius: 18,
  },
  checkRing: {
    alignItems: 'center',
    borderColor: '#bfc8e5',
    borderRadius: 14,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 8,
    width: 20,
    zIndex: 2,
  },
  checkRingSelected: {
    backgroundColor: '#1689ff',
    borderColor: '#4dbfff',
  },
  phonePreview: {
    alignSelf: 'center',
    backgroundColor: '#061333',
    borderColor: '#15335f',
    borderRadius: 14,
    borderWidth: 1,
    height: 150,
    marginTop: 20,
    overflow: 'hidden',
    padding: 9,
    width: '100%',
  },
  phonePreviewLight: {
    backgroundColor: '#f4f8ff',
  },
  autoSplit: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '50%',
  },
  previewTopBar: {
    alignSelf: 'center',
    backgroundColor: '#10224d',
    borderRadius: 4,
    height: 5,
    marginBottom: 10,
    width: 48,
  },
  miniProgress: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#2397ff',
    borderRadius: 38,
    borderRightWidth: 5,
    borderTopWidth: 5,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  miniToday: {
    color: '#ffffff',
    fontSize: 11,
  },
  miniLiters: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  miniGoal: {
    color: '#ffffff',
    fontSize: 10,
  },
  darkMiniText: {
    color: '#0a1938',
  },
  miniSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  miniSlot: {
    alignItems: 'center',
    flex: 1,
  },
  miniCheck: {
    alignItems: 'center',
    backgroundColor: 'rgba(36,96,145,0.75)',
    borderRadius: 12,
    height: 15,
    justifyContent: 'center',
    width: 15,
  },
  miniSlotText: {
    color: '#ffffff',
    fontSize: 6,
    marginTop: 4,
  },
  miniPlus: {
    alignItems: 'center',
    backgroundColor: '#146dff',
    borderRadius: 12,
    bottom: 10,
    height: 15,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    width: 15,
  },
  themeLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  themeIconImage: {
    height: 24,
    width: 24,
  },
  themeName: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 7,
  },
  themeDescription: {
    color: '#d7dcec',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },
  accentCard: {
    borderColor: '#183763',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
  },
  cardDescription: {
    color: '#aeb6ca',
    fontSize: 17,
    lineHeight: 23,
    marginTop: 10,
  },
  accentList: {
    gap: 16,
    paddingTop: 20,
  },
  accentItem: {
    alignItems: 'center',
    borderColor: '#102b55',
    borderRadius: 12,
    borderWidth: 1,
    height: 126,
    justifyContent: 'center',
    width: 112,
  },
  accentItemActive: {
    borderColor: '#198fff',
  },
  accentCircle: {
    alignItems: 'center',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  accentLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  previewCard: {
    borderColor: '#183763',
    borderRadius: 20,
    marginBottom: 18,
  },
  previewCardContent: {
    padding: 14,
  },
  lightPreviewCard: {
    borderColor: '#8fb9ff',
  },
  previewGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  todayPreview: {
    alignItems: 'center',
    backgroundColor: '#071b3d',
    borderColor: '#1a3b70',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1.18,
    justifyContent: 'center',
    minHeight: 136,
    overflow: 'hidden',
  },
  lightPreviewPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#b7cdf1',
  },
  lightPreviewText: {
    color: '#071b3d',
  },
  lightPreviewMuted: {
    color: '#4f648a',
  },
  autoPanelSplit: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '50%',
  },
  bigProgressRing: {
    alignItems: 'center',
    borderColor: '#10264e',
    borderRadius: 46,
    borderRightWidth: 6,
    borderTopWidth: 6,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  previewMuted: {
    color: '#c5cceb',
    fontSize: 13,
  },
  previewLiters: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  previewGoal: {
    color: '#ffffff',
    fontSize: 12,
  },
  previewMiddle: {
    flex: 1.08,
    gap: 8,
  },
  smallPreviewCard: {
    borderColor: '#1a3b70',
    borderRadius: 14,
    flex: 1,
  },
  smallPreviewCardContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  smallPreviewTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  smallPreviewImage: {
    height: 20,
    width: 20,
  },
  smallPreviewTitle: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 6,
  },
  smallPreviewValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  smallPreviewValue: {
    fontSize: 14,
    fontWeight: '900',
    marginRight: 7,
  },
  smallPreviewSuffix: {
    color: '#d8deee',
    fontSize: 11,
  },
  energyTrack: {
    backgroundColor: '#13284d',
    borderRadius: 4,
    height: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  energyFill: {
    borderRadius: 4,
    height: 8,
    width: '72%',
  },
  streakDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 9,
  },
  streakDot: {
    alignItems: 'center',
    backgroundColor: '#22304f',
    borderRadius: 8,
    height: 13,
    justifyContent: 'center',
    width: 13,
  },
  streakDotText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
  },
  slotPreviewCard: {
    backgroundColor: '#071b3d',
    borderColor: '#1a3b70',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1.08,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  slotPreviewTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  slotPreviewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 34,
  },
  slotImage: {
    height: 24,
    width: 24,
  },
  slotTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  slotTitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  slotAmount: {
    color: '#aeb6ca',
    fontSize: 9,
  },
  slotCheck: {
    alignItems: 'center',
    borderRadius: 11,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  settingsRow: {
    alignItems: 'center',
    borderColor: '#153259',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 98,
    paddingHorizontal: 22,
  },
  settingsCopy: {
    flex: 1,
    marginLeft: 20,
  },
  settingsTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  settingsDescription: {
    color: '#d6dbea',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  applyButton: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    marginTop: 14,
  },
  applyText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 10,
  },
  footerNote: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#b2bad1',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default ThemeSettingsScreen;
