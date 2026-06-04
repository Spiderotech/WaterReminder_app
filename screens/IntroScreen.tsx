import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const initialWindow = Dimensions.get('window');

type IntroSlideId = 'habits' | 'rewards' | 'digital-me';

type IntroSlide = {
  id: IntroSlideId;
};

type IntroMetrics = {
  availableHeight: number;
  contentWidth: number;
  horizontalPadding: number;
  scale: number;
  compactHeight: boolean;
  headerHeight: number;
  titleSize: number;
  titleLineHeight: number;
  subtitleSize: number;
  subtitleLineHeight: number;
  iconSize: number;
  featureIconSize: number;
  featureCardHeight: number;
  habitVisualHeight: number;
  bottleHeight: number;
  bottleWidth: number;
  trophyVisualHeight: number;
  trophyHeight: number;
  trophyWidth: number;
  coinSize: number;
  diamondSize: number;
  streakCardMinHeight: number;
  challengeCardMinHeight: number;
  giftSize: number;
  arrowSize: number;
  digitalVisualHeight: number;
  digitalMeHeight: number;
  digitalMeWidth: number;
  digitalStatsWidth: number;
  digitalStatIconSize: number;
  digitalFeatureMinHeight: number;
  footerButtonHeight: number;
  footerGap: number;
};

const slides: IntroSlide[] = [
  { id: 'habits' },
  { id: 'rewards' },
  { id: 'digital-me' },
];

const slideBackgrounds: Record<IntroSlideId, string[]> = {
  habits: ['#020712', '#05245c', '#063f86', '#010713'],
  rewards: ['#030613', '#181143', '#092a6d', '#010611'],
  'digital-me': ['#010814', '#072963', '#053168', '#020816'],
};

