import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryPicker, { Country, CountryCode, Flag } from 'react-native-country-picker-modal';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabTheme, useMainTabTheme } from '../constants/mainTabTheme';
import { getUserProfile, updateUserProfile } from '../utils/userUtils';

type ProfileForm = {
  username?: string;
  avatar?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  wakeUpTime?: string;
  sleepTime?: string;
  activityLevel?: string;
  climate?: string;
  country?: string;
  countryCode?: CountryCode;
};

type FieldKey = keyof ProfileForm | 'hydrationGoal';

type FieldConfig = {
  key: FieldKey;
  label: string;
  subtitle: string;
  icon: string;
  type: 'text' | 'choice' | 'number' | 'time' | 'readonly' | 'location';
  unit?: string;
  options?: ChoiceOption[];
  values?: number[];
};

type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
  image?: ImageSourcePropType;
};

type SectionConfig = {
  title: string;
  accent: string;
  icon: string;
  fields: FieldConfig[];
};

const AGE_VALUES = Array.from({ length: 83 }, (_, index) => 18 + index);
const HEIGHT_VALUES = Array.from({ length: 101 }, (_, index) => 110 + index);
const WEIGHT_VALUES = Array.from({ length: 121 }, (_, index) => 30 + index);

const images = {
  male: require('../assets/avatar_male_1.png') as ImageSourcePropType,
  female: require('../assets/avatar_female_1.png') as ImageSourcePropType,
  sedentary: require('../assets/alone.png') as ImageSourcePropType,
  light: require('../assets/walk.png') as ImageSourcePropType,
  moderate: require('../assets/training.png') as ImageSourcePropType,
  very: require('../assets/weightlifting.png') as ImageSourcePropType,
  hot: require('../assets/contrast.png') as ImageSourcePropType,
  temperate: require('../assets/sun.png') as ImageSourcePropType,
  cold: require('../assets/autumn.png') as ImageSourcePropType,
};

const avatarSources: Record<string, ImageSourcePropType> = {
  male_1: require('../assets/avatar_male_1.png') as ImageSourcePropType,
  male_2: require('../assets/avatar_male_2.png') as ImageSourcePropType,
  male_3: require('../assets/avatar_male_3.png') as ImageSourcePropType,
  male_4: require('../assets/avatar_male_4.png') as ImageSourcePropType,
  male_6: require('../assets/avatar_male_6.png') as ImageSourcePropType,
  male_7: require('../assets/avatar_male_7.png') as ImageSourcePropType,
  male_8: require('../assets/avatar_male_8.png') as ImageSourcePropType,
  male_9: require('../assets/avatar_male_9.png') as ImageSourcePropType,
  male_10: require('../assets/avatar_male_10.png') as ImageSourcePropType,
  male_12: require('../assets/avatar_male_12.png') as ImageSourcePropType,
  male_13: require('../assets/avatar_male_13.png') as ImageSourcePropType,
  male_14: require('../assets/avatar_male_14.png') as ImageSourcePropType,
  male_15: require('../assets/avatar_male_15.png') as ImageSourcePropType,
  female_1: require('../assets/avatar_female_1.png') as ImageSourcePropType,
  female_2: require('../assets/avatar_female_2.png') as ImageSourcePropType,
  female_3: require('../assets/avatar_female_3.png') as ImageSourcePropType,
  female_4: require('../assets/avatar_female_4.png') as ImageSourcePropType,
  female_5: require('../assets/avatar_female_5.png') as ImageSourcePropType,
  female_6: require('../assets/avatar_female_6.png') as ImageSourcePropType,
  female_7: require('../assets/avatar_female_7.png') as ImageSourcePropType,
  female_8: require('../assets/avatar_female_8.png') as ImageSourcePropType,
  female_9: require('../assets/avatar_female_9.png') as ImageSourcePropType,
  female_10: require('../assets/avatar_female_10.png') as ImageSourcePropType,
  female_11: require('../assets/avatar_female_11.png') as ImageSourcePropType,
  female_12: require('../assets/avatar_female_12.png') as ImageSourcePropType,
  female_13: require('../assets/avatar_female_13.png') as ImageSourcePropType,
};

