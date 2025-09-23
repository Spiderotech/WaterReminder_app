// utils/exactAlarmPermission.ts
import { Platform } from 'react-native';
import { checkPermission as checkExactAlarmPermission } from 'react-native-schedule-exact-alarm-permission';

export async function needsExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const granted = await checkExactAlarmPermission();
    return !granted;
  }
  return false;
}
