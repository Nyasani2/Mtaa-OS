import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';
import * as Device from 'expo-device';

export default function BugReportScreen() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('bug');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'bug', label: '🐛 Bug', desc: 'Something is broken' },
    { id: 'feature', label: '✨ Feature Request', desc: 'Suggest an improvement' },
    { id: 'performance', label: '🐌 Performance', desc: 'App is slow or laggy' },
    { id: 'crash', label: '💥 Crash', desc: 'App crashes or freezes' },
    { id: 'ui', label: '🎨 UI Issue', desc: 'Visual or layout problem' },
    { id: 'other', label: '📝 Other', desc: 'Something else' },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue');
      return;
    }

    setSubmitting(true);

    const deviceInfo = {
      brand: Device.brand,
      model: Device.modelName,
      systemVersion: Device.systemVersion,
      os: Device.osName,
    };

    const { error } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user?.id,
        category,
        description: description.trim(),
        device_info: deviceInfo,
        status: 'open',
        created_at: new Date().toISOString(),
      });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping improve MTAA OS. We will investigate and respond via support.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report a Bug</Text>
      <Text style={styles.subtitle}>Help us improve MTAA OS</Text>

      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryBtn,
              category === cat.id && styles.categoryBtnActive
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={[
              styles.categoryDesc,
              category === cat.id && styles.categoryDescActive
            ]}>{cat.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        style={styles.descriptionInput}
        placeholder="Describe what happened, steps to reproduce, and expected behavior..."
        placeholderTextColor="#888"
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        value={description}
        onChange={setDescription}
      />

      <TouchableOpacity 
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting...' : '📤 Submit Report'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 24 },
  categoryBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryBtnActive: { borderColor: '#6366f1', backgroundColor: '#6366f110' },
  categoryLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoryDesc: { color: '#888', fontSize: 11, marginTop: 2 },
  categoryDescActive: { color: '#6366f1' },
  descriptionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 160,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 8, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#888', fontSize: 14 },
});
