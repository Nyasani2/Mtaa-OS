import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'violet' | 'orange' | 'pink';

export default function AccentScreen() {
  const [currentAccent, setCurrentAccent] = useState<AccentColor>('indigo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccent();
  }, []);

  const loadAccent = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_accent');
      if (saved) setCurrentAccent(saved as AccentColor);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleSelect = async (accent: AccentColor) => {
    setCurrentAccent(accent);
    try {
      await AsyncStorage.setItem('mtaa_accent', accent);
    } catch (e) {
      // ignore
    }
  };

  const accents: { id: AccentColor; name: string; color: string }[] = [
    { id: 'indigo', name: 'Indigo', color: '#6366f1' },
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
    { id: 'rose', name: 'Rose', color: '#f43f5e' },
    { id: 'amber', name: 'Amber', color: '#f59e0b' },
    { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
    { id: 'violet', name: 'Violet', color: '#8b5cf6' },
    { id: 'orange', name: 'Orange', color: '#f97316' },
    { id: 'pink', name: 'Pink', color: '#ec4899' },
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
      <Text style={styles.title}>Accent Color</Text>
      <Text style={styles.subtitle}>Personalize your MTAA experience</Text>

      <View style={styles.previewBox}>
        <View style={[styles.previewBar, { backgroundColor: accents.find(a => a.id === currentAccent)?.color || '#6366f1' }]} />
        <Text style={styles.previewText}>This is how buttons and highlights will look</Text>
      </View>

      <View style={styles.grid}>
        {accents.map((accent) => (
          <TouchableOpacity
            key={accent.id}
            style={[
              styles.colorBtn,
              { backgroundColor: accent.color },
              currentAccent === accent.id && styles.colorBtnActive
            ]}
            onPress={() => handleSelect(accent.id)}
          >
            {currentAccent === accent.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
            <Text style={styles.colorName}>{accent.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  previewBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  previewBar: { width: '100%', height: 8, borderRadius: 4, marginBottom: 12 },
  previewText: { color: '#888', fontSize: 13 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  colorBtn: {
    width: '47%',
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorBtnActive: { borderColor: '#fff' },
  checkmark: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  colorName: { color: '#fff', fontSize: 14, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
