import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from '../components/AppSafeAreaView';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useMainTabTheme } from '../constants/mainTabTheme';

const { width, height } = Dimensions.get('window');

// Responsive values
const isSmallDevice = width < 350 || height < 650;
const padding = isSmallDevice ? 8 : Math.max(16, width * 0.05);
const headerIconSize = isSmallDevice ? 18 : Math.max(24, width * 0.065);
const headerTitleFontSize = isSmallDevice ? 16 : Math.max(22, width * 0.055);

const TermsOfServiceScreen = () => {
  const tabTheme = useMainTabTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tabTheme.shell }]}>
      {/* Header */}
      <View style={[styles.header, { padding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerButton, { backgroundColor: tabTheme.headerButton, borderColor: tabTheme.border }]}>
          <Feather name="arrow-left" size={headerIconSize} color={tabTheme.icon} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tabTheme.text, fontSize: headerTitleFontSize }]}>
          Terms of Service
        </Text>
        <View style={{ width: headerIconSize }} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: 'https://doradrink.com/terms-and-conditions-app' }} // 👈 use your clean app route
        style={styles.webView}
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
  webView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: 'bold' },
  headerButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
