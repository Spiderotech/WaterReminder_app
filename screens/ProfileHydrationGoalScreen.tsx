import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
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
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Reminder, saveReminders } from '../utils/reminderUtils';
import { scheduleRemindersIfGoalNotReached } from '../utils/notificationUtils';
import { getUserProfile, updateUserProfile } from '../utils/userUtils';

const { height } = Dimensions.get('window');

type PlanType = 'smart' | 'performance' | 'custom';

type ReminderPlanItem = {
  id: string;
  time: string;
  label: string;
  icon: string;
};

type StoredHydrationPlan = {
  planType?: PlanType;
  dailyGoal?: number;
  unit?: string;
  reminders?: ReminderPlanItem[];
};

type PlanMeta = {
  title: string;
  badge: string;
  description: string;
  accent: string;
  image: ImageSourcePropType;
  goalMl?: number;
};

const planMeta: Record<PlanType, PlanMeta> = {
  smart: {
    title: 'Smart Plan',
    badge: 'Recommended',
    description: 'Perfect balance for everyday hydration and steady reminders.',
    accent: '#16b8ff',
    image: require('../assets/remindercard1.png'),
    goalMl: 2000,
  },
  performance: {
    title: 'Performance Plan',
    badge: 'High Performance',
    description: 'More support for active days, workouts, and warmer routines.',
    accent: '#b65cff',
    image: require('../assets/remindercard2.png'),
    goalMl: 3000,
  },
  custom: {
    title: 'Custom Plan',
    badge: 'Custom',
    description: 'Your own water goal and reminder rhythm.',
    accent: '#13d7d2',
    image: require('../assets/remindercard3.png'),
  },
};

const planOrder: PlanType[] = ['smart', 'performance', 'custom'];
const TIME_HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const TIME_MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const TIME_PERIODS = ['AM', 'PM'];

const defaultReminders: ReminderPlanItem[] = [
  { id: 'morning', time: '07:30', label: 'Morning Boost', icon: 'sunrise' },
  { id: 'afternoon', time: '14:25', label: 'Focus Time', icon: 'sun' },
  { id: 'evening', time: '20:00', label: 'Evening Recovery', icon: 'moon' },
];

