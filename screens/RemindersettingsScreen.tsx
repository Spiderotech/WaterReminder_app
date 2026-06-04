import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee from '@notifee/react-native';
import { getPermission as requestExactAlarmPermission } from 'react-native-schedule-exact-alarm-permission';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from '../components/AppSafeAreaView';
import LinearGradient from 'react-native-linear-gradient';
import { useMainTabTheme } from '../constants/mainTabTheme';

import {
  getReminders,
  addReminder as addReminderUtil,
  deleteReminder as deleteReminderUtil,
  updateReminder as updateReminderUtil,
  Reminder,
} from '../utils/reminderUtils';
import { scheduleRemindersIfGoalNotReached } from '../utils/notificationUtils';
import { needsExactAlarmPermission } from '../utils/exactAlarmPermission';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 350 || height < 650;
const BLUE = '#16b8ff';
const GOLD = '#ffd24b';
const PURPLE = '#b96cff';
const GREEN = '#50e574';
const PANEL = 'rgba(7, 24, 62, 0.72)';
const PANEL_SOFT = 'rgba(12, 34, 78, 0.58)';
const BORDER = 'rgba(75, 112, 183, 0.44)';
const MUTED = '#c8d2ee';
const SWITCH_TRACK = { false: 'rgba(82, 103, 159, 0.48)', true: '#42d96b' };
const SWITCH_IOS_BG = 'rgba(82, 103, 159, 0.48)';
const SCREEN_PADDING = isSmallDevice ? 19 : 25;
const reminderActionWidth = Math.min(112, Math.max(96, width * 0.25));

