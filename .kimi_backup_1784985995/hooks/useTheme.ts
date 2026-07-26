import { useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#06B6D4',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#06B6D4',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    isDark,
    toggleTheme,
    colors: theme,
  };
}
