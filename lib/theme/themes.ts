// @ts-nocheck
export type ThemeType = 'dynamic-green' | 'subtle-gradient' | 'clean-minimal';

export interface Theme {
  name: string;
  type: ThemeType;
  description: string;
  colors: {
    background: string[];
    card: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
  animated: boolean;
}

export const themes: Record<ThemeType, Theme> = {
  'dynamic-green': {
    name: 'Dynamic Green',
    type: 'dynamic-green',
    description: 'Premium animated theme for entertainment & creative apps',
    colors: {
      background: ['#0a3d0a', '#00ff88', '#001a00'],
      card: 'rgba(10, 30, 10, 0.85)',
      text: '#ffffff',
      textSecondary: '#a0f0c0',
      accent: '#00ff88',
      border: 'rgba(0, 255, 136, 0.3)',
    },
    animated: true,
  },
  'subtle-gradient': {
    name: 'Subtle Gradient',
    type: 'subtle-gradient',
    description: 'Professional dark theme for business & finance',
    colors: {
      background: ['#0f172a', '#1e1b4b', '#0f172a'],
      card: 'rgba(30, 41, 59, 0.9)',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.3)',
    },
    animated: false,
  },
  'clean-minimal': {
    name: 'Clean Minimal',
    type: 'clean-minimal',
    description: 'Light theme for productivity & readability',
    colors: {
      background: ['#f8fafc', '#e2e8f0', '#f8fafc'],
      card: 'rgba(255, 255, 255, 0.95)',
      text: '#0f172a',
      textSecondary: '#64748b',
      accent: '#2563eb',
      border: 'rgba(15, 23, 42, 0.1)',
    },
    animated: false,
  },
};

export const defaultTheme: ThemeType = 'subtle-gradient';