const formatTime12 = (time = '07:30') => {
  const [hourText = '7', minuteText = '30'] = time.split(':');
  const hour = Number(hourText);
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minuteText} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const dateToHHMM = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const timeToDate = (time = '06:30') => {
  const [hours = '6', minutes = '30'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

const parseTimeToMinutes = (time = '06:30') => {
  const [hourText = '6', minuteText = '30'] = time.split(':');
  return Number(hourText) * 60 + Number(minuteText);
};

const minutesToHHMM = (minutes: number) => {
  const normalized = ((Math.round(minutes) % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const buildThreeReminderPlan = (
  wakeTime = '06:30',
  sleepTime = '23:00',
  planType: PlanType = 'smart',
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
    : planType === 'custom'
      ? ['Custom', 'Custom', 'Custom']
      : ['Morning Boost', 'Focus Time', 'Evening Recovery'];

  return [
    { id: 'morning', time: minutesToHHMM(wake + offsets[0]), label: labels[0], icon: 'sunrise' },
    { id: 'afternoon', time: minutesToHHMM(wake + offsets[1]), label: labels[1], icon: 'sun' },
    { id: 'evening', time: minutesToHHMM(wake + offsets[2]), label: labels[2], icon: 'moon' },
  ];
};

const buildDefaultCustomReminderPlan = (wakeTime = '06:30', sleepTime = '23:00') => (
  buildThreeReminderPlan(wakeTime, sleepTime, 'smart').map(reminder => ({
    ...reminder,
    label: 'Custom',
  }))
);

const toReminderRecords = (reminders: ReminderPlanItem[]): Reminder[] => (
  reminders.slice(0, 3).map(reminder => ({
    id: reminder.id,
    time: reminder.time.includes(':') && reminder.time.split(':').length === 2 ? `${reminder.time}:00` : reminder.time,
    enabled: true,
  }))
);

const ProfileHydrationGoalScreen = () => {
  const navigation = useNavigation();
  const [plan, setPlan] = useState<StoredHydrationPlan>({
    planType: 'smart',
    dailyGoal: 2000,
    unit: 'mL',
    reminders: defaultReminders,
  });
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [editingTime, setEditingTime] = useState<'wake' | 'sleep' | null>(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [draftPlanType, setDraftPlanType] = useState<PlanType>('smart');
  const [draftCustomGoal, setDraftCustomGoal] = useState('2000');
  const [draftReminderPlan, setDraftReminderPlan] = useState<ReminderPlanItem[]>(defaultReminders);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const [storedPlan, storedGoal, storedUnit, profile] = await Promise.all([
          AsyncStorage.getItem('selectedHydrationPlan'),
          AsyncStorage.getItem('hydrationGoal'),
          AsyncStorage.getItem('hydrationUnit'),
          getUserProfile(),
        ]);

        const parsedPlan: StoredHydrationPlan = storedPlan ? JSON.parse(storedPlan) : {};
        const parsedGoal = storedGoal ? JSON.parse(storedGoal) : undefined;

        setPlan({
          planType: parsedPlan.planType || 'smart',
          dailyGoal: parsedPlan.dailyGoal || parsedGoal || 2000,
          unit: parsedPlan.unit || storedUnit || 'mL',
          reminders: parsedPlan.reminders?.length ? parsedPlan.reminders : defaultReminders,
        });
        setWakeTime((profile as any)?.wakeUpTime || profile?.wakeTime || '06:30');
        setSleepTime(profile?.sleepTime || '23:00');
      } catch (error) {
        console.error('Failed to load profile hydration plan:', error);
      }
    };

    loadPlan();
  }, []);

  const activeMeta = useMemo(() => planMeta[plan.planType || 'smart'], [plan.planType]);
  const goalLiters = ((plan.dailyGoal || 2000) / 1000).toFixed(1);
  const reminders = plan.reminders?.length ? plan.reminders : defaultReminders;

  const openPlanModal = () => {
    const type = plan.planType || 'smart';
    setDraftPlanType(type);
    setDraftCustomGoal(String(plan.dailyGoal || 2000));
    setDraftReminderPlan(plan.reminders?.length ? plan.reminders : buildThreeReminderPlan(wakeTime, sleepTime, type));
    setPlanModalVisible(true);
  };

  const selectDraftPlan = (nextPlanType: PlanType) => {
    setDraftPlanType(nextPlanType);

    if (nextPlanType === 'custom') {
      setDraftCustomGoal(String(plan.planType === 'custom' ? plan.dailyGoal || 2000 : Number(draftCustomGoal) || plan.dailyGoal || 2000));
      setDraftReminderPlan(
        plan.planType === 'custom' && plan.reminders?.length === 3
          ? plan.reminders
          : buildDefaultCustomReminderPlan(wakeTime, sleepTime),
      );
      return;
    }

    setDraftCustomGoal(String(planMeta[nextPlanType].goalMl || 2000));
    setDraftReminderPlan(buildThreeReminderPlan(wakeTime, sleepTime, nextPlanType));
  };

  const updateDraftCustomGoal = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 4);
    setDraftPlanType('custom');
    setDraftCustomGoal(cleaned);
    setDraftReminderPlan(current => (
      current.length === 3 ? current : buildDefaultCustomReminderPlan(wakeTime, sleepTime)
    ));
  };

  const updateDraftCustomReminder = (index: number, time: string) => {
    setDraftPlanType('custom');
    setDraftReminderPlan(current => {
      const source = current.length === 3 ? current : buildDefaultCustomReminderPlan(wakeTime, sleepTime);
      return source.map((reminder, reminderIndex) => (
        reminderIndex === index ? { ...reminder, time, label: 'Custom' } : reminder
      ));
    });
  };

  const openTimeEditor = (field: 'wake' | 'sleep') => {
    setEditingTime(field);
    setSelectedTime(timeToDate(field === 'wake' ? wakeTime : sleepTime));
  };

  const saveTime = async (date: Date) => {
    if (!editingTime) return;

    const time = dateToHHMM(date);
    const nextWakeTime = editingTime === 'wake' ? time : wakeTime;
    const nextSleepTime = editingTime === 'sleep' ? time : sleepTime;
    const reminderPlan = buildThreeReminderPlan(nextWakeTime, nextSleepTime, plan.planType || 'smart');
    const reminderRecords = toReminderRecords(reminderPlan);
    const nextPlan = { ...plan, reminders: reminderPlan };

    await updateUserProfile({
      ...(editingTime === 'wake' ? { wakeTime: nextWakeTime } : {}),
      ...(editingTime === 'sleep' ? { sleepTime: nextSleepTime } : {}),
    } as any);
    await saveReminders(reminderRecords);
    await AsyncStorage.setItem('selectedHydrationPlan', JSON.stringify(nextPlan));
    await scheduleRemindersIfGoalNotReached();

    setWakeTime(nextWakeTime);
    setSleepTime(nextSleepTime);
    setPlan(nextPlan);
    setEditingTime(null);
  };

  const savePlanSelection = async () => {
    const selectedMeta = planMeta[draftPlanType];
    const customGoal = Number(draftCustomGoal.replace(/[^0-9]/g, ''));
    const dailyGoal = draftPlanType === 'custom'
      ? Math.max(customGoal || plan.dailyGoal || 2000, 500)
      : selectedMeta.goalMl || 2000;
    const reminderPlan = draftReminderPlan.length === 3
      ? draftReminderPlan
      : buildThreeReminderPlan(wakeTime, sleepTime, draftPlanType);
    const reminderRecords = toReminderRecords(reminderPlan);
    const nextPlan: StoredHydrationPlan = {
      planType: draftPlanType,
      dailyGoal,
      unit: 'mL',
      reminders: reminderPlan,
    };

    await AsyncStorage.setItem('selectedHydrationPlan', JSON.stringify(nextPlan));
    await AsyncStorage.setItem('hydrationGoal', JSON.stringify(dailyGoal));
    await AsyncStorage.setItem('hydrationUnit', 'mL');
    await AsyncStorage.setItem('hydrationGoalChoice', draftPlanType);
    await saveReminders(reminderRecords);
    await scheduleRemindersIfGoalNotReached();

    setPlan(nextPlan);
    setPlanModalVisible(false);
  };

  return (
    <LinearGradient colors={['#010713', '#041025', '#020713']} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header onBack={() => navigation.goBack()} onEdit={openPlanModal} />
          <PlanHero plan={plan} meta={activeMeta} goalLiters={goalLiters} />
          <GoalProgress plan={plan} meta={activeMeta} />
          <RoutineWindow
            wakeTime={wakeTime}
            sleepTime={sleepTime}
            accent={activeMeta.accent}
            onEditWake={() => openTimeEditor('wake')}
            onEditSleep={() => openTimeEditor('sleep')}
          />
          <ReminderPlan reminders={reminders} accent={activeMeta.accent} />
          <PlanInsights meta={activeMeta} />
        </ScrollView>
        {editingTime && Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setEditingTime(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalFrame}>
                <GradientFrame colors={['#081b3d', '#13091f']} style={styles.modalSurface} contentStyle={styles.timeModal}>
                  <Text style={styles.modalTitle}>Edit {editingTime === 'wake' ? 'Wake-up Time' : 'Sleep Time'}</Text>
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
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setEditingTime(null)} style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => saveTime(selectedTime)} style={styles.saveButton}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </GradientFrame>
              </View>
            </View>
          </Modal>
        ) : null}
        {editingTime && Platform.OS === 'android' ? (
          <DateTimePicker
            mode="time"
            value={selectedTime}
            onChange={async (event, date) => {
              if (event.type === 'dismissed') {
                setEditingTime(null);
                return;
              }
              if (date) await saveTime(date);
            }}
            display="spinner"
          />
        ) : null}
        <PlanPickerModal
          visible={planModalVisible}
          selectedPlan={draftPlanType}
          customGoal={draftCustomGoal}
          reminderPlan={draftReminderPlan}
          onSelectPlan={selectDraftPlan}
          onChangeCustomGoal={updateDraftCustomGoal}
          onChangeCustomReminder={updateDraftCustomReminder}
          onClose={() => setPlanModalVisible(false)}
          onSave={savePlanSelection}
          wakeTime={wakeTime}
          sleepTime={sleepTime}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ onBack, onEdit }: { onBack: () => void; onEdit: () => void }) => (
  <View style={styles.header}>
    <TouchableOpacity activeOpacity={0.85} onPress={onBack} style={styles.headerButton}>
      <Feather name="arrow-left" size={25} color="#ffffff" />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle}>Hydration Goal</Text>
      <Text style={styles.headerSubtitle}>Your selected daily plan</Text>
    </View>
    <TouchableOpacity activeOpacity={0.85} onPress={onEdit} style={styles.headerButton}>
      <Feather name="edit-2" size={20} color="#ffffff" />
    </TouchableOpacity>
  </View>
);