const images = {
  bottle: require('../assets/intro1.png') as ImageSourcePropType,
  trophy: require('../assets/competion.png') as ImageSourcePropType,
  gift: require('../assets/reward.png') as ImageSourcePropType,
  coin: require('../assets/coin1.png') as ImageSourcePropType,
  diamond: require('../assets/diamond.png') as ImageSourcePropType,
  digitalMe: require('../assets/digitalme3.png') as ImageSourcePropType,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildMetrics = (screenWidth: number, screenHeight: number, safeTop: number, safeBottom: number): IntroMetrics => {
  const availableHeight = Math.max(screenHeight - safeTop - safeBottom, 520);
  const compactWidth = screenWidth < 370;
  const compactHeight = availableHeight < 700;
  const scale = clamp(availableHeight / 790, 0.68, 1);
  const horizontalPadding = compactWidth ? 14 : 22;
  const contentWidth = Math.max(screenWidth - horizontalPadding * 2, 280);

  return {
    availableHeight,
    contentWidth,
    horizontalPadding,
    scale,
    compactHeight,
    headerHeight: clamp(44 * scale, 38, 48),
    titleSize: clamp(34 * scale, 24, 34),
    titleLineHeight: clamp(41 * scale, 30, 41),
    subtitleSize: clamp(16 * scale, 13, 16),
    subtitleLineHeight: clamp(24 * scale, 18, 24),
    iconSize: clamp(30 * scale, 22, 30),
    featureIconSize: clamp(46 * scale, 34, 46),
    featureCardHeight: clamp(availableHeight * 0.105, 66, 88),
    habitVisualHeight: clamp(availableHeight * 0.3, 150, 292),
    bottleHeight: clamp(availableHeight * 0.29, 146, 286),
    bottleWidth: clamp(contentWidth * 0.56, 144, 206),
    trophyVisualHeight: clamp(availableHeight * 0.2, 104, 205),
    trophyHeight: clamp(availableHeight * 0.18, 98, 184),
    trophyWidth: clamp(contentWidth * 0.56, 150, 226),
    coinSize: clamp(44 * scale, 30, 44),
    diamondSize: clamp(42 * scale, 28, 42),
    streakCardMinHeight: clamp(availableHeight * 0.165, 100, 148),
    challengeCardMinHeight: clamp(availableHeight * 0.115, 70, 104),
    giftSize: clamp(70 * scale, 48, 70),
    arrowSize: clamp(48 * scale, 38, 48),
    digitalVisualHeight: clamp(availableHeight * 0.38, 188, 315),
    digitalMeHeight: clamp(availableHeight * 0.36, 178, 308),
    digitalMeWidth: clamp(contentWidth * 0.44, 118, 170),
    digitalStatsWidth: clamp(contentWidth * 0.42, 112, 138),
    digitalStatIconSize: clamp(40 * scale, 30, 40),
    digitalFeatureMinHeight: clamp(availableHeight * 0.145, 82, 120),
    footerButtonHeight: clamp(50 * scale, 44, 56),
    footerGap: compactHeight ? 8 : 12,
  };
};

const IntroScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const windowDimensions = useWindowDimensions();

  const screenWidth = frame.width || windowDimensions.width || initialWindow.width;
  const screenHeight = windowDimensions.height || frame.height || initialWindow.height;
  const metrics = useMemo(
    () => buildMetrics(screenWidth, screenHeight, insets.top, insets.bottom),
    [insets.bottom, insets.top, screenHeight, screenWidth],
  );

  useEffect(() => {
    StatusBar.setHidden(true, 'fade');

    return () => {
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  const goToAppOnboarding = () => navigation.replace('Onboarding');

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    goToAppOnboarding();
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <IntroSlideView
        currentIndex={currentIndex}
        index={currentIndex}
        item={currentSlide}
        metrics={metrics}
        onNext={goNext}
        onSkip={goToAppOnboarding}
        screenHeight={screenHeight}
        screenWidth={screenWidth}
      />
    </View>
  );
};

const IntroSlideView = ({
  currentIndex,
  index,
  item,
  metrics,
  onNext,
  onSkip,
  screenHeight,
  screenWidth,
}: {
  currentIndex: number;
  index: number;
  item: IntroSlide;
  metrics: IntroMetrics;
  onNext: () => void;
  onSkip: () => void;
  screenHeight: number;
  screenWidth: number;
}) => (
  <LinearGradient colors={slideBackgrounds[item.id]} style={styles.slide}>
    <DecorativeBackground slideId={item.id} screenHeight={screenHeight} screenWidth={screenWidth} />
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <IntroHeader metrics={metrics} onSkip={onSkip} slideId={item.id} />
      <View style={[styles.bodySlot, { paddingHorizontal: metrics.horizontalPadding }]}>
        {item.id === 'habits' ? <HydrationHabitsSlide metrics={metrics} /> : null}
        {item.id === 'rewards' ? <RewardsSlide metrics={metrics} /> : null}
        {item.id === 'digital-me' ? <DigitalMeSlide metrics={metrics} /> : null}
      </View>
      <IntroFooter
        currentIndex={currentIndex}
        index={index}
        metrics={metrics}
        onNext={onNext}
        slideId={item.id}
      />
    </SafeAreaView>
  </LinearGradient>
);

const IntroHeader = ({ metrics, onSkip, slideId }: { metrics: IntroMetrics; onSkip: () => void; slideId: IntroSlideId }) => (
  <View style={[styles.header, { height: metrics.headerHeight, paddingHorizontal: metrics.horizontalPadding }]}>
    <View style={styles.headerSide} />
    {slideId === 'habits' ? null : (
      <View style={[styles.stepBadge, { height: clamp(34 * metrics.scale, 30, 34), paddingHorizontal: clamp(14 * metrics.scale, 10, 14) }]}>
        <Text style={[styles.stepBadgeText, { fontSize: clamp(18 * metrics.scale, 15, 18) }]}>
          {slideId === 'rewards' ? '2 / 3' : '3 / 3'}
        </Text>
      </View>
    )}
    <TouchableOpacity accessibilityLabel="Skip onboarding" accessibilityRole="button" onPress={onSkip} style={[styles.skipButton, { height: clamp(38 * metrics.scale, 34, 38) }]}>
      <Text style={[styles.skipText, { fontSize: clamp(16 * metrics.scale, 14, 16) }]}>Skip</Text>
    </TouchableOpacity>
  </View>
);

const DecorativeBackground = ({ slideId, screenHeight, screenWidth }: { slideId: IntroSlideId; screenHeight: number; screenWidth: number }) => (
  <View style={styles.decorLayer} pointerEvents="none">
    <LinearGradient
      colors={slideId === 'rewards'
        ? ['rgba(255,198,45,0.24)', 'rgba(25,126,255,0.08)', 'rgba(0,0,0,0)']
        : ['rgba(42,214,255,0.28)', 'rgba(14,85,218,0.12)', 'rgba(0,0,0,0)']}
      style={[styles.topLight, { height: screenHeight * 0.36, left: -screenWidth * 0.2, right: -screenWidth * 0.2 }]}
    />
    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(13,171,255,0.25)', 'rgba(3,16,46,0.8)']}
      style={[styles.waterFloor, { height: screenHeight * 0.34 }]}
    />
  </View>
);

const HydrationHabitsSlide = ({ metrics }: { metrics: IntroMetrics }) => (
  <View style={styles.slideBody}>
    <View style={[styles.habitVisual, { height: metrics.habitVisualHeight, marginTop: metrics.compactHeight ? 4 : 10 }]}>
      <Image
        source={images.bottle}
        style={[styles.bottleImage, { height: metrics.bottleHeight, width: metrics.bottleWidth }]}
        resizeMode="contain"
      />
    </View>

    <Text style={[styles.largeTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight, marginTop: metrics.compactHeight ? 2 : 8 }]}>Build Better</Text>
    <Text style={[styles.accentTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight }]}>Hydration Habits</Text>
    <Text style={[styles.subtitle, { fontSize: metrics.subtitleSize, lineHeight: metrics.subtitleLineHeight, marginTop: metrics.compactHeight ? 6 : 10 }]}>
      Track your daily water intake and make hydration a powerful habit.
    </Text>
    <View style={[styles.habitFeatureCard, { height: metrics.featureCardHeight, marginTop: metrics.compactHeight ? 10 : 18 }]}>
      {[
        { icon: 'water', label: 'Drink' },
        { icon: 'clock-outline', label: 'Track' },
        { icon: 'chart-bar', label: 'Improve' },
        { icon: 'heart-outline', label: 'Feel Great' },
      ].map((item, itemIndex) => (
        <View key={item.label} style={styles.habitFeatureItem}>
          <View style={[styles.featureIconCircle, { height: metrics.featureIconSize, width: metrics.featureIconSize }]}>
            <MaterialCommunityIcons name={item.icon} size={metrics.iconSize} color="#1ec8ff" />
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.featureLabel, { fontSize: clamp(13 * metrics.scale, 10, 13) }]}>
            {item.label}
          </Text>
          {itemIndex < 3 ? <View style={styles.featureDivider} /> : null}
        </View>
      ))}
    </View>
  </View>
);

