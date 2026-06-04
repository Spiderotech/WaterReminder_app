import React from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

type LoginNavigation = NativeStackNavigationProp<Record<string, undefined>>;

const features = [
  { icon: 'droplet', title: 'Hydrate', subtitle: 'Stay on track' },
  { icon: 'zap', title: 'Energize', subtitle: 'Boost your day' },
  { icon: 'award', title: 'Compete', subtitle: 'Challenge friends' },
  { icon: 'bar-chart-2', title: 'Improve', subtitle: 'See real results' },
];

const LoginScreen = () => {
  const navigation = useNavigation<LoginNavigation>();
  const { width, height } = useWindowDimensions();
  const compact = height < 760;
  const short = height < 700;
  const titleSize = Math.min(46, Math.max(32, width * 0.118));
  const panelPadding = short ? 12 : 18;
  const panelBottom = short ? 16 : 22;
  const authButtonHeight = short ? 54 : 50;
  const featureIconSize = short ? 42 : compact ? 50 : 48;
  const featureTop = height * (short ? 0.35 : compact ? 0.5 : 0.41);
  const featureGap = short ? 39 : 42;
  const artworkTop = height * (short ? 0.18 : 0.19);
  const artworkHeight = height * (short ? 0.66 : 0.68);
  const artworkWidth = width * (short ? 1.12 : 1.58);
  const markSize = Math.min(132, Math.max(96, width * 0.3));

  const continueAsGuest = async () => {
    await AsyncStorage.setItem('authMode', 'guest');
    navigation.replace('Intro');
  };

  return (
    <View style={styles.background}>
      <Image
        source={require('../assets/Auth_bg.png')}
        style={[
          styles.artwork,
          {
            height: artworkHeight,
            left: (width - artworkWidth) / 2,
            top: artworkTop,
            width: artworkWidth,
          },
        ]}
        resizeMode="contain"
      />
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, { paddingHorizontal: width * 0.052 }]}>
          <View style={styles.hero}>
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
            <Text style={[styles.title, { fontSize: titleSize }]}>
              <Text style={styles.titleLight}>Dora</Text>
              <Text style={styles.titleBlue}>Drink</Text>
            </Text>
            <Text style={[styles.tagline, { fontSize: short ? 19 : 16 }]}>Hydrate. Earn. Compete.</Text>
            <Text style={[styles.description, { fontSize: short ? 14 : 14, lineHeight: short ? 12 : 14 }]}>
              Track your hydration, improve your body,{'\n'}
              and become the best version of you.
            </Text>
          </View>

          <View style={[styles.featureLayer, { top: featureTop }]}>
            <View style={[styles.featureColumn, { gap: featureGap }]}>
              <FeaturePill {...features[0]} iconSize={featureIconSize} compact={short} />
              <FeaturePill {...features[2]} iconSize={featureIconSize} compact={short} />
            </View>
            <View style={[styles.featureColumn, { gap: featureGap }]}>
              <FeaturePill {...features[1]} iconSize={featureIconSize} compact={short} />
              <FeaturePill {...features[3]} iconSize={featureIconSize} compact={short} />
            </View>
          </View>

          <View style={[styles.authPanel, { bottom: panelBottom, padding: panelPadding }]}>
            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.guestButton, { minHeight: authButtonHeight }]}
              onPress={continueAsGuest}>
              <Feather name="user" size={short ? 24 : 25} color="#FFFFFF" />
              <Text style={[styles.guestText, { fontSize: short ? 18 : 16 }]}>Continue as Guest</Text>
              <Feather name="arrow-right" size={short ? 28 : 24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.termsText, { fontSize: short ? 12 : 12, marginTop: short ? 10 : 20 }]}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.linkText} onPress={() => navigation.navigate('Privacy')}>
                Privacy Policy
              </Text>
              <Text> and </Text>
              <Text style={styles.linkText} onPress={() => navigation.navigate('Terms')}>
                Terms of Use
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const FeaturePill = ({
  icon,
  title,
  subtitle,
  iconSize,
  compact,
}: {
  icon: string;
  title: string;
  subtitle: string;
  iconSize: number;
  compact: boolean;
}) => (
  <View style={styles.feature}>
    <View style={[styles.featureIcon, { borderRadius: iconSize / 2, height: iconSize, width: iconSize }]}>
      <Feather name={icon} size={iconSize * 0.42} color="#8FEAFF" />
    </View>
    <Text style={[styles.featureTitle, { fontSize: compact ? 16 : 14 }]}>{title}</Text>
    <Text style={[styles.featureSubtitle, { fontSize: compact ? 12 : 10 }]}>{subtitle}</Text>
  </View>
);

export default LoginScreen;

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#000817',
    flex: 1,
  },
  artwork: {
    position: 'absolute',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 7, 20, 0.06)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    
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
    marginTop: 2,
  },
  titleLight: {
    color: '#FFFFFF',
  },
  titleBlue: {
    color: '#209CFF',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  glowLine: {
    backgroundColor: '#7AEAFF',
    borderRadius: 2,
    height: 1,
    marginTop: 18,
    shadowColor: '#2DBDFF',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    width: 178,
  },
  description: {
    color: '#D8DDEE',
    fontSize: 17,
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center',
  },
  featureLayer: {
    left: 0,
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
   
  },
  featureColumn: {
    alignItems: 'center',
  },
  feature: {
    alignItems: 'center',
    width: 112,
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 33, 80, 0.55)',
    borderColor: '#0879E8',
    borderRadius: 32,
    borderWidth: 1.5,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#149CFF',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    width: 64,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    color: '#E7EAF6',
    fontSize: 13,
    marginTop: 1,
    textAlign: 'center',
  },
  authPanel: {
    backgroundColor: 'rgba(1, 10, 28, 0.8)',
    borderColor: 'rgba(139, 166, 214, 0.28)',
    borderRadius: 24,
    borderWidth: 1.2,
    left: 10,
    position: 'absolute',
    right: 10,
  },
  guestButton: {
    alignItems: 'center',
    backgroundColor: '#0C8FFF',
    borderColor: '#75F2FF',
    borderRadius: 17,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: 30,
    shadowColor: '#1DB8FF',
    shadowOpacity: 0.85,
    shadowRadius: 16,
  },
  guestText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  termsText: {
    color: '#C8CEDE',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 24,
    textAlign: 'center',
  },
  linkText: {
    color: '#11A8FF',
    fontWeight: '700',
  },
});
