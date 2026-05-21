import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light' | 'system' | 'amoled';

export default function ThemeScreen() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_theme');
      if (saved) setCurrentTheme(saved as ThemeMode);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleSelect = async (theme: ThemeMode) => {
    setCurrentTheme(theme);
    try {
      await AsyncStorage.setItem('mtaa_theme', theme);
      // In real app, trigger global theme change via context or event
    } catch (e) {
      // ignore
    }
  };

  const themes: { id: ThemeMode; name: string; desc: string; preview: string }[] = [
    { id: 'dark', name: 'Dark', desc: 'Default dark theme', preview: '#0a0a0a' },
    { id: 'amoled', name: 'AMOLED Black', desc: 'Pure black for OLED screens', preview: '#000000' },
    { id: 'light', name: 'Light', desc: 'Light mode for daytime', preview: '#f5f5f5' },
    { id: 'system', name: 'System', desc: 'Follows device settings', preview: '#6366f1' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Theme</Text>

      {themes.map((theme) => (
        <TouchableOpacity
          key={theme.id}
          style={[
            styles.themeCard,
            currentTheme === theme.id && styles.themeCardActive
          ]}
          onPress={() => handleSelect(theme.id)}
        >
          <View style={[styles.preview, { backgroundColor: theme.preview }]} />
          <View style={styles.themeInfo}>
            <Text style={styles.themeName}>{theme.name}</Text>
            <Text style={styles.themeDesc}>{theme.desc}</Text>
          </View>
          {currentTheme === theme.id && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: { borderColor: '#6366f1' },
  preview: { width: 48, height: 48, borderRadius: 8, marginRight: 16, borderWidth: 1, borderColor: '#333' },
  themeInfo: { flex: 1 },
  themeName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  themeDesc: { color: '#888', fontSize: 13, marginTop: 2 },
  checkmark: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
