// lib/civic/courts/components/BailForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CourtBail, BailType } from '@/types/courts';

interface BailFormData {
  case_id: string;
  party_id: string;
  bail_type: BailType;
  amount: number;
  conditions: string;
}

export function BailForm({ onSubmit }: { onSubmit?: (data: BailFormData) => void }) {
  const [form, setForm] = useState<BailFormData>({
    case_id: '',
    party_id: '',
    bail_type: 'cash',
    amount: 0,
    conditions: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Post Bail</Text>
      <TextInput style={styles.input} placeholder="Case ID" value={form.case_id} onChangeText={v => setForm(f => ({ ...f, case_id: v }))} />
      <TextInput style={styles.input} placeholder="Party ID" value={form.party_id} onChangeText={v => setForm(f => ({ ...f, party_id: v }))} />
      <TextInput style={styles.input} placeholder="Amount (KES)" value={String(form.amount)} onChangeText={v => setForm(f => ({ ...f, amount: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Conditions (comma separated)" value={form.conditions} onChangeText={v => setForm(f => ({ ...f, conditions: v }))} />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Post Bail</Text>
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
