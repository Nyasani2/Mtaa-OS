// lib/civic/prisons/components/CellForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonCell, CellType, SecurityLevel } from '@/types/prisons';

interface CellFormData {
  facility_id: string;
  cell_block: string;
  cell_number: string;
  capacity: number;
  cell_type: CellType;
  security_level: SecurityLevel;
}

export function CellForm({ onSubmit }: { onSubmit?: (data: CellFormData) => void }) {
  const [form, setForm] = useState<CellFormData>({
    facility_id: '',
    cell_block: '',
    cell_number: '',
    capacity: 0,
    cell_type: 'shared',
    security_level: 'medium',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Cell</Text>
      <TextInput style={styles.input} placeholder="Facility ID" value={form.facility_id} onChangeText={v => setForm(f => ({ ...f, facility_id: v }))} />
      <TextInput style={styles.input} placeholder="Cell Block" value={form.cell_block} onChangeText={v => setForm(f => ({ ...f, cell_block: v }))} />
      <TextInput style={styles.input} placeholder="Cell Number" value={form.cell_number} onChangeText={v => setForm(f => ({ ...f, cell_number: v }))} />
      <TextInput style={styles.input} placeholder="Capacity" value={String(form.capacity)} onChangeText={v => setForm(f => ({ ...f, capacity: parseInt(v) || 0 }))} keyboardType="number-pad" />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Add Cell</Text>
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