const RewardsSlide = ({ metrics }: { metrics: IntroMetrics }) => (
  <View style={styles.slideBody}>
    <Text style={[styles.largeTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight, marginTop: metrics.compactHeight ? 0 : 4 }]}>Earn Rewards</Text>
    <Text style={[styles.accentTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight }]}>Build Streaks</Text>
    <Text style={[styles.subtitle, { fontSize: metrics.subtitleSize, lineHeight: metrics.subtitleLineHeight, marginTop: metrics.compactHeight ? 6 : 10 }]}>
      Stay consistent, earn coins, unlock rewards, and achieve amazing streaks.
    </Text>

    <View style={[styles.trophyVisual, { height: metrics.trophyVisualHeight, marginTop: metrics.compactHeight ? 2 : 8 }]}>
      <Image source={images.trophy} style={[styles.trophyImage, { height: metrics.trophyHeight, width: metrics.trophyWidth }]} resizeMode="contain" />
      <Image source={images.coin} style={[styles.floatingCoin, styles.floatingCoinLeft, { height: metrics.coinSize, width: metrics.coinSize }]} resizeMode="contain" />
      <Image source={images.coin} style={[styles.floatingCoin, styles.floatingCoinRight, { height: metrics.coinSize, width: metrics.coinSize }]} resizeMode="contain" />
      <Image source={images.diamond} style={[styles.floatingDiamond, styles.floatingDiamondLeft, { height: metrics.diamondSize, width: metrics.diamondSize }]} resizeMode="contain" />
      <Image source={images.diamond} style={[styles.floatingDiamond, styles.floatingDiamondRight, { height: metrics.diamondSize, width: metrics.diamondSize }]} resizeMode="contain" />
    </View>

    <GradientFrame colors={['rgba(3,35,91,0.95)', 'rgba(4,16,49,0.98)']} style={[styles.streakCard, { minHeight: metrics.streakCardMinHeight, padding: metrics.compactHeight ? 10 : 14 }]}>
      <View style={[styles.streakTitleRow, { marginBottom: metrics.compactHeight ? 5 : 9 }]}>
        <MaterialCommunityIcons name="fire" size={metrics.iconSize} color="#ff9f1c" />
        <Text style={[styles.streakTitle, { fontSize: clamp(18 * metrics.scale, 14, 18) }]}>7 Day Streak</Text>
      </View>
      <View style={[styles.weekRow, { marginBottom: metrics.compactHeight ? 5 : 9 }]}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dayIndex) => (
          <View key={`${day}-${dayIndex}`} style={styles.dayWrap}>
            <View style={[styles.dayCircle, { height: clamp(32 * metrics.scale, 26, 32), width: clamp(32 * metrics.scale, 26, 32), borderRadius: clamp(16 * metrics.scale, 13, 16) }, dayIndex === 6 && styles.dayCircleActive]}>
              <Text style={[styles.dayText, { fontSize: clamp(15 * metrics.scale, 12, 15) }]}>{day}</Text>
            </View>
            {dayIndex < 6 ? <Feather name="check" size={clamp(16 * metrics.scale, 12, 16)} color="#14d8ff" /> : <View style={styles.checkSpacer} />}
          </View>
        ))}
      </View>
      <View style={[styles.rewardStatsRow, { paddingTop: metrics.compactHeight ? 6 : 9 }]}>
        <RewardStat image={images.coin} metrics={metrics} title="340" label="Coins" />
        <View style={[styles.rewardStatDivider, { height: clamp(56 * metrics.scale, 38, 56) }]} />
        <RewardStat image={images.diamond} metrics={metrics} title="12" label="Diamonds" />
      </View>
    </GradientFrame>

    <GradientFrame colors={['rgba(2,37,93,0.95)', 'rgba(6,19,58,0.98)']} style={[styles.challengeCard, { marginTop: metrics.compactHeight ? 8 : 12, minHeight: metrics.challengeCardMinHeight }]}>
      <Image source={images.gift} style={[styles.giftImage, { height: metrics.giftSize, width: metrics.giftSize }]} resizeMode="contain" />
      <View style={styles.challengeCopy}>
        <Text style={[styles.challengeTitle, { fontSize: clamp(16 * metrics.scale, 13, 16) }]}>Weekly Challenge</Text>
        <Text style={[styles.challengeText, { fontSize: clamp(14 * metrics.scale, 12, 14), lineHeight: clamp(20 * metrics.scale, 16, 20) }]}>Complete goals and win exciting rewards!</Text>
      </View>
      <View style={[styles.challengeArrow, { borderRadius: metrics.arrowSize / 2, height: metrics.arrowSize, width: metrics.arrowSize }]}>
        <Feather name="chevron-right" size={clamp(34 * metrics.scale, 26, 34)} color="#ffffff" />
      </View>
    </GradientFrame>
  </View>
);

