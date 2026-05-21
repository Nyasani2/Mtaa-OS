// app/(os)/settings/bug-report.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { key: 'ui_bug', label: 'UI / Display Issue', icon: 'desktop' },
  { key: 'crash', label: 'App Crash', icon: 'warning' },
  { key: 'performance', label: 'Slow / Laggy', icon: 'timer' },
  { key: 'payment', label: 'Payment Problem', icon: 'card' },
  { key: 'security', label: 'Security Issue', icon: 'shield' },
  { key: 'feature', label: 'Feature Request', icon: 'bulb' },
  { key: 'other', label: 'Other', icon: 'help-circle' },
];

export default function BugReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState('ui_bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isLoading, setIsLoading] = useState(false);

  const submitReport = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id,
        category,
        title: title.trim(),
        description: description.trim(),
        severity,
        status: 'open',
        platform: 'mobile',
        app_version: '1.0.0',
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: 'MTAA-OS-Mobile',
        },
      });

      if (error) throw error;

      Alert.alert(
        'Report Submitted',
        'Thank you! Our team will review your report and respond within 24 hours.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Issue Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryButton, category === cat.key && styles.categoryActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Ionicons name={cat.icon as any} size={20} color={category === cat.key ? '#3B82F6' : '#64748B'} />
              <Text style={[styles.categoryLabel, category === cat.key && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Severity</Text>
        <View style={styles.severityRow}>
          {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
            <TouchableOpacity
              key={sev}
              style={[styles.severityButton, severity === sev && styles.severityActive(sev)]}
              onPress={() => setSeverity(sev)}
            >
              <Text style={[styles.severityLabel, severity === sev && styles.severityLabelActive]}>
                {sev.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of the issue"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed description. Include steps to reproduce if applicable."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
        />
        <Text style={styles.charCount}>{description.length}/2000</Text>

        <TouchableOpacity style={styles.submitButton} onPress={submitReport} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 16, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  categoryActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  categoryLabel: { fontSize: 12, color: '#64748B' },
  categoryLabelActive: { color: '#3B82F6', fontWeight: '600' },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  severityActive: (sev: string) => ({
    borderColor: sev === 'critical' ? '#EF4444' : sev === 'high' ? '#F59E0B' : sev === 'medium' ? '#3B82F6' : '#10B981',
    backgroundColor: sev === 'critical' ? '#FEE2E2' : sev === 'high' ? '#FEF3C7' : sev === 'medium' ? '#EFF6FF' : '#D1FAE5',
  }),
  severityLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  severityLabelActive: { color: '#1E293B' },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14, color: '#1E293B' },
  textArea: { height: 120, paddingTop: 12 },
  charCount: { fontSize: 12, color: '#94A3B8', textAlign: 'right', marginTop: 4 },
  submitButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
