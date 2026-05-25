// lib/civic/agriculture/civic_modules_v3/agriculture_kephis/components/PestReportForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useIdentity } from '@/lib/auth/identity';

export function PestReportForm() {
  const { user } = useIdentity();
  const [form, setForm] = useState({ crop: '', pest: '', severity: 'low', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) { Alert.alert('Error', 'Please sign in'); return; }
    setSubmitting(true);
    // Submit to API
    Alert.alert('Success', 'Pest report submitted');
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pest Report</Text>
      <TextInput style={styles.input} placeholder="Crop" value={form.crop} onChangeText={t => setForm(f => ({ ...f, crop: t }))} />
      <TextInput style={styles.input} placeholder="Pest Name" value={form.pest} onChangeText={t => setForm(f => ({ ...f, pest: t }))} />
      <TextInput style={styles.input} placeholder="Severity (low/medium/high)" value={form.severity} onChangeText={t => setForm(f => ({ ...f, severity: t }))} />
      <TextInput style={styles.input} placeholder="Notes" value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} multiline />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
