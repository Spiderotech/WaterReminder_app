import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Timely Reminders\nto Help You Drink More Water',
    description:
      'Our app helps you stay refreshed and healthy by sending smart reminders.',
  },
  {
    id: '2',
    title: 'Build a Healthy Habit\nOne Sip at a Time',
    description:
      'Simple, clean, and effective — this app keeps your water intake right.',
  },
  {
    id: '3',
    title: 'Healthy Living\nStarts with Hydration',
    description: '',
  },
];

const IntroScreen = ({ navigation }: any) => {
  const scheme = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const backgroundColor = scheme === 'dark' ? '#3498ff' : '#3498ff';
  const barStyle = scheme === 'dark' ? 'light-content' : 'light-content';

  const isSmallDevice = width < 350 || height < 650;

// Responsive sizes (update for small devices)
const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.06);
const descFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const imageSize = isSmallDevice ? 80 : Math.max(120, Math.min(width * 0.55, height * 0.3));
const navCircleSize = isSmallDevice ? 32 : Math.max(44, width * 0.13);
const startButtonPaddingV = isSmallDevice ? 7 : Math.max(10, height * 0.015);
const startButtonPaddingH = isSmallDevice ? 14 : Math.max(24, width * 0.08);
const dotSize = isSmallDevice ? 7 : width * 0.022;
const dotActiveSize = isSmallDevice ? 11 : width * 0.033;
const dotRadius = isSmallDevice ? 3.5 : width * 0.011;
const dotMargin = isSmallDevice ? 2 : 5;
const slidePadding = isSmallDevice ? 8 : width * 0.06;
const slideMarginB = isSmallDevice ? 10 : height * 0.05;
const navMarginH = isSmallDevice ? 12 : width * 0.08;
const navMarginB = isSmallDevice ? 12 : height * 0.05;
const dotsMarginB = isSmallDevice ? 8 : height * 0.025;

  const onNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Onboarding');
    }
  };

  const onPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const onSkip = () => navigation.replace('Onboarding');

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={[styles.container, { backgroundColor }]}>
    <StatusBar
      backgroundColor={backgroundColor}
      barStyle={barStyle}
      translucent={false}
    />

    <FlatList
      ref={flatListRef}
      data={slides}
      keyExtractor={item => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <View style={[styles.slide, { width, padding: slidePadding }]}>
          {item.image && (
            <Image
              source={item.image}
              style={[
                styles.image,
                { width: imageSize, height: imageSize, marginBottom: slideMarginB },
              ]}
            />
          )}
          <Text style={[styles.title, { fontSize: titleFontSize, marginBottom: isSmallDevice ? 6 : height * 0.015 }]}>{item.title}</Text>
          {item.description ? (
            <Text style={[styles.desc, { fontSize: descFontSize, lineHeight: descFontSize * 1.4 }]}>{item.description}</Text>
          ) : null}
        </View>
      )}
    />

    {/* Pagination Dots */}
    <View style={[styles.dotsContainer, { marginBottom: dotsMarginB }]}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: currentIndex === index ? dotActiveSize : dotSize,
              height: dotSize,
              borderRadius: dotRadius,
              marginHorizontal: dotMargin,
              backgroundColor: currentIndex === index ? '#fff' : '#ccc',
            },
          ]}
        />
      ))}
    </View>

    {/* Navigation Controls */}
    <View style={[styles.navContainer, { marginHorizontal: navMarginH, marginBottom: navMarginB }]}>
      {currentIndex < slides.length - 1 ? (
        <>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={onPrev} style={[styles.navCircle, { width: navCircleSize, height: navCircleSize, borderRadius: navCircleSize / 2 }]}>
              <Feather name="arrow-left" size={navCircleSize * 0.43} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onSkip}>
              <Text style={[styles.navText, { fontSize: descFontSize }]}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onNext} style={[styles.navCircle, { width: navCircleSize, height: navCircleSize, borderRadius: navCircleSize / 2 }]}>
            <Feather name="arrow-right" size={navCircleSize * 0.43} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity onPress={onNext} style={[styles.startButton, { paddingVertical: startButtonPaddingV, paddingHorizontal: startButtonPaddingH, borderRadius: startButtonPaddingH }]}>
          <Text style={[styles.startText, { fontSize: descFontSize }]} >Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  desc: {
    color: '#f0f0f0',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navText: {
    color: '#fff',
  },
  navCircle: {
    backgroundColor: '#ffffff33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  startText: {
    color: '#5D8BF4',
    fontWeight: 'bold',
  },
});

export default IntroScreen;
