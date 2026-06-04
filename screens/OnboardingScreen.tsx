import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { City, State } from 'country-state-city';
import CountryPicker, { Country, CountryCode, Flag } from 'react-native-country-picker-modal';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

type OnboardingData = {
  gender?: string;
  age?: number;
  height?: number;
  heightUnit?: string;
  weight?: number;
  weightUnit?: string;
  activityLevel?: string;
  climate?: string;
  username?: string;
  avatar?: string;
  country?: string;
  countryCode?: CountryCode;
  city?: string;
  wakeUpTime?: string;
  sleepTime?: string;
  planType?: 'smart' | 'performance' | 'custom';
  dailyGoal?: number;
  dailyGoalUnit?: string;
  reminderPlan?: ReminderPlanItem[];
};

type OptionCard = {
  title: string;
  subtitle?: string;
  value: string;
  image?: ImageSourcePropType;
  icon?: React.ReactNode;
};

type AvatarOption = {
  id: string;
  gender: 'Male' | 'Female';
  image: ImageSourcePropType;
};

type WeatherProfile = {
  status: string;
  temp: number;
  description: string;
  image: ImageSourcePropType;
  accent: string;
  climate: 'Cold' | 'Temperate' | 'Hot';
};

type ReminderPlanItem = {
  id: 'morning' | 'afternoon' | 'evening';
  time: string;
  label: string;
  icon: string;
};

type HydrationPlan = {
  key: 'smart' | 'performance' | 'custom';
  badge: string;
  title: string;
  description: string;
  goalLabel: string;
  goalMl?: number;
  accent: string;
  image: ImageSourcePropType;
};

const TOTAL_STEPS = 8;
const BLUE = '#16b8ff';
const PANEL = 'rgba(7, 24, 62, 0.72)';
const PANEL_SOFT = 'rgba(12, 34, 78, 0.58)';
const BORDER = 'rgba(75, 112, 183, 0.44)';
const MUTED = '#c8d2ee';
const AGE_VALUES = Array.from({ length: 83 }, (_, index) => 18 + index);
const HEIGHT_VALUES = Array.from({ length: 111 }, (_, index) => 120 + index);
const WEIGHT_VALUES = Array.from({ length: 151 }, (_, index) => 30 + index);
const TIME_ITEM_HEIGHT = 40;
const TIME_WHEEL_VISIBLE_ITEMS = 5;
const TIME_WHEEL_PADDING = TIME_ITEM_HEIGHT * 2;
const TIME_HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const TIME_MINUTES = Array.from({ length: 60 }, (_, index) => index);
const TIME_PERIODS = ['AM', 'PM'];

const parseTimeToMinutes = (time = '06:30') => {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
};

const normalizeMinutes = (minutes: number) => {
  const day = 24 * 60;
  return ((Math.round(minutes) % day) + day) % day;
};

