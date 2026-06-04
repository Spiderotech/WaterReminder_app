import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DigitalMeScreen from '../screens/DigitalMeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RewardsScreen from '../screens/RewardsScreen';
import { useMainTabTheme } from '../constants/mainTabTheme';

type MainTabKey = 'home' | 'history' | 'digitalMe' | 'rewards' | 'leaderboard' | 'profile';

type MainTab = {
  key: MainTabKey;
  label: string;
  icon: string;
  activeIcon: string;
  component: React.ComponentType<{ goToTab?: (tab: MainTabKey) => void }>;
};

const tabs: MainTab[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', component: HomeScreen },
  { key: 'history', label: 'History', icon: 'chart-line', activeIcon: 'chart-areaspline', component: HistoryScreen },
  { key: 'digitalMe', label: 'Digital Me', icon: 'account-heart-outline', activeIcon: 'account-heart', component: DigitalMeScreen },
  { key: 'rewards', label: 'Rewards', icon: 'gift-outline', activeIcon: 'gift', component: RewardsScreen },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'podium', activeIcon: 'podium-gold', component: LeaderboardScreen },
  { key: 'profile', label: 'Profile', icon: 'account-outline', activeIcon: 'account', component: ProfileScreen },
];

const MainTabs = () => {
  const appTheme = useMainTabTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MainTabKey>('home');
  const themeColors = appTheme.isLight ? lightTabTheme : darkTabTheme;
  const bottomInset = Math.max(insets.bottom, 18);
  const tabBarHeight = 68 + bottomInset;
  const ActiveScreen = useMemo(
    () => tabs.find(tab => tab.key === activeTab)?.component || HomeScreen,
    [activeTab],
  );

  return (
    <View style={[styles.shell, { backgroundColor: appTheme.shell }]}>
      <View style={[styles.screen, { paddingBottom: tabBarHeight }]}>
        <ActiveScreen goToTab={setActiveTab} />
      </View>
      <GradientFrame
        colors={themeColors.tabBar}
        style={[
          styles.tabBar,
          {
            borderColor: themeColors.border,
            minHeight: tabBarHeight,
            paddingBottom: bottomInset,
            shadowColor: themeColors.shadow,
          },
        ]}
      >
        {tabs.map(tab => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.86}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tabButton}
            >
              {active ? (
                <GradientFrame colors={themeColors.activeBubble} style={[styles.activeBubble, { borderColor: themeColors.activeBorder }]}>
                  <MaterialCommunityIcons name={tab.activeIcon} size={23} color="#ffffff" />
                </GradientFrame>
              ) : (
                <View style={styles.inactiveIcon}>
                  <MaterialCommunityIcons name={tab.icon} size={22} color={themeColors.inactiveIcon} />
                </View>
              )}
              <Text style={[styles.tabLabel, { color: active ? themeColors.activeText : themeColors.inactiveText }]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </GradientFrame>
    </View>
  );
};

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

const darkTabTheme = {
  tabBar: ['rgba(5,18,43,0.98)', 'rgba(2,8,22,0.99)'] as [string, string],
  border: '#24436e',
  shadow: '#1679ff',
  activeBubble: ['#1787ff', '#095cff'] as [string, string],
  activeBorder: '#5fc4ff',
  activeText: '#35d9ff',
  inactiveIcon: '#8c9ac2',
  inactiveText: '#8c9ac2',
};

const lightTabTheme = {
  tabBar: ['rgba(255,255,255,0.98)', 'rgba(228,239,255,0.98)'] as [string, string],
  border: '#bfd5f5',
  shadow: '#7bb8ff',
  activeBubble: ['#2f8dff', '#0c65ed'] as [string, string],
  activeBorder: '#8ad7ff',
  activeText: '#006bdc',
  inactiveIcon: '#7584a4',
  inactiveText: '#7584a4',
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#010713',
    flex: 1,
  },
  screen: {
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
  tabBar: {
    alignItems: 'center',
    borderColor: '#24436e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 86,
    paddingBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#1679ff',
    shadowOpacity: 0.38,
    shadowRadius: 16,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  activeBubble: {
    alignItems: 'center',
    borderColor: '#5fc4ff',
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    shadowColor: '#1688ff',
    shadowOpacity: 0.72,
    shadowRadius: 12,
    width: 42,
  },
  inactiveIcon: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
});

export default MainTabs;
