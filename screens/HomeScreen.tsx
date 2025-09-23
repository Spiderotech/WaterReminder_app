import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
  Image,
  BackHandler,
  Alert,

} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Defs, ClipPath, Path, Rect } from 'react-native-svg';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logWaterIntake, getTodayLogs, deleteWaterLog } from '../utils/waterIntakeUtils';
import { getHydrationGoal } from '../utils/userUtils';
import LottieView from 'lottie-react-native';


const { width, height } = Dimensions.get('window');

const isSmallDevice = width < 350 || height < 650;

const padding = Math.max(16, width * 0.05);
const progressCardMarginV = Math.max(30, height * 0.04);
const progressCardPadding = Math.max(10, width * 0.03);
const progressCardRadius = Math.max(16, width * 0.045);
const intakeValueFontSize = Math.max(32, width * 0.09);
const goalTextFontSize = Math.max(14, width * 0.04);
const drinkBtnPaddingV = Math.max(12, height * 0.018);
const drinkBtnPaddingH = Math.max(30, width * 0.09);
const drinkBtnRadius = Math.max(30, width * 0.09);
const drinkBtnFontSize = Math.max(16, width * 0.045);
const cupIconPadding = Math.max(8, width * 0.025);
const cupIconRadius = Math.max(50, width * 0.15);
const historySectionPadding = Math.max(20, width * 0.06);
const historySectionRadius = Math.max(16, width * 0.045);
const historyHeaderPaddingT = Math.max(10, height * 0.015);
const historyHeaderPaddingB = Math.max(15, height * 0.022);
const historyTitleFontSize = Math.max(18, width * 0.05);
const seeAllTextFontSize = Math.max(14, width * 0.04);
const historyItemPaddingV = Math.max(12, height * 0.018);
const historyLabelFontSize = Math.max(16, width * 0.045);
const historyTimeFontSize = Math.max(12, width * 0.035);
const historyAmountFontSize = Math.max(16, width * 0.045);
const noHistoryMarginT = Math.max(20, height * 0.03);
const modalContentPadding = Math.max(20, width * 0.06);
const modalTitleFontSize = Math.max(18, width * 0.055);
const cupOptionPaddingV = Math.max(15, height * 0.022);
const cupTextFontSize = Math.max(14, width * 0.04);
const deleteIconSize = Math.max(20, width * 0.06);
const inputPaddingH = Math.max(20, width * 0.06);
const inputPaddingV = Math.max(8, height * 0.012);
const inputRadius = Math.max(8, width * 0.025);
const modalCloseMarginT = Math.max(20, height * 0.03);
const circularProgressSize = isSmallDevice ? 140 : Math.max(180, width * 0.6);
const circularProgressWidth = isSmallDevice ? 12 : Math.max(18, width * 0.08);
const logoSize = isSmallDevice ? 22 : Math.max(28, width * 0.08);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(18, width * 0.05);