const DigitalMeSlide = ({ metrics }: { metrics: IntroMetrics }) => (
  <View style={styles.slideBody}>
    <Text style={[styles.largeTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight, marginTop: metrics.compactHeight ? 0 : 4 }]}>Grow Your</Text>
    <Text style={[styles.accentTitle, { fontSize: metrics.titleSize, lineHeight: metrics.titleLineHeight }]}>Digital Me</Text>
    <Text style={[styles.subtitle, { fontSize: metrics.subtitleSize, lineHeight: metrics.subtitleLineHeight, marginTop: metrics.compactHeight ? 6 : 10 }]}>
      Your Digital Me evolves with your consistency. Hydrate more, become the best version of you.
    </Text>

    <View style={[styles.digitalVisualRow, { height: metrics.digitalVisualHeight, marginTop: metrics.compactHeight ? 2 : 6 }]}>
      <Image source={images.digitalMe} style={[styles.digitalMeImage, { height: metrics.digitalMeHeight, width: metrics.digitalMeWidth }]} resizeMode="contain" />
      <GradientFrame colors={['rgba(10,42,99,0.94)', 'rgba(5,20,57,0.98)']} style={[styles.digitalStatsCard, { paddingHorizontal: metrics.compactHeight ? 8 : 11, paddingVertical: metrics.compactHeight ? 8 : 12, width: metrics.digitalStatsWidth }]}>
        <DigitalStat icon="water" label="Hydration" metrics={metrics} value="78%" />
        <DigitalStat icon="lightning-bolt" label="Energy" metrics={metrics} value="85%" />
        <DigitalStat icon="brain" label="Focus" metrics={metrics} value="82%" />
        <DigitalStat icon="shield-plus-outline" label="Immunity" metrics={metrics} value="80%" />
      </GradientFrame>
    </View>

    <View style={[styles.digitalFeatureCard, { minHeight: metrics.digitalFeatureMinHeight, paddingVertical: metrics.compactHeight ? 8 : 12 }]}>
      {[
        { icon: 'trending-up', title: 'Track Progress', text: 'See your improvement every day.' },
        { icon: 'star', title: 'Level Up', text: 'Complete goals and unlock new levels.' },
        { icon: 'user', title: 'Personalized', text: 'Your journey, your Digital Me.' },
      ].map((item, itemIndex) => (
        <View key={item.title} style={styles.digitalFeatureItem}>
          <View style={[styles.featureIconCircle, { height: metrics.featureIconSize, width: metrics.featureIconSize }]}>
            <Feather name={item.icon} size={metrics.iconSize} color="#1ec8ff" />
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.digitalFeatureTitle, { fontSize: clamp(13 * metrics.scale, 10, 13) }]}>{item.title}</Text>
          <Text style={[styles.digitalFeatureText, { fontSize: clamp(11 * metrics.scale, 9, 11), lineHeight: clamp(16 * metrics.scale, 12, 16) }]}>{item.text}</Text>
          {itemIndex < 2 ? <View style={styles.digitalFeatureDivider} /> : null}
        </View>
      ))}
    </View>
  </View>
);