const getProfileAvatarSource = (avatarId?: string, gender?: string) => {
  if (avatarId && avatarSources[avatarId]) return avatarSources[avatarId];
  if (gender === 'Female') return images.female;
  return images.male;
};

const genderOptions: ChoiceOption[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const activityOptions: ChoiceOption[] = [
  { value: 'Low', label: 'Sedentary', description: 'Limited physical activity', image: images.sedentary },
  { value: 'Light', label: 'Light Activity', description: 'Light walking or standing', image: images.light },
  { value: 'Medium', label: 'Moderate Active', description: 'Regular jogging or cycling', image: images.moderate },
  { value: 'High', label: 'Very Active', description: 'Heavy lifting or training', image: images.very },
];

const climateOptions: ChoiceOption[] = [
  { value: 'Hot', label: 'Hot', description: 'More hydration support', image: images.hot },
  { value: 'Temperate', label: 'Temperate', description: 'Balanced daily target', image: images.temperate },
  { value: 'Cold', label: 'Cold', description: 'Steady gentle reminders', image: images.cold },
];

const sections: SectionConfig[] = [
  {
    title: 'Identity',
    accent: '#35d9ff',
    icon: 'account-circle-outline',
    fields: [
      { key: 'username', label: 'Username', subtitle: 'Shown across DoraDrink', icon: 'account-edit-outline', type: 'text' },
      { key: 'gender', label: 'Gender', subtitle: 'Used for goal calculation', icon: 'gender-male-female', type: 'choice', options: genderOptions },
      { key: 'country', label: 'Country', subtitle: 'Profile location', icon: 'map-marker-outline', type: 'location' },
    ],
  },
  {
    title: 'Body Metrics',
    accent: '#b65cff',
    icon: 'human-male-height',
    fields: [
      { key: 'age', label: 'Age', subtitle: 'Personalized daily goal', icon: 'calendar-account-outline', type: 'number', values: AGE_VALUES, unit: 'years' },
      { key: 'height', label: 'Height', subtitle: 'Body profile detail', icon: 'human-male-height-variant', type: 'number', values: HEIGHT_VALUES, unit: 'cm' },
      { key: 'weight', label: 'Weight', subtitle: 'Goal calculation input', icon: 'weight-kilogram', type: 'number', values: WEIGHT_VALUES, unit: 'kg' },
    ],
  },
  {
    title: 'Daily Routine',
    accent: '#13d7d2',
    icon: 'clock-outline',
    fields: [
      { key: 'activityLevel', label: 'Activity Level', subtitle: 'Adjusts hydration needs', icon: 'run-fast', type: 'choice', options: activityOptions },
      { key: 'climate', label: 'Climate', subtitle: 'Weather hydration profile', icon: 'weather-partly-cloudy', type: 'choice', options: climateOptions },
    ],
  },
  {
    title: 'Hydration Plan',
    accent: '#61ff91',
    icon: 'water-check-outline',
    fields: [
      { key: 'hydrationGoal', label: 'Hydration Goal', subtitle: 'Updates from your profile data', icon: 'target', type: 'readonly' },
    ],
  },
];

const defaultProfile: ProfileForm = {
  username: 'User',
  avatar: 'male_1',
  gender: 'Male',
  age: 25,
  height: 170,
  weight: 65,
  wakeUpTime: '06:30',
  sleepTime: '23:00',
  activityLevel: 'Medium',
  climate: 'Temperate',
  country: 'India',
  countryCode: 'IN',
};

const PersonalInformationScreen = ({ navigation }) => {
  const tabTheme = useMainTabTheme();
  const [formData, setFormData] = useState<ProfileForm>(defaultProfile);
  const [hydrationGoal, setHydrationGoal] = useState(2000);
  const [currentField, setCurrentField] = useState<FieldConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(25);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, storedGoal] = await Promise.all([
          getUserProfile(),
          AsyncStorage.getItem('hydrationGoal'),
        ]);

        if (profile) {
          setFormData({ ...defaultProfile, ...profile });
        }

        if (storedGoal) {
          const parsedGoal = Number(JSON.parse(storedGoal));
          if (!Number.isNaN(parsedGoal)) {
            setHydrationGoal(parsedGoal);
          }
        }
      } catch (error) {
        console.error('Failed to load personal information:', error);
      }
    };

    loadData();
  }, []);

  const avatarSource = useMemo(
    () => getProfileAvatarSource(formData.avatar, formData.gender),
    [formData.avatar, formData.gender],
  );

  const openEditor = (field: FieldConfig) => {
    if (field.type === 'readonly') {
      navigation.navigate('ProfileHydrationGoal');
      return;
    }

    if (field.type === 'location') {
      setLocationModalVisible(true);
      return;
    }

    setCurrentField(field);
    const value = formData[field.key as keyof ProfileForm];

    if (field.type === 'time') {
      setSelectedTime(timeToDate(String(value || '06:30')));
      setShowTimePicker(true);
      return;
    }

    if (field.type === 'number') {
      setSelectedNumber(Number(value || field.values?.[0] || 0));
    } else {
      setInputValue(value?.toString() || '');
    }

    setEditModalVisible(true);
  };

  const saveField = async () => {
    if (!currentField) return;

    const nextValue = currentField.type === 'number' ? selectedNumber : inputValue.trim();
    const updatedProfile = await updateUserProfile({ [currentField.key]: nextValue } as any);
    const nextProfile = { ...defaultProfile, ...updatedProfile } as ProfileForm;
    setFormData(nextProfile);

    setEditModalVisible(false);
  };

  const saveTime = async (date: Date) => {
    if (!currentField) return;

    const time24 = dateToHHMM(date);
    const updatedProfile = await updateUserProfile({ [currentField.key]: time24 } as any);
    const nextProfile = { ...defaultProfile, ...updatedProfile } as ProfileForm;
    setFormData(nextProfile);
  };

  const saveLocation = async (updates: Pick<ProfileForm, 'country' | 'countryCode'>) => {
    const updatedProfile = await updateUserProfile(updates as any);
    const nextProfile = { ...defaultProfile, ...updatedProfile, ...updates } as ProfileForm;
    setFormData(nextProfile);
  };

  return (
    <LinearGradient colors={tabTheme.background} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} theme={tabTheme} />
          <ProfileCard avatarSource={avatarSource} formData={formData} hydrationGoal={hydrationGoal} />
          {sections.map(section => (
            <InfoSection key={section.title} section={section} formData={formData} hydrationGoal={hydrationGoal} onFieldPress={openEditor} />
          ))}
        </ScrollView>

        <EditModal
          visible={editModalVisible}
          field={currentField}
          value={inputValue}
          selectedNumber={selectedNumber}
          onChangeText={setInputValue}
          onSelectNumber={setSelectedNumber}
          onClose={() => setEditModalVisible(false)}
          onSave={saveField}
        />

        <LocationModal
          visible={locationModalVisible}
          formData={formData}
          onClose={() => setLocationModalVisible(false)}
          onSave={saveLocation}
        />

        {showTimePicker && Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalFrame}>
                <GradientFrame colors={['#081b3d', '#13091f']} style={[styles.modalSurface, styles.timeModal]}>
                  <Text style={styles.modalTitle}>Edit {currentField?.label}</Text>
                  <DateTimePicker
                    mode="time"
                    value={selectedTime}
                    onChange={(event, date) => {
                      if (date) setSelectedTime(date);
                    }}
                    display="spinner"
                    textColor="#ffffff"
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setShowTimePicker(false)} style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={async () => {
                        await saveTime(selectedTime);
                        setShowTimePicker(false);
                      }}
                      style={styles.saveButton}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </GradientFrame>
              </View>
            </View>
          </Modal>
        ) : null}

        {showTimePicker && Platform.OS === 'android' ? (
          <DateTimePicker
            mode="time"
            value={selectedTime}
            onChange={async (event, date) => {
              setShowTimePicker(false);
              if (date) {
                setSelectedTime(date);
                await saveTime(date);
              }
            }}
            display="spinner"
          />
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, theme }: { onBack: () => void; theme: MainTabTheme }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Feather name="arrow-left" size={25} color={theme.icon} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Personal Info</Text>
      <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Edit your hydration profile</Text>
    </View>
    <View style={[styles.headerButton, { backgroundColor: theme.headerButton, borderColor: theme.border }]}>
      <Feather name="user-check" size={22} color={theme.icon} />
    </View>
  </View>
);

