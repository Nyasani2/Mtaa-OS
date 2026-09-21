// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, defaultTheme, ThemeType, Theme } from './themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeType: ThemeType;
  setTheme: (type: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'mtaa_os_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeType, setThemeType] = useState<ThemeType>(defaultTheme);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && themes[saved as ThemeType]) {
        setThemeType(saved as ThemeType);
      }
    } catch (e) {
      console.warn('Failed to load theme', e);
    }
  };

  const setTheme = async (type: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, type);
      setThemeType(type);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  };

  const value = {
    currentTheme: themes[themeType],
    themeType,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
