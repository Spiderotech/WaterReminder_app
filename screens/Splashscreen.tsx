import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, useColorScheme, useWindowDimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



const SplashScreen = () => {
  const scheme = useColorScheme();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        const hydrationGoal = await AsyncStorage.getItem('hydrationGoal');

        if (userProfile && hydrationGoal) {
          navigation.replace('Home');
        } else {
          navigation.replace('Intro');
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
        navigation.replace('Intro');
      }
    };

    const timeout = setTimeout(checkUserData, 2000); // 2-second splash delay

    return () => clearTimeout(timeout);
  }, []);

  const backgroundColor = scheme === 'dark' ? '#3498ff' : '#3498ff';

  const fontSize = Math.max(24, width * 0.07);
  const marginTop = Math.max(12, height * 0.02);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={scheme === 'dark' ? 'light-content' : 'light-content'}
        translucent={false}
      />
      <Image 
         source={require('../assets/logo1.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <Text style={[styles.title, { fontSize, marginTop }]}>Dora Drink</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150, // Adjust the size as needed
    height: 150,
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
  },
});