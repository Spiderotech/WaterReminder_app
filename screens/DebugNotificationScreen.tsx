import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {
  testInstantNotification,
  cancelAllHydrationReminders,
} from '../utils/notificationUtils';
import { getReminders } from '../utils/reminderUtils';

const DebugNotificationScreen = () => {
  const [reminders, setReminders] = useState([]);

  const handleTest = async () => {
    await testInstantNotification();
    Alert.alert('✅ Scheduled', 'Test notification will show in 10 seconds.');
  };

  const handleCancelAll = async () => {
    await cancelAllHydrationReminders();
    Alert.alert('🗑️ Cleared', 'All scheduled notifications cancelled.');
    setReminders([]); // clear display too
  };

  const handleLoadReminders = async () => {
    const storedReminders = await getReminders();
    setReminders(storedReminders || []);
    console.log('📋 Loaded Reminders:', storedReminders);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔧 Debug Notification Tools</Text>

      <Button title="🚀 Test 5s Notification" onPress={handleTest} />

      <View style={styles.spacer} />

      <Button title="📋 Load Reminder Times" onPress={handleLoadReminders} />

      <View style={styles.spacer} />

      <Button title="🗑️ Cancel All Reminders" onPress={handleCancelAll} color="red" />

      {reminders.length > 0 && (
        <View style={styles.reminderList}>
          <Text style={styles.sectionTitle}>🔔 Scheduled Reminders</Text>
          {reminders.map((r, index) => (
            <Text key={index} style={styles.reminderItem}>
              {r.time} - {r.enabled ? '✅ Enabled' : '🚫 Disabled'}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default DebugNotificationScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  spacer: {
    height: 16,
  },
  reminderList: {
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reminderItem: {
    fontSize: 14,
    paddingVertical: 4,
  },
});
