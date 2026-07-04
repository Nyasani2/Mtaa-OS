// hooks/useTheme.ts
// MTAA OS V10 — Theme Hook
// Provides colors, fonts, sizes for all screens

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  inputBg: string;
  surface: string;
}

const darkColors: ThemeColors = {
  background: '#0a0a0a',
  card: '#111111',
  text: '#ffffff',
  textSecondary: '#888888',
  primary: '#00d4ff',
  secondary: '#6366f1',
  border: '#222222',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  inputBg: '#1a1a1a',
  surface: '#1a1a1a',
};

const lightColors: ThemeColors = {
  background: '#ffffff',
  card: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  primary: '#2563eb',
  secondary: '#6366f1',
  border: '#e5e7eb',
  error: '#dc2626',
  success: '#059669',
  warning: '#d97706',
  inputBg: '#f3f4f6',
  surface: '#f8fafc',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  return {
    colors,
    isDark,
  };
}

export default useTheme;
