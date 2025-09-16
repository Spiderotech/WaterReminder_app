import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeContext } from '../ThemeContext';
import {
  requestNotificationPermission,
  createNotificationChannel,
  checkBatteryOptimizations,
  scheduleReminderNotifications,
  cancelAllHydrationReminders,
  testInstantNotification,
} from '../utils/notificationUtils';
import { generateReminders } from '../utils/reminderUtils';
import notifee, { TimestampTrigger } from '@notifee/react-native';

const TestNotificationScreen = () => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  const [logs, setLogs] = useState<string[]>([]);
  





  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [message, ...prev.slice(0, 50)]);
  };

  const handleTestNotification = async () => {
    try {
      await testInstantNotification();
      log('✅ Instant notification scheduled (5s)');
    } catch (err) {
      log('❌ Instant notification failed');
    }
  };

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    log('🔐 Requested notification permission');
  };

  const handleCreateChannel = async () => {
    await createNotificationChannel();
    log('🔔 Created channel');
  };

  const handleCheckBattery = async () => {
    await checkBatteryOptimizations();
    log('⚙️ Opened battery optimization settings');
  };

  const handleGenerateAndSchedule = async () => {
    const reminders = generateReminders('16:57', '17:50', 300); // 🔧 Example time span
    await scheduleReminderNotifications(reminders);
    log(`📅 Scheduled ${reminders.length} reminders from 18:00 to 18:20`);
  };

  const handleCancelAll = async () => {
    await cancelAllHydrationReminders();
    log('🗑️ Canceled all reminders');
  };
  const handleCheckScheduledNotifications = async () => {
  const triggers = await notifee.getTriggerNotifications();
  console.log('🔍 Scheduled:', triggers.length);
  triggers.forEach(t => {
    const time = new Date((t.trigger as TimestampTrigger).timestamp).toLocaleString();
    log(`📅 ${t.notification.title} → ${time}`);
  });
};


  return (
    <ScrollView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: dark ? '#fff' : '#000' }]}>🔧 Notification Debug Panel</Text>

      <TestButton label="Request Permission" onPress={handleRequestPermission} />
      <TestButton label="Create Channel" onPress={handleCreateChannel} />
      <TestButton label="Open Battery Settings" onPress={handleCheckBattery} />
      <TestButton label="Test Instant Notification (5s)" onPress={handleTestNotification} />
      <TestButton label="Generate + Schedule Dummy Reminders" onPress={handleGenerateAndSchedule} />
      <TestButton label="Cancel All Scheduled Reminders" onPress={handleCancelAll} />
      <TestButton label="Check Scheduled Notifications" onPress={handleCheckScheduledNotifications} />
     



      <Text style={[styles.logTitle, { color: dark ? '#fff' : '#000' }]}>📝 Logs</Text>
      {logs.map((entry, index) => (
        <Text key={index} style={[styles.logEntry, { color: dark ? '#ccc' : '#333' }]}>
          {entry}
        </Text>
      ))}
    </ScrollView>
  );
};

const TestButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default TestNotificationScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  logEntry: {
    fontSize: 13,
    marginBottom: 5,
  },
});