const PlanHero = ({
  plan,
  meta,
  goalLiters,
}: {
  plan: StoredHydrationPlan;
  meta: PlanMeta;
  goalLiters: string;
}) => (
  <GradientFrame colors={['rgba(8,47,91,0.96)', 'rgba(25,12,67,0.96)']} style={[styles.heroCard, { borderColor: meta.accent }]} contentStyle={styles.heroCardContent}>
    <View style={styles.heroCopy}>
      <View style={[styles.planBadge, { backgroundColor: `${meta.accent}28` }]}>
        <Text style={[styles.planBadgeText, { color: meta.accent }]}>{meta.badge}</Text>
      </View>
      <Text style={styles.planTitle}>{meta.title}</Text>
      <Text style={styles.planDescription}>{meta.description}</Text>
      <View style={styles.goalRow}>
        <Text style={[styles.goalBig, { color: meta.accent }]}>{plan.dailyGoal || 2000}</Text>
        <Text style={styles.goalUnit}>{plan.unit || 'mL'} / day</Text>
      </View>
      <Text style={styles.goalLiters}>{goalLiters} L daily target</Text>
    </View>
    <View style={[styles.planImageRing, { borderColor: meta.accent }]}>
      <Image source={meta.image} style={styles.planImage} resizeMode="contain" />
    </View>
  </GradientFrame>
);

