// @ts-nocheck
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

interface ThemeCardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
}

export function ThemeCard({ children, title, style }: ThemeCardProps) {
  const { currentTheme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }, style]}>
      {title && <Text style={[styles.title, { color: currentTheme.colors.text }]}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
