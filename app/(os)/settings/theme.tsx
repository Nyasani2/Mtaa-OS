// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeBackground } from '@/components/ThemeBackground';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function ThemeSettingsScreen() {
  const { currentTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background[0] }]}>
      <ThemeBackground />
      <View style={styles.content}>
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
