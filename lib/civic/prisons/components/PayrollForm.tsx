// lib/civic/prisons/components/PayrollForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonPayroll, StaffType } from '@/types/prisons';

interface PayrollData {
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  hazard_allowance: number;
  overtime: number;
  deductions: number;
}

export function PayrollForm({ onSubmit }: { onSubmit?: (data: PayrollData) => void }) {
  const [form, setForm] = useState<PayrollData>({
    facility_id: '',
    staff_id: '',
    staff_name: '',
    staff_type: 'warder',
    pay_period_start: '',
    pay_period_end: '',
    base_amount: 0,
    hazard_allowance: 0,
    overtime: 0,
    deductions: 0,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Process Payroll</Text>
      <TextInput style={styles.input} placeholder="Facility ID" value={form.facility_id} onChangeText={v => setForm(f => ({ ...f, facility_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff ID" value={form.staff_id} onChangeText={v => setForm(f => ({ ...f, staff_id: v }))} />
      <TextInput style={styles.input} placeholder="Staff Name" value={form.staff_name} onChangeText={v => setForm(f => ({ ...f, staff_name: v }))} />
      <TextInput style={styles.input} placeholder="Period Start (YYYY-MM-DD)" value={form.pay_period_start} onChangeText={v => setForm(f => ({ ...f, pay_period_start: v }))} />
      <TextInput style={styles.input} placeholder="Period End (YYYY-MM-DD)" value={form.pay_period_end} onChangeText={v => setForm(f => ({ ...f, pay_period_end: v }))} />
      <TextInput style={styles.input} placeholder="Base Amount" value={String(form.base_amount)} onChangeText={v => setForm(f => ({ ...f, base_amount: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Hazard Allowance" value={String(form.hazard_allowance)} onChangeText={v => setForm(f => ({ ...f, hazard_allowance: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Overtime" value={String(form.overtime)} onChangeText={v => setForm(f => ({ ...f, overtime: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Deductions" value={String(form.deductions)} onChangeText={v => setForm(f => ({ ...f, deductions: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Process</Text>
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
