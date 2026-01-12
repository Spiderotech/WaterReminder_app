import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  Share,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllHydrationReminders } from '../utils/notificationUtils';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const paddingHorizontal = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerTitleFontSize = isSmallDevice ? 18 : Math.max(22, width * 0.05);
const optionRowPaddingV = isSmallDevice ? 10 : Math.max(20, height * 0.025);
const labelFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const cardPaddingV = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const cardPaddingH = isSmallDevice ? 8 : Math.max(15, width * 0.04);
const cardRadius = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const iconSize = isSmallDevice ? 18 : Math.max(22, width * 0.06);
const iconMarginR = isSmallDevice ? 8 : Math.max(12, width * 0.03);
const modalContentPadding = isSmallDevice ? 12 : Math.max(24, width * 0.06);
const modalRadius = isSmallDevice ? 10 : Math.max(16, width * 0.045);
const modalTitleFontSize = isSmallDevice ? 15 : Math.max(18, width * 0.055);
const modalMessageFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.04);
const modalButtonPaddingV = isSmallDevice ? 7 : Math.max(10, height * 0.014);
const modalButtonPaddingH = isSmallDevice ? 12 : Math.max(20, width * 0.06);
const modalButtonRadius = isSmallDevice ? 7 : Math.max(10, width * 0.03);

const settingsOptions = [
  { label: 'History', icon: 'clock', screen: 'History' },
  { label: 'Reminder Settings', icon: 'bell', screen: 'ReminderSettings' },
  { label: 'Personal Information', icon: 'user', screen: 'PersonalInfo' },
  { label: 'Theme Settings', icon: 'moon', screen: 'ThemeSettings' },
  { label: 'Reset Data', icon: 'rotate-ccw', screen: null },
  { label: 'Contact Support', icon: 'mail', screen: 'ContactSupport' },
  { label: 'FAQ', icon: 'help-circle', screen: 'FAQ' },
  { label: 'Share', icon: 'share-2', screen: null },
  { label: 'Privacy Policy', icon: 'lock', screen: 'Privacy' },
  { label: 'Terms of Service', icon: 'file-text', screen: 'Terms' },
];

const SettingsScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [resetModalVisible, setResetModalVisible] = useState(false);

  const goBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleReset = async () => {
    try {
      await cancelAllHydrationReminders();
      await AsyncStorage.clear();
      setResetModalVisible(false);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  const APP_LINKS = {
  ios: 'https://apps.apple.com/app/id6752671109',
  android: 'https://play.google.com/store/apps/details?id=com.doradrinkwaterreminderapp',
};

const handleShare = async () => {
  try {
    const storeLink =
      Platform.OS === 'ios' ? APP_LINKS.ios : APP_LINKS.android;

    await Share.share({
      message: `Stay hydrated with DoraDrink! 💧\n\nDownload now:\n${storeLink}`,
      url: storeLink, // iOS prefers url
      title: 'DoraDrink – Stay Hydrated',
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
};


  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: dark ? '#000' : '#fff', paddingHorizontal }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Feather name="arrow-left" size={iconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#111', fontSize: headerTitleFontSize }]}>
          Settings
        </Text>
      </View>

      {/* Scrollable List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: dark ? '#121212' : '#fff',
              shadowColor: dark ? '#000' : '#aaa',
              paddingVertical: cardPaddingV,
              paddingHorizontal: cardPaddingH,
              borderRadius: cardRadius,
            },
          ]}
        >
          {settingsOptions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionRow,
                { borderBottomColor: dark ? '#333' : '#eee', paddingVertical: optionRowPaddingV },
              ]}
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                } else if (item.label === 'Reset Data') {
                  setResetModalVisible(true);
                } else if (item.label === 'Share') {
                  handleShare();
                }
              }}
            >
              <View style={styles.left}>
                <Feather
                  name={item.icon}
                  size={iconSize}
                  color={dark ? '#ccc' : '#007AFF'}
                  style={{ marginRight: iconMarginR }}
                />
                <Text
                  style={[styles.label, { color: dark ? '#fff' : '#333', fontSize: labelFontSize }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={iconSize - 2}
                color={dark ? '#666' : '#999'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: dark ? '#fff' : '#fff',
              padding: modalContentPadding,
              borderRadius: modalRadius,
            }
          ]}>
            <Text style={[styles.modalTitle, { color: dark ? '#000' : '#000', fontSize: modalTitleFontSize }]}>
              Reset All Data?
            </Text>
            <Text style={[styles.modalMessage, { color: dark ? '#333' : '#333', fontSize: modalMessageFontSize }]}>
              This will erase all your water intake, reminders, and settings. Are you sure you want to continue?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: dark ? '#333' : '#eee',
                    paddingVertical: modalButtonPaddingV,
                    paddingHorizontal: modalButtonPaddingH,
                    borderRadius: modalButtonRadius,
                  }
                ]}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={{ color: dark ? '#fff' : '#000' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: '#007AFF',
                    paddingVertical: modalButtonPaddingV,
                    paddingHorizontal: modalButtonPaddingH,
                    borderRadius: modalButtonRadius,
                  }
                ]}
                onPress={handleReset}
              >
                <Text style={{ color: '#fff' }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    // padding and borderRadius set inline for responsiveness
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    flexShrink: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {},
});