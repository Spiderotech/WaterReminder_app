// components/ExactAlarmPermissionModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getPermission as requestExactAlarmPermission } from 'react-native-schedule-exact-alarm-permission';

interface Props {
  visible: boolean;
  onClose: () => void;
  canClose?: boolean; // new prop to control Cancel button
}

const ExactAlarmPermissionModal: React.FC<Props> = ({ visible, onClose, canClose = true }) => {
  const handleOpenSettings = async () => {
    await requestExactAlarmPermission();
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (canClose) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Enable Exact Alarms</Text>
          <Text style={styles.message}>
            To get accurate hydration reminders, please enable{' '}
            <Text style={{ fontWeight: 'bold' }}>"Schedule exact alarms"</Text> in system settings.
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

export default ExactAlarmPermissionModal;

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
