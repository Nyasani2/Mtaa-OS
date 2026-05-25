// lib/civic/prisons/components/ProcurementForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonProcurement, ProcurementCategory } from '@/types/prisons';

interface ProcurementData {
  facility_id: string;
  item_name: string;
  category: ProcurementCategory;
  quantity: number;
  unit_cost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  vendor_name: string;
}

export function ProcurementForm({ onSubmit }: { onSubmit?: (data: ProcurementData) => void }) {
  const [form, setForm] = useState<ProcurementData>({
    facility_id: '',
    item_name: '',
    category: 'food',
    quantity: 0,
    unit_cost: 0,
    urgency: 'medium',
    vendor_name: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Procurement</Text>
      <TextInput style={styles.input} placeholder="Facility ID" value={form.facility_id} onChangeText={v => setForm(f => ({ ...f, facility_id: v }))} />
      <TextInput style={styles.input} placeholder="Item Name" value={form.item_name} onChangeText={v => setForm(f => ({ ...f, item_name: v }))} />
      <TextInput style={styles.input} placeholder="Quantity" value={String(form.quantity)} onChangeText={v => setForm(f => ({ ...f, quantity: parseInt(v) || 0 }))} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Unit Cost (KES)" value={String(form.unit_cost)} onChangeText={v => setForm(f => ({ ...f, unit_cost: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Vendor Name" value={form.vendor_name} onChangeText={v => setForm(f => ({ ...f, vendor_name: v }))} />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Submit Request</Text>
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
