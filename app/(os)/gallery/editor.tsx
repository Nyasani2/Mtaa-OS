import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, 
  ActivityIndicator, Slider, Alert 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function GalleryEditorScreen() {
  const { uri } = useLocalSearchParams();
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // In a real app, apply filters via canvas or native module
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Saved', 'Edits applied', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1000);
  };

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No image to edit</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit</Text>

      <View style={styles.previewContainer}>
        <Image
          source={{ uri: uri as string }}
          style={[
            styles.preview,
            {
              opacity: brightness,
              // Note: Real filter implementation needs native modules or canvas
            }
          ]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Brightness</Text>
          <Text style={styles.controlValue}>{Math.round(brightness * 100)}%</Text>
        </View>
        {/* Slider would go here - using buttons for simplicity */}
        <View style={styles.sliderRow}>
          <TouchableOpacity onPress={() => setBrightness(Math.max(0.1, brightness - 0.1))}>
            <Text style={styles.sliderBtn}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${brightness * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setBrightness(Math.min(2, brightness + 0.1))}>
            <Text style={styles.sliderBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Contrast</Text>
          <Text style={styles.controlValue}>{Math.round(contrast * 100)}%</Text>
        </View>
        <View style={styles.sliderRow}>
          <TouchableOpacity onPress={() => setContrast(Math.max(0.1, contrast - 0.1))}>
            <Text style={styles.sliderBtn}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${contrast * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setContrast(Math.min(2, contrast + 0.1))}>
            <Text style={styles.sliderBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Saturation</Text>
          <Text style={styles.controlValue}>{Math.round(saturation * 100)}%</Text>
        </View>
        <View style={styles.sliderRow}>
          <TouchableOpacity onPress={() => setSaturation(Math.max(0, saturation - 0.1))}>
            <Text style={styles.sliderBtn}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${saturation * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setSaturation(Math.min(2, saturation + 0.1))}>
            <Text style={styles.sliderBtn}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.resetBtn} onPress={() => {
          setBrightness(1);
          setContrast(1);
          setSaturation(1);
        }}>
          <Text style={styles.resetText}>↺ Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? 'Saving...' : '✓ Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  previewContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  preview: { width: '100%', height: '100%', borderRadius: 12 },
  controls: { padding: 16, paddingBottom: 8 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  controlLabel: { color: '#fff', fontSize: 14 },
  controlValue: { color: '#888', fontSize: 14 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sliderBtn: { color: '#fff', fontSize: 20, paddingHorizontal: 12 },
  sliderTrack: { flex: 1, height: 4, backgroundColor: '#333', borderRadius: 2 },
  sliderFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
  resetBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  resetText: { color: '#888', fontSize: 14 },
  saveBtn: {
    flex: 2,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backButton: { padding: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginTop: 100 },
});
