import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../ThemeContext';
import {
  getReminders,
  addReminder as addReminderUtil,
  deleteReminder as deleteReminderUtil,
  updateReminder as updateReminderUtil,
  Reminder,
} from '../utils/reminderUtils';
import { scheduleReminderNotifications, scheduleRemindersIfGoalNotReached } from '../utils/notificationUtils';
import notifee from '@notifee/react-native';
import { needsExactAlarmPermission } from '../utils/exactAlarmPermission';
const { width, height } = Dimensions.get('window');
import { getPermission as requestExactAlarmPermission } from 'react-native-schedule-exact-alarm-permission';


const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const paddingHorizontal = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const fabSize = isSmallDevice ? 28 : Math.max(32, width * 0.09);
const fabRadius = fabSize / 2;
const fabIconSize = isSmallDevice ? 16 : Math.max(20, width * 0.055);
const reminderRowPaddingV = isSmallDevice ? 8 : Math.max(14, height * 0.018);
const reminderRowPaddingH = isSmallDevice ? 8 : Math.max(12, width * 0.03);
const reminderRowRadius = isSmallDevice ? 10 : Math.max(15, width * 0.045);
const reminderRowMarginV = isSmallDevice ? 4 : Math.max(8, height * 0.012);
const timeTextFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.05);
const scheduledTextFontSize = isSmallDevice ? 10 : Math.max(12, width * 0.035);
const deleteIconMarginL = isSmallDevice ? 6 : Math.max(12, width * 0.03);
const iosPickerRadius = isSmallDevice ? 12 : Math.max(20, width * 0.055);
const doneBtnPaddingH = isSmallDevice ? 10 : Math.max(20, width * 0.06);
const doneBtnPaddingV = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const doneTextFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const alertBoxRadius = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const alertBoxPadding = isSmallDevice ? 10 : Math.max(20, width * 0.055);
const alertTitleFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.055);
const alertMessageFontSize = isSmallDevice ? 11 : Math.max(15, width * 0.04);
const alertButtonPaddingH = isSmallDevice ? 10 : Math.max(20, width * 0.06);
const alertButtonPaddingV = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const alertButtonRadius = isSmallDevice ? 5 : Math.max(8, width * 0.025);
const alertButtonMarginH = isSmallDevice ? 8 : Math.max(18, width * 0.045);

const ReminderSettingsScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showExactAlarmCard, setShowExactAlarmCard] = useState(false);



  useEffect(() => {
  const init = async () => {
    // 1️⃣ Load reminders
    const data = await getReminders();
    setReminders(data);
    await scheduleRemindersIfGoalNotReached();

    // 2️⃣ Check exact alarm permission (Android 12+)
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const granted = await needsExactAlarmPermission(); // your existing util
      setShowExactAlarmCard(granted); // true if permission NOT granted
    }
  };

  init();
}, []);

const handleOpenExactAlarmSettings = async () => {
  // Open permission/settings
  // You already have a function for this, call it here
  await requestExactAlarmPermission();
  setShowExactAlarmCard(false); // hide card after opening settings
};



  const getScheduledInfo = (time: string) => {
    const [hourStr, minStr, secStr = '0'] = time.split(':');
    const hour = parseInt(hourStr);
    const min = parseInt(minStr);
    const sec = parseInt(secStr);

    const now = new Date();
    const target = new Date();
    target.setHours(hour, min, sec, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1); // move to next day if time passed
    }

    return `Scheduled : ${target.toLocaleString()}`;
  };


  const goBack = () => navigation?.goBack();

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const onChangeTime = async (event: { type: any; }, selectedDate: Date) => {
    const currentTime = selectedDate || time;

    // For Android, this handles both 'set' and 'dismiss' events.
    if (Platform.OS === 'android') {
      setShowPicker(false);
      // Only proceed with setting the reminder if the user confirmed ('set').
      if (event?.type === 'set') {
        const formatted24 = currentTime
          .toTimeString()
          .split(':')
          .slice(0, 2)
          .join(':');

        const updated = await addReminderUtil(formatted24);
        setReminders(updated);
        await scheduleRemindersIfGoalNotReached(); 
      }
    } else {
      // For iOS, the picker continuously updates the state, but we don't call
      // addReminderUtil here. This is handled by the 'Done' button.
      setTime(currentTime);
    }
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    const updated = await updateReminderUtil(id, { enabled: !reminder.enabled });
    setReminders(updated);

    if (reminder.enabled) {
      console.log(reminder.id);

      await notifee.cancelNotification(reminder.id); // Cancel if turning off
    } else {
      await scheduleRemindersIfGoalNotReached(); // Re-schedule all if turning on
    }
  };

  const handleDelete = (id: string) => {
    setSelectedIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedIdToDelete) {
      const updated = await deleteReminderUtil(selectedIdToDelete);
      setReminders(updated);
      await scheduleRemindersIfGoalNotReached();
      setSelectedIdToDelete(null);
      setShowDeleteModal(false);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Feather name="arrow-left" size={22} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#000' }]}>
          Reminder
        </Text>

        {/* Right Side Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Tips Button */}
          <TouchableOpacity
            onPress={() => setShowTipsModal(true)}
            style={[styles.infoIconButton, { marginRight: 10, backgroundColor: dark ? '#444' : '#555' }]}
          >
            <Feather name="info" size={12} color="#fff" />
          </TouchableOpacity>

          {/* Add Reminder Button */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') setIosPickerVisible(true);
              else setShowPicker(true);
            }}
            style={styles.fabIcon}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