const RewardStat = ({ image, metrics, title, label }: { image: ImageSourcePropType; metrics: IntroMetrics; title: string; label: string }) => (
  <View style={styles.rewardStat}>
    <Image source={image} style={[styles.rewardStatImage, { height: clamp(46 * metrics.scale, 34, 46), width: clamp(46 * metrics.scale, 34, 46) }]} resizeMode="contain" />
    <View>
      <Text style={[styles.rewardStatTitle, { fontSize: clamp(25 * metrics.scale, 19, 25) }]}>{title}</Text>
      <Text style={[styles.rewardStatLabel, { fontSize: clamp(14 * metrics.scale, 11, 14) }]}>{label}</Text>
    </View>
  </View>
);

const DigitalStat = ({ icon, label, metrics, value }: { icon: string; label: string; metrics: IntroMetrics; value: string }) => (
  <View style={[styles.digitalStat, { gap: metrics.compactHeight ? 6 : 8, paddingBottom: metrics.compactHeight ? 6 : 9 }]}>
    <View style={[styles.digitalStatIcon, { borderRadius: metrics.digitalStatIconSize / 2, height: metrics.digitalStatIconSize, width: metrics.digitalStatIconSize }]}>
      <MaterialCommunityIcons name={icon} size={clamp(28 * metrics.scale, 20, 28)} color="#25d9ff" />
    </View>
    <View>
      <Text style={[styles.digitalStatLabel, { fontSize: clamp(11 * metrics.scale, 9, 11) }]}>{label}</Text>
      <Text style={[styles.digitalStatValue, { fontSize: clamp(20 * metrics.scale, 16, 20) }]}>{value}</Text>
    </View>
  </View>
);

