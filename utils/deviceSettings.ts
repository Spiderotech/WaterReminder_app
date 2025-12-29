import { Alert, Linking, Platform } from 'react-native';
import notifee from '@notifee/react-native';
import { NativeModules } from 'react-native';

const { AutoStartModule } = NativeModules;

export async function requestBatteryOptimizationDisable() {
  if (Platform.OS === 'android') {
    try {
      const optimized = await notifee.isBatteryOptimizationEnabled();
      return optimized; // ✅ return result instead of opening alert directly
    } catch (error) {
      console.log('Battery Optimization Check Failed:', error);
      return false;
    }
  }
  return false;
}

export async function openAutoStartSettings() {
  if (Platform.OS === 'android') {
    Alert.alert(
      'Enable Auto Start',
      'To keep reminders active in background, please allow Auto-Start permission for this app.',
      [
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              if (AutoStartModule && AutoStartModule.openAutoStartSettings) {
                await AutoStartModule.openAutoStartSettings(); // Handles Vivo / Oppo / Xiaomi
              } else {
                await Linking.openSettings(); // Fallback
              }
            } catch (e) {
              await Linking.openSettings();
            }
          }
        },
        { text: 'Later', style: 'cancel' }
      ]
    );
  }
}