const WaterDrop = ({ fillPercent }: { fillPercent: number }) => {
  const clipHeight = 100 - fillPercent;
  return (
    <View style={styles.dropContainer}>
      <Svg width="80" height="100" viewBox="0 0 80 100">
        <Defs>
          <ClipPath id="clip">
            <Path
              d="M40 0 C10 40, 0 60, 10 80 C20 95, 60 95, 70 80 C80 60, 70 40, 40 0"
              fill="white"
            />
          </ClipPath>
        </Defs>
        <Rect
          x="0"
          y={`${clipHeight}`}
          width="80"
          height="100"
          fill="#007AFF"
          clipPath="url(#clip)"
        />
        <Path
          d="M40 0 C10 40, 0 60, 10 80 C20 95, 60 95, 70 80 C80 60, 70 40, 40 0"
          fill="none"
          stroke="#ccc"
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [intake, setIntake] = useState(0);
  const [history, setHistory] = useState<{ id: string; time: string; amount: number; icon: string }[]>([]);
  const [selectedCup, setSelectedCup] = useState<number | 'add'>(200);
  const [selectedIcon, setSelectedIcon] = useState<string>('cup-outline');
  const [modalVisible, setModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customInputVisible, setCustomInputVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  


  const [goal, setGoal] = useState(2500);

  const fillPercent = (intake / goal) * 100;

  const [cupOptions, setCupOptions] = useState<any[]>([
    { amount: 100, icon: 'glass-cocktail' },
    { amount: 125, icon: 'glass-pint-outline' },
    { amount: 150, icon: 'cup-outline' },
    { amount: 200, icon: 'cup' },
    { amount: 250, icon: 'glass-mug' },
    { amount: 300, icon: 'cup-water' },
    { amount: 350, icon: 'bottle-tonic' },
    { amount: 400, icon: 'bottle-wine-outline' },
    { amount: 500, icon: 'bottle-soda-classic-outline' },
    { amount: 'add', icon: 'plus-circle-outline' },
  ]);

  // Load today's logs on mount
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const logs = await getTodayLogs();
        const total = logs.reduce((sum, l) => sum + l.amount, 0);
        const mapped = logs.map(l => ({
          id: l.id,
          amount: l.amount,
          icon: 'cup-outline',
          time: new Date(l.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        setIntake(total);
        setHistory(mapped.reverse());

        const storedGoal = await getHydrationGoal();
        setGoal(storedGoal);
      };

      loadData();

      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true; // Prevent default back action
      };

      const backHandlerSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      // Clean up
      return () => {
        backHandlerSubscription.remove(); // ✅ modern cleanup
      };
    }, [])
  );


  const handleDrink = async () => {
    if (intake >= goal) return;

    const amount = selectedCup as number;

    // Log the new intake
    await logWaterIntake(amount);

    // ✅ Get only today's logs after logging
    const logs = await getTodayLogs();
    const total = logs.reduce((sum, l) => sum + l.amount, 0);
    const mapped = logs.map(l => ({
      id: l.id,
      amount: l.amount,
      icon: 'cup-outline',
      time: new Date(l.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    setIntake(total);
    setHistory(mapped.reverse());

    // Optionally use correct icon and time for the new entry
  };


  const handleDelete = async (id: string) => {
    await deleteWaterLog(id);
    const todayLogs = await getTodayLogs();
    const total = todayLogs.reduce((sum, l) => sum + l.amount, 0);
    const mapped = todayLogs.map(l => ({
      id: l.id,
      amount: l.amount,
      icon: 'cup-outline',
      time: new Date(l.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    setIntake(total);
    setHistory(mapped.reverse());
  };


  const handleSelectCup = (cup: any) => {
    if (cup.amount === 'add') {
      setCustomAmount('');
      setSelectedIcon('cup-water');
      setCustomInputVisible(true);
    } else {
      setSelectedCup(cup.amount);
      setSelectedIcon(cup.icon);
      setCustomInputVisible(false);
      setModalVisible(false);
    }
  };

  const confirmCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      const newCup = { amount, icon: 'cup-water', custom: true };
      setCupOptions(prev => {
        const filtered = prev.filter(c => c.amount !== 'add');
        return [...filtered, newCup, { amount: 'add', icon: 'plus-circle-outline' }];
      });
      setSelectedCup(amount);
      setSelectedIcon('cup-water');
      setModalVisible(false);
      setCustomInputVisible(false);
    }
  };

  const handleRemoveCustomCup = (amountToRemove: number) => {
    setCupOptions(prev => prev.filter(cup => !(cup.custom && cup.amount === amountToRemove)));
    if (selectedCup === amountToRemove) {
      setSelectedCup(200);
      setSelectedIcon('cup-outline');
    }
  };

  useEffect(() => {
    if (intake >= goal && !showCelebration) {
      setShowCelebration(true);
      // Auto-hide after 4s
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [intake, goal]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')} // replace with your actual logo path
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#000' }]}>Home</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Feather name="settings" size={24} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: dark ? '#222' : '#f9f9f9' }]}>
          <AnimatedCircularProgress
            size={250}
            width={28}
            fill={fillPercent}
            tintColor="#007AFF"
            backgroundColor={dark ? '#eee' : '#eee'}
            arcSweepAngle={240}
            rotation={240}
            lineCap="round"
          >
            {() => (
              <View style={styles.centerCircle}>
                <WaterDrop fillPercent={fillPercent} />
                <View style={styles.intakeContainer}>
                  <Text style={[styles.intakeValue, { color: '#007AFF' }]}>{intake}</Text>
                  <Text style={[styles.goalText, { color: dark ? '#aaa' : '#999' }]}>/ {goal} mL</Text>
                </View>
              </View>
            )}
          </AnimatedCircularProgress>

          {intake >= goal ? (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <MaterialCommunityIcons name="trophy" size={36} color="#007AFF" />
              <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>
                Today’s Goal Achieved!
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.drinkBtn, { backgroundColor: '#007AFF' }]}
              onPress={handleDrink}
            >
              <Text style={styles.drinkBtnText}>Tap ({selectedCup} mL)</Text>
            </TouchableOpacity>
          )}


          {intake < goal && (
            <TouchableOpacity
              style={[styles.cupIcon, { backgroundColor: dark ? '#e8f0ff' : '#e8f0ff' }]}
              onPress={() => setModalVisible(true)}
            >
              <MaterialCommunityIcons name={selectedIcon} size={24} color="#007AFF" />
            </TouchableOpacity>
          )}

        </View>

        {/* History */}
        <View style={[styles.historySection, { backgroundColor: dark ? '#222' : '#f9f9f9', flex: 1 }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: dark ? '#fff' : '#000' }]}>History</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={[styles.seeAllText, { color: '#007AFF' }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.noHistory}>
              <Feather name="clipboard" size={40} color={dark ? '#555' : '#ccc'} />
              <Text style={[styles.noHistoryText, { color: dark ? '#888' : '#999' }]}>
                No water intake today.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
              {history.map(entry => (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItem,
                    { borderColor: dark ? '#333' : '#f0f0f0' },
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <MaterialCommunityIcons name={entry.icon} size={28} color="#007AFF" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[styles.historyLabel, { color: dark ? '#fff' : '#000' }]}>Water</Text>
                      <Text style={[styles.historyTime, { color: dark ? '#aaa' : '#999' }]}>
                        {entry.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyAmount, { color: dark ? '#fff' : '#000' }]}>
                      {entry.amount} mL
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                      <Feather name="trash-2" size={22} color={dark ? '#aaa' : '#999'} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Cup Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: dark ? '#fff' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: dark ? '#000' : '#000' }]}>Select Cup Size</Text>
            <FlatList
              data={cupOptions}
              keyExtractor={(_, idx) => idx.toString()}
              numColumns={3}
              renderItem={({ item }) => {
                const isSel = selectedCup === item.amount;
                return (
                  <View style={styles.cupWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.cupOption,
                        isSel && { backgroundColor: '#e6f0ff', borderRadius: 10, padding: 10, },
                      ]}
                      onPress={() => handleSelectCup(item)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={32}
                        color={isSel ? '#007AFF' : dark ? '#555' : '#555'}
                      />
                      <Text style={[styles.cupText, isSel && { color: '#007AFF', fontWeight: '600' }]}>
                        {item.amount === 'add' ? 'Add New' : `${item.amount} mL`}
                      </Text>
                    </TouchableOpacity>
                    {item.custom && (
                      <TouchableOpacity
                        onPress={() => handleRemoveCustomCup(item.amount)}
                        style={styles.deleteIcon}
                      >
                        <Feather name="x-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
            {customInputVisible && (
              <View style={styles.customInputContainer}>
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={dark ? '#aaa' : '#999'}
                  style={[styles.input, { borderColor: dark ? '#333' : '#ccc', color: dark ? '#000' : '#000' }]}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
                <TouchableOpacity onPress={confirmCustomAmount}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalClose, { color: '#007AFF' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={{ width: width, height: height }}
          />
        </View>
      )}

    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: {
    width: logoSize,
    height: logoSize,
    marginRight: 8,
    borderRadius: 10,
  },
  headerTitle: { fontSize: headerTitleFontSize, fontWeight: 'bold' },
  dropContainer: { height: 100, justifyContent: 'center', alignItems: 'center' },
  progressCard: {
    alignItems: 'center',
    marginVertical: progressCardMarginV,
    padding: progressCardPadding,
    borderRadius: progressCardRadius,
  },
  centerCircle: { justifyContent: 'center', alignItems: 'center', flex: 1, marginTop: 20 },
  intakeContainer: { alignItems: 'center' },
  intakeValue: { fontSize: intakeValueFontSize, fontWeight: 'bold' },
  goalText: { fontSize: goalTextFontSize },
  drinkBtn: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: drinkBtnPaddingV,
    paddingHorizontal: drinkBtnPaddingH,
    borderRadius: drinkBtnRadius,
  },
  drinkBtnText: { color: '#fff', fontWeight: '600', fontSize: drinkBtnFontSize },
  cupIcon: { marginTop: 12, padding: cupIconPadding, borderRadius: cupIconRadius },
  historySection: { padding: historySectionPadding, borderRadius: historySectionRadius },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: historyHeaderPaddingT,
    paddingBottom: historyHeaderPaddingB,
  },
  seeAllText: {
    fontSize: seeAllTextFontSize,
    fontWeight: '500',
  },
  historyTitle: { fontSize: historyTitleFontSize, fontWeight: 'bold' },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: historyItemPaddingV,
    borderBottomWidth: 1,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyLabel: { fontWeight: '600', fontSize: historyLabelFontSize },
  historyTime: { fontSize: historyTimeFontSize },
  historyAmount: { fontSize: historyAmountFontSize, fontWeight: '600' },
  historyRight: { flexDirection: 'row', alignItems: 'center' },
  noHistory: { alignItems: 'center', marginTop: noHistoryMarginT },
  noHistoryText: { marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: modalContentPadding,
  },
  modalTitle: { fontSize: modalTitleFontSize, fontWeight: 'bold', marginBottom: 10 },
  cupWrapper: { position: 'relative', width: '33%', alignItems: 'center', marginVertical: 8 },
  cupOption: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1 / 3,
    paddingVertical: cupOptionPaddingV,
  },
  cupText: { marginTop: 6, fontSize: cupTextFontSize },
  deleteIcon: { position: 'absolute', top: 0, right: 12 },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: inputRadius,
    paddingHorizontal: inputPaddingH,
    paddingVertical: inputPaddingV,
    marginRight: 10,
  },
  modalClose: { textAlign: 'center', marginTop: modalCloseMarginT },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

});