const ProfileCard = ({
  avatarSource,
  formData,
  hydrationGoal,
}: {
  avatarSource: ImageSourcePropType;
  formData: ProfileForm;
  hydrationGoal: number;
}) => (
  <GradientFrame colors={['rgba(8,47,91,0.96)', 'rgba(25,12,67,0.96)']} style={styles.profileCard}>
    <GradientFrame colors={['#65ecff', '#155dff']} style={styles.avatarFrame}>
      <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
    </GradientFrame>
    <View style={styles.profileCopy}>
      <Text style={styles.profileName}>{formData.username}</Text>
      <Text style={styles.profileLocation}>{formData.country || 'India'}</Text>
      <View style={styles.profileMetaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="water" size={17} color="#35d9ff" />
          <Text style={styles.metaPillText}>{hydrationGoal} ml/day</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="run-fast" size={17} color="#b65cff" />
          <Text style={styles.metaPillText}>{formatChoiceLabel(formData.activityLevel, activityOptions)}</Text>
        </View>
      </View>
    </View>
  </GradientFrame>
);

const InfoSection = ({
  section,
  formData,
  hydrationGoal,
  onFieldPress,
}: {
  section: SectionConfig;
  formData: ProfileForm;
  hydrationGoal: number;
  onFieldPress: (field: FieldConfig) => void;
}) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: `${section.accent}20` }]}>
        <MaterialCommunityIcons name={section.icon} size={24} color={section.accent} />
      </View>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
    {section.fields.map(field => (
      <TouchableOpacity key={field.key} activeOpacity={0.86} onPress={() => onFieldPress(field)} style={styles.fieldRow}>
        <View style={styles.fieldLeft}>
          <View style={styles.fieldIcon}>
            <MaterialCommunityIcons name={field.icon} size={20} color={section.accent} />
          </View>
          <View style={styles.fieldCopy}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldSubtitle}>{field.subtitle}</Text>
          </View>
        </View>
        <View style={styles.fieldRight}>
          <Text style={[styles.fieldValue, { color: section.accent }]} numberOfLines={1}>
            {renderFieldValue(field, formData, hydrationGoal)}
          </Text>
          <Feather name={field.type === 'readonly' ? 'external-link' : 'edit-2'} size={16} color="#8fa1c8" />
        </View>
      </TouchableOpacity>
    ))}
  </GradientFrame>
);

