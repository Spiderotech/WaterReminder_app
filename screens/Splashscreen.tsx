import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SplashNavigation = NativeStackNavigationProp<Record<string, undefined>>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashNavigation>();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        const hydrationGoal = await AsyncStorage.getItem('hydrationGoal');

        if (userProfile && hydrationGoal) {
          navigation.replace('Home');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
        navigation.replace('Login');
      }
    };

    const timeout = setTimeout(checkUserData, 2000); // 2-second splash delay

    return () => clearTimeout(timeout);
  }, [navigation]);

  const markSize = Math.min(132, Math.max(96, width * 0.3));
  const titleSize = Math.min(62, Math.max(42, width * 0.135));
  const taglineSize = Math.min(22, Math.max(16, width * 0.047));
  const contentTop = Math.min(height * 0.55, height - 405);

  return (
    <ImageBackground
      source={require('../assets/spalsh_bg.png')}
      style={styles.background}
      resizeMode="cover">
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />
      <View style={styles.scrim} />
      <View style={[styles.brandArea, { paddingHorizontal: width * 0.08, top: contentTop }]}>
        <View style={[styles.logoFrame, { width: markSize, height: markSize, borderRadius: markSize / 2 }]}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Image
                source={require('../assets/logo2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
        <Text
          style={[styles.title, { fontSize: titleSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          <Text style={styles.titleLight}>Dora</Text>
          <Text style={styles.titleBlue}>Drink</Text>
        </Text>
        <Text style={[styles.tagline, { fontSize: taglineSize }]}>Hydrate. Earn. Compete.</Text>
      </View>
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#1597FF" />
      </View>
    </ImageBackground>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 7, 18, 0.22)',
  },
  brandArea: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
  logoFrame: {
    alignItems: 'center',
    backgroundColor: '#061127',
    borderColor: '#061B3F',
    borderWidth: 7,
    elevation: 16,
    justifyContent: 'center',
    shadowColor: '#009DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
  },
  logoRing: {
    alignItems: 'center',
    borderColor: '#48DFFF',
    borderRadius: 999,
    borderWidth: 5,
    height: '88%',
    justifyContent: 'center',
    width: '88%',
  },
  logoInner: {
    alignItems: 'center',
    backgroundColor: '#071125',
    borderRadius: 999,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    height: '76%',
    width: '76%',
  },
  title: {
    fontWeight: '800',
    marginTop: 22,
  },
  titleLight: {
    color: '#FFFFFF',
  },
  titleBlue: {
    color: '#209CFF',
  },
  tagline: {
    color: '#C4C9DC',
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingArea: {
    alignItems: 'center',
    bottom: 86,
    position: 'absolute',
    width: '100%',
  },
  loadingText: {
    color: '#BFC8E2',
    fontSize: 17,
    marginTop: 24,
    textAlign: 'center',
  },
});