const minutesToHHMM = (minutes: number) => {
  const normalized = normalizeMinutes(minutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatTime12 = (time: string) => {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minuteText} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const buildThreeReminderPlan = (
  wakeTime = '06:30',
  sleepTime = '23:00',
  planType: OnboardingData['planType'] = 'smart',
): ReminderPlanItem[] => {
  const wake = parseTimeToMinutes(wakeTime);
  let sleep = parseTimeToMinutes(sleepTime);

  if (sleep <= wake) {
    sleep += 24 * 60;
  }

  const activeWindow = Math.max(6 * 60, sleep - wake);
  const offsets = planType === 'performance'
    ? [30, activeWindow * 0.45, activeWindow - 210]
    : [60, activeWindow * 0.48, activeWindow - 180];
  const labels = planType === 'performance'
    ? ['Early Hydration', 'Mid-Day Boost', 'Post Activity']
    : ['Morning Boost', 'Focus Time', 'Evening Recovery'];

  return [
    { id: 'morning', time: minutesToHHMM(wake + offsets[0]), label: labels[0], icon: 'sunrise' },
    { id: 'afternoon', time: minutesToHHMM(wake + offsets[1]), label: labels[1], icon: 'sun' },
    { id: 'evening', time: minutesToHHMM(wake + offsets[2]), label: labels[2], icon: 'moon' },
  ];
};

const buildDefaultCustomReminderPlan = (wakeTime = '06:30', sleepTime = '23:00') => (
  buildThreeReminderPlan(wakeTime, sleepTime, 'smart').map((reminder) => ({
    ...reminder,
    label: 'Custom',
  }))
);

const hydrationPlans: HydrationPlan[] = [
  {
    key: 'smart',
    badge: 'Recommended',
    title: 'Smart Plan',
    description: 'Perfect balance for your daily hydration.',
    goalLabel: '2000 ml',
    goalMl: 2000,
    accent: BLUE,
    image: require('../assets/remindercard1.png'),
  },
  {
    key: 'performance',
    badge: 'High Performance',
    title: 'Performance Plan',
    description: 'More support for active and intense days.',
    goalLabel: '3000 ml',
    goalMl: 3000,
    accent: '#b65cff',
    image: require('../assets/remindercard2.png'),
  },
  {
    key: 'custom',
    badge: 'Custom',
    title: 'Custom Plan',
    description: 'Set your own water goal and reminder times.',
    goalLabel: 'Custom',
    accent: '#13d7d2',
    image: require('../assets/remindercard3.png'),
  },
];

const genderOptions: OptionCard[] = [
  { title: 'Male', value: 'Male', image: require('../assets/male.png') },
  { title: 'Female', value: 'Female', image: require('../assets/female.png') },
  {
    title: 'Prefer not\nto say',
    value: 'Prefer not to say',
    icon: <Ionicons name="person-outline" size={78} color={BLUE} />,
  },
];

const activityOptions: OptionCard[] = [
  {
    title: 'Sedentary',
    subtitle: 'Little or no exercise',
    value: 'Low',
    image: require('../assets/alone.png'),
  },
  {
    title: 'Active',
    subtitle: 'Exercise 1-3 days weekly',
    value: 'Medium',
    image: require('../assets/walk.png'),
  },
  {
    title: 'Athlete',
    subtitle: 'Intense exercise often',
    value: 'High',
    image: require('../assets/weightlifting.png'),
  },
];

const climateOptions: OptionCard[] = [
  { title: 'Cold', subtitle: 'Cool weather', value: 'Cold', image: require('../assets/autumn.png') },
  { title: 'Moderate', subtitle: 'Mild climate', value: 'Temperate', image: require('../assets/sun.png') },
  { title: 'Hot', subtitle: 'Hot weather', value: 'Hot', image: require('../assets/contrast.png') },
];

const weatherProfiles: WeatherProfile[] = [
  {
    status: 'Cold',
    temp: 8,
    description: 'Cool air with low sweat loss',
    image: require('../assets/autumn.png'),
    accent: '#76d8ff',
    climate: 'Cold',
  },
  {
    status: 'Mild',
    temp: 22,
    description: 'Comfortable weather for steady hydration',
    image: require('../assets/sun.png'),
    accent: '#ffd45c',
    climate: 'Temperate',
  },
  {
    status: 'Warm',
    temp: 28,
    description: 'Warm day with moderate hydration needs',
    image: require('../assets/sun.png'),
    accent: '#ffbf4b',
    climate: 'Temperate',
  },
  {
    status: 'Hot',
    temp: 34,
    description: 'Humid with high UV index',
    image: require('../assets/contrast.png'),
    accent: '#ff9b35',
    climate: 'Hot',
  },
  {
    status: 'Very Hot',
    temp: 39,
    description: 'High heat means more water needed',
    image: require('../assets/contrast.png'),
    accent: '#ff6d37',
    climate: 'Hot',
  },
];

const getRandomWeatherProfile = () => (
  weatherProfiles[Math.floor(Math.random() * weatherProfiles.length)] || weatherProfiles[1]
);

const avatarOptions: AvatarOption[] = [
  { id: 'male_1', gender: 'Male', image: require('../assets/avatar_male_1.png') },
  { id: 'male_2', gender: 'Male', image: require('../assets/avatar_male_2.png') },
  { id: 'male_3', gender: 'Male', image: require('../assets/avatar_male_3.png') },
  { id: 'male_4', gender: 'Male', image: require('../assets/avatar_male_4.png') },
  { id: 'male_6', gender: 'Male', image: require('../assets/avatar_male_6.png') },
  { id: 'male_7', gender: 'Male', image: require('../assets/avatar_male_7.png') },
  { id: 'male_8', gender: 'Male', image: require('../assets/avatar_male_8.png') },
  { id: 'male_9', gender: 'Male', image: require('../assets/avatar_male_9.png') },
  { id: 'male_10', gender: 'Male', image: require('../assets/avatar_male_10.png') },
  { id: 'male_12', gender: 'Male', image: require('../assets/avatar_male_12.png') },
  { id: 'male_13', gender: 'Male', image: require('../assets/avatar_male_13.png') },
  { id: 'male_14', gender: 'Male', image: require('../assets/avatar_male_14.png') },
  { id: 'male_15', gender: 'Male', image: require('../assets/avatar_male_15.png') },
  { id: 'female_1', gender: 'Female', image: require('../assets/avatar_female_1.png') },
  { id: 'female_2', gender: 'Female', image: require('../assets/avatar_female_2.png') },
  { id: 'female_3', gender: 'Female', image: require('../assets/avatar_female_3.png') },
  { id: 'female_4', gender: 'Female', image: require('../assets/avatar_female_4.png') },
  { id: 'female_5', gender: 'Female', image: require('../assets/avatar_female_5.png') },
  { id: 'female_6', gender: 'Female', image: require('../assets/avatar_female_6.png') },
  { id: 'female_7', gender: 'Female', image: require('../assets/avatar_female_7.png') },
  { id: 'female_8', gender: 'Female', image: require('../assets/avatar_female_8.png') },
  { id: 'female_9', gender: 'Female', image: require('../assets/avatar_female_9.png') },
  { id: 'female_10', gender: 'Female', image: require('../assets/avatar_female_10.png') },
  { id: 'female_11', gender: 'Female', image: require('../assets/avatar_female_11.png') },
  { id: 'female_12', gender: 'Female', image: require('../assets/avatar_female_12.png') },
  { id: 'female_13', gender: 'Female', image: require('../assets/avatar_female_13.png') },
];

const getDefaultAvatarId = (gender?: string) => {
  if (gender === 'Female') {
    return avatarOptions.find((avatar) => avatar.gender === 'Female')?.id || avatarOptions[0]?.id || 'male_1';
  }

  return avatarOptions.find((avatar) => avatar.gender === 'Male')?.id || avatarOptions[0]?.id || 'male_1';
};

const initialData: OnboardingData = {
  gender: 'Male',
  age: 28,
  height: 175,
  heightUnit: 'cm',
  weight: 70,
  weightUnit: 'kg',
  activityLevel: 'Low',
  climate: 'Temperate',
  username: '',
  avatar: 'male_1',
  country: 'India',
  countryCode: 'IN',
  city: 'Bangalore, Karnataka',
  wakeUpTime: '06:30',
  sleepTime: '23:00',
  planType: 'smart',
  dailyGoal: 2000,
  dailyGoalUnit: 'mL',
  reminderPlan: buildThreeReminderPlan('06:30', '23:00', 'smart'),
};

const OnboardingScreen = ({ navigation }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<OnboardingData>(initialData);

  const updateData = (data: Partial<OnboardingData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const stepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!userData.gender;
      case 1:
        return !!userData.age && !!userData.height && !!userData.weight;
      case 2:
        return !!userData.activityLevel && !!userData.climate;
      case 3:
        return !!userData.username?.trim();
      case 4:
        return !!userData.country && !!userData.city;
      case 5:
        return !!userData.wakeUpTime && !!userData.sleepTime;
      case 6:
        return !!userData.planType && !!userData.dailyGoal && !!userData.reminderPlan?.length;
      case 7:
        return !!userData.planType && !!userData.dailyGoal;
      default:
        return true;
    }
  }, [currentStep, userData]);

  const handleNext = () => {
    if (!stepValid) {
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    navigation.replace('GeneratingPlan', { userData });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <GenderStep userData={userData} updateData={updateData} />;
      case 1:
        return <BasicsStep userData={userData} updateData={updateData} />;
      case 2:
        return <LifestyleStep userData={userData} updateData={updateData} />;
      case 3:
        return <IdentityStep userData={userData} updateData={updateData} />;
      case 4:
        return <LocationStep userData={userData} updateData={updateData} />;
      case 5:
        return <ScheduleStep userData={userData} updateData={updateData} />;
      case 6:
        return <ReminderPlanStep userData={userData} updateData={updateData} />;
      case 7:
        return <PlanSummaryStep userData={userData} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#020918" />


      <View style={styles.topBar}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= currentStep && styles.progressSegmentActive,
              ]}
            >
              {index < currentStep ? (
                <Feather name="check" size={13} color="#fff" />
              ) : index === currentStep && currentStep > 1 ? (
                <Text style={styles.progressNumber}>{index + 1}</Text>
              ) : null}
            </View>
          ))}
        </View>
        <Text style={styles.stepCount}>{currentStep + 1} / {TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={!stepValid}
          onPress={handleNext}
          style={[styles.continueButton, !stepValid && styles.continueDisabled]}
        >
          <Text style={styles.continueText}>
            {currentStep === TOTAL_STEPS - 1 ? 'Start My Hydration Journey' : 'Continue'}
          </Text>
          <Feather name="arrow-right" size={28} color="#fff" style={styles.continueArrow} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepTitle = ({
  title,
  accent,
  subtitle,
}: {
  title: string;
  accent?: string;
  subtitle: string;
}) => (
  <View style={styles.titleWrap}>
    <Text style={styles.title}>
      {title}{accent ? <Text style={styles.titleAccent}> {accent}</Text> : null}
    </Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const GenderStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => (
  <>
    <StepTitle
      title="Let's personalize"
      accent="your experience"
      subtitle="This helps us create your Digital Me and a better hydration plan."
    />
    <View style={styles.genderGrid}>
      {genderOptions.map((item) => (
        <TallChoiceCard
          key={item.value}
          item={item}
          selected={userData.gender === item.value}
          onPress={() => updateData({ gender: item.value, avatar: getDefaultAvatarId(item.value) })}
          selectedTall
          hideEmptyCheck
        />
      ))}
    </View>
    <InfoPanel
      icon={<MaterialCommunityIcons name="shield-check-outline" size={42} color={BLUE} />}
      text="Your information is private and will never be shared."
    />
    <MascotBubble text="Let's build your best hydration journey!" />
  </>
);

const BasicsStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => (
  <>
    <StepTitle
      title="Tell us a bit about you"
      subtitle="This helps us create your personalized hydration plan."
    />
    <NumberCard
      icon={<Feather name="calendar" size={20} color={BLUE} />}
      label="Age"
      value={userData.age || 28}
      unit="Years"
      values={AGE_VALUES}
      onSelect={(age) => updateData({ age })}
      helper="We use this to understand your body's needs."
    />
    <NumberCard
      icon={<MaterialCommunityIcons name="human-male-height" size={25} color={BLUE} />}
      label="Height"
      value={userData.height || 175}
      unit="cm"
      values={HEIGHT_VALUES}
      onSelect={(heightValue) => updateData({ height: heightValue, heightUnit: 'cm' })}
      helper="Helps us calculate your daily hydration target."
    />
    <NumberCard
      icon={<MaterialCommunityIcons name="scale-bathroom" size={25} color={BLUE} />}
      label="Weight"
      value={userData.weight || 70}
      unit="kg"
      values={WEIGHT_VALUES}
      decimals
      onSelect={(weightValue) => updateData({ weight: weightValue, weightUnit: 'kg' })}
      helper="Helps us fine-tune your hydration recommendations."
    />
    <InfoPanel
      icon={<MaterialCommunityIcons name="shield-lock-outline" size={40} color={BLUE} />}
      text="Your data is private and secure. We never share your information."
    />
  </>
);

const LifestyleStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => (
  <>
    <StepTitle
      title="Your lifestyle matters"
      subtitle="This helps us personalize your hydration recommendations."
    />
    <SectionLabel icon={<FontAwesome5 name="running" size={24} color={BLUE} />} title="1. Activity Level" subtitle="How active are you on a regular day?" />
    <View style={styles.optionGrid}>
      {activityOptions.map((item) => (
        <TallChoiceCard
          key={item.value}
          item={item}
          selected={userData.activityLevel === item.value}
          onPress={() => updateData({ activityLevel: item.value })}
        />
      ))}
    </View>
    <SectionLabel icon={<Feather name="sun" size={26} color={BLUE} />} title="2. Climate" subtitle="What's the typical climate like where you live?" />
    <View style={styles.optionGrid}>
      {climateOptions.map((item) => (
        <TallChoiceCard
          key={item.value}
          item={item}
          selected={userData.climate === item.value}
          onPress={() => updateData({ climate: item.value })}
          compact
        />
      ))}
    </View>
    <InfoPanel
      icon={<Image source={require('../assets/logo2.png')} style={styles.infoImage} />}
      text="This helps us adjust your daily goal. Hot climate means more hydration needed."
    />
  </>
);

const IdentityStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => {
  const availableAvatars = avatarOptions.filter((avatar) => {
    if (userData.gender === 'Female') {
      return avatar.gender === 'Female';
    }

    if (userData.gender === 'Male') {
      return avatar.gender === 'Male';
    }

    return true;
  });
  const defaultAvatar = avatarOptions[0] as AvatarOption;
  const selectedAvatar = availableAvatars.find((avatar) => avatar.id === userData.avatar)
    || availableAvatars[0]
    || defaultAvatar;

  return (
    <>
      <StepTitle
        title="Let's create"
        accent="your identity"
        subtitle="This will be your name in the app and your Digital Me."
      />
      <View style={styles.avatarWrap}>
        <View style={styles.avatarRing}>
          <Image
            source={selectedAvatar.image}
            style={styles.avatarImage}
          />
        </View>

      </View>

      <Text style={styles.inputLabel}>Choose your avatar</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarPickerContent}
        style={styles.avatarPicker}
      >
        {availableAvatars.map((avatar) => {
          const selected = selectedAvatar.id === avatar.id;

          return (
            <TouchableOpacity
              key={avatar.id}
              activeOpacity={0.86}
              onPress={() => updateData({ avatar: avatar.id })}
              style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
            >
              <Image source={avatar.image} style={styles.avatarOptionImage} />
              {selected ? (
                <View style={styles.avatarOptionCheck}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.inputLabel}>Choose a username</Text>
      <View style={styles.inputCard}>
        <Ionicons name="person" size={30} color={BLUE} />
        <TextInput
          value={userData.username}
          onChangeText={(username) => updateData({ username })}
          placeholder="Enter username"
          placeholderTextColor="#7890c9"
          selectionColor={BLUE}
          style={styles.textInput}
        />
        <Feather name="check-circle" size={30} color="#16d66f" />
      </View>
      <Text style={styles.successText}>Great choice! This username is available.</Text>
      <InfoPanel
        icon={<Image source={selectedAvatar.image} style={styles.miniAvatar} />}
        text={`Welcome, ${userData.username || 'Hydration Hero'}! Hydration warrior mode: ON`}
      />
      <TipsPanel />
    </>
  );
};

const LocationStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => {
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [weatherProfile, setWeatherProfile] = useState<WeatherProfile>(() => getRandomWeatherProfile());
  const countryCode = userData.countryCode || 'IN';
  const weatherAccentStyle = useMemo(
    () => ({ color: weatherProfile.accent }),
    [weatherProfile.accent],
  );

  const cities = useMemo(() => {
    const states = State.getStatesOfCountry(countryCode);
    const stateNameByCode = states.reduce<Record<string, string>>((acc, state) => {
      acc[state.isoCode] = state.name;
      return acc;
    }, {});

    return (City.getCitiesOfCountry(countryCode) || [])
      .map((city) => ({
        key: `${city.name}-${city.stateCode}`,
        label: stateNameByCode[city.stateCode]
          ? `${city.name}, ${stateNameByCode[city.stateCode]}`
          : city.name,
      }))
      .filter((city, index, list) => list.findIndex((item) => item.label === city.label) === index)
      .slice(0, 500);
  }, [countryCode]);

  const filteredCities = useMemo(() => {
    const query = citySearch.trim().toLowerCase();

    if (!query) {
      return cities;
    }

    return cities.filter((city) => city.label.toLowerCase().includes(query));
  }, [cities, citySearch]);

  const handleCountrySelect = (country: Country) => {
    const nextCountryCode = country.cca2;
    const states = State.getStatesOfCountry(nextCountryCode);
    const stateNameByCode = states.reduce<Record<string, string>>((acc, state) => {
      acc[state.isoCode] = state.name;
      return acc;
    }, {});
    const firstCity = City.getCitiesOfCountry(nextCountryCode)?.[0];
    const nextCity = firstCity
      ? stateNameByCode[firstCity.stateCode]
        ? `${firstCity.name}, ${stateNameByCode[firstCity.stateCode]}`
        : firstCity.name
      : '';
    const countryName = typeof country.name === 'string'
      ? country.name
      : country.name.common || nextCountryCode;

    const nextWeather = getRandomWeatherProfile();
    setWeatherProfile(nextWeather);
    updateData({
      country: countryName,
      countryCode: nextCountryCode,
      city: nextCity,
      climate: nextWeather.climate,
    });
    setCitySearch('');
    setCountryPickerVisible(false);
  };

  return (
    <>
      <View style={styles.splitHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Where are you{'\n'}<Text style={styles.titleAccent}>located?</Text></Text>
          <Text style={styles.heroSubtitle}>
            This helps us adjust hydration goals based on your location and weather.
          </Text>
        </View>
        <View style={styles.locationHeroArt}>
          <Image source={require('../assets/location.png')} style={styles.heroAssetImage} />
        </View>
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

      <SelectPanel
        icon={<Ionicons name="globe-outline" size={20} color={BLUE} />}
        label="Country"
        value={userData.country || 'India'}
        valueIcon={<Flag countryCode={countryCode} withEmoji withFlagButton flagSize={28} />}
        onPress={() => setCountryPickerVisible(true)}
      />
      <SelectPanel
        icon={<MaterialCommunityIcons name="city-variant-outline" size={20} color={BLUE} />}
        label="City"
        value={userData.city || 'Select city'}
        valueIcon={<CityBadge />}
        onPress={() => setCityPickerVisible(true)}
      />

      <Modal
        visible={cityPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <View style={styles.cityModalBackdrop}>
          <View style={styles.cityModal}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select city</Text>
              <TouchableOpacity onPress={() => setCityPickerVisible(false)} style={styles.cityModalClose}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.citySearchBox}>
              <Feather name="search" size={20} color={BLUE} />
              <TextInput
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Search city or state"
                placeholderTextColor="#7f91c6"
                selectionColor={BLUE}
                style={styles.citySearchInput}
              />
              {citySearch ? (
                <TouchableOpacity onPress={() => setCitySearch('')}>
                  <Feather name="x-circle" size={20} color="#7f91c6" />
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.key}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityOption}
                  onPress={() => {
                    const nextWeather = getRandomWeatherProfile();
                    setWeatherProfile(nextWeather);
                    updateData({ city: item.label, climate: nextWeather.climate });
                    setCityPickerVisible(false);
                  }}
                >
                  <Text style={styles.cityOptionText}>{item.label}</Text>
                  {userData.city === item.label ? <Feather name="check" size={20} color={BLUE} /> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.cityEmptyText}>No city found for this search.</Text>}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.weatherCard}>
        <Image source={weatherProfile.image} style={styles.weatherImage} />
        <View style={styles.flex}>
          <Text style={styles.weatherLabel}>Current weather in {userData.city?.split(',')[0] || 'your city'}</Text>
          <Text style={styles.weatherTemp}>
            <Text style={[styles.hotText, weatherAccentStyle]}>{weatherProfile.status}</Text>
            {'  '}
            {weatherProfile.temp}°C
          </Text>
          <Text style={styles.weatherText}>{weatherProfile.description}</Text>
        </View>
        <View style={styles.tempIcon}>
          <Feather name="thermometer" size={31} color="#ff6fa3" />
        </View>
      </View>
      <View style={styles.whyPanel}>
        <View style={styles.whyIcon}>
          <Feather name="info" size={20} color="#ffc247" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.whyTitle}>Why location matters?</Text>
          <Text style={styles.whyText}>Climate and environment affect how much water your body needs every day.</Text>
        </View>
        <View style={styles.cityArt}>
          <Image source={require('../assets/location2.png')} style={styles.smartBottle} />
        </View>
      </View>
    </>
  );
};

const ScheduleStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => (
  <>
    <View style={styles.splitHero}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>Let's set your{'\n'}daily <Text style={styles.scheduleAccent}>schedule</Text></Text>
        <Text style={styles.heroSubtitle}>
          This helps us time your reminders perfectly for your day.
        </Text>
      </View>
      <View style={styles.scheduleHeroArt}>
        <Image source={require('../assets/timing.png')} style={styles.heroAssetImage} />
      </View>
    </View>
    <TimePanel
      theme="morning"
      label="Wake-up time"
      subtitle="When do you usually wake up?"
      value={userData.wakeUpTime || '06:30'}
      onChange={(wakeUpTime) => updateData({
        wakeUpTime,
        reminderPlan: buildThreeReminderPlan(wakeUpTime, userData.sleepTime, userData.planType),
      })}
    />
    <TimePanel
      theme="night"
      label="Sleep time"
      subtitle="When do you usually go to bed?"
      value={userData.sleepTime || '23:00'}
      onChange={(sleepTime) => updateData({
        sleepTime,
        reminderPlan: buildThreeReminderPlan(userData.wakeUpTime, sleepTime, userData.planType),
      })}
    />

    <View style={styles.smartPanel}>
      <Image source={require('../assets/info1.png')} style={styles.smartMascot} />
      <View style={styles.flex}>
        <Text style={styles.smartTitle}>Smart hydration, personalized for you</Text>
        <Text style={styles.smartText}>We'll plan your reminders around your wake and sleep time for maximum results.</Text>
      </View>
    </View>
  </>
);

const ReminderPlanStep = ({
  userData,
  updateData,
}: {
  userData: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}) => {
  const selectedPlan = userData.planType || 'smart';
  const customGoal = String(userData.dailyGoal || 2000);

  const selectPlan = (plan: HydrationPlan) => {
    const reminderPlan = plan.key === 'custom'
      ? userData.reminderPlan || buildDefaultCustomReminderPlan(userData.wakeUpTime, userData.sleepTime)
      : buildThreeReminderPlan(userData.wakeUpTime, userData.sleepTime, plan.key);
    updateData({
      planType: plan.key,
      dailyGoal: plan.goalMl || userData.dailyGoal || 2000,
      dailyGoalUnit: 'mL',
      reminderPlan,
    });
  };

  const updateCustomGoal = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 4);
    const goal = Number(cleaned);
    updateData({
      planType: 'custom',
      dailyGoal: goal || undefined,
      dailyGoalUnit: 'mL',
      reminderPlan: userData.reminderPlan || buildDefaultCustomReminderPlan(userData.wakeUpTime, userData.sleepTime),
    });
  };

  const updateCustomReminder = (index: number, time: string) => {
    const currentPlan = userData.reminderPlan?.length === 3
      ? userData.reminderPlan
      : buildDefaultCustomReminderPlan(userData.wakeUpTime, userData.sleepTime);
    const reminderPlan = currentPlan.map((reminder, reminderIndex) => (
      reminderIndex === index ? { ...reminder, time, label: 'Custom' } : reminder
    ));

    updateData({
      planType: 'custom',
      dailyGoal: userData.dailyGoal || 2000,
      dailyGoalUnit: 'mL',
      reminderPlan,
    });
  };

  return (
    <>
      <View style={styles.splitHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Set up your{'\n'}<Text style={styles.scheduleAccent}>reminder plan</Text></Text>
          <Text style={styles.heroSubtitle}>
            We'll remind you to stay hydrated at the best times of your day.
          </Text>
        </View>
        <View style={styles.scheduleHeroArt}>
          <Image source={require('../assets/reminder.png')} style={styles.heroAssetImage} />
        </View>
      </View>

      {hydrationPlans.map((plan) => {
        const selected = selectedPlan === plan.key;
        const reminders = buildThreeReminderPlan(userData.wakeUpTime, userData.sleepTime, plan.key);
        const planBorderStyle = { borderColor: selected ? plan.accent : `${plan.accent}99` };
        const planIconStyle = { backgroundColor: `${plan.accent}22` };
        const planBadgeStyle = { backgroundColor: `${plan.accent}33` };
        const planAccentTextStyle = { color: plan.accent };
        const planRadioSelectedStyle = { backgroundColor: plan.accent, borderColor: plan.accent };

        return (
          <TouchableOpacity
            key={plan.key}
            activeOpacity={0.88}
            onPress={() => selectPlan(plan)}
            style={[
              styles.planCard,
              planBorderStyle,
              selected && styles.planCardSelected,
            ]}
          >
            <View style={styles.planTopRow}>
              <View style={[styles.planIconCircle, planIconStyle]}>
                <Image source={plan.image} style={styles.planCardImage} resizeMode="contain" />
              </View>
              <View style={styles.flex}>
                <View style={[styles.planBadge, planBadgeStyle]}>
                  <Text style={[styles.planBadgeText, planAccentTextStyle]}>{plan.badge}</Text>
                </View>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>
              <View style={styles.planGoalBox}>
                <Text style={styles.planGoalLabel}>Recommended Water</Text>
                {plan.key === 'custom' && selected ? (
                  <View style={styles.customGoalRow}>
                    <TextInput
                      value={customGoal}
                      onChangeText={updateCustomGoal}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="2000"
                      placeholderTextColor="#5573af"
                      selectionColor={plan.accent}
                      style={[styles.customGoalInput, planAccentTextStyle]}
                    />
                    <Text style={[styles.customGoalUnit, planAccentTextStyle]}>ml</Text>
                  </View>
                ) : (
                  <Text style={[styles.planGoalValue, planAccentTextStyle]}>
                    {plan.key === 'custom' && userData.dailyGoal ? `${userData.dailyGoal} ml` : plan.goalLabel}
                  </Text>
                )}
                <Text style={styles.planGoalUnit}>per day</Text>
              </View>
              <View style={[styles.planRadio, selected && planRadioSelectedStyle]}>
                {selected ? <Feather name="check" size={20} color="#fff" /> : null}
              </View>
            </View>

            <View style={styles.planReminderDivider}>
              <Text style={[styles.planReminderDividerText, planAccentTextStyle]}>3 REMINDERS PER DAY</Text>
            </View>

            <View style={styles.planReminderRow}>
              {plan.key === 'custom'
                ? (selected
                  ? (userData.reminderPlan || buildDefaultCustomReminderPlan(userData.wakeUpTime, userData.sleepTime)).map((reminder, index) => (
                    <View key={reminder.id} style={styles.customReminderEditor}>
                      <Text style={styles.customReminderLabel}>{index === 0 ? 'Morning' : index === 1 ? 'Afternoon' : 'Evening'}</Text>
                      <MiniTimePicker
                        value={reminder.time}
                        accent={plan.accent}
                        onChange={(time) => updateCustomReminder(index, time)}
                      />
                    </View>
                  ))
                  : [0, 1, 2].map((index) => (
                    <View key={index} style={styles.planReminderItem}>
                      <View style={[styles.addTimeCircle, planBorderStyle]}>
                        <Feather name="plus" size={22} color={plan.accent} />
                      </View>
                      <Text style={styles.planReminderTime}>Add Time</Text>
                      <Text style={styles.planReminderLabel}>Custom</Text>
                    </View>
                  )))
                : reminders.map((reminder) => (
                  <View key={reminder.id} style={styles.planReminderItem}>
                    <Feather name={reminder.icon as keyof typeof Feather.glyphMap} size={24} color={plan.accent} />
                    <Text style={styles.planReminderTime}>{formatTime12(reminder.time)}</Text>
                    <Text style={styles.planReminderLabel}>{reminder.label}</Text>
                  </View>
                ))}
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.planHint}>You can edit your plan and reminder times anytime from settings.</Text>
    </>
  );
};

const PlanSummaryStep = ({
  userData,
}: {
  userData: OnboardingData;
}) => {
  const selectedPlan = hydrationPlans.find((plan) => plan.key === userData.planType) || hydrationPlans[0];
  const reminders = userData.reminderPlan || buildThreeReminderPlan(userData.wakeUpTime, userData.sleepTime, userData.planType);
  const selectedPlanRingStyle = { borderColor: selectedPlan.accent };
  const selectedPlanTextStyle = { color: selectedPlan.accent };

  return (
    <>
      <View style={styles.splitHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>You're all set!</Text>
          <Text style={styles.heroSubtitle}>
            Your hydration plan is ready. Let's build a healthier you, one sip at a time.
          </Text>
        </View>
        <View style={styles.scheduleHeroArt}>
          <Image source={require('../assets/hydrationplan.png')} style={styles.heroAssetImage} />
        </View>
      </View>

      <View style={styles.summaryPanel}>
        <View style={styles.summaryHeader}>
          <View style={styles.numberIcon}>
            <Feather name="clipboard" size={25} color={BLUE} />
          </View>
          <Text style={styles.summaryHeaderTitle}>Your Plan Summary</Text>
        </View>
        <View style={styles.summaryColumns}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryColumnLabel}>Plan Type</Text>
            <Text style={[styles.summaryPlanName, selectedPlanTextStyle]}>{selectedPlan.title}</Text>
            <Text style={styles.summaryGoalText}>{userData.dailyGoal || selectedPlan.goalMl || 2000} ml</Text>
            <Text style={styles.summarySmallText}>recommended water per day</Text>
            <View style={styles.summaryReminderPill}>
              <Feather name="bell" size={15} color={BLUE} />
              <Text style={styles.summaryReminderPillText}>3 reminders / day</Text>
            </View>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryColumnLabel}>Daily Goal</Text>
            <View style={[styles.goalRing, selectedPlanRingStyle]}>
              <Image source={selectedPlan.image} style={styles.goalRingDrop} />
            </View>
            <Text style={styles.summaryGoalBig}>{userData.dailyGoal || selectedPlan.goalMl || 2000} ml</Text>
            <Text style={styles.summarySmallText}>Stay consistent and achieve your goal!</Text>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryColumnLabel}>Reminders</Text>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.summaryReminderLine}>
                <Feather name={reminder.icon as keyof typeof Feather.glyphMap} size={24} color={selectedPlan.accent} />
                <View>
                  <Text style={styles.summaryReminderTime}>{formatTime12(reminder.time)}</Text>
                  <Text style={styles.summaryReminderLabel}>{reminder.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.nextTitle}>What happens next?</Text>
      <View style={styles.nextPanel}>
        <NextItem image={require('../assets/whatnext_1.png')} title="Smart Reminders" text="We'll remind you at the right time to help you stay on track." color={BLUE} />
        <NextItem image={require('../assets/whatnext_2.png')} title="Track & Improve" text="Monitor your progress and build better hydration habits." color="#b65cff" />
        <NextItem image={require('../assets/whatnext_3.png')} title="Achievements" text="Complete goals, earn badges and stay motivated every day." color="#42d37d" />
      </View>

      <View style={styles.proTipPanel}>
        <View style={styles.proTipIcon}>
          <Image source={require('../assets/protip2.png')} style={styles.smartBottle1} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.proTipTitle}>Pro Tip</Text>
          <Text style={styles.proTipText}>Keep a water bottle with you and sip regularly throughout the day.</Text>
        </View>
        <Image source={require('../assets/protip1.png')} style={styles.smartBottle} />
      </View>
    </>
  );
};

const TallChoiceCard = ({
  item,
  selected,
  onPress,
  compact,
  selectedTall,
  hideEmptyCheck,
}: {
  item: OptionCard;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  selectedTall?: boolean;
  hideEmptyCheck?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={[
      styles.tallCard,
      compact && styles.tallCardCompact,
      selectedTall && styles.genderTallCard,
      selected && styles.cardSelected,
      selectedTall && selected && styles.genderTallCardSelected,
    ]}
  >
    {selected || !hideEmptyCheck ? (
      <View style={[styles.checkBadge, selected && styles.checkBadgeSelected]}>
        {selected ? <Feather name="check" size={18} color="#fff" /> : null}
      </View>
    ) : null}
    {item.image ? (
      <Image
        source={item.image}
        style={[
          styles.choiceImage,
          compact && styles.choiceImageCompact,
          selectedTall && styles.genderChoiceImage,
          selectedTall && selected && styles.genderChoiceImageSelected,
        ]}
      />
    ) : (
      <View
        style={[
          styles.choiceIcon,
          selectedTall && styles.genderChoiceIcon,
          selectedTall && selected && styles.genderChoiceIconSelected,
        ]}
      >
        {item.icon}
      </View>
    )}
    <Text style={styles.choiceTitle}>{item.title}</Text>
    {item.subtitle ? <Text style={styles.choiceSubtitle}>{item.subtitle}</Text> : null}
  </TouchableOpacity>
);

const NumberCard = ({
  icon,
  label,
  value,
  unit,
  values,
  onSelect,
  helper,
  decimals,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  values: number[];
  onSelect: (value: number) => void;
  helper: string;
  decimals?: boolean;
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const itemWidth = Math.min(96, width * 0.22);
  const sidePadding = Math.max(0, (width - width * 0.11 - 32 - itemWidth) / 2);
  const selectedIndex = Math.max(0, values.findIndex((item) => item === value));
  const rulerPaddingStyle = useMemo(
    () => ({ paddingHorizontal: sidePadding }),
    [sidePadding],
  );
  const rulerItemSizeStyle = useMemo(
    () => ({ width: itemWidth }),
    [itemWidth],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: selectedIndex * itemWidth,
      animated: false,
    });
  }, [itemWidth, selectedIndex]);

  const selectByOffset = (offsetX: number) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(offsetX / itemWidth)));
    onSelect(values[index]);
  };

  return (
    <View style={styles.numberCard}>
      <View style={styles.numberHeader}>
        <View style={styles.numberTitleGroup}>
          <View style={styles.numberIcon}>{icon}</View>
          <Text style={styles.numberLabel}>{label}</Text>
        </View>
        <Text style={styles.numberValue}>
          {decimals ? value.toFixed(1) : value}
        </Text>
        <View style={styles.unitPill}>
          <Text style={styles.unitPillText}>{unit}</Text>
        </View>
      </View>

      <View style={styles.rulerFrame}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentContainerStyle={[styles.rulerContent, rulerPaddingStyle]}
          onMomentumScrollEnd={(event) => selectByOffset(event.nativeEvent.contentOffset.x)}
          onScrollEndDrag={(event) => selectByOffset(event.nativeEvent.contentOffset.x)}
        >
          {values.map((item) => {
            const selected = item === value;
            return (
              <TouchableOpacity
                key={`${label}-${item}`}
                activeOpacity={0.82}
                onPress={() => onSelect(item)}
                style={[
                  styles.rulerItem,
                  rulerItemSizeStyle,
                  selected && styles.rulerItemSelected,
                ]}
              >
                <Text style={[styles.rulerText, selected && styles.rulerTextSelected]}>
                  {decimals ? item.toFixed(1) : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <Text style={styles.helperText}>{helper}</Text>
    </View>
  );
};

const SelectPanel = ({
  icon,
  label,
  value,
  valueIcon,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueIcon?: React.ReactNode;
  onPress: () => void;
}) => (
  <View style={styles.selectPanel}>
    <View style={styles.selectLabelRow}>
      {icon}
      <Text style={styles.selectLabel}>{label}</Text>
    </View>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.selectValueRow}>
      {valueIcon ? <View style={styles.selectValueIcon}>{valueIcon}</View> : null}
      <Text style={styles.selectValue}>{value}</Text>
      <Feather name="chevron-down" size={26} color="#fff" />
    </TouchableOpacity>
  </View>
);

const CityBadge = () => (
  <View style={styles.cityBadge}>
    <MaterialCommunityIcons name="office-building" size={31} color="#7d95ff" />
  </View>
);

const TimePanel = ({
  label,
  subtitle,
  value,
  onChange,
  theme,
}: {
  label: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
  theme: 'morning' | 'night';
}) => {
  const [hourText, minuteText] = value.split(':');
  const hour24 = Number(hourText);
  const minute = Number(minuteText);
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  const accent = theme === 'morning' ? '#ffd66b' : '#bd77ff';
  const selectedPeriod = isPm ? 'PM' : 'AM';
  const timeSelectedBandStyle = useMemo(
    () => ({ borderColor: `${accent}44` }),
    [accent],
  );
  const pillBorderStyle = useMemo(
    () => ({ borderColor: `${accent}66` }),
    [accent],
  );
  const accentTextStyle = useMemo(
    () => ({ color: accent }),
    [accent],
  );

  const updateTime = (nextHour12 = hour12, nextMinute = minute, nextPeriod = selectedPeriod) => {
    let nextHour24 = nextHour12 % 12;

    if (nextPeriod === 'PM') {
      nextHour24 += 12;
    }

    onChange(`${String(nextHour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
  };

  return (
    <View style={styles.timePanel}>
      <View style={styles.timeHeader}>
        <View style={[styles.roundIcon, theme === 'morning' ? styles.morningIcon : styles.nightIcon]}>
          <Feather name={theme === 'morning' ? 'sunrise' : 'moon'} size={20} color={accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.numberLabel}>{label}</Text>
          <Text style={styles.choiceSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.pill, pillBorderStyle]}>
          <Feather name={theme === 'morning' ? 'sun' : 'moon'} size={17} color={accent} />
          <Text style={[styles.pillText, { color: accent }]}>{theme === 'morning' ? 'Morning' : 'Night'}</Text>
        </View>
      </View>
      <View style={styles.timeWheel}>
        <View style={[styles.timeSelectedBand, timeSelectedBandStyle]} />
        <TimeWheelColumn
          values={TIME_HOURS}
          selectedValue={hour12}
          accentTextStyle={accentTextStyle}
          formatValue={(item) => String(item).padStart(2, '0')}
          onSelect={(nextHour) => updateTime(nextHour, minute, selectedPeriod)}
        />
        <View style={styles.timeColonColumn}>
          <Text style={[styles.timeNumber, accentTextStyle]}>:</Text>
        </View>
        <TimeWheelColumn
          values={TIME_MINUTES}
          selectedValue={minute}
          accentTextStyle={accentTextStyle}
          formatValue={(item) => String(item).padStart(2, '0')}
          onSelect={(nextMinute) => updateTime(hour12, nextMinute, selectedPeriod)}
        />
        <TimeWheelColumn
          values={TIME_PERIODS}
          selectedValue={selectedPeriod}
          accentTextStyle={accentTextStyle}
          onSelect={(nextPeriod) => updateTime(hour12, minute, nextPeriod)}
        />
      </View>
    </View>
  );
};

const TimeWheelColumn = <T extends string | number>({
  values,
  selectedValue,
  accentTextStyle,
  onSelect,
  formatValue = (item: T) => String(item),
}: {
  values: T[];
  selectedValue: T;
  accentTextStyle: { color: string };
  onSelect: (value: T) => void;
  formatValue?: (value: T) => string;
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, values.findIndex((item) => item === selectedValue));

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * TIME_ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const selectByOffset = (offsetY: number) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(offsetY / TIME_ITEM_HEIGHT)));
    onSelect(values[index]);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.timeColumn}
      contentContainerStyle={styles.timeColumnContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={TIME_ITEM_HEIGHT}
      decelerationRate="fast"
      onMomentumScrollEnd={(event) => selectByOffset(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(event) => selectByOffset(event.nativeEvent.contentOffset.y)}
    >
      {values.map((item) => {
        const selected = item === selectedValue;

        return (
          <TouchableOpacity
            key={String(item)}
            activeOpacity={0.82}
            onPress={() => onSelect(item)}
            style={styles.timeColumnItem}
          >
            <Text style={[styles.timeFaded, selected && styles.timeNumber, selected && accentTextStyle]}>
              {formatValue(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const MiniTimePicker = ({
  value,
  accent,
  onChange,
}: {
  value: string;
  accent: string;
  onChange: (value: string) => void;
}) => {
  const [hourText, minuteText] = value.split(':');
  const hour24 = Number(hourText);
  const minute = Number(minuteText);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const accentTextStyle = useMemo(() => ({ color: accent }), [accent]);

  const updateTime = (nextHour12 = hour12, nextMinute = minute, nextPeriod = period) => {
    let nextHour24 = nextHour12 % 12;
    if (nextPeriod === 'PM') {
      nextHour24 += 12;
    }
    onChange(`${String(nextHour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
  };

  return (
    <View style={styles.miniTimePicker}>
      <View style={styles.miniTimeBand} />
      <MiniTimeColumn
        values={TIME_HOURS}
        selectedValue={hour12}
        accentTextStyle={accentTextStyle}
        formatValue={(item) => String(item).padStart(2, '0')}
        onSelect={(nextHour) => updateTime(nextHour, minute, period)}
      />
      <Text style={[styles.miniTimeColon, accentTextStyle]}>:</Text>
      <MiniTimeColumn
        values={TIME_MINUTES}
        selectedValue={minute}
        accentTextStyle={accentTextStyle}
        formatValue={(item) => String(item).padStart(2, '0')}
        onSelect={(nextMinute) => updateTime(hour12, nextMinute, period)}
      />
      <MiniTimeColumn
        values={TIME_PERIODS}
        selectedValue={period}
        accentTextStyle={accentTextStyle}
        onSelect={(nextPeriod) => updateTime(hour12, minute, nextPeriod)}
      />
    </View>
  );
};

const MiniTimeColumn = <T extends string | number>({
  values,
  selectedValue,
  accentTextStyle,
  onSelect,
  formatValue = (item: T) => String(item),
}: {
  values: T[];
  selectedValue: T;
  accentTextStyle: { color: string };
  onSelect: (value: T) => void;
  formatValue?: (value: T) => string;
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, values.findIndex((item) => item === selectedValue));

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * 28,
      animated: false,
    });
  }, [selectedIndex]);

  const selectByOffset = (offsetY: number) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(offsetY / 28)));
    onSelect(values[index]);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.miniTimeColumn}
      contentContainerStyle={styles.miniTimeColumnContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={28}
      decelerationRate="fast"
      onMomentumScrollEnd={(event) => selectByOffset(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(event) => selectByOffset(event.nativeEvent.contentOffset.y)}
    >
      {values.map((item) => {
        const selected = item === selectedValue;
        return (
          <TouchableOpacity key={String(item)} style={styles.miniTimeItem} onPress={() => onSelect(item)}>
            <Text style={[styles.miniTimeText, selected && styles.miniTimeTextSelected, selected && accentTextStyle]}>
              {formatValue(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const SectionLabel = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <View style={styles.sectionLabel}>
    <View style={styles.sectionTitleRow}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
  </View>
);

const InfoPanel = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.infoPanel}>
    <View style={styles.infoIcon}>{icon}</View>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const MascotBubble = ({ text }: { text: string }) => (
  <View style={styles.mascotRow}>
    <Image source={require('../assets/info1.png')} style={styles.mascot} />
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  </View>
);

const TipsPanel = () => (
  <View style={styles.tipsPanel}>
    <View style={styles.sectionTitleRow}>
      <Feather name="info" size={24} color={BLUE} />
      <Text style={styles.sectionTitle}>Tips for a great username</Text>
    </View>
    <View style={styles.tipsRow}>
      <Tip icon="shield" label="Keep it unique" />
      <Tip icon="star" label="Use letters and numbers" />
      <Tip icon="smile" label="Make it you" />
    </View>
  </View>
);

const Tip = ({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) => (
  <View style={styles.tip}>
    <Feather name={icon} size={30} color={BLUE} />
    <Text style={styles.tipText}>{label}</Text>
  </View>
);

const NextItem = ({
  image,
  title,
  text,
  color,
}: {
  image: ImageSourcePropType;
  title: string;
  text: string;
  color: string;
}) => {
  const colorStyle = useMemo(() => ({ color }), [color]);
  const iconBgStyle = useMemo(() => ({ backgroundColor: `${color}24` }), [color]);

  return (
    <View style={styles.nextItem}>
      <View style={[styles.nextItemIcon, iconBgStyle]}>
        <Image source={image} style={styles.nextItemImage} resizeMode="contain" />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.nextItemTitle, colorStyle]}>{title}</Text>
        <Text style={styles.nextItemText}>{text}</Text>
      </View>
      <Feather name="chevron-right" size={28} color="#dfe8ff" />
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020918',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingHorizontal: width * 0.07,
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 184, 255, 0.18)',
  },
  backPlaceholder: {
    width: 34,
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  progressSegment: {
    flex: 1,
    minWidth: 18,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(125, 145, 194, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSegmentActive: {
    height: 20,
    borderRadius: 12,
    backgroundColor: BLUE,
  },
  progressNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    minWidth: 46,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: width * 0.055,
    paddingTop: 28,
    paddingBottom: 18,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: Math.min(34, width * 0.065),
    lineHeight: Math.min(43, width * 0.108),
    fontWeight: '900',
    textAlign: 'center',
  },
  titleAccent: {
    color: BLUE,
  },
  subtitle: {
    marginTop: 5,
    maxWidth: width * 0.68,
    color: MUTED,
    textAlign: 'center',
    fontSize: Math.min(18, width * 0.035),
    lineHeight: Math.min(27, width * 0.068),
  },
  genderGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 26,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  tallCard: {
    flex: 1,
    minHeight: height * 0.24,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: BORDER,
    backgroundColor: PANEL,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  tallCardCompact: {
    minHeight: height * 0.2,
  },
  genderTallCard: {
    minHeight: height * 0.235,
  },
  genderTallCardSelected: {
    minHeight: height * 0.285,
    borderWidth: 2.2,
    backgroundColor: 'rgba(8, 40, 104, 0.88)',
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  cardSelected: {
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(119, 140, 190, 0.7)',
    backgroundColor: 'rgba(4, 23, 58, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkBadgeSelected: {
    borderColor: 'rgba(54, 221, 255, 0.9)',
    backgroundColor: '#159eff',
  },
  choiceImage: {
    width: '118%',
    height: height * 0.15,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  choiceImageCompact: {
    height: height * 0.105,
  },
  genderChoiceImage: {
    height: height * 0.142,
    width: '112%',
  },
  genderChoiceImageSelected: {
    height: height * 0.19,
    width: '125%',
  },
  choiceIcon: {
    height: height * 0.14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChoiceIcon: {
    height: height * 0.13,
  },
  genderChoiceIconSelected: {
    height: height * 0.18,
  },
  choiceTitle: {
    color: '#fff',
    fontSize: Math.min(10, width * 0.032),
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceSubtitle: {
    marginTop: 7,
    color: MUTED,
    fontSize: Math.min(12, width * 0.028),
    lineHeight: Math.min(10, width * 0.032),
    textAlign: 'center',
  },
  infoPanel: {
    minHeight: 74,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(36, 105, 215, 0.46)',
    backgroundColor: PANEL_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 18,
    marginBottom: 18,
  },
  infoIcon: {
    width: 54,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: Math.min(17, width * 0.032),
    lineHeight: Math.min(25, width * 0.044),
  },
  infoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  mascot: {
    width: width * 0.28,
    height: width * 0.28,
    resizeMode: 'contain',
  },
  bubble: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.55)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(10, 37, 88, 0.65)',
  },
  bubbleText: {
    color: BLUE,
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '800',
    lineHeight: Math.min(26, width * 0.063),
  },
  numberCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    padding: 16,
    marginBottom: 18,
  },
  numberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    marginBottom: 18,
    position: 'relative',
  },
  numberTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    zIndex: 1,
  },
  numberIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(43, 96, 235, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLabel: {
    color: '#fff',
    fontSize: Math.min(16, width * 0.034),
    fontWeight: '800',
  },
  numberValue: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#fff',
    fontSize: Math.min(30, width * 0.096),
    fontWeight: '900',
    textAlign: 'center',
  },
  numberUnit: {
    color: BLUE,
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '800',
  },
  unitPill: {
    marginLeft: 'auto',
    minWidth: 62,
    minHeight: 34,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.22)',
    backgroundColor: 'rgba(17, 62, 145, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    zIndex: 1,
  },
  unitPillText: {
    color: '#149dff',
    fontSize: Math.min(14, width * 0.031),
    fontWeight: '900',
  },
  rulerFrame: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.18)',
    paddingVertical: 10,
    overflow: 'hidden',
  },
  rulerContent: {
    alignItems: 'center',
  },
  rulerItem: {
    height: 54,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.16)',
  },
  rulerItemSelected: {
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: 'rgba(22, 184, 255, 0.12)',
  },
  rulerText: {
    color: 'rgba(213, 221, 246, 0.58)',
    fontSize: Math.min(22, width * 0.053),
    fontWeight: '700',
  },
  rulerTextSelected: {
    color: BLUE,
    fontSize: Math.min(30, width * 0.073),
    fontWeight: '900',
  },
  helperText: {
    marginTop: 14,
    color: MUTED,
    fontSize: Math.min(12, width * 0.028),
    textAlign: 'center',
  },
  sectionLabel: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: Math.min(20, width * 0.048),
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 7,
    marginLeft: 34,
    color: MUTED,
    fontSize: Math.min(15, width * 0.038),
  },
  avatarWrap: {
    minHeight: height * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  avatarRing: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: width * 0.24,
    borderWidth: 2,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'rgba(22, 184, 255, 0.12)',
  },
  avatarImage: {
    width: width * 0.44,
    height: width * 0.44,
    resizeMode: 'contain',
  },
  avatarPicker: {
    marginTop: -4,
    marginBottom: 18,
  },
  avatarPickerContent: {
    gap: 12,
    paddingRight: 4,
  },
  avatarOption: {
    width: 76,
    height: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderWidth: 2,
    borderColor: BLUE,
    backgroundColor: 'rgba(8, 40, 104, 0.88)',
    shadowColor: BLUE,
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarOptionImage: {
    width: 74,
    height: 74,
    resizeMode: 'contain',
  },
  avatarOptionCheck: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#159eff',
    borderWidth: 1,
    borderColor: 'rgba(54, 221, 255, 0.9)',
  },
  speechBubble: {
    position: 'absolute',
    right: 0,
    top: height * 0.05,
    maxWidth: width * 0.34,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.52)',
    padding: 14,
    backgroundColor: PANEL,
  },
  speechTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  speechText: {
    marginTop: 5,
    color: MUTED,
    fontSize: 15,
    lineHeight: 21,
  },
  cyanText: {
    color: BLUE,
    fontWeight: '900',
  },
  inputLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  inputCard: {
    minHeight: 70,
    borderRadius: 13,
    borderWidth: 1.3,
    borderColor: BLUE,
    backgroundColor: PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 14,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 14,
  },
  successText: {
    color: '#16d66f',
    fontSize: 15,
    marginVertical: 13,
  },
  miniAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  tipsPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    padding: 18,
  },
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  tip: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    color: MUTED,
    fontSize: Math.min(10, width * 0.033),
    textAlign: 'center',
  },
  locationHero: {
    minHeight: height * 0.19,
    justifyContent: 'center',
    marginBottom: 10,
  },
  splitHero: {
    minHeight: height * 0.19,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: Math.min(28, width * 0.083),
    lineHeight: Math.min(32, width * 0.106),
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 13,
    color: MUTED,
    fontSize: Math.min(13, width * 0.043),
    lineHeight: Math.min(20, width * 0.064),
  },
  scheduleAccent: {
    color: '#29baff',
  },
  locationHeroArt: {
    width: width * 0.34,
    height: width * 0.34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAssetImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  locationPin: {
    position: 'absolute',
    right: 5,
    top: 3,
  },
  scheduleHeroArt: {
    width: width * 0.38,
    height: width * 0.32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleSun: {
    position: 'absolute',
    left: 2,
    bottom: 16,
  },
  scheduleMoon: {
    position: 'absolute',
    right: 4,
    bottom: 16,
  },
  heroIcon: {
    position: 'absolute',
    right: 18,
    top: 8,
    opacity: 0.85,
  },
  selectPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    padding: 16,
    marginBottom: 16,
  },
  selectLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  selectLabel: {
    color: MUTED,
    fontSize: 17,
    fontWeight: '700',
  },
  selectValueRow: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 14,
  },
  selectValueIcon: {
    width: 48,
    alignItems: 'center',
  },
  selectValue: {
    flex: 1,
    color: '#fff',
    fontSize: Math.min(15, width * 0.048),
    fontWeight: '900',
  },
  cityModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  cityModal: {
    maxHeight: height * 0.68,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.42)',
    backgroundColor: '#061637',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Math.max(22, height * 0.03),
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cityModalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  cityModalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 184, 255, 0.16)',
  },
  citySearchBox: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.32)',
    backgroundColor: 'rgba(4, 17, 45, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  citySearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 10,
  },
  cityOption: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderColor: 'rgba(94, 125, 190, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityOptionText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingRight: 12,
  },
  cityEmptyText: {
    color: MUTED,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 28,
  },
  cityBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 99, 226, 0.2)',
  },
  weatherCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  weatherImage: {
    width: 78,
    height: 78,
    resizeMode: 'contain',
  },
  weatherLabel: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.038),
  },
  weatherTemp: {
    color: '#fff',
    fontSize: Math.min(22, width * 0.06),

  },
  hotText: {
    color: '#ff9b35',
  },
  weatherText: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.036),
  },
  tempIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 111, 163, 0.12)',
  },
  goalPanel: {
    minHeight: 106,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: BLUE,
    backgroundColor: PANEL_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  goalDrop: {
    width: 92,
    height: 72,
    resizeMode: 'contain',
  },
  goalCopy: {
    flex: 1,
    color: '#fff',
    fontSize: Math.min(16, width * 0.038),
    lineHeight: Math.min(24, width * 0.058),
  },
  goalDivider: {
    width: 1,
    height: 68,
    backgroundColor: 'rgba(22, 184, 255, 0.28)',
  },
  goalText: {
    color: BLUE,
    fontSize: Math.min(40, width * 0.094),
    fontWeight: '900',
    textAlign: 'center',
  },
  goalUnit: {
    color: MUTED,
    fontSize: Math.min(16, width * 0.038),
    fontWeight: '600',
  },
  whyPanel: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    marginBottom: 18,
  },
  whyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 194, 71, 0.12)',
  },
  whyTitle: {
    color: BLUE,
    fontSize: Math.min(13, width * 0.04),
    fontWeight: '900',
    marginBottom: 5,
  },
  whyText: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.035),
    lineHeight: Math.min(18, width * 0.053),
  },
  cityArt: {
    width: 96,
    height: 62,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timePanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    padding: 16,
    marginBottom: 18,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 17,
  },
  roundIcon: {
    width: 46,
    height: 46,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 184, 255, 0.14)',
  },
  morningIcon: {
    backgroundColor: 'rgba(255, 187, 54, 0.16)',
  },
  nightIcon: {
    backgroundColor: 'rgba(151, 83, 255, 0.18)',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  timePicker: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  timeWheel: {
    height: TIME_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    overflow: 'hidden',
  },
  timeSelectedBand: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: TIME_WHEEL_PADDING,
    height: TIME_ITEM_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  timeColumn: {
    width: width * 0.18,
    height: TIME_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
  },
  timeColumnContent: {
    paddingVertical: TIME_WHEEL_PADDING,
    alignItems: 'center',
  },
  timeColumnItem: {
    height: TIME_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeColonColumn: {
    width: 24,
    height: TIME_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timeFaded: {
    color: 'rgba(199, 210, 238, 0.36)',
    fontSize: Math.min(20, width * 0.048),
    fontWeight: '800',
    lineHeight: TIME_ITEM_HEIGHT,
    textAlign: 'center',
  },
  timeNumber: {
    fontSize: Math.min(30, width * 0.071),
    fontWeight: '900',
    lineHeight: TIME_ITEM_HEIGHT,
  },
  windowPanel: {
    borderRadius: 18,
    borderWidth: 1.3,
    borderColor: BLUE,
    backgroundColor: PANEL_SOFT,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  windowClock: {
    width: 108,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowSun: {
    position: 'absolute',
    left: 0,
    bottom: 12,
  },
  windowMoon: {
    position: 'absolute',
    right: 2,
    bottom: 12,
  },
  windowTitle: {
    color: '#fff',
    fontSize: Math.min(18, width * 0.042),
    fontWeight: '900',
  },
  windowTime: {
    color: BLUE,
    fontSize: Math.min(34, width * 0.08),
    fontWeight: '900',
    marginTop: 4,
  },
  windowText: {
    color: MUTED,
    fontSize: Math.min(15, width * 0.036),
    lineHeight: Math.min(22, width * 0.053),
  },
  smartPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 18,
  },
  smartMascot: {
    width: 74,
    height: 74,
    resizeMode: 'contain',
  },
  smartTitle: {
    color: BLUE,
    fontSize: Math.min(14, width * 0.038),
    fontWeight: '900',
    marginBottom: 3,
  },
  smartText: {
    color: MUTED,
    fontSize: Math.min(10, width * 0.034),
    lineHeight: Math.min(15, width * 0.05),
  },
  smartBottle: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
   smartBottle1: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1.4,
    backgroundColor: PANEL,
    padding: 16,
    marginBottom: 18,
  },
  planCardSelected: {
    shadowColor: BLUE,
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  planIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  planCardImage: {
    width: 74,
    height: 74,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: Math.min(10, width * 0.032),
    fontWeight: '600',
  },
  planTitle: {
    color: '#fff',
    fontSize: Math.min(15, width * 0.052),
    fontWeight: '900',
  },
  planDescription: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.036),
    lineHeight: Math.min(15, width * 0.053),
    marginTop: 5,
  },
  planGoalBox: {
    width: width * 0.28,
    borderLeftWidth: 1,
    borderColor: 'rgba(95, 124, 184, 0.35)',
    paddingLeft: 14,
  },
  planGoalLabel: {
    color: '#fff',
    fontSize: Math.min(9, width * 0.03),
  },
  planGoalValue: {
    fontSize: Math.min(25, width * 0.066),
    fontWeight: '900',
    marginTop: 5,
  },
  planGoalUnit: {
    color: MUTED,
    fontSize: Math.min(13, width * 0.032),
  },
  customGoalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 3,
  },
  customGoalInput: {
    minWidth: 58,
    color: BLUE,
    fontSize: Math.min(24, width * 0.058),
    fontWeight: '900',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 184, 255, 0.55)',
  },
  customGoalUnit: {
    fontSize: Math.min(15, width * 0.036),
    fontWeight: '900',
    marginLeft: 4,
    marginBottom: 2,
  },
  planRadio: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(127, 146, 194, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planReminderDivider: {
    borderTopWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.32)',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
  },
  planReminderDividerText: {
    fontSize: Math.min(10, width * 0.032),
    fontWeight: '900',
  },
  planReminderRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  customReminderEditor: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.25)',
  },
  customReminderLabel: {
    color: MUTED,
    fontSize: Math.min(11, width * 0.028),
    fontWeight: '800',
    marginBottom: 6,
  },
  miniTimePicker: {
    width: '100%',
    height: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(19, 215, 210, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  miniTimeBand: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(19, 215, 210, 0.08)',
  },
  miniTimeColumn: {
    width: 34,
    height: 84,
  },
  miniTimeColumnContent: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  miniTimeItem: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTimeText: {
    color: 'rgba(199, 210, 238, 0.36)',
    fontSize: Math.min(11, width * 0.028),
    fontWeight: '800',
    lineHeight: 28,
  },
  miniTimeTextSelected: {
    fontSize: Math.min(13, width * 0.032),
    fontWeight: '900',
  },
  miniTimeColon: {
    width: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    zIndex: 1,
  },
  planReminderItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.25)',
    paddingHorizontal: 6,
  },
  planReminderTime: {
    color: '#fff',
    fontSize: Math.min(13, width * 0.038),
    fontWeight: '900',
    marginTop: 5,
  },
  planReminderLabel: {
    color: MUTED,
    fontSize: Math.min(10, width * 0.03),
    textAlign: 'center',
    marginTop: 2,
  },
  addTimeCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHint: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.032),
    marginBottom: 18,
  },
  summaryPanel: {
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: BLUE,
    backgroundColor: PANEL,
    padding: 16,
    marginBottom: 22,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryHeaderTitle: {
    flex: 1,
    color: '#fff',
    fontSize: Math.min(18, width * 0.043),
    fontWeight: '900',
  },
  editPlanButton: {
    borderRadius: 18,
    backgroundColor: 'rgba(22, 184, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  editPlanText: {
    color: BLUE,
    fontSize: Math.min(13, width * 0.032),
    fontWeight: '900',
  },
  summaryColumns: {
    flexDirection: 'row',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.32)',
    paddingHorizontal: 7,
  },
  summaryColumnLabel: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.03),
    marginBottom: 10,
  },
  summaryPlanName: {
    color: BLUE,
    fontSize: Math.min(16, width * 0.039),
    fontWeight: '900',
    textAlign: 'center',
  },
  summaryGoalText: {
    color: '#fff',
    fontSize: Math.min(18, width * 0.043),
    fontWeight: '900',
    marginTop: 12,
  },
  summarySmallText: {
    color: MUTED,
    fontSize: Math.min(11, width * 0.028),
    lineHeight: Math.min(16, width * 0.04),
    textAlign: 'center',
    marginTop: 4,
  },
  summaryReminderPill: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(22, 184, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  summaryReminderPillText: {
    color: BLUE,
    fontSize: Math.min(9, width * 0.028),
    fontWeight: '900',
  },
  goalRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 9,
    borderColor: '#0875ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRingDrop: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  summaryGoalBig: {
    color: '#fff',
    fontSize: Math.min(19, width * 0.046),
    fontWeight: '900',
    marginTop: 10,
  },
  summaryReminderLine: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },
  summaryReminderTime: {
    color: '#fff',
    fontSize: Math.min(13, width * 0.032),
    fontWeight: '900',
  },
  summaryReminderLabel: {
    color: MUTED,
    fontSize: Math.min(10, width * 0.02),
  },
  nextTitle: {
    color: '#fff',
    fontSize: Math.min(20, width * 0.048),
    fontWeight: '900',
    marginBottom: 12,
  },
  nextPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  nextItem: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.25)',
  },
  nextItemIcon: {
    width: 46,
    height: 46,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nextItemImage: {
    width: 46,
    height: 46,
  },
  nextItemTitle: {
    fontSize: Math.min(15, width * 0.04),
    fontWeight: '600',
    marginBottom: 4,
  },
  nextItemText: {
    color: MUTED,
    fontSize: Math.min(12, width * 0.032),
    lineHeight: Math.min(19, width * 0.046),
  },
  proTipPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 211, 125, 0.45)',
    backgroundColor: 'rgba(7, 63, 56, 0.46)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    marginBottom: 18,
  },
  proTipIcon: {
    width: 38,
    height: 38,
    borderRadius: 29,
    backgroundColor: 'rgba(66, 211, 125, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTipTitle: {
    color: '#42d37d',
    fontSize: Math.min(14, width * 0.04),
    fontWeight: '900',
  },
  proTipText: {
    color: MUTED,
    fontSize: Math.min(11, width * 0.034),
    lineHeight: Math.min(21, width * 0.05),
    marginTop: 5,
  },
  compactCard: {
    flex: 1,
    minHeight: 156,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    padding: 18,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(80, 114, 176, 0.26)',
  },
  summaryLabel: {
    color: MUTED,
    fontSize: 15,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  finalHero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 255, 0.48)',
    backgroundColor: PANEL,
    alignItems: 'center',
    padding: 22,
    marginBottom: 18,
  },
  finalDrop: {
    width: width * 0.32,
    height: width * 0.32,
    resizeMode: 'contain',
  },
  finalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  finalText: {
    color: MUTED,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 9,
  },
  flex: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: width * 0.055,
    paddingTop: 10,
    paddingBottom: Math.max(24, height * 0.035),
  },
  continueButton: {
    height: Math.max(60, height * 0.062),
    borderRadius: 28,
    backgroundColor: '#045fff',
    borderWidth: 1.4,
    borderColor: '#25d7ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: BLUE,
    shadowOpacity: 0.85,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  continueDisabled: {
    opacity: 0.48,
  },
  continueText: {
    color: '#fff',
    fontSize: Math.min(20, width * 0.063),
    fontWeight: '700',
  },
  continueArrow: {
    position: 'absolute',
    right: Math.max(28, width * 0.072),
  },
});
