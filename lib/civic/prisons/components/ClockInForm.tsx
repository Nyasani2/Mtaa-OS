// lib/civic/prisons/components/ClockInForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonStaffAttendance, StaffType } from '@/types/prisons';

interface ClockInData {
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  tower_id: string;
  cell_block_id: string;
}

export function ClockInForm({ onSubmit }: { onSubmit?: (data: ClockInData) => void }) {
  const [form, setForm] = useState<ClockInData>({
    facility_id: '',
    staff_id: '',
    staff_name: '',
    staff_type: 'warder',
    tower_id: '',
    cell_block_id: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Staff Clock In</Text>
      <TextInput style={styles.input} placeholder="Facility ID" value={form.facility_id} onChangeText={v => setForm(f => ({ ...f, facility_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff ID" value={form.staff_id} onChangeText={v => setForm(f => ({ ...f, staff_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff Name" value={form.staff_name} onChangeText={v => setForm(f => ({ ...f, staff_name: v }))} />
      <TextInput style={styles.input} placeholder="Tower ID" value={form.tower_id} onChangeText={v => setForm(f => ({ ...f, tower_id: v }))} />
      <TextInput style={styles.input} placeholder="Cell Block ID" value={form.cell_block_id} onChangeText={v => setForm(f => ({ ...f, cell_block_id: v }))} />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Clock In</Text>
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