const GoalProgress = ({ plan, meta }: { plan: StoredHydrationPlan; meta: PlanMeta }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.progressCard} contentStyle={styles.progressCardContent}>
    <View style={styles.progressTop}>
      <View>
        <Text style={styles.cardTitle}>Today&apos;s Progress</Text>
        <Text style={styles.cardSubtitle}>Stay consistent and complete all slots.</Text>
      </View>
      <MaterialCommunityIcons name="water-percent" size={34} color={meta.accent} />
    </View>
    <View style={styles.progressTrack}>
      <LinearGradient colors={['#24d8ff', meta.accent]} style={styles.progressFill} />
    </View>
    <View style={styles.progressMeta}>
      <Text style={styles.progressValue}>1,450 {plan.unit || 'mL'}</Text>
      <Text style={styles.progressTotal}>of {plan.dailyGoal || 2000} {plan.unit || 'mL'}</Text>
    </View>
  </GradientFrame>
);

const RoutineWindow = ({
  wakeTime,
  sleepTime,
  accent,
  onEditWake,
  onEditSleep,
}: {
  wakeTime: string;
  sleepTime: string;
  accent: string;
  onEditWake: () => void;
  onEditSleep: () => void;
}) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.routineCard} contentStyle={styles.routineCardContent}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Reminder Window</Text>
      <Text style={[styles.cardAction, { color: accent }]}>3 slot reminders</Text>
    </View>
    <View style={styles.routineRow}>
      <TouchableOpacity activeOpacity={0.86} onPress={onEditWake} style={styles.routinePill}>
        <Feather name="sunrise" size={22} color={accent} />
        <View style={styles.routineCopy}>
          <Text style={styles.routineLabel}>Wake-up</Text>
          <Text style={styles.routineTime}>{formatTime12(wakeTime)}</Text>
        </View>
        <Feather name="edit-2" size={15} color="#8fa1c8" />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.86} onPress={onEditSleep} style={styles.routinePill}>
        <Feather name="moon" size={22} color={accent} />
        <View style={styles.routineCopy}>
          <Text style={styles.routineLabel}>Sleep</Text>
          <Text style={styles.routineTime}>{formatTime12(sleepTime)}</Text>
        </View>
        <Feather name="edit-2" size={15} color="#8fa1c8" />
      </TouchableOpacity>
    </View>
    <Text style={styles.routineHint}>Changing these times updates Morning, Afternoon, and Evening reminders only.</Text>
  </GradientFrame>
);

