import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const suffixes = ['AM', 'PM'];

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

const SleepTimeStep = ({ onDataChange, selectedData = {} }) => {
  const defaultDate = selectedData.sleepTime
    ? new Date(`1970-01-01T${selectedData.sleepTime}`)
    : null;

  const initialHour = defaultDate
    ? ((defaultDate.getHours() % 12) || 12)
    : 11;
  const initialMinute = defaultDate
    ? defaultDate.getMinutes().toString().padStart(2, '0')
    : '00';
  const initialSuffix = defaultDate
    ? defaultDate.getHours() >= 12 ? 'PM' : 'AM'
    : 'PM';

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedSuffix, setSelectedSuffix] = useState(initialSuffix);

  useEffect(() => {
    const sleepTime = formatToHHMM(selectedHour, selectedMinute, selectedSuffix);
    onDataChange?.({ sleepTime });
  }, [selectedHour, selectedMinute, selectedSuffix]);

  return (
    <View style={[styles.container, { padding }]}>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>When do you usually go to sleep?</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}>
        We'll stop sending reminders after this time.
      </Text>

      <View style={styles.pickerRow}>
        {/* Hour Picker */}
        <FlatList
          data={hours}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.picker}
          contentContainerStyle={styles.centerItems}
          getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
          snapToInterval={50}
          initialScrollIndex={hours.indexOf(initialHour)}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / 50);
            const clampedIndex = Math.max(0, Math.min(index, hours.length - 1));
            setSelectedHour(hours[clampedIndex]);
          }}
          renderItem={({ item }) => (
            <Text style={[styles.pickerItem, selectedHour === item && styles.selectedItem]}>
              {item}
            </Text>
          )}
        />

        <Text style={[styles.colon, { fontSize: colonFontSize, marginHorizontal: colonMarginH }]}>:</Text>

        {/* Minute Picker */}
        <FlatList
          data={minutes}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={styles.picker}
          contentContainerStyle={styles.centerItems}
          getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
          snapToInterval={50}
          initialScrollIndex={minutes.indexOf(initialMinute)}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / 50);
            const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
            setSelectedMinute(minutes[clampedIndex]);
          }}
          renderItem={({ item }) => (
            <Text style={[styles.pickerItem, selectedMinute === item && styles.selectedItem]}>
              {item}
            </Text>
          )}
        />

        {/* AM/PM Picker */}
        <FlatList
          data={suffixes}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={styles.picker}
          contentContainerStyle={styles.centerItems}
          getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
          snapToInterval={50}
          initialScrollIndex={suffixes.indexOf(initialSuffix)}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / 50);
            const clampedIndex = Math.max(0, Math.min(index, suffixes.length - 1));
            setSelectedSuffix(suffixes[clampedIndex]);
          }}
          renderItem={({ item }) => (
            <Text style={[styles.pickerItem, selectedSuffix === item && styles.selectedItem]}>
              {item}
            </Text>
          )}
        />
      </View>
    </View>
  );
};

export default SleepTimeStep;

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
    height: 50,
    fontSize: 24,
    color: '#999',
    textAlign: 'center',
    lineHeight: 50,
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