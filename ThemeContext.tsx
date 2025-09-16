// src/context/ThemeContext.tsx
import React, { createContext, useEffect, useState, useContext } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  selectedOption: ThemeType;
  setThemeOption: (option: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [selectedOption, setSelectedOption] = useState<ThemeType>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const loadStoredTheme = async () => {
      const stored = await AsyncStorage.getItem('theme');
      const savedOption = stored as ThemeType;
      if (savedOption) {
        setSelectedOption(savedOption);
        applyTheme(savedOption);
      }
    };
    loadStoredTheme();
  }, []);

  const applyTheme = (option: ThemeType) => {
    if (option === 'system') {
      const sys = Appearance.getColorScheme();
      setTheme(sys === 'dark' ? 'dark' : 'light');
    } else {
      setTheme(option);
    }
  };

  const setThemeOption = async (option: ThemeType) => {
    setSelectedOption(option);
    await AsyncStorage.setItem('theme', option);
    applyTheme(option);
  };

  return (
    <ThemeContext.Provider value={{ theme, selectedOption, setThemeOption }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within a ThemeProvider');
  return context;
};
