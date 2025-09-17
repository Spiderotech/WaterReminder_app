import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

const isSmallDevice = width < 350 || height < 650;

// Responsive values (update for small devices)
const padding = isSmallDevice ? 8 : Math.max(12, width * 0.04);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);
const headerHeight = isSmallDevice ? 40 : Math.max(60, height * 0.08);
const iconSize = isSmallDevice ? 18 : Math.max(22, width * 0.06);
const iconMarginR = isSmallDevice ? 6 : Math.max(12, width * 0.03);
const itemPadding = isSmallDevice ? 10 : Math.max(20, width * 0.055);
const itemRadius = isSmallDevice ? 6 : Math.max(10, width * 0.03);
const itemMarginB = isSmallDevice ? 6 : Math.max(10, height * 0.014);
const labelFontSize = isSmallDevice ? 13 : Math.max(16, width * 0.045);

const ContactSupportScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const dark = theme === 'dark';

  const links = [
    { label: 'Customer Support', icon: 'headphones', url: 'mailto:support@doradrink.com' },
    { label: 'Website', icon: 'web', url: 'https://doradrink.com' },
    // { label: 'WhatsApp', icon: 'whatsapp', url: 'https://wa.me/1234567890' },
    // { label: 'Facebook', icon: 'facebook', url: 'https://facebook.com/doradrink' },
    // { label: 'Instagram', icon: 'instagram', url: 'https://instagram.com/doradrink' },
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff', padding }]}>
      <View style={[styles.header, { height: headerHeight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={iconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: headerTitleFontSize }]}>Contact Support</Text>
        <View style={{ width: iconSize }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
        {links.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.item,
              {
                backgroundColor: dark ? '#111' : '#f9f9f9',
                padding: itemPadding,
                borderRadius: itemRadius,
                marginBottom: itemMarginB,
              },
            ]}
            onPress={() => handleLinkPress(item.url)}
          >
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={item.icon}
                size={iconSize}
                color={dark ? '#ccc' : '#007AFF'}
                style={{ width: iconSize + iconMarginR }}
              />
              <Text style={[styles.label, { color: dark ? '#fff' : '#000', fontSize: labelFontSize }]}>{item.label}</Text>
            </View>
            <Feather name="chevron-right" size={iconSize} color={dark ? '#666' : '#999'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContactSupportScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontWeight: 'bold' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 10 },
});