const GradientFrame = ({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    {children}
  </View>
);

const IntroFooter = ({
  currentIndex,
  index,
  metrics,
  onNext,
  slideId,
}: {
  currentIndex: number;
  index: number;
  metrics: IntroMetrics;
  onNext: () => void;
  slideId: IntroSlideId;
}) => {
  const isFirst = slideId === 'habits';
  const isLast = slideId === 'digital-me';

  return (
    <View style={[styles.footer, { paddingHorizontal: metrics.horizontalPadding, paddingTop: metrics.footerGap }]}>
      {isFirst ? (
        <View style={styles.firstFooterRow}>
          <Text style={[styles.pageCount, { fontSize: clamp(20 * metrics.scale, 17, 20) }]}><Text style={styles.pageCountActive}>1</Text> / 3</Text>
          <PaginationDots currentIndex={currentIndex} />
          <TouchableOpacity
            accessibilityLabel="Next slide"
            accessibilityRole="button"
            activeOpacity={0.86}
            onPress={onNext}
            style={[styles.roundNextButton, { borderRadius: metrics.footerButtonHeight / 2, height: metrics.footerButtonHeight, width: metrics.footerButtonHeight }]}
          >
            <Feather name="arrow-right" size={clamp(30 * metrics.scale, 24, 30)} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            accessibilityLabel={index === slides.length - 1 ? 'Start setup' : 'Next slide'}
            accessibilityRole="button"
            activeOpacity={0.86}
            onPress={onNext}
            style={[styles.fullNextButton, { height: metrics.footerButtonHeight }]}
          >
            <Text style={[styles.fullNextText, { fontSize: clamp(18 * metrics.scale, 15, 18) }]}>{isLast ? "Let's Go!" : 'Next'}</Text>
            <Feather name="arrow-right" size={clamp(25 * metrics.scale, 21, 25)} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ marginTop: metrics.footerGap }}>
            <PaginationDots currentIndex={currentIndex} />
          </View>
        </>
      )}
    </View>
  );
};

