import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

const ITEM_HEIGHT = 50;
const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // 00–59
const suffixes = ['AM', 'PM'];

const { width, height } = Dimensions.get('window');

// Responsive values for text and padding only
const isSmallDevice = width < 350 || height < 650;

const padding = isSmallDevice ? 10 : Math.max(16, width * 0.06);
const titleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.07);
const subtitleFontSize = isSmallDevice ? 12 : Math.max(14, width * 0.045);
const subtitleMarginBottom = isSmallDevice ? 20 : Math.max(30, height * 0.03);
const colonFontSize = isSmallDevice ? 18 : Math.max(24, width * 0.07);
const colonMarginH = isSmallDevice ? 4 : Math.max(8, width * 0.02);


const formatToHHMM = (hour: number, minute: string, suffix: string): string => {
  let h = hour;
  if (suffix === 'PM' && hour !== 12) h += 12;
  if (suffix === 'AM' && hour === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute}`;
};

const WakeUpTimeStep = ({ onDataChange, selectedData = {} }) => {
  const defaultDate = selectedData.wakeUpTime
    ? new Date(`1970-01-01T${selectedData.wakeUpTime}`)
    : null;

  const initialHour = defaultDate
    ? ((defaultDate.getHours() % 12) || 12)
    : 7;
  const initialMinute = defaultDate
    ? defaultDate.getMinutes().toString().padStart(2, '0')
    : '00';
  const initialSuffix = defaultDate
    ? defaultDate.getHours() >= 12 ? 'PM' : 'AM'
    : 'AM';

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedSuffix, setSelectedSuffix] = useState(initialSuffix);

  useEffect(() => {
    const wakeUpTime = formatToHHMM(selectedHour, selectedMinute, selectedSuffix);
    onDataChange?.({ wakeUpTime });
  }, [selectedHour, selectedMinute, selectedSuffix]);

  const renderPicker = (data, selectedValue, setSelectedValue) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.toString()}
      showsVerticalScrollIndicator={false}
      style={styles.picker}
      contentContainerStyle={styles.centerItems}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      snapToInterval={ITEM_HEIGHT}
      initialScrollIndex={
        Math.max(0, data.findIndex((v) => v === selectedValue))
      }
      decelerationRate="fast"
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
        setSelectedValue(data[clampedIndex]);
      }}
      onScrollEndDrag={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
        setSelectedValue(data[clampedIndex]);
      }}
      renderItem={({ item }) => (
        <Text style={[styles.pickerItem, selectedValue === item && styles.selectedItem]}>
          {item}
        </Text>
      )}
    />
  );

  return (
    <View style={[styles.container, { padding }]}>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>When do you usually wake up?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}>
        We'll schedule hydration reminders starting from your wake-up time.
      </Text>

      <View style={styles.pickerRow}>
        {renderPicker(hours, selectedHour, setSelectedHour)}
        <Text style={[styles.colon, { fontSize: colonFontSize, marginHorizontal: colonMarginH }]}>:</Text>
        {renderPicker(minutes, selectedMinute, setSelectedMinute)}
        {renderPicker(suffixes, selectedSuffix, setSelectedSuffix)}
      </View>
    </View>
  );
};

export default WakeUpTimeStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#555',
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
    marginBottom: 30,
  },
  picker: {
    height: 150,
    width: 60,
  },
  colon: {
    fontWeight: 'bold',
    color: '#007aff',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    fontSize: 24,
    color: '#999',
    textAlign: 'center',
    lineHeight: ITEM_HEIGHT,
  },
  selectedItem: {
    color: '#007aff',
    fontWeight: 'bold',
    fontSize: 32,
  },
  centerItems: {
    paddingVertical: 50,
  },
});