{showExactAlarmCard && (
    <View
      style={[
        styles.exactAlarmCard,
        { backgroundColor: dark ? '#111' : '#fff', borderColor: dark ? '#333' : '#eee' },
      ]}
    >
      <Text style={[styles.exactAlarmTitle, { color: dark ? '#fff' : '#000' }]}>
        Enable Exact Alarms
      </Text>
      <Text style={[styles.exactAlarmMessage, { color: dark ? '#aaa' : '#666' }]}>
        To get accurate hydration reminders, please enable{" "}
        <Text style={{ fontWeight: 'bold' }}>"Schedule exact alarms"</Text> in system settings.
      </Text>
      <TouchableOpacity style={styles.exactAlarmBtn} onPress={handleOpenExactAlarmSettings}>
        <Text style={styles.exactAlarmBtnText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  )}


      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.reminderRow,
              {
                backgroundColor: dark ? '#111' : '#fff',
                borderColor: dark ? '#333' : '#eee',
              },
            ]}
          >
            <View>
              <Text style={[styles.timeText, { color: dark ? '#fff' : '#000' }]}>
                {formatTime(new Date(`1970-01-01T${item.time}`))}
              </Text>
              <Text style={[styles.scheduledText, { color: dark ? '#aaa' : '#666' }]}>
                {getScheduledInfo(item.time)}
              </Text>
            </View>

            <View style={styles.rightButtons}>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleReminder(item.id)}
                trackColor={{ false: dark ? '#444' : '#ccc', true: '#007AFF' }}
                thumbColor={item.enabled ? '#fff' : '#888'}
              />
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIcon}>
                <Feather name="trash-2" size={20} color={dark ? '#ff5555' : '#007AFF'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* TIPS MODAL */}
      <Modal visible={showTipsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.tipsBox,
              { backgroundColor: dark ? '#1c1c1e' : '#fff' },
            ]}
          >
            {/* Title */}
            <Text
              style={[
                styles.tipsTitle,
                { color: dark ? '#fff' : '#000' },
              ]}
            >
              💡 Tips
            </Text>

            {/* Tips List */}
            <View style={styles.tipRow}>
              <Feather name="plus-circle" size={20} color="#007AFF" />
              <Text
                style={[
                  styles.tipText,
                  { color: dark ? '#ccc' : '#444' },
                ]}
              >
                Add a custom reminder using the  <Feather name="plus" size={20} color={dark ? '#fff' : '#000'} /> button on top.
              </Text>
            </View>

            <View style={styles.tipRow}>
              <Feather name="toggle-right" size={20} color="#007AFF" />
              <Text
                style={[
                  styles.tipText,
                  { color: dark ? '#ccc' : '#444' },
                ]}
              >
                Pause or resume a reminder using the toggle switch.
              </Text>
            </View>

            <View style={styles.tipRow}>
              <Feather name="trash-2" size={20} color="#007AFF" />
              <Text
                style={[
                  styles.tipText,
                  { color: dark ? '#ccc' : '#444' },
                ]}
              >
                Delete a reminder using the trash icon.
              </Text>
            </View>

            {/* Got it Button */}
            <TouchableOpacity
              onPress={() => setShowTipsModal(false)}
              style={styles.gotItButton}
            >
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          mode="time"
          value={time}
          onChange={onChangeTime}
          display="default"
        />
      )}

      <Modal visible={iosPickerVisible} animationType="slide" transparent>
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPicker}>
            {/* Header Row with Cancel + Done */}
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity
                onPress={() => setIosPickerVisible(false)}
                style={styles.iosPickerButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const formatted24 = time
                    .toTimeString()
                    .split(':')
                    .slice(0, 2)
                    .join(':');

                  const updated = await addReminderUtil(formatted24);
                  setReminders(updated);
                 await scheduleRemindersIfGoalNotReached();
                  setIosPickerVisible(false);
                }}
                style={styles.iosPickerButton}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* iOS Time Picker */}
            <DateTimePicker
              mode="time"
              value={time}
              onChange={onChangeTime}
              is24Hour={true}
              display="spinner"
              style={{ backgroundColor: '#fff' }}
              textColor="#000"
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: dark ? '#222' : '#fff' }]}>
            <Text style={[styles.alertTitle, { color: dark ? '#fff' : '#000' }]}>Delete Reminder</Text>
            <Text style={[styles.alertMessage, { color: dark ? '#ccc' : '#444' }]}>
              Are you sure you want to delete this reminder?
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={[styles.alertButton, styles.cancelButton]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.alertButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

export default ReminderSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 10,
  },
  fabIcon: {
    width: fabSize,
    height: fabSize,
    borderRadius: fabRadius,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  headerTitle: {
    fontSize: headerTitleFontSize,
    fontWeight: '600',
  },
  rightSpacer: {
    width: fabSize, // same as fabIcon width to balance
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: reminderRowPaddingV,
    borderWidth: 1.5,
    borderRadius: reminderRowRadius,
    marginVertical: reminderRowMarginV,
    paddingHorizontal: reminderRowPaddingH,
  },
  timeText: {
    fontSize: timeTextFontSize,
    fontWeight: '400',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIcon: {
    marginLeft: deleteIconMarginL,
  },
  fabCenter: {
    position: 'absolute',
    bottom: 30,
    left: '56%',
    transform: [{ translateX: -fabSize / 2 }],
    backgroundColor: '#007AFF',
    width: fabSize * 1.75,
    height: fabSize * 1.75,
    borderRadius: fabSize * 0.875,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  iosPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPicker: {
    backgroundColor: '#fff',
    paddingTop: 10,
    borderTopLeftRadius: iosPickerRadius,
    borderTopRightRadius: iosPickerRadius,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: doneBtnPaddingH,
    paddingVertical: doneBtnPaddingV,
  },
  doneText: {
    color: '#007AFF',
    fontSize: doneTextFontSize,
    fontWeight: '500',
  },
  scheduledText: {
    fontSize: scheduledTextFontSize,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    borderRadius: alertBoxRadius,
    padding: alertBoxPadding,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: alertTitleFontSize,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: alertMessageFontSize,
    textAlign: 'center',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  alertButton: {
    paddingHorizontal: alertButtonPaddingH,
    paddingVertical: alertButtonPaddingV,
    borderRadius: alertButtonRadius,
    marginHorizontal: alertButtonMarginH,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  deleteButton: {
    backgroundColor: '#007AFF',
  },
  cancelText: {
    color: '#000',
    fontWeight: '500',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '500',
  },
  tipsBox: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'flex-start',
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tipText: {
    marginLeft: 10,
    fontSize: 15,
    flexShrink: 1,
  },
  gotItButton: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  gotItText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  infoIconButton: {
    width: fabSize * 0.65,   // smaller than add button
    height: fabSize * 0.65,
    borderRadius: (fabSize * 0.65) / 2,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
  },

  iosPickerHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},
iosPickerButton: {
  paddingHorizontal: 10,
  paddingVertical: 6,
},
exactAlarmCard: {
  padding: 16,
  borderWidth: 1.5,
  borderRadius: 16,
  marginVertical: 10,
  marginHorizontal: 0,
},
exactAlarmTitle: {
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 6,
},
exactAlarmMessage: {
  fontSize: 14,
  marginBottom: 12,
},
exactAlarmBtn: {
  backgroundColor: '#007AFF',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 10,
  alignSelf: 'flex-start',
},
exactAlarmBtnText: {
  color: '#fff',
  fontWeight: '600',
},


});
