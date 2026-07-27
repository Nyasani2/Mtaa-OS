// constants/Colors.ts
// MTAA OS V10 — canonical color palette
// Used by: health screens, profile screens, and all OS components

export const Colors = {
  // Primary brand
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  primaryForeground: '#ffffff',

  // Semantic
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Neutrals
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#f5f5f5',
  cardForeground: '#0a0a0a',
  secondary: '#e5e7eb',
  secondaryForeground: '#374151',
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  input: '#e5e7eb',
  ring: '#2563eb',

  // Dark mode overrides (consumers check manually or use theme provider)
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
  },
} as const;

export default Colors;
