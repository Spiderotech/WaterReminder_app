import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { useThemeContext } from '../ThemeContext'; // adjust path as needed

const DebugStorageScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [data, setData] = useState<[string, string | null][]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');

  const loadStorage = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    setData(items);
  };

  const handleEdit = (key: string, value: string | null) => {
    setEditingKey(key);
    setEditingValue(value || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    await AsyncStorage.setItem(editingKey, editingValue);
    setModalVisible(false);
    loadStorage();
  };

  const handleDelete = (key: string) => {
    Alert.alert('Delete Key', `Are you sure you want to delete "${key}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(key);
          loadStorage();
        },
      },
    ]);
  };

  useEffect(() => {
    loadStorage();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000' }]}>AsyncStorage Debug</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={([key]) => key}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: [key, value] }) => (
          <View style={[styles.item, { borderBottomColor: dark ? '#333' : '#eee' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.keyText, { color: dark ? '#1e90ff' : '#007AFF' }]}>{key}</Text>
              <ScrollView horizontal>
                <Text style={[styles.valueText, { color: dark ? '#ccc' : '#444' }]} numberOfLines={30}>
                  {value}
                </Text>
              </ScrollView>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(key, value)}>
                <Feather name="edit" size={20} color={dark ? '#ccc' : '#555'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(key)} style={{ marginLeft: 8 }}>
                <Feather name="trash-2" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: dark ? '#111' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: dark ? '#fff' : '#000' }]}>Edit Value</Text>
            <Text style={[styles.modalKey, { color: dark ? '#aaa' : '#666' }]}>{editingKey}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: dark ? '#fff' : '#000',
                  borderColor: dark ? '#444' : '#ccc',
                },
              ]}
              multiline
              value={editingValue}
              onChangeText={setEditingValue}
              placeholder="Value"
              placeholderTextColor={dark ? '#666' : '#aaa'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: dark ? '#aaa' : '#999' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DebugStorageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    marginTop: 6,
    maxWidth: '90%',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalKey: {
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
});
