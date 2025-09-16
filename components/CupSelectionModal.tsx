import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const cupOptions = [
  { label: '100 mL' }, { label: '125 mL' }, { label: '150 mL' },
  { label: '200 mL' }, { label: '250 mL' }, { label: '300 mL' },
  { label: '350 mL' }, { label: '400 mL' }, { label: '500 mL' },
  { label: '600 mL' }, { label: 'Add New', isCustom: true },
];

const CupSelectionModal = ({ visible, onClose, onSelect }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Water Amount</Text>

          <FlatList
            data={cupOptions}
            numColumns={3}
            contentContainerStyle={styles.grid}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Feather name={item.isCustom ? 'plus' : 'coffee'} size={28} color="#3498ff" />
                <Text style={styles.optionLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CupSelectionModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width - 40,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    justifyContent: 'center',
  },
  option: {
    alignItems: 'center',
    width: '33.33%',
    marginBottom: 20,
  },
  optionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  closeText: {
    color: '#007aff',
    fontWeight: '600',
    fontSize: 16,
  },
});