const EditModal = ({
  visible,
  field,
  value,
  selectedNumber,
  onChangeText,
  onSelectNumber,
  onClose,
  onSave,
}: {
  visible: boolean;
  field: FieldConfig | null;
  value: string;
  selectedNumber: number;
  onChangeText: (value: string) => void;
  onSelectNumber: (value: number) => void;
  onClose: () => void;
  onSave: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalFrame, styles.editModalFrame]}>
        <GradientFrame colors={['#081b3d', '#13091f']} style={[styles.modalSurface, styles.modalCard]}>
          <Text style={styles.modalTitle}>Edit {field?.label}</Text>
          <Text style={styles.modalSubtitle}>{field?.subtitle}</Text>
          {renderModalEditor(field, value, selectedNumber, onChangeText, onSelectNumber)}
          <View style={styles.modalActions}>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={onSave} style={styles.saveButton}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </GradientFrame>
      </View>
    </View>
  </Modal>
);

const LocationModal = ({
  visible,
  formData,
  onClose,
  onSave,
}: {
  visible: boolean;
  formData: ProfileForm;
  onClose: () => void;
  onSave: (updates: Pick<ProfileForm, 'country' | 'countryCode'>) => Promise<void>;
}) => {
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [draftLocation, setDraftLocation] = useState({
    country: formData.country || 'India',
    countryCode: formData.countryCode || 'IN',
  });
  const countryCode = draftLocation.countryCode || 'IN';

  useEffect(() => {
    if (!visible) return;

    setDraftLocation({
      country: formData.country || 'India',
      countryCode: formData.countryCode || 'IN',
    });
  }, [formData.country, formData.countryCode, visible]);

  const handleCountrySelect = (country: Country) => {
    const nextCountryCode = country.cca2;
    const countryName = typeof country.name === 'string'
      ? country.name
      : country.name.common || nextCountryCode;

    setDraftLocation({
      country: countryName,
      countryCode: nextCountryCode,
    });
    setCountryPickerVisible(false);
  };

  const handleSave = async () => {
    await onSave(draftLocation);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalFrame, styles.locationModalFrame]}>
          <GradientFrame colors={['#081b3d', '#13091f']} style={[styles.modalSurface, styles.locationModal]}>
            <View style={styles.locationHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Location</Text>
                <Text style={styles.modalSubtitle}>Choose your country.</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.locationClose}>
                <Feather name="x" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <CountryPicker
              countryCode={countryCode}
              visible={countryPickerVisible}
              withFilter
              withFlag
              withEmoji
              withFlagButton={false}
              withCountryNameButton={false}
              withCallingCode={false}
              onSelect={handleCountrySelect}
              onClose={() => setCountryPickerVisible(false)}
            />

          <TouchableOpacity activeOpacity={0.86} onPress={() => setCountryPickerVisible(true)} style={styles.locationSelectPanel}>
            <View style={styles.locationSelectLeft}>
              <View style={styles.locationIcon}>
                <Feather name="globe" size={19} color="#35d9ff" />
              </View>
              <View>
                <Text style={styles.locationSelectLabel}>Country</Text>
                <Text style={styles.locationSelectValue}>{draftLocation.country}</Text>
              </View>
            </View>
            <Flag countryCode={countryCode} withEmoji withFlagButton flagSize={28} />
          </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveText}>Save Location</Text>
              </TouchableOpacity>
            </View>
          </GradientFrame>
        </View>
      </View>
    </Modal>
  );
};

