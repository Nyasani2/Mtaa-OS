import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

/**
 * Theme hook for education screens.
 * Returns a colors object matching what all education screens expect.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';

  const colors = useMemo(() => ({
    background: isDark ? '#0a0a0f' : '#f8fafc',
    surface: isDark ? '#13131f' : '#ffffff',
    card: isDark ? '#13131f' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    border: isDark ? '#1e1e2e' : '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  }), [isDark]);

  return { colors, isDark, scheme };
}
