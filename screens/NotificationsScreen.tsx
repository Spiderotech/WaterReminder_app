import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  dismissNotificationFeedItems,
  getNotificationFeed,
  NotificationFeedItem,
} from '../services/notificationFeedService';

type NotificationCategory = 'all' | 'reminders' | 'achievements' | 'system';

type NotificationItem = {
  id: string;
  group: string;
  category: Exclude<NotificationCategory, 'all'>;
  title: string;
  body: string;
  time: string;
  accent: string;
  image?: ImageSourcePropType;
  icon?: string;
  action?: string;
  reward?: string;
  route?: string;
};

const images = {
  mascot: require('../assets/hydrationplan.png') as ImageSourcePropType,
  water: require('../assets/waterglass.png') as ImageSourcePropType,
  streak: require('../assets/streak.png') as ImageSourcePropType,
  coin: require('../assets/coin2.png') as ImageSourcePropType,
  trophy: require('../assets/challenge.png') as ImageSourcePropType,
  reward: require('../assets/reward.png') as ImageSourcePropType,
};

const tabs: { id: NotificationCategory; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All', icon: 'apps', color: '#ffffff' },
  { id: 'reminders', label: 'Reminders', icon: 'water', color: '#35c8ff' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy', color: '#b65cff' },
  { id: 'system', label: 'System', icon: 'bell-outline', color: '#ffad33' },
];

const { width } = Dimensions.get('window');
const isCompactScreen = width < 430;
const screenPadding = 14;
const cardPaddingHorizontal = 14;
const cardPaddingVertical = isCompactScreen ? 12 : 10;
const iconSize = isCompactScreen ? 48 : 54;
const iconImageSize = isCompactScreen ? 39 : 45;
const timeColumnWidth = isCompactScreen ? 74 : 82;

const mapFeedItem = (item: NotificationFeedItem): NotificationItem => ({
  ...item,
  image: item.imageKey ? images[item.imageKey] : undefined,
});

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);

  const loadFeed = useCallback(async () => {
    const feed = await getNotificationFeed();
    setItems(feed.map(mapFeedItem));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  const filtered = useMemo(
    () => activeTab === 'all' ? items : items.filter(item => item.category === activeTab),
    [activeTab, items],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    filtered.forEach(item => {
      groups[item.group] = [...(groups[item.group] || []), item];
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <LinearGradient colors={['#010713', '#041025', '#020713']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header
            onBack={() => navigation.goBack()}
            onSettings={() => navigation.navigate('Profile' as never)}
          />
          <CategoryTabs activeTab={activeTab} onChange={setActiveTab} />
          {grouped.length ? (
            grouped.map(([group, groupItems]) => (
              <View key={group} style={styles.group}>
                <Text style={styles.groupTitle}>{group}</Text>
                {groupItems.map(item => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onPress={() => {
                      if (item.route === 'Home') navigation.goBack();
                      if (item.route && item.route !== 'Home') navigation.navigate(item.route as never);
                    }}
                  />
                ))}
              </View>
            ))
          ) : (
            <EmptyState />
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              await dismissNotificationFeedItems(items.map(item => item.id));
              setItems([]);
            }}
            style={styles.clearButton}
          >
            <Feather name="trash-2" size={18} color="#8e96ad" />
            <Text style={styles.clearText}>Clear all notifications</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, onSettings }: { onBack: () => void; onSettings: () => void }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={styles.headerButton}>
      <Feather name="arrow-left" size={25} color="#ffffff" />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle}>Notifications</Text>
      <Text style={styles.headerSubtitle}>Stay updated on your hydration journey</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onSettings} style={styles.headerButton}>
      <Feather name="settings" size={23} color="#ffffff" />
    </TouchableOpacity>
  </View>
);

const CategoryTabs = ({ activeTab, onChange }: { activeTab: NotificationCategory; onChange: (tab: NotificationCategory) => void }) => (
  <LinearGradient colors={['rgba(7,22,50,0.98)', 'rgba(4,12,29,0.98)']} style={styles.tabs}>
    {tabs.map(tab => {
      const active = activeTab === tab.id;
      return (
        <TouchableOpacity key={tab.id} activeOpacity={0.88} onPress={() => onChange(tab.id)} style={styles.tabTouch}>
          {active ? (
            <LinearGradient colors={['#1787ff', '#095cff']} style={styles.tabActive}>
              <MaterialCommunityIcons name={tab.icon} size={14} color="#ffffff" />
              <Text style={styles.tabActiveText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{tab.label}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabInactive}>
              <MaterialCommunityIcons name={tab.icon} size={18} color={tab.color} />
              <Text style={[styles.tabText, { color: tab.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{tab.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </LinearGradient>
);

const NotificationCard = ({ item, onPress }: { item: NotificationItem; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
    <View style={[styles.cardFrame, { borderColor: `${item.accent}75` }]}>
      <LinearGradient colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.card}>
        <View style={styles.cardMain}>
          <View style={[styles.iconWrap, { borderColor: item.accent, backgroundColor: `${item.accent}18` }]}>
            {item.image ? (
              <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <MaterialCommunityIcons name={item.icon || 'bell'} size={34} color={item.accent} />
            )}
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
            {item.action ? (
              <View style={styles.actionButton}>
                <Text style={styles.actionText} numberOfLines={1}>
                  {item.action}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.cardSide}>
          <Text style={styles.cardTime} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {item.time}
          </Text>
          {item.reward ? (
            <Text style={[styles.rewardText, { color: item.accent }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
              {item.reward}
            </Text>
          ) : (
            <View style={[styles.unreadDot, { backgroundColor: item.accent }]} />
          )}
        </View>
      </LinearGradient>
    </View>
  </TouchableOpacity>
);

const EmptyState = () => (
  <View style={styles.emptyFrame}>
    <LinearGradient colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.emptyCard}>
      <MaterialCommunityIcons name="bell-check-outline" size={42} color="#35c8ff" />
      <Text style={styles.emptyTitle}>You're all caught up</Text>
      <Text style={styles.emptyText}>New reminders, claims, streaks, and reward updates will appear here.</Text>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingBottom: 36, paddingHorizontal: screenPadding },
  header: { alignItems: 'center', flexDirection: 'row', paddingBottom: 22, paddingTop: 12 },
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
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600', lineHeight: 32 },
  headerSubtitle: { color: '#b7bdd7', fontSize: 12, marginTop: 2, textAlign: 'center' },
  tabs: {
    borderColor: '#24436e',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 18,
    minHeight: 50,
    overflow: 'hidden',
    padding: 1,
  },
  tabTouch: {
    flex: 1,
    minWidth: 0,
  },
  tabActive: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 5,
    height: 40,
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 8,
  },
  tabInactive: {
    alignItems: 'center',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 4,
    height: 40,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
  },
  tabActiveText: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: isCompactScreen ? 11 : 12,
    fontWeight: '900',
  },
  tabText: {
    flexShrink: 1,
    fontSize: isCompactScreen ? 10 : 11,
    fontWeight: '800',
  },
  group: { marginBottom: 14 },
  groupTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  cardFrame: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: isCompactScreen ? 136 : 110,
    overflow: 'hidden',
  },
  card: {
    alignItems: 'center',
    flex: 1,
    minHeight: isCompactScreen ? 136 : 110,
    overflow: 'hidden',
    position: 'relative',
  },
  cardMain: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
    width: '100%',
    paddingHorizontal: cardPaddingHorizontal,
    paddingVertical: cardPaddingVertical,
    paddingRight: cardPaddingHorizontal + timeColumnWidth,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: iconSize / 2,
    borderWidth: 1,
    height: iconSize,
    justifyContent: 'center',
    marginRight: isCompactScreen ? 10 : 12,
    width: iconSize,
  },
  cardImage: { height: iconImageSize, width: iconImageSize },
  cardCopy: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  cardTitle: { color: '#ffffff', flexShrink: 1, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  cardBody: { color: '#c5cbe0', flexShrink: 1, fontSize: 12, lineHeight: 18, marginTop: 5 },
  actionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0e82ff',
    borderColor: '#54c2ff',
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 9,
    maxWidth: '100%',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  actionText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  cardSide: {
    alignItems: 'flex-end',
    bottom: cardPaddingVertical,
    justifyContent: 'space-between',
    position: 'absolute',
    right: cardPaddingHorizontal,
    top: cardPaddingVertical,
    width: timeColumnWidth,
  },
  cardTime: { color: '#c6cad9', fontSize: 12, textAlign: 'right', width: '100%' },
  unreadDot: { borderRadius: 5, height: 10, width: 10 },
  rewardText: { fontSize: isCompactScreen ? 17 : 19, fontWeight: '900', textAlign: 'right', width: '100%' },
  clearButton: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 6, minHeight: 44 },
  clearText: { color: '#8e96ad', fontSize: 13, marginLeft: 10 },
  emptyFrame: {
    borderColor: '#24436e',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 20,
    minHeight: 150,
    overflow: 'hidden',
  },
  emptyCard: {
    alignItems: 'center',
    flex: 1,
    padding: 22,
  },
  emptyTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#b7bdd7', fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
});

export default NotificationsScreen;
