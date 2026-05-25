// lib/civic/prisons/components/MovementForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonMovement, MovementType } from '@/types/prisons';

interface MovementData {
  inmate_id: string;
  movement_type: MovementType;
  from_facility_id: string;
  to_facility_id: string;
  reason: string;
}

export function MovementForm({ onSubmit }: { onSubmit?: (data: MovementData) => void }) {
  const [form, setForm] = useState<MovementData>({
    inmate_id: '',
    movement_type: 'transfer_in',
    from_facility_id: '',
    to_facility_id: '',
    reason: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Record Movement</Text>
      <TextInput style={styles.input} placeholder="Inmate ID" value={form.inmate_id} onChangeText={v => setForm(f => ({ ...f, inmate_id: v }))} />
      <TextInput style={styles.input} placeholder="From Facility ID" value={form.from_facility_id} onChangeText={v => setForm(f => ({ ...f, from_facility_id: v }))} />
      <TextInput style={styles.input} placeholder="To Facility ID" value={form.to_facility_id} onChangeText={v => setForm(f => ({ ...f, to_facility_id: v }))} />
      <TextInput style={styles.input} placeholder="Reason" value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))} />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Record</Text>
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
