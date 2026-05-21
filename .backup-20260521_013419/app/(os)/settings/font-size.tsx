import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

export default function FontSizeScreen() {
  const [currentSize, setCurrentSize] = useState<FontSize>('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSize();
  }, []);

  const loadSize = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_font_size');
      if (saved) setCurrentSize(saved as FontSize);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleSelect = async (size: FontSize) => {
    setCurrentSize(size);
    try {
      await AsyncStorage.setItem('mtaa_font_size', size);
    } catch (e) {
      // ignore
    }
  };

  const sizes: { id: FontSize; label: string; sampleSize: number }[] = [
    { id: 'small', label: 'Small', sampleSize: 12 },
    { id: 'normal', label: 'Normal', sampleSize: 14 },
    { id: 'large', label: 'Large', sampleSize: 18 },
    { id: 'xlarge', label: 'Extra Large', sampleSize: 22 },
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
      <Text style={styles.title}>Font Size</Text>

      <View style={styles.previewBox}>
        <Text style={[styles.previewText, { fontSize: sizes.find(s => s.id === currentSize)?.sampleSize || 14 }]}>
          The quick brown fox jumps over the lazy dog.
        </Text>
      </View>

      {sizes.map((size) => (
        <TouchableOpacity
          key={size.id}
          style={[
            styles.sizeCard,
            currentSize === size.id && styles.sizeCardActive
          ]}
          onPress={() => handleSelect(size.id)}
        >
          <Text style={[
            styles.sizeLabel,
            currentSize === size.id && styles.sizeLabelActive
          ]}>
            {size.label}
          </Text>
          <Text style={[
            styles.sizeSample,
            { fontSize: size.sampleSize },
            currentSize === size.id && styles.sizeSampleActive
          ]}>
            Aa
          </Text>
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
  previewBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewText: { color: '#fff' },
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeCardActive: { borderColor: '#6366f1' },
  sizeLabel: { color: '#fff', fontSize: 16 },
  sizeLabelActive: { fontWeight: '600' },
  sizeSample: { color: '#888' },
  sizeSampleActive: { color: '#6366f1' },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