const ReminderPlan = ({ reminders, accent }: { reminders: ReminderPlanItem[]; accent: string }) => (
  <GradientFrame colors={['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)']} style={styles.reminderCard} contentStyle={styles.reminderCardContent}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Reminder Plan</Text>
      <Text style={[styles.cardAction, { color: accent }]}>3 per day</Text>
    </View>
    <View style={styles.reminderRow}>
      {reminders.map(reminder => (
        <View key={`${reminder.id}-${reminder.time}`} style={styles.reminderItem}>
          <View style={[styles.reminderIcon, { borderColor: accent, backgroundColor: `${accent}20` }]}>
            <Feather name={reminder.icon as keyof typeof Feather.glyphMap} size={22} color={accent} />
          </View>
          <Text style={styles.reminderTime}>{formatTime12(reminder.time)}</Text>
          <Text style={styles.reminderLabel}>{reminder.label}</Text>
        </View>
      ))}
    </View>
  </GradientFrame>
);

const PlanPickerModal = ({
  visible,
  selectedPlan,
  customGoal,
  reminderPlan,
  onSelectPlan,
  onChangeCustomGoal,
  onChangeCustomReminder,
  onClose,
  onSave,
  wakeTime,
  sleepTime,
}: {
  visible: boolean;
  selectedPlan: PlanType;
  customGoal: string;
  reminderPlan: ReminderPlanItem[];
  onSelectPlan: (plan: PlanType) => void;
  onChangeCustomGoal: (value: string) => void;
  onChangeCustomReminder: (index: number, time: string) => void;
  onClose: () => void;
  onSave: () => void;
  wakeTime: string;
  sleepTime: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalFrame, styles.planModalFrame]}>
        <GradientFrame colors={['#071936', '#120822']} style={styles.modalSurface} contentStyle={styles.planModalCard}>
          <View style={styles.planModalHeader}>
            <View style={styles.planModalTitleBlock}>
              <Text style={styles.modalTitle}>Choose Hydration Plan</Text>
              <Text style={styles.planModalSubtitle}>Select a daily goal and 3 reminder slots.</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color="#dce8ff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.planModalScrollView}
            contentContainerStyle={styles.planModalScroll}
          >
          {planOrder.map(planType => {
            const meta = planMeta[planType];
            const selected = selectedPlan === planType;
            const previewGoal = planType === 'custom' ? customGoal || '2000' : String(meta.goalMl || 2000);
            const previewReminders = selected
              ? reminderPlan
              : planType === 'custom'
                ? buildDefaultCustomReminderPlan(wakeTime, sleepTime)
                : buildThreeReminderPlan(wakeTime, sleepTime, planType);

            return (
              <TouchableOpacity
                key={planType}
                activeOpacity={0.88}
                onPress={() => onSelectPlan(planType)}
                style={[styles.planOptionCard, { borderColor: selected ? meta.accent : `${meta.accent}7a` }, selected && styles.planOptionSelected]}
              >
                <View style={styles.planOptionTop}>
                  <View style={[styles.planOptionImageWrap, { backgroundColor: `${meta.accent}22`, borderColor: meta.accent }]}>
                    <Image source={meta.image} style={styles.planOptionImage} resizeMode="contain" />
                  </View>
                  <View style={styles.planOptionCopy}>
                    <View style={[styles.planBadge, { backgroundColor: `${meta.accent}28` }]}>
                      <Text style={[styles.planBadgeText, { color: meta.accent }]}>{meta.badge}</Text>
                    </View>
                    <Text style={styles.planOptionTitle}>{meta.title}</Text>
                    <Text style={styles.planOptionDescription}>{meta.description}</Text>
                  </View>
                  <View style={[styles.planRadio, selected && { backgroundColor: meta.accent, borderColor: meta.accent }]}>
                    {selected ? <Feather name="check" size={16} color="#ffffff" /> : null}
                  </View>
                </View>

                <View style={styles.planOptionGoalRow}>
                  <Text style={styles.planOptionGoalLabel}>Daily Goal</Text>
                  {planType === 'custom' && selected ? (
                    <View style={[styles.customGoalInputWrap, { borderColor: meta.accent }]}>
                      <TextInput
                        value={customGoal}
                        onChangeText={onChangeCustomGoal}
                        keyboardType="numeric"
                        placeholder="2000"
                        placeholderTextColor="#5573af"
                        selectionColor={meta.accent}
                        style={[styles.customGoalInput, { color: meta.accent }]}
                      />
                      <Text style={[styles.customGoalUnit, { color: meta.accent }]}>ml</Text>
                    </View>
                  ) : (
                    <Text style={[styles.planOptionGoalValue, { color: meta.accent }]}>{previewGoal} ml</Text>
                  )}
                </View>

                <View style={styles.planOptionReminderRow}>
                  {planType === 'custom' && selected
                    ? previewReminders.map((reminder, index) => (
                      <View key={`${planType}-${reminder.id}`} style={styles.customReminderEditor}>
                        <Text style={styles.customReminderLabel}>
                          {index === 0 ? 'Morning' : index === 1 ? 'Afternoon' : 'Evening'}
                        </Text>
                        <MiniTimePicker
                          value={reminder.time}
                          accent={meta.accent}
                          onChange={time => onChangeCustomReminder(index, time)}
                        />
                      </View>
                    ))
                    : previewReminders.map(reminder => (
                      <View key={`${planType}-${reminder.id}`} style={styles.planOptionReminder}>
                        <Feather name={reminder.icon as keyof typeof Feather.glyphMap} size={17} color={meta.accent} />
                        <Text style={styles.planOptionReminderTime}>{formatTime12(reminder.time)}</Text>
                        <Text style={styles.planOptionReminderLabel}>{reminder.label}</Text>
                      </View>
                    ))}
                </View>
              </TouchableOpacity>
            );
          })}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={onSave} style={styles.saveButton}>
              <Text style={styles.saveText}>Apply Plan</Text>
            </TouchableOpacity>
          </View>
        </GradientFrame>
      </View>
    </View>
  </Modal>
);

