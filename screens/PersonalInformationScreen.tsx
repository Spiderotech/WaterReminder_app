import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from '../ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateUserProfile } from '../utils/userUtils';
import { generateWaterGoal } from '../utils/hydrationUtils';
import { generateReminders, saveReminders } from '../utils/reminderUtils';
import { scheduleReminderNotifications, scheduleRemindersIfGoalNotReached } from '../utils/notificationUtils';

const HEIGHT_CM = Array.from({ length: 101 }, (_, i) => 110 + i);
const AGE_YEARS = Array.from({ length: 83 }, (_, i) => 18 + i);
const WEIGHT_KG = Array.from({ length: 121 }, (_, i) => 30 + i);

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', title: 'Sedentary', description: 'Limited physical activity', icon: require('../assets/alone.png') },
  { key: 'light', title: 'Light Activity', description: 'Light walking or standing.', icon: require('../assets/walk.png') },
  { key: 'moderate', title: 'Moderate Active', description: 'Regular jogging or cycling.', icon: require('../assets/training.png') },
  { key: 'very', title: 'Very Active', description: 'Heavy lifting or training.', icon: require('../assets/weightlifting.png') },
];

const CLIMATE_OPTIONS = [
  { key: 'hot', title: 'Hot', icon: require('../assets/contrast.png') },
  { key: 'temperate', title: 'Temperate', icon: require('../assets/sun.png') },
  { key: 'cold', title: 'Cold', icon: require('../assets/autumn.png') },
];

const fields = [
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'weight', label: 'Weight' },
  { key: 'height', label: 'Height' },
  { key: 'wakeUpTime', label: 'Wake-up time' },
  { key: 'sleepTime', label: 'Bed time' },
  { key: 'activityLevel', label: 'Activity Level' },
  { key: 'climate', label: 'Climate' },
  { key: 'hydrationGoal', label: 'Hydration Goal', isReadOnly: true },
];
const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;
const paddingHorizontal = isSmallDevice ? 10 : Math.max(16, width * 0.05);
const modalContainerPadding = isSmallDevice ? 12 : Math.max(20, width * 0.06);
const modalLabelFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.055);
const modalInputPadding = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const modalInputRadius = isSmallDevice ? 6 : Math.max(10, width * 0.03);
const modalOptionFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.05);
const heightItemFontSize = isSmallDevice ? 18 : Math.max(22, width * 0.065);
const heightItemPaddingV = isSmallDevice ? 4 : Math.max(8, height * 0.012);
const okBtnPaddingV = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const okBtnPaddingH = isSmallDevice ? 12 : Math.max(20, width * 0.06);
const okBtnRadius = isSmallDevice ? 6 : Math.max(8, width * 0.025);
const iconSize = isSmallDevice ? 28 : Math.max(40, width * 0.11);
const iconMarginR = isSmallDevice ? 8 : Math.max(16, width * 0.045);
const cardPadding = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const cardRadius = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const cardTitleFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const cardDescFontSize = isSmallDevice ? 10 : Math.max(12, width * 0.035);
const avatarSize = isSmallDevice ? 60 : Math.max(90, width * 0.25);
const headerTitleFontSize = isSmallDevice ? 18 : Math.max(22, width * 0.055);
const detailsTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.05);
const detailRowPaddingV = isSmallDevice ? 8 : Math.max(14, height * 0.018);
const labelFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);
const valueTextFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);

const PersonalInformationScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAge, setSelectedAge] = useState(25);
  const [selectedHeight, setSelectedHeight] = useState(160);
  const [selectedWeight, setSelectedWeight] = useState(60);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [hydrationGoal, setHydrationGoal] = useState<number | null>(null); // New state variable for hydration goal

  useEffect(() => {
    const loadData = async () => {
      const profile = await getUserProfile();
      if (profile) {
        setFormData(profile);
        setSelectedAge(profile.age || 25);
        setSelectedHeight(profile.height || 160);
        setSelectedWeight(profile.weight || 60);
      }
      // Load hydration goal from storage
      const storedGoal = await AsyncStorage.getItem('hydrationGoal');
      if (storedGoal) {
        setHydrationGoal(parseInt(storedGoal));
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const refreshGoalAndReminders = async (profile, updatedField?: string) => {
    const choice = await AsyncStorage.getItem('hydrationGoalChoice');

    if (choice === 'custom') {
      // Keep user’s custom goal fixed
      const storedGoal = await AsyncStorage.getItem('hydrationGoal');
      if (storedGoal) {
        setHydrationGoal(parseInt(storedGoal));
      }

      // 🔹 But regenerate reminders if sleep/wake time changed
      if (updatedField === 'wakeUpTime' || updatedField === 'sleepTime') {
        const reminderCount =
          parseInt(storedGoal || '0') > 1000 ? 5 : 3;

        const reminders = generateReminders(
          profile.wakeUpTime,
          profile.sleepTime,
          reminderCount
        );

        await saveReminders(reminders);
        await scheduleRemindersIfGoalNotReached();
      }
      return;
    }

    // 🔹 Normal flow for min/max
    const { min, max } = generateWaterGoal(profile);
    const selectedGoal = choice === 'max' ? max : min;

    await AsyncStorage.setItem('hydrationGoal', selectedGoal.toString());
    setHydrationGoal(selectedGoal);

    const reminderCount = choice === 'max' ? 8 : 5;
    const reminders = generateReminders(
      profile.wakeUpTime,
      profile.sleepTime,
      reminderCount
    );

    await saveReminders(reminders);
    await scheduleRemindersIfGoalNotReached();
  };





  const openModal = (field) => {
    if (field.key === 'wakeUpTime' || field.key === 'sleepTime') {
      setCurrentField(field);
      setSelectedTime(
        formData[field.key]
          ? new Date(`1970-01-01T${formData[field.key]}`)
          : new Date()
      );
      setShowTimePicker(true);
      return;
    }

    setCurrentField(field);
    setInputValue(formData[field.key]?.toString() || '');
    setModalVisible(true);

    if (field.key === 'height') setSelectedHeight(Number(formData.height || 160));
    if (field.key === 'age') setSelectedAge(Number(formData.age || 25));
    if (field.key === 'weight') setSelectedWeight(Number(formData.weight || 60));
  };

  const handleSave = async () => {
    let updatedValue = inputValue;
    if (currentField.key === 'height') updatedValue = selectedHeight;
    if (currentField.key === 'age') updatedValue = selectedAge;
    if (currentField.key === 'weight') updatedValue = selectedWeight;

    const updatedProfile = await updateUserProfile({ [currentField.key]: updatedValue });
    setFormData(updatedProfile);

    if (['age', 'weight', 'height'].includes(currentField.key)) {
      await refreshGoalAndReminders(updatedProfile, currentField.key);
    }

    setModalVisible(false);
    setShowTimePicker(false);
  };

  const handleSaveTime = async (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time24 = `${hours}:${minutes}`;

    const updatedField = currentField.key;
    const updatedData = {
      ...formData,
      [updatedField]: time24,
    };

    await updateUserProfile({ [updatedField]: time24 });
    setFormData(updatedData);

    if (['wakeUpTime', 'sleepTime'].includes(updatedField)) {
      await refreshGoalAndReminders(updatedData, updatedField);
    }
  };

  const renderFieldValue = (key) => {
    const value = formData[key];
    if (key === 'hydrationGoal') return `${hydrationGoal} ml`;
    if (key === 'height') return `${value} cm`;
    if (key === 'weight') return `${value} kg`;
    if (key === 'wakeUpTime' || key === 'sleepTime') {
      if (!value) return '—';
      return new Date(`1970-01-01T${value}`).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    }
    return value || '—';
  };

  const renderModalContent = () => {
    switch (currentField?.key) {
      case 'gender':
        return ['Male', 'Female'].map((val) => (
          <TouchableOpacity key={val} onPress={() => setInputValue(val)}>
            <Text style={[styles.modalOption, inputValue === val && styles.selectedOption]}>{val}</Text>
          </TouchableOpacity>
        ));
      case 'age':
        return (
          <FlatList
            data={AGE_YEARS}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedAge(item)}>
                <Text style={[styles.heightItem, item === selectedAge && styles.selectedHeight]}>{item} years</Text>
              </TouchableOpacity>
            )}
          />
        );
      case 'weight':
        return (
          <FlatList
            data={WEIGHT_KG}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedWeight(item)}>
                <Text style={[styles.heightItem, item === selectedWeight && styles.selectedHeight]}>{item} kg</Text>
              </TouchableOpacity>
            )}
          />
        );
      case 'height':
        return (
          <FlatList
            data={HEIGHT_CM}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedHeight(item)}>
                <Text style={[styles.heightItem, item === selectedHeight && styles.selectedHeight]}>{item} cm</Text>
              </TouchableOpacity>
            )}
          />
        );
      case 'activityLevel':
        return ACTIVITY_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, inputValue === item.key && styles.cardSelected]}
            onPress={() => setInputValue(item.key)}
          >
            <Image source={item.icon} style={styles.icon} />
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ));
      case 'climate':
        return CLIMATE_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, inputValue === item.key && styles.cardSelected]}
            onPress={() => setInputValue(item.key)}
          >
            <Image source={item.icon} style={styles.icon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ));
      default:
        return (
          <TextInput
            style={styles.modalInput}
            value={inputValue}
            onChangeText={setInputValue}
          />
        );
    }
  };

  const avatarSource =
    (formData.gender || '').toLowerCase() === 'male'
      ? require('../assets/male.png')
      : require('../assets/female.png');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#000' }]}>Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        <Image source={avatarSource} style={styles.avatar} />
      </View>

      <View style={styles.detailsCard}>
        <Text style={[styles.detailsTitle, { color: dark ? '#1e90ff' : '#007AFF' }]}>Profile Details</Text>
        {fields.map((field) => (
          <TouchableOpacity
            key={field.key}
            style={[styles.detailRow, { borderBottomColor: dark ? '#222' : '#f0f0f0' }]}
            onPress={() => openModal(field)}
            disabled={field.isReadOnly}
          >
            <Text style={[styles.label, { color: dark ? '#aaa' : '#777' }]}>• {field.label}</Text>
            <Text style={[styles.valueText, { color: dark ? '#1e90ff' : '#1d8ae0' }]}>{renderFieldValue(field.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>


      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: dark ? '#fff' : '#fff' }]}>
            <Text style={[styles.modalLabel, { color: dark ? '#000' : '#000' }]}>Edit {currentField?.label}</Text>
            {renderModalContent()}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.okButton} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.okButton}>
                <Text style={styles.okText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Modal for iOS Time Picker */}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              <Text style={[styles.modalLabel, { color: dark ? '#000' : '#000' }]}>
                Edit {currentField?.label}
              </Text>
              <DateTimePicker
                mode="time"
                value={selectedTime}
                onChange={(event, newDate) => {
                  if (newDate) {
                    setSelectedTime(newDate);
                  }
                }}
                is24Hour={true}
                display="spinner"
                style={styles.timePicker}
                textColor="#000"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    await handleSaveTime(selectedTime); // Pass the selectedTime to the function
                    setShowTimePicker(false); // Close the modal after saving
                  }}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}


      {/* Android DateTimePicker */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          mode="time"
          value={selectedTime}
          onChange={async (event, newDate) => {
            setShowTimePicker(false); // Close the picker immediately
            if (newDate) {
              setSelectedTime(newDate); // Update the state with the new date
              await handleSaveTime(newDate); // Call the save function with the new date
            }
          }}
          is24Hour={true}
          display="spinner"
        />
      )}
    </SafeAreaView>
  );
};

