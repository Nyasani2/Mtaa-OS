// @ts-nocheck
// constants/theme.ts
// MTAA OS V10 — theme constants (alias for lib/theme/theme-provider)
// Imported by: app/(os)/network.tsx, app/(os)/reader.tsx, app/(os)/wifi.tsx

export { useTheme, ThemeProvider } from '@/lib/theme/theme-provider';
export type Theme = 'light' | 'dark' | 'system';;

// Re-export color palette for direct access
export const colors = {
  light: {
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
  },
  dark: {
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
  },
} as const;

export const FONTS: Record<string, any> = { regular: 'System', medium: 'System', bold: 'System' };
export const SIZES: Record<string, number> = { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 };

export const COLORS: any = { ...(colors as any).light, text: '#0f172a', textSecondary: '#64748b', textLight: '#94a3b8' };
export const FONTS: Record<string, string> = { regular: 'System', medium: 'System', bold: 'System' };
export const SIZES: Record<string, number> = { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 };
