// lib/civic/courts/components/AppealForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CourtAppeal, AppealType } from '@/types/courts';

interface AppealFormData {
  original_case_id: string;
  original_judgment_id: string;
  appeal_case_number: string;
  appellant_party_id: string;
  appeal_type: AppealType;
  grounds: string;
  appellate_court_id: string;
}

export function AppealForm({ onSubmit }: { onSubmit?: (data: AppealFormData) => void }) {
  const [form, setForm] = useState<AppealFormData>({
    original_case_id: '',
    original_judgment_id: '',
    appeal_case_number: '',
    appellant_party_id: '',
    appeal_type: 'civil',
    grounds: '',
    appellate_court_id: '',
  });

  const handleSubmit = () => {
    onSubmit?.(form);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>File Appeal</Text>
      <TextInput style={styles.input} placeholder="Original Case ID" value={form.original_case_id} onChangeText={v => setForm(f => ({ ...f, original_case_id: v }))} />
      <TextInput style={styles.input} placeholder="Original Judgment ID" value={form.original_judgment_id} onChangeText={v => setForm(f => ({ ...f, original_judgment_id: v }))} />
      <TextInput style={styles.input} placeholder="Appeal Case Number" value={form.appeal_case_number} onChangeText={v => setForm(f => ({ ...f, appeal_case_number: v }))} />
      <TextInput style={styles.input} placeholder="Appellant Party ID" value={form.appellant_party_id} onChangeText={v => setForm(f => ({ ...f, appellant_party_id: v }))} />
      <TextInput style={styles.input} placeholder="Grounds of appeal" value={form.grounds} onChangeText={v => setForm(f => ({ ...f, grounds: v }))} multiline />
      <TextInput style={styles.input} placeholder="Appellate Court ID" value={form.appellate_court_id} onChangeText={v => setForm(f => ({ ...f, appellate_court_id: v }))} />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Appeal</Text>
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
