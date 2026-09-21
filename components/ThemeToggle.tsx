// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeContext';
import { themes, ThemeType } from '@/lib/theme/themes';

export function ThemeToggle() {
  const { currentTheme, themeType, setTheme } = useTheme();

  const themeOptions: ThemeType[] = ['dynamic-green', 'subtle-gradient', 'clean-minimal'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Theme</Text>
      <Text style={styles.subtitle}>Customize the look of MTAA OS</Text>

      <ScrollView style={styles.themeList} showsVerticalScrollIndicator={false}>
        {themeOptions.map((type) => {
          const theme = themes[type];
          const isSelected = themeType === type;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.themeCard,
                isSelected && styles.themeCardSelected,
                { borderColor: theme.colors.accent },
              ]}
              onPress={() => setTheme(type)}
              activeOpacity={0.7}
            >
              <View style={styles.themeHeader}>
                <View
                  style={[
                    styles.themePreview,
                    {
                      backgroundColor: theme.colors.background[0],
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  {theme.animated && (
                    <View style={[styles.animatedDot, { backgroundColor: theme.colors.accent }]} />
                  )}
                </View>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeName, { color: currentTheme.colors.text }]}>
                    {theme.name}
                  </Text>
                  <Text style={[styles.themeDesc, { color: currentTheme.colors.textSecondary }]}>
                    {theme.description}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                )}
              </View>

              {theme.animated && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✨ ANIMATED</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.currentInfo}>
        <Text style={[styles.currentLabel, { color: currentTheme.colors.textSecondary }]}>
          Currently using:
        </Text>
        <Text style={[styles.currentName, { color: currentTheme.colors.accent }]}>
          {currentTheme.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  themeList: {
    flex: 1,
  },
  themeCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  themeCardSelected: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themePreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  themeDesc: {
    fontSize: 12,
  },
  badge: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '700',
  },
  currentInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentName: {
    fontSize: 16,
    fontWeight: '700',
  },
});