const formatTime = (time: string): string => {
  const [hourText = '0', minuteText = '0'] = time.split(':');
  const hour = Number(hourText);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, '0')}:${minuteText.padStart(2, '0')} ${period}`;
};

const toPickerDate = (time: string) => {
  const [hourText = '8', minuteText = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hourText), Number(minuteText), 0, 0);
  return date;
};

const toReminderTime = (date: Date) => (
  date.toTimeString().split(':').slice(0, 2).join(':')
);

const getLastUpdatedText = () => {
  const now = new Date();
  return `Today, ${formatTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)}`;
};

const getReminderMeta = (index: number) => {
  if (index === 0) {
    return {
      title: 'Morning Reminder',
      quote: 'Start your day fresh and hydrated',
      accent: GOLD,
      image: require('../assets/morning.png'),
      icon: 'sun',
    };
  }

  if (index === 1) {
    return {
      title: 'Afternoon Reminder',
      quote: 'Keep your energy flowing',
      accent: BLUE,
      image: require('../assets/afternoon.png'),
      icon: 'clock',
    };
  }

  return {
    title: index === 2 ? 'Evening Reminder' : 'Custom Reminder',
    quote: index === 2 ? 'Finish strong today' : 'Stay steady and hydrated',
    accent: PURPLE,
    image: require('../assets/evening.png'),
    icon: 'clock',
  };
};

const ReminderSettingsScreen = ({ navigation }: any) => {
  const tabTheme = useMainTabTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showExactAlarmCard, setShowExactAlarmCard] = useState(false);

  const lastUpdatedText = useMemo(getLastUpdatedText, [reminders]);

  useEffect(() => {
    const init = async () => {
      const data = await getReminders();
      setReminders(data);
      await scheduleRemindersIfGoalNotReached();

      if (Platform.OS === 'android' && Platform.Version >= 31) {
        const needsPermission = await needsExactAlarmPermission();
        setShowExactAlarmCard(needsPermission);
      }
    };

    init();
  }, []);

  const closePicker = useCallback(() => {
    setShowPicker(false);
    setIosPickerVisible(false);
    setSelectedReminderId(null);
  }, []);

  const saveSelectedTime = useCallback(async (selectedDate: Date) => {
    const formatted24 = toReminderTime(selectedDate);
    const formattedWithSeconds = `${formatted24}:00`;
    const updated = selectedReminderId
      ? await updateReminderUtil(selectedReminderId, { time: formattedWithSeconds, enabled: true })
      : await addReminderUtil(formatted24);

    setReminders(updated);
    await scheduleRemindersIfGoalNotReached();
  }, [selectedReminderId]);

  const handleOpenExactAlarmSettings = async () => {
    await requestExactAlarmPermission();
    setShowExactAlarmCard(false);
  };

  const goBack = () => navigation?.goBack();

  const openTimePicker = (reminder?: Reminder) => {
    setSelectedReminderId(reminder?.id || null);
    setTime(reminder ? toPickerDate(reminder.time) : new Date());

    if (Platform.OS === 'ios') {
      setIosPickerVisible(true);
    } else {
      setShowPicker(true);
    }
  };

  const onChangeTime = async (event: { type?: string }, selectedDate?: Date) => {
    const currentTime = selectedDate || time;

    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event?.type === 'set') {
        await saveSelectedTime(currentTime);
      }
      setSelectedReminderId(null);
      return;
    }

    setTime(currentTime);
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) {
      return;
    }

    const updated = await updateReminderUtil(id, { enabled: !reminder.enabled });
    setReminders(updated);

    if (reminder.enabled) {
      await notifee.cancelNotification(reminder.id);
    } else {
      await scheduleRemindersIfGoalNotReached();
    }
  };

  const handleDelete = (id: string) => {
    setSelectedIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedIdToDelete) {
      return;
    }

    const updated = await deleteReminderUtil(selectedIdToDelete);
    setReminders(updated);
    await scheduleRemindersIfGoalNotReached();
    setSelectedIdToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.container}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={[styles.headerCircle, { backgroundColor: tabTheme.headerButton, borderColor: tabTheme.border, shadowColor: tabTheme.shadow }]}>
          <Feather name="chevron-left" size={25} color={tabTheme.icon} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: tabTheme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            Reminder Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: tabTheme.mutedText }]}>Stay consistent. Stay hydrated.</Text>
        </View>

        <TouchableOpacity onPress={() => setShowTipsModal(true)} style={[styles.headerCircle, { backgroundColor: tabTheme.headerButton, borderColor: tabTheme.border, shadowColor: tabTheme.shadow }]}>
          <Feather name="info" size={25} color={tabTheme.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showExactAlarmCard ? (
          <View style={styles.exactAlarmCard}>
            <View style={styles.exactTopRow}>
              <View style={styles.exactIcon}>
                <Image source={require('../assets/exact.png')} style={styles.infoImage} resizeMode="contain" />
              </View>
              <View style={styles.exactCopy}>
                <Text style={styles.exactAlarmTitle}>Enable Exact Alarms</Text>
                <Text style={styles.exactAlarmMessage}>
                  Allow exact alarms to make sure your reminders go off on time.
                </Text>
              </View>
              <TouchableOpacity style={styles.exactAlarmBtn} onPress={handleOpenExactAlarmSettings}>
                <Text style={styles.exactAlarmBtnText}>Enable</Text>
                <Feather name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.androidPill}>
              <FontAwesome5 name="android" size={14} color={GOLD} />
              <Text style={styles.androidPillText}>Recommended for best experience on Android</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.infoImageCircle}>
            <Image source={require('../assets/reminderinfo.png')} style={styles.infoImage} resizeMode="contain" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.infoTitle}>We'll remind you to drink water at the right time.</Text>
            <Text style={styles.infoText}>These reminders are personalized for you.</Text>
          </View>
        </View>

        {reminders.length ? reminders.map((reminder, index) => {
          const meta = getReminderMeta(index);
          const cardBorderStyle = { borderColor: meta.accent };
          const timeTextStyle = { color: meta.accent };
          const quoteBorderStyle = { borderColor: `${meta.accent}55` };

          return (
            <View key={reminder.id} style={[styles.reminderCard, cardBorderStyle]}>
              <View style={styles.reminderLeft}>
                <View style={styles.reminderMain}>
                  <View style={[styles.reminderIconCircle, cardBorderStyle]}>
                    <Image source={meta.image} style={styles.reminderImage} resizeMode="contain" />
                  </View>
                  <View style={styles.reminderDetails}>
                    <Text style={styles.reminderTitle} numberOfLines={1}>{meta.title}</Text>
                    <Text style={[styles.reminderTime, timeTextStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                      {formatTime(reminder.time)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.quoteBox, quoteBorderStyle]}>
                  
                  <Text style={styles.quoteText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                    {meta.quote}
                  </Text>
                </View>
              </View>

              <View style={[styles.reminderActions, quoteBorderStyle]}>
                <View style={styles.actionToggleRow}>
                  <Text style={[styles.enabledText, reminder.enabled ? styles.enabledOn : styles.enabledOff]}>
                    {reminder.enabled ? 'Enabled' : 'Paused'}
                  </Text>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={SWITCH_TRACK}
                    thumbColor="#fff"
                    ios_backgroundColor={SWITCH_IOS_BG}
                    style={styles.switchControl}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => openTimePicker(reminder)}
                  style={[styles.changeTimeButton, cardBorderStyle]}
                >
                  <Feather name={meta.icon as keyof typeof Feather.glyphMap} size={16} color={meta.accent} />
                  <Text style={[styles.changeTimeText, timeTextStyle]} numberOfLines={1}>Change Time</Text>
                </TouchableOpacity>
                {reminders.length > 3 ? (
                  <TouchableOpacity onPress={() => handleDelete(reminder.id)} style={styles.deleteButtonSmall}>
                    <Feather name="trash-2" size={18} color="#ff6a7a" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyCard}>
            <Image source={require('../assets/reminder.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyText}>Add a reminder to start getting hydration nudges.</Text>
            <TouchableOpacity onPress={() => openTimePicker()} style={styles.addReminderButton}>
              <Feather name="plus" size={21} color="#fff" />
              <Text style={styles.addReminderText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.scheduledCard}>
          <View style={styles.scheduledCheck}>
           <Image source={require('../assets/reminderinfo1.png')} style={styles.scheduledImage} resizeMode="contain" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.scheduledTitle}>Reminders Scheduled</Text>
            <Text style={styles.scheduledMessage}>
              Your reminders are active and will notify you at the right time.
            </Text>
            <View style={styles.updatedPill}>
              <Feather name="clock" size={15} color={GREEN} />
              <Text style={styles.updatedText}>Last updated: {lastUpdatedText}</Text>
            </View>
          </View>
          <Image source={require('../assets/reminderinfo2.png')} style={styles.scheduledImage} resizeMode="contain" />
        </View>
      </ScrollView>

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          mode="time"
          value={time}
          onChange={onChangeTime}
          display="default"
        />
      ) : null}

      <Modal visible={iosPickerVisible} animationType="slide" transparent>
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPicker}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={closePicker} style={styles.iosPickerButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await saveSelectedTime(time);
                  closePicker();
                }}
                style={styles.iosPickerButton}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              mode="time"
              value={time}
              onChange={onChangeTime}
              is24Hour={true}
              display="spinner"
              textColor="#fff"
              style={styles.iosDatePicker}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showTipsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>Reminder Tips</Text>
            <Tip icon="clock" text="Change each reminder time from its card." />
            <Tip icon="toggle-right" text="Pause or resume reminders using the switch." />
            <TouchableOpacity onPress={() => setShowTipsModal(false)} style={styles.gotItButton}>
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Reminder</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete this reminder?
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.cancelActionButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.deleteActionButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
};

const Tip = ({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) => (
  <View style={styles.tipRow}>
    <Feather name={icon} size={21} color={BLUE} />
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

export default ReminderSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: SCREEN_PADDING,
    position: 'relative',
  },
  headerCircle: {
    width: 30,
    height: 30,
    borderRadius: 28,
    borderWidth: 1.4,
    borderColor: 'rgba(223, 232, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  headerCopy: {
    alignItems: 'center',
    position: 'absolute',
    left: 68,
    right: 68,
  },
  headerTitle: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 20, 
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: MUTED,
    fontSize: isSmallDevice ? 4 : 10,
    marginTop: 6,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 34,
    paddingHorizontal: SCREEN_PADDING,
  },
  exactAlarmCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#f0aa21',
    backgroundColor: 'rgba(54, 32, 5, 0.55)',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 12 : 14,
    marginBottom: 18,
  },
  exactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exactIcon: {
    width: isSmallDevice ? 40 : 48,
    height: isSmallDevice ? 40 : 48,
    borderRadius: isSmallDevice ? 25 : 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 180, 36, 0.18)',
    borderWidth: 1,
    borderColor: '#f0aa21',
    marginRight: isSmallDevice ? 10 : 14,
  },
  exactCopy: {
    flex: 1,
    minWidth: 0,
  },
  exactAlarmTitle: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 14,
    fontWeight: '500',
  },
  exactAlarmMessage: {
    color: '#f1e5cc',
    fontSize: isSmallDevice ? 11 : 10,
    lineHeight: isSmallDevice ? 15 : 17,
    marginTop: 5,
  },
  androidPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 55, 0.34)',
    backgroundColor: 'rgba(255, 196, 55, 0.08)',
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 5 : 6,
    marginTop: 12,
    marginLeft: isSmallDevice ? 60 : 72,
    maxWidth: '100%',
  },
  androidPillText: {
    color: GOLD,
    fontSize: isSmallDevice ? 9 : 10,
    fontWeight: '700',
  },
  exactAlarmBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffbf37',
    backgroundColor: 'rgba(255, 151, 26, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: isSmallDevice ? 82 : 76,
    paddingVertical: isSmallDevice ? 6 : 7,
    marginLeft: isSmallDevice ? 8 : 12,
  },
  exactAlarmBtnText: {
    color: '#fff',
    fontSize: isSmallDevice ? 13 : 11,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 22,
  },
  infoImageCircle: {
    width: 44,
    height: 44,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: 'rgba(22, 184, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoImage: {
    width: 42,
    height: 42,
  },
  infoTitle: {
    color: '#fff',
    fontSize: isSmallDevice ? 8 : 12,
    fontWeight: '900',
    lineHeight: isSmallDevice ? 11 : 14,
  },
  infoText: {
    color: MUTED,
    fontSize: isSmallDevice ? 10 : 10,
    marginTop: 7,
  },
  reminderCard: {
    minHeight: isSmallDevice ? 118 : 132,
    borderRadius: 18,
    borderWidth: 1.2,
    backgroundColor: PANEL,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: isSmallDevice ? 11 : 14,
    marginBottom: 16,
  },
  reminderLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  reminderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginBottom: 9,
  },
  reminderIconCircle: {
    width: isSmallDevice ? 48 : 58,
    height: isSmallDevice ? 48 : 58,
    borderRadius: isSmallDevice ? 24 : 29,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    marginRight: isSmallDevice ? 10 : 12,
    overflow: 'hidden',
  },
  reminderImage: {
    width: isSmallDevice ? 35 : 45,
    height: isSmallDevice ? 35 : 45,
  },
  reminderDetails: {
    flex: 1,
    minWidth: 0,
  },
  reminderTitle: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : Math.min(15, width * 0.041),
    flexShrink: 1,
  },
  reminderTime: {
    fontSize: isSmallDevice ? 24 : Math.min(22, width * 0.071),
    
    marginTop: 3,
  },
  quoteBox: {
    alignSelf: 'flex-start',
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: isSmallDevice ? 30 : 34,
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 5 : 7,
    maxWidth: '100%',
  },
  quoteText: {
    color: '#fff',
    fontSize: isSmallDevice ? 10 : Math.min(12, width * 0.028),
    flexShrink: 1,
  },
  reminderActions: {
    width: reminderActionWidth,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: isSmallDevice ? 8 : 12,
    paddingLeft: isSmallDevice ? 8 : 12,
  },
  actionToggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enabledText: {
    fontSize: isSmallDevice ? 10 : 12,
    fontWeight: '900',
  },
  switchControl: {
    transform: [{ scaleX: 0.72 }, { scaleY: 0.72 }],
  },
  enabledOn: {
    color: GREEN,
  },
  enabledOff: {
    color: '#91a0c8',
  },
  changeTimeButton: {
    width: '100%',
    borderRadius: 13,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: isSmallDevice ? 5 : 8,
    paddingVertical: isSmallDevice ? 8 : 9,
    marginTop: 18,
  },
  changeTimeText: {
    fontSize: isSmallDevice ? 9 : Math.min(8, width * 0.028),
    
  },
  deleteButtonSmall: {
    marginTop: 10,
    padding: 6,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    alignItems: 'center',
    padding: 26,
    marginBottom: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 7,
  },
  addReminderButton: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#0058ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addReminderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  scheduledCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#25b66a',
    backgroundColor: 'rgba(5, 55, 43, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  scheduledCheck: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scheduledTitle: {
    color: GREEN,
    fontSize: isSmallDevice ? 10 : 13,
    fontWeight: '900',
  },
  scheduledMessage: {
    color: '#dce7f8',
    fontSize: isSmallDevice ? 8 : 10,
    lineHeight: isSmallDevice ? 19 : 12,
    marginTop: 7,
  },
  updatedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 211, 107, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(28, 211, 107, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 12,
  },
  updatedText: {
    color: '#dce7f8',
    fontSize: isSmallDevice ? 6 : 10,
  },
  scheduledImage: {
    width: 38,
    height: 38,
    marginLeft: 10,
  },
  iosPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  iosPicker: {
    backgroundColor: '#07183e',
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80, 114, 176, 0.35)',
  },
  iosPickerButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iosDatePicker: {
    backgroundColor: '#07183e',
  },
  doneText: {
    color: BLUE,
    fontSize: 17,
    fontWeight: '900',
  },
  cancelText: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  tipsBox: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#07183e',
    padding: 22,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipText: {
    color: MUTED,
    marginLeft: 12,
    fontSize: 15,
    flex: 1,
    lineHeight: 21,
  },
  gotItButton: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: '#0058ff',
    paddingHorizontal: 34,
    paddingVertical: 13,
    borderRadius: 24,
  },
  gotItText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  alertBox: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#07183e',
    padding: 22,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 9,
  },
  alertMessage: {
    color: MUTED,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  cancelActionButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  deleteActionButton: {
    borderRadius: 16,
    backgroundColor: '#ff4d64',
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