const PaginationDots = ({ currentIndex }: { currentIndex: number }) => (
  <View style={styles.dots}>
    {slides.map((slide, dotIndex) => (
      <View key={slide.id} style={[styles.dot, currentIndex === dotIndex && styles.dotActive]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#000716',
    flex: 1,
    width: '100%',
  },
  slide: {
    alignSelf: 'stretch',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topLight: {
    position: 'absolute',
    top: -80,
  },
  waterFloor: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  headerSide: {
    width: 66,
  },
  skipButton: {
    alignItems: 'center',
    borderColor: 'rgba(119,166,255,0.65)',
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    width: 66,
  },
  skipText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,83,207,0.68)',
    borderRadius: 9,
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  bodySlot: {
    flex: 1,
    minHeight: 0,
  },
  slideBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
  },
  habitVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bottleImage: {
    shadowColor: '#00d9ff',
    shadowOpacity: 0.75,
    shadowRadius: 24,
  },
  largeTitle: {
    color: '#ffffff',
    fontWeight: '900',
    textAlign: 'center',
  },
  accentTitle: {
    color: '#16bdff',
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#e0e8ff',
    maxWidth: 320,
    textAlign: 'center',
  },
  habitFeatureCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(4,25,70,0.78)',
    borderColor: 'rgba(78,147,255,0.48)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  habitFeatureItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  featureIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,71,187,0.62)',
    borderColor: '#099eff',
    borderRadius: 23,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    color: '#ffffff',
    fontWeight: '700',
    maxWidth: '100%',
    textAlign: 'center',
  },
  featureDivider: {
    backgroundColor: 'rgba(73,124,208,0.42)',
    bottom: 8,
    position: 'absolute',
    right: 0,
    top: 8,
    width: 1,
  },
  trophyVisual: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  trophyImage: {
    zIndex: 2,
  },
  floatingCoin: {
    position: 'absolute',
  },
  floatingCoinLeft: {
    left: '14%',
    top: '50%',
    transform: [{ rotate: '-22deg' }],
  },
  floatingCoinRight: {
    right: '12%',
    top: '58%',
    transform: [{ rotate: '22deg' }],
  },
  floatingDiamond: {
    position: 'absolute',
  },
  floatingDiamondLeft: {
    bottom: '12%',
    left: '10%',
  },
  floatingDiamondRight: {
    right: '22%',
    top: '14%',
  },
  streakCard: {
    alignSelf: 'stretch',
    borderColor: '#058cff',
    borderRadius: 16,
    borderWidth: 1,
  },
  streakTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  streakTitle: {
    color: '#ffffff',
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayCircle: {
    alignItems: 'center',
    backgroundColor: '#065dff',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: 'rgba(18,26,60,0.88)',
    borderColor: '#ffd536',
    borderWidth: 1,
  },
  dayText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  checkSpacer: {
    height: 16,
  },
  rewardStatsRow: {
    borderTopColor: 'rgba(74,133,220,0.34)',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  rewardStat: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  rewardStatTitle: {
    color: '#ffffff',
    fontWeight: '900',
  },
  rewardStatLabel: {
    color: '#ffffff',
  },
  rewardStatDivider: {
    backgroundColor: 'rgba(68,123,204,0.55)',
    width: 1,
  },
  challengeCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: '#047dff',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  challengeCopy: {
    flex: 1,
    marginHorizontal: 12,
    minWidth: 0,
  },
  challengeTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4,
  },
  challengeText: {
    color: '#ffffff',
  },
  challengeArrow: {
    alignItems: 'center',
    backgroundColor: '#0759dc',
    borderColor: '#1296ff',
    borderWidth: 1,
    justifyContent: 'center',
  },
  digitalVisualRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  digitalMeImage: {
    marginRight: -10,
  },
  digitalStatsCard: {
    borderColor: 'rgba(83,150,255,0.54)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  digitalStat: {
    alignItems: 'center',
    borderBottomColor: 'rgba(55,124,220,0.46)',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  digitalStatIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,48,126,0.64)',
    justifyContent: 'center',
  },
  digitalStatLabel: {
    color: '#dbe4ff',
  },
  digitalStatValue: {
    color: '#ffffff',
    fontWeight: '900',
  },
  digitalFeatureCard: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(4,25,70,0.78)',
    borderColor: 'rgba(78,147,255,0.48)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
  },
  digitalFeatureItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 5,
    position: 'relative',
  },
  digitalFeatureTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginTop: 3,
    maxWidth: '100%',
    textAlign: 'center',
  },
  digitalFeatureText: {
    color: '#e5ecff',
    marginTop: 4,
    textAlign: 'center',
  },
  digitalFeatureDivider: {
    backgroundColor: 'rgba(73,124,208,0.42)',
    bottom: 8,
    position: 'absolute',
    right: 0,
    top: 8,
    width: 1,
  },
  footer: {
    alignItems: 'center',
    flexShrink: 0,
  },
  firstFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pageCount: {
    color: '#b7c8e8',
    fontWeight: '700',
    minWidth: 70,
  },
  pageCountActive: {
    color: '#14bdff',
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: '#233d73',
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  dotActive: {
    backgroundColor: '#13c9ff',
  },
  roundNextButton: {
    alignItems: 'center',
    backgroundColor: '#0658ff',
    borderColor: '#1cd7ff',
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#0cd9ff',
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  fullNextButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#0658ff',
    borderColor: '#1cd7ff',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0cd9ff',
    shadowOpacity: 0.48,
    shadowRadius: 16,
  },
  fullNextText: {
    color: '#ffffff',
    flex: 1,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default IntroScreen;