const renderModalEditor = (
  field: FieldConfig | null,
  value: string,
  selectedNumber: number,
  onChangeText: (value: string) => void,
  onSelectNumber: (value: number) => void,
) => {
  if (!field) return null;

  if (field.type === 'number') {
    return (
      <FlatList
        data={field.values || []}
        keyExtractor={item => String(item)}
        style={styles.numberList}
        contentContainerStyle={styles.numberListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = selectedNumber === item;
          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onSelectNumber(item)} style={[styles.numberOption, selected && styles.numberOptionSelected]}>
              <Text style={[styles.numberText, selected && styles.numberTextSelected]}>{item} {field.unit}</Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  }

  if (field.type === 'choice') {
    return (
      <View style={styles.choiceList}>
        {(field.options || []).map(option => {
          const selected = value === option.value;
          return (
            <TouchableOpacity key={option.value} activeOpacity={0.84} onPress={() => onChangeText(option.value)} style={[styles.choiceOption, selected && styles.choiceOptionSelected]}>
              {option.image ? <Image source={option.image} style={styles.choiceImage} resizeMode="contain" /> : null}
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceTitle}>{option.label}</Text>
                {option.description ? <Text style={styles.choiceDescription}>{option.description}</Text> : null}
              </View>
              <View style={[styles.choiceRadio, selected && styles.choiceRadioSelected]}>
                {selected ? <Feather name="check" size={14} color="#ffffff" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={`Enter ${field.label.toLowerCase()}`}
      placeholderTextColor="#7585aa"
      selectionColor="#35d9ff"
      style={styles.textInput}
    />
  );
};

const renderFieldValue = (field: FieldConfig, formData: ProfileForm, hydrationGoal: number) => {
  if (field.key === 'hydrationGoal') return `${hydrationGoal} ml`;

  const value = formData[field.key as keyof ProfileForm];
  if (field.type === 'number') return `${value || '—'} ${field.unit}`;
  if (field.type === 'time') return formatTime12(String(value || ''));
  if (field.key === 'activityLevel') return formatChoiceLabel(value, activityOptions);
  if (field.key === 'climate') return formatChoiceLabel(value, climateOptions);
  return value?.toString() || '—';
};

const formatChoiceLabel = (value: unknown, options: ChoiceOption[]) => (
  options.find(option => option.value === value)?.label || value?.toString() || '—'
);

const dateToHHMM = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const timeToDate = (time: string) => {
  const [hours = '6', minutes = '30'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

const formatTime12 = (time: string) => {
  if (!time) return '—';
  const [hourText = '0', minuteText = '00'] = time.split(':');
  const hour = Number(hourText);
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minuteText} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const GradientFrame = ({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 14,
  },
  gradientFrame: {
    backgroundColor: 'rgba(4,14,33,0.98)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 22,
    paddingTop: 12,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,55,0.86)',
    borderColor: '#315f9f',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#1679ff',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    width: 44,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 32,
  },
  headerSubtitle: {
    color: '#b7bdd7',
    fontSize: 12,
    marginTop: 2,
  },
  profileCard: {
    alignItems: 'center',
    borderColor: '#315f9f',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    minHeight: 126,
    padding: 14,
  },
  avatarFrame: {
    alignItems: 'center',
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  avatar: {
    borderRadius: 38,
    height: 76,
    width: 76,
  },
  profileCopy: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
  },
  profileLocation: {
    color: '#c4cbe1',
    fontSize: 12,
    marginTop: 5,
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,27,62,0.9)',
    borderColor: '#24436e',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 30,
    paddingHorizontal: 9,
  },
  metaPillText: {
    color: '#dce8ff',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
  },
  sectionCard: {
    borderColor: '#203f70',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  fieldRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(66,98,149,0.28)',
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    paddingVertical: 10,
  },
  fieldLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  fieldIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,44,91,0.72)',
    borderRadius: 13,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  fieldSubtitle: {
    color: '#9faac6',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  fieldRight: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 10,
    maxWidth: 130,
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '900',
    marginRight: 8,
    maxWidth: 104,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.66)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalFrame: {
    borderColor: '#315f9f',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  editModalFrame: {
    maxHeight: '84%',
  },
  locationModalFrame: {
    maxHeight: '88%',
  },
  modalSurface: {
    width: '100%',
  },
  modalCard: {
    padding: 18,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#aeb8d5',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  textInput: {
    backgroundColor: 'rgba(7,26,61,0.9)',
    borderColor: '#284e87',
    borderRadius: 15,
    borderWidth: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    height: 52,
    marginTop: 18,
    paddingHorizontal: 14,
  },
  numberList: {
    marginTop: 16,
    maxHeight: 280,
  },
  numberListContent: {
    gap: 8,
  },
  numberOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.74)',
    borderColor: '#254e85',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
  },
  numberOptionSelected: {
    backgroundColor: 'rgba(22,184,255,0.18)',
    borderColor: '#35d9ff',
  },
  numberText: {
    color: '#aeb8d5',
    fontSize: 14,
    fontWeight: '800',
  },
  numberTextSelected: {
    color: '#ffffff',
    fontSize: 16,
  },
  choiceList: {
    gap: 10,
    marginTop: 18,
  },
  choiceOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.74)',
    borderColor: '#254e85',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    padding: 10,
  },
  choiceOptionSelected: {
    backgroundColor: 'rgba(22,184,255,0.16)',
    borderColor: '#35d9ff',
  },
  choiceImage: {
    height: 40,
    marginRight: 10,
    width: 40,
  },
  choiceCopy: {
    flex: 1,
  },
  choiceTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  choiceDescription: {
    color: '#aeb8d5',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  choiceRadio: {
    alignItems: 'center',
    borderColor: '#5270a6',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  choiceRadioSelected: {
    backgroundColor: '#1688ff',
    borderColor: '#35d9ff',
  },
  timeModal: {
    padding: 18,
  },
  locationModal: {
    padding: 18,
  },
  locationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,38,76,0.94)',
    borderColor: '#294d82',
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  locationSelectPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.9)',
    borderColor: '#284e87',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    minHeight: 66,
    paddingHorizontal: 14,
  },
  locationSelectLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  locationIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,184,255,0.14)',
    borderColor: '#235d9c',
    borderRadius: 13,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginRight: 10,
    width: 38,
  },
  locationSelectLabel: {
    color: '#9faac6',
    fontSize: 11,
    fontWeight: '800',
  },
  locationSelectValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,38,76,0.94)',
    borderColor: '#294d82',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#0e82ff',
    borderColor: '#54c2ff',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#d8e4ff',
    fontSize: 14,
    fontWeight: '900',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default PersonalInformationScreen;
