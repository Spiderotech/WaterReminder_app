import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerIconSize = isSmallDevice ? 18 : Math.max(24, width * 0.065);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);

const TermsOfServiceScreen = () => {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={[styles.header, { padding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={headerIconSize} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#fff' : '#000', fontSize: headerTitleFontSize }]}>
          Terms of Service
        </Text>
        <View style={{ width: headerIconSize }} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: 'https://doradrink.com/terms-and-conditions-app' }} // 👈 use your clean app route
        style={{ flex: 1 }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
};

export default TermsOfServiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: 'bold' },
});
