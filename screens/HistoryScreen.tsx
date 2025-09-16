import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../ThemeContext';
import { getTodayLogs, deleteWaterLog } from '../utils/waterIntakeUtils';
import { generateDailyHistory, generateMonthlyHistory } from '../utils/historyUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getWaterReportStats } from '../utils/DrinkingreportUtils';





const { width, height } = Dimensions.get('window');

const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerTitleFontSize = isSmallDevice ? 15 : Math.max(18, width * 0.05);
const tabFontSize = isSmallDevice ? 12 : Math.max(16, width * 0.045);
const tabPaddingV = isSmallDevice ? 4 : Math.max(8, height * 0.012);
const tabPaddingH = isSmallDevice ? 12 : Math.max(28, width * 0.08);
const dateTextFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const chartRadius = isSmallDevice ? 8 : Math.max(12, width * 0.035);
const chartMarginB = isSmallDevice ? 10 : Math.max(20, height * 0.03);
const sectionRadius = isSmallDevice ? 10 : Math.max(16, width * 0.045);
const sectionPadding = isSmallDevice ? 8 : Math.max(16, width * 0.045);
const historyTitleFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.05);
const historyTitleMarginB = isSmallDevice ? 8 : Math.max(16, height * 0.022);
const historyItemPaddingV = isSmallDevice ? 6 : Math.max(12, height * 0.018);
const historyLabelFontSize = isSmallDevice ? 12 : Math.max(16, width * 0.045);
const historyTimeFontSize = isSmallDevice ? 10 : Math.max(12, width * 0.035);
const historyAmountFontSize = isSmallDevice ? 12 : Math.max(16, width * 0.045);
const noHistoryMarginT = isSmallDevice ? 10 : Math.max(20, height * 0.03);
const noHistoryIconSize = isSmallDevice ? 24 : Math.max(40, width * 0.12);
const noHistoryTextMarginT = isSmallDevice ? 5 : Math.max(10, height * 0.015);
const reportCardRadius = isSmallDevice ? 10 : Math.max(16, width * 0.045);
const reportCardPadding = isSmallDevice ? 8 : Math.max(16, width * 0.045);
const reportTitleFontSize = isSmallDevice ? 14 : Math.max(18, width * 0.055);
const reportTitleMarginB = isSmallDevice ? 6 : Math.max(12, height * 0.018);
const reportLabelFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const reportValueFontSize = isSmallDevice ? 11 : Math.max(14, width * 0.04);
const reportRowPaddingV = isSmallDevice ? 3 : Math.max(6, height * 0.009);

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const [history, setHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  const [report, setReport] = useState({
    weeklyAvg: 0,
    monthlyAvg: 0,
    avgCompletion: 0,
    drinkFreq: '0.0',
  });

  const getIconForAmount = (amount: number) => {
    if (amount <= 100) return 'glass-cocktail';
    if (amount <= 125) return 'glass-pint-outline';
    if (amount <= 150) return 'cup-outline';
    if (amount <= 200) return 'cup';
    if (amount <= 250) return 'glass-mug';
    if (amount <= 300) return 'cup-water';
    if (amount <= 350) return 'bottle-tonic';
    if (amount <= 400) return 'bottle-wine-outline';
    return 'bottle-soda-classic-outline';
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await fetchTodayLogs();
        const reportStats = await getWaterReportStats();
        setReport(reportStats);

        if (activeTab === 'week') {
          await fetchWeeklyChart();
        } else {
          await fetchMonthlyChart();
        }
      };
      loadData();
    }, [activeTab])
  );


  const fetchTodayLogs = async () => {
    const logs = await getTodayLogs(); // only today's logs
    const parsed = logs.map(log => ({
      id: log.id,
      amount: log.amount,
      time: new Date(log.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    setHistory(parsed.reverse());
  };


  const fetchWeeklyChart = async () => {
    const daily = await generateDailyHistory();
    const past7 = daily.slice(-7);
    const labels = past7.map(entry => entry.date.slice(8)); // show day
    const values = past7.map(entry => entry.total);
    setChartData({
      labels,
      datasets: [{ data: values }],
    });
  };

  const fetchMonthlyChart = async () => {
    const monthly = await generateMonthlyHistory();
    const past6 = monthly.slice(-6);
    const labels = past6.map(entry => {
      const [year, month] = entry.month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[parseInt(month, 10) - 1];
    });
    const values = past6.map(entry => entry.total);
    setChartData({
      labels,
      datasets: [{ data: values }],
    });
  };


  const handleDelete = async (id: string) => {
    await deleteWaterLog(id);
    fetchTodayLogs();
    if (activeTab === 'week') {
      fetchWeeklyChart();
    } else {
      fetchMonthlyChart();
    }
  };

  const chartConfig = {
    backgroundGradientFrom: dark ? '#000' : '#fff',
    backgroundGradientTo: dark ? '#000' : '#fff',
    decimalPlaces: 0,
    fillShadowGradient: '#007AFF',
    fillShadowGradientOpacity: 1,
    color: () => '#007AFF',
    labelColor: () => (dark ? '#bbb' : '#666'),
    propsForBackgroundLines: {
      stroke: dark ? '#333' : '#eee',
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={dark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#000' }]}>History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Feather name="settings" size={24} color={dark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: dark ? '#222' : '#f0f4f8' }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'week' && styles.activeTab]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={activeTab === 'week' ? styles.activeText : [styles.tabText, { color: dark ? '#aaa' : '#777' }]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'month' && styles.activeTab]}
            onPress={() => setActiveTab('month')}
          >
            <Text style={activeTab === 'month' ? styles.activeText : [styles.tabText, { color: dark ? '#aaa' : '#777' }]}>Month</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <Text style={[styles.dateText, { color: dark ? '#aaa' : '#555', textAlign: 'center', marginVertical: 10 }]}>
          {activeTab === 'week' ? 'Past 7 Days' : 'Last 6 Months'}
        </Text>
        <BarChart
          data={chartData}
          width={width - (isSmallDevice ? 20 : 40)}
          height={isSmallDevice ? 120 : 220}
          yAxisSuffix=" mL"
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />

        {/* History List */}
        <View style={[styles.historySection, { backgroundColor: dark ? '#111' : '#f9f9f9' }]}>
          <Text style={[styles.historyTitle, { color: dark ? '#fff' : '#000' }]}>Today's Records</Text>
          {history.length === 0 ? (
            <View style={styles.noHistory}>
              <Feather name="file-text" size={40} color="#ccc" />
              <Text style={[styles.noHistoryText, { color: dark ? '#888' : '#999' }]}>
                No water intake records yet.
              </Text>
            </View>
          ) : (
            <View style={{ maxHeight: 300 }}>
              <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[styles.historyItem, { borderColor: dark ? '#333' : '#f0f0f0' }]}>
                    <View style={styles.historyLeft}>
                      <MaterialCommunityIcons
                        name={getIconForAmount(item.amount)}
                        size={28}
                        color="#007AFF"
                      />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.historyLabel, { color: dark ? '#fff' : '#000' }]}>Water</Text>
                        <Text style={[styles.historyTime, { color: dark ? '#aaa' : '#999' }]}>{item.time}</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyAmount, { color: dark ? '#fff' : '#000' }]}>{item.amount} mL</Text>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Feather name="trash-2" size={22} color={dark ? '#aaa' : '#999'} style={{ marginLeft: 10 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

        </View>
        <View style={[styles.reportCard, { backgroundColor: dark ? '#111' : '#f9f9f9', marginTop: 20, borderRadius: 16, padding: 16 }]}>
          <Text style={[styles.historyTitle, { color: dark ? '#fff' : '#000', marginBottom: 12 }]}>Drinking Water Report</Text>

          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: dark ? '#aaa' : '#555' }]}>Weekly Avg:</Text>
            <Text style={[styles.reportValue, { color: dark ? '#fff' : '#000' }]}>{report.weeklyAvg} mL</Text>
          </View>

          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: dark ? '#aaa' : '#555' }]}>Monthly Avg:</Text>
            <Text style={[styles.reportValue, { color: dark ? '#fff' : '#000' }]}>{report.monthlyAvg} mL</Text>
          </View>

          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: dark ? '#aaa' : '#555' }]}>Avg Completion:</Text>
            <Text style={[styles.reportValue, { color: dark ? '#fff' : '#000' }]}>{report.avgCompletion}%</Text>
          </View>

          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: dark ? '#aaa' : '#555' }]}>Drinking Frequency:</Text>
            <Text style={[styles.reportValue, { color: dark ? '#fff' : '#000' }]}>{report.drinkFreq} / day</Text>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: headerTitleFontSize,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
  },
  tabButton: {
    paddingVertical: tabPaddingV,
    paddingHorizontal: tabPaddingH,
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
  },
  tabText: {
    fontSize: tabFontSize,
  },
  activeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: tabFontSize,
  },
  dateText: {
    fontSize: dateTextFontSize,
    marginTop: 10,
  },
  chart: {
    borderRadius: chartRadius,
    marginBottom: chartMarginB,
  },
  historySection: {
    borderRadius: sectionRadius,
    padding: sectionPadding,
  },
  historyTitle: {
    fontSize: historyTitleFontSize,
    fontWeight: 'bold',
    marginBottom: historyTitleMarginB,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: historyItemPaddingV,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLabel: {
    fontWeight: '600',
    fontSize: historyLabelFontSize,
  },
  historyTime: {
    fontSize: historyTimeFontSize,
  },
  historyAmount: {
    fontSize: historyAmountFontSize,
    fontWeight: '600',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noHistory: {
    alignItems: 'center',
    marginTop: noHistoryMarginT,
  },
  noHistoryText: {
    marginTop: noHistoryTextMarginT,
  },
  reportCard: {
    marginTop: 20,
    padding: reportCardPadding,
    borderRadius: reportCardRadius,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: reportRowPaddingV,
  },
  reportLabel: {
    fontSize: reportLabelFontSize,
  },
  reportValue: {
    fontSize: reportValueFontSize,
    fontWeight: '600',
  },
});