const MiniTimePicker = ({
  value,
  accent,
  onChange,
}: {
  value: string;
  accent: string;
  onChange: (value: string) => void;
}) => {
  const [hourText = '6', minuteText = '30'] = value.split(':');
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
    <View style={[styles.miniTimePicker, { borderColor: `${accent}55` }]}>
      <View style={[styles.miniTimeBand, { backgroundColor: `${accent}16` }]} />
      <MiniTimeColumn
        values={TIME_HOURS}
        selectedValue={hour12}
        accentTextStyle={accentTextStyle}
        formatValue={item => String(item).padStart(2, '0')}
        onSelect={nextHour => updateTime(nextHour, minute, period)}
      />
      <Text style={[styles.miniTimeColon, accentTextStyle]}>:</Text>
      <MiniTimeColumn
        values={TIME_MINUTES}
        selectedValue={minute}
        accentTextStyle={accentTextStyle}
        formatValue={item => String(item).padStart(2, '0')}
        onSelect={nextMinute => updateTime(hour12, nextMinute, period)}
      />
      <MiniTimeColumn
        values={TIME_PERIODS}
        selectedValue={period}
        accentTextStyle={accentTextStyle}
        onSelect={nextPeriod => updateTime(hour12, minute, nextPeriod)}
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
  const selectedIndex = Math.max(0, values.findIndex(item => item === selectedValue));

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * 26,
      animated: false,
    });
  }, [selectedIndex]);

  const selectByOffset = (offsetY: number) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(offsetY / 26)));
    onSelect(values[index]);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.miniTimeColumn}
      contentContainerStyle={styles.miniTimeColumnContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={26}
      decelerationRate="fast"
      onMomentumScrollEnd={event => selectByOffset(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={event => selectByOffset(event.nativeEvent.contentOffset.y)}
    >
      {values.map(item => {
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

const PlanInsights = ({ meta }: { meta: PlanMeta }) => (
  <GradientFrame colors={['rgba(26,13,65,0.96)', 'rgba(4,21,47,0.98)']} style={styles.insightCard} contentStyle={styles.insightCardContent}>
    <View style={styles.insightIcon}>
      <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color={meta.accent} />
    </View>
    <View style={styles.insightCopy}>
      <Text style={styles.insightTitle}>Plan setup from onboarding</Text>
      <Text style={styles.insightText}>This screen shows the hydration plan you selected during setup. Reminder timing can be adjusted from Reminder Settings.</Text>
    </View>
  </GradientFrame>
);

const GradientFrame = ({
  children,
  colors,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.gradientFrame, style]}>
    <LinearGradient colors={colors} style={styles.gradientBackground} />
    <View style={[styles.gradientContent, contentStyle]}>{children}</View>
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
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientContent: {
    zIndex: 1,
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
  heroCard: {
    borderRadius: 20,
    marginBottom: 14,
    minHeight: 194,
  },
  heroCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 194,
    padding: 16,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  planRadio: {
    alignItems: 'center',
    borderColor: '#5270a6',
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  planTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  planDescription: {
    color: '#c4cbe1',
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  goalRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 14,
  },
  goalBig: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  goalUnit: {
    color: '#d8ddec',
    flexShrink: 1,
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 6,
  },
  goalLiters: {
    color: '#aeb8d5',
    fontSize: 11,
    marginTop: 3,
  },
  planImageRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,22,51,0.72)',
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  planImage: {
    height: 76,
    width: 76,
  },
  progressCard: {
    borderColor: '#284e87',
    borderRadius: 20,
    marginBottom: 14,
  },
  progressCardContent: {
    padding: 14,
  },
  progressTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    minWidth: 0,
  },
  cardSubtitle: {
    color: '#aeb8d5',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  progressTrack: {
    backgroundColor: '#12325d',
    borderRadius: 10,
    height: 11,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 10,
    height: 11,
    width: '58%',
  },
  progressMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressValue: {
    color: '#35d9ff',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTotal: {
    color: '#c4cbe1',
    fontSize: 12,
  },
  routineCard: {
    borderColor: '#284e87',
    borderRadius: 20,
    marginBottom: 14,
  },
  routineCardContent: {
    padding: 14,
  },
  routineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routinePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.82)',
    borderColor: '#254e85',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 66,
    paddingHorizontal: 10,
  },
  routineCopy: {
    flex: 1,
    minWidth: 0,
  },
  routineLabel: {
    color: '#aeb8d5',
    fontSize: 10,
    fontWeight: '700',
  },
  routineTime: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  routineHint: {
    color: '#aeb8d5',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  reminderCard: {
    borderColor: '#284e87',
    borderRadius: 20,
    marginBottom: 14,
  },
  reminderCardContent: {
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardAction: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,61,0.82)',
    borderColor: '#254e85',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    minHeight: 118,
    padding: 10,
  },
  reminderIcon: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  reminderTime: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  reminderLabel: {
    color: '#aeb8d5',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  insightCard: {
    borderColor: '#5f35c8',
    borderRadius: 20,
  },
  insightCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(166,108,255,0.14)',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginRight: 12,
    width: 56,
  },
  insightCopy: {
    flex: 1,
  },
  insightTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  insightText: {
    color: '#c5cbe0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalFrame: {
    borderColor: '#315f9f',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  planModalFrame: {
    maxHeight: '88%',
  },
  modalSurface: {
    borderColor: '#315f9f',
    borderRadius: 22,
    maxHeight: '100%',
    width: '100%',
  },
  planModalCard: {
    maxHeight: '100%',
    padding: 16,
  },
  planModalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planModalTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  planModalSubtitle: {
    color: '#aeb8d5',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  planModalScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  planModalScrollView: {
    maxHeight: Math.min(520, height * 0.58),
  },
  planOptionCard: {
    backgroundColor: 'rgba(7,26,61,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  planOptionSelected: {
    backgroundColor: 'rgba(18,60,114,0.72)',
    shadowColor: '#1688ff',
    shadowOpacity: 0.34,
    shadowRadius: 12,
  },
  planOptionTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  planOptionImageWrap: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    marginRight: 11,
    width: 54,
  },
  planOptionImage: {
    height: 40,
    width: 40,
  },
  planOptionCopy: {
    flex: 1,
    minWidth: 0,
  },
  planOptionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 5,
  },
  planOptionDescription: {
    color: '#aeb8d5',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  planOptionGoalRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(82,112,166,0.28)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  planOptionGoalLabel: {
    color: '#c5cbe0',
    fontSize: 12,
    fontWeight: '800',
  },
  planOptionGoalValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  customGoalInputWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,12,31,0.62)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    height: 38,
    paddingHorizontal: 10,
  },
  customGoalInput: {
    fontSize: 16,
    fontWeight: '900',
    minWidth: 58,
    padding: 0,
    textAlign: 'right',
  },
  customGoalUnit: {
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  planOptionReminderRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  planOptionReminder: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,12,31,0.48)',
    borderColor: '#254e85',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    paddingVertical: 7,
  },
  planOptionReminderTime: {
    color: '#dce8ff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  planOptionReminderLabel: {
    color: '#8fa1c8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  customReminderEditor: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  customReminderLabel: {
    color: '#aeb8d5',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  miniTimePicker: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,12,31,0.48)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 78,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  miniTimeBand: {
    borderRadius: 8,
    height: 26,
    left: 5,
    position: 'absolute',
    right: 5,
    top: 26,
  },
  miniTimeColumn: {
    height: 78,
    width: 30,
  },
  miniTimeColumnContent: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  miniTimeItem: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
  },
  miniTimeText: {
    color: 'rgba(199,210,238,0.36)',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 26,
  },
  miniTimeTextSelected: {
    fontSize: 12,
    fontWeight: '900',
  },
  miniTimeColon: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    width: 8,
    zIndex: 1,
  },
  timeModal: {
    padding: 18,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#315f9f',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  cancelText: {
    color: '#d9e7ff',
    fontSize: 14,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#128eff',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default ProfileHydrationGoalScreen;
