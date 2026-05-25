// lib/theme/theme-provider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#f5f5f5',
  cardForeground: '#0a0a0a',
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  secondary: '#e5e7eb',
  secondaryForeground: '#374151',
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  input: '#e5e7eb',
  ring: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const darkColors = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#171717',
  cardForeground: '#fafafa',
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  secondary: '#262626',
  secondaryForeground: '#e5e5e5',
  muted: '#262626',
  mutedForeground: '#a3a3a3',
  border: '#262626',
  input: '#262626',
  ring: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<Theme>('system');

  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