export default PersonalInformationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: { position: 'absolute', left: 0 },
  headerTitle: { fontSize: headerTitleFontSize, fontWeight: 'bold' },
  profileContainer: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
  detailsCard: { padding: 16 },
  detailsTitle: { fontSize: detailsTitleFontSize, fontWeight: 'bold', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: detailRowPaddingV,
    borderBottomWidth: 1,
  },
  label: { fontSize: labelFontSize },
  valueText: { fontSize: valueTextFontSize },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', borderRadius: 14, padding: modalContainerPadding },
  modalLabel: { fontSize: modalLabelFontSize, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    padding: modalInputPadding,
    borderWidth: 1,
    borderRadius: modalInputRadius,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: { fontSize: modalOptionFontSize, padding: 12, textAlign: 'center' },
  selectedOption: { color: '#007AFF', fontWeight: 'bold' },
  heightItem: { fontSize: heightItemFontSize, paddingVertical: heightItemPaddingV },
  selectedHeight: { fontWeight: 'bold', color: '#007AFF' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  okButton: {
    backgroundColor: '#007AFF',
    paddingVertical: okBtnPaddingV,
    paddingHorizontal: okBtnPaddingH,
    borderRadius: okBtnRadius,
    marginLeft: 10,
  },
  okText: { color: '#fff', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: cardPadding,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 8,
  },
  cardSelected: { borderColor: '#007AFF', backgroundColor: '#e6f0ff' },
  icon: { width: iconSize, height: iconSize, marginRight: iconMarginR },
  cardTitle: { fontSize: cardTitleFontSize, fontWeight: '600' },
  cardDescription: { fontSize: cardDescFontSize, color: '#555' },
  timePickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
  },
  cancelButton: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#D3D3D3',
    marginRight: 10,
  },
  saveButton: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});