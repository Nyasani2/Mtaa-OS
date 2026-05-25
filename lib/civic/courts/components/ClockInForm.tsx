// lib/civic/courts/components/ClockInForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CourtStaffAttendance, StaffType } from '@/types/courts';

interface ClockInData {
  court_house_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  station_id: string;
}

export function ClockInForm({ onSubmit }: { onSubmit?: (data: ClockInData) => void }) {
  const [form, setForm] = useState<ClockInData>({
    court_house_id: '',
    staff_id: '',
    staff_name: '',
    staff_type: 'clerk',
    station_id: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Staff Clock In</Text>
      <TextInput style={styles.input} placeholder="Court House ID" value={form.court_house_id} onChangeText={v => setForm(f => ({ ...f, court_house_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff ID" value={form.staff_id} onChangeText={v => setForm(f => ({ ...f, staff_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff Name" value={form.staff_name} onChangeText={v => setForm(f => ({ ...f, staff_name: v }))} />
      <TextInput style={styles.input} placeholder="Station ID" value={form.station_id} onChangeText={v => setForm(f => ({ ...f, station_id: v }))} />
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
