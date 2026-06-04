import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AnalyticsTabData, HistoryAnalyticsKey } from '../../constants/historyData';

interface AnalyticsTabsProps {
  tabs: AnalyticsTabData[];
  activeKey: HistoryAnalyticsKey;
  onChange: (key: HistoryAnalyticsKey) => void;
}

const activePalette: Record<HistoryAnalyticsKey, { colors: string[]; border: string; text: string; shadow: string }> = {
  hydration: {
    colors: ['#1989ff', '#095dff'],
    border: '#4db3ff',
    text: '#ffffff',
    shadow: '#147dff',
  },
  slots: {
    colors: ['#1989ff', '#095dff'],
    border: '#4db3ff',
    text: '#ffffff',
    shadow: '#147dff',
  },
  streaks: {
    colors: ['#b94cff', '#7a24c8'],
    border: '#db7dff',
    text: '#ffffff',
    shadow: '#b844ff',
  },
  rewards: {
    colors: ['#d99b0c', '#8d6100'],
    border: '#ffd45f',
    text: '#ffffff',
    shadow: '#d99b0c',
  },
  competitions: {
    colors: ['#2a6cff', '#18307a'],
    border: '#75a4ff',
    text: '#ffffff',
    shadow: '#2a6cff',
  },
};

const AnalyticsTabs = ({ tabs, activeKey, onChange }: AnalyticsTabsProps) => (
  <View style={styles.shell}>
    <View style={styles.list}>
      {tabs.map(item => {
        const active = item.key === activeKey;
        const palette = activePalette[item.key];

        return (
          <TouchableOpacity key={item.key} activeOpacity={0.85} onPress={() => onChange(item.key)} style={styles.touch}>
            <View
              style={[
                styles.tab,
                active && styles.activeTab,
                active && { borderColor: palette.border, shadowColor: palette.shadow },
              ]}
            >
              {active ? <LinearGradient colors={palette.colors} style={styles.tabBackground} /> : null}
              <Text
                style={[styles.label, active && styles.activeLabel, active && { color: palette.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.76}
              >
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'rgba(2,10,25,0.96)',
    borderColor: '#12325f',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 22,
    overflow: 'hidden',
    paddingHorizontal: 8,
    shadowColor: '#0b4ca0',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  list: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 54,
  },
  touch: {
    flex: 1,
    minWidth: 0,
  },
  tab: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 2,
    overflow: 'hidden',
    paddingHorizontal: 4,
    position: 'relative',
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  activeTab: {
    shadowOpacity: 0.95,
    shadowRadius: 10,
  },
  label: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  activeLabel: {
    fontWeight: '800',
    textShadowColor: 'rgba(255,255,255,0.65)',
    textShadowRadius: 7,
  },
});

export default AnalyticsTabs;
