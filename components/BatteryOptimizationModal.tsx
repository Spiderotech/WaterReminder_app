// components/BatteryOptimizationModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import notifee from '@notifee/react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BatteryOptimizationModal: React.FC<Props> = ({ visible, onClose }) => {
  const handleOpenSettings = async () => {
    await notifee.openBatteryOptimizationSettings();
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Disable Battery Optimization</Text>
          <Text style={styles.message}>
            To allow hydration reminders to work properly in the background,
            please disable <Text style={{ fontWeight: 'bold' }}>Battery Optimization</Text> for this app.
          </Text>

          <View style={styles.actions}>

            <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={handleOpenSettings}>
              <Text style={styles.confirmText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BatteryOptimizationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancel: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  confirm: {
    backgroundColor: '#007AFF',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
