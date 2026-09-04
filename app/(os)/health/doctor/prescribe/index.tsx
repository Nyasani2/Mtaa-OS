// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, ArrowLeft, Pill, Plus, Trash2, Send, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Alert, useHealthRole } from '@/lib/health/hooks';

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function DoctorPrescribeScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof PrescriptionItem, value: string) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };

  const handleSubmit = async () => {
    if (!patientId.trim() || !diagnosis.trim() || items.some((i) => !i.medication.trim())) {
      Alert.alert('Missing Info', 'Please fill patient ID, diagnosis, and at least one medication.');
      return;
    }
    setSaving(true);
    try {
      const { data: rx, error: rxError } = await supabase.from('health_prescriptions').insert({
        patient_id: patientId,
        doctor_id: staffRecord?.id,
        facility_id: staffRecord?.facility_id,
        diagnosis,
        status: 'pending',
      }).select('id').single();

      if (rxError) throw rxError;

      const itemsToInsert = items.map((i) => ({
        prescription_id: rx.id,
        medication: i.medication,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        instructions: i.instructions,
      }));

      const { error: itemsError } = await supabase.from('health_prescription_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      Alert.alert('Success', 'Prescription sent to pharmacy.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Write Prescription</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Patient ID</Text>
        <View style={styles.inputRow}>
          <User size={18} color="#9ca3af" />
          <TextInput style={styles.input} placeholder="Enter patient ID or scan" value={patientId} onChangeText={setPatientId} placeholderTextColor="#9ca3af" />
        </View>

        <Text style={styles.label}>Patient Name (optional)</Text>
        <TextInput style={styles.inputBox} placeholder="Patient name" value={patientName} onChangeText={setPatientName} placeholderTextColor="#9ca3af" />

        <Text style={styles.label}>Diagnosis</Text>
        <TextInput style={[styles.inputBox, { minHeight: 60 }]} placeholder="Enter diagnosis..." value={diagnosis} onChangeText={setDiagnosis} multiline placeholderTextColor="#9ca3af" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pill size={20} color="#a855f7" />
          <Text style={styles.sectionTitle}>Medications</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>#{idx + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(idx)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
              )}
            </View>
            <TextInput style={styles.itemInput} placeholder="Medication name" value={item.medication} onChangeText={(v) => updateItem(idx, 'medication', v)} placeholderTextColor="#9ca3af" />
            <View style={styles.itemRow}>
              <TextInput style={[styles.itemInput, { flex: 1 }]} placeholder="Dosage (e.g. 500mg)" value={item.dosage} onChangeText={(v) => updateItem(idx, 'dosage', v)} placeholderTextColor="#9ca3af" />
              <TextInput style={[styles.itemInput, { flex: 1, marginLeft: 8 }]} placeholder="Frequency" value={item.frequency} onChangeText={(v) => updateItem(idx, 'frequency', v)} placeholderTextColor="#9ca3af" />
            </View>
            <View style={styles.itemRow}>
              <TextInput style={[styles.itemInput, { flex: 1 }]} placeholder="Duration (e.g. 7 days)" value={item.duration} onChangeText={(v) => updateItem(idx, 'duration', v)} placeholderTextColor="#9ca3af" />
            </View>
            <TextInput style={[styles.itemInput, { minHeight: 50 }]} placeholder="Special instructions" value={item.instructions} onChangeText={(v) => updateItem(idx, 'instructions', v)} multiline placeholderTextColor="#9ca3af" />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Plus size={18} color="#2563eb" />
          <Text style={styles.addBtnText}>Add Medication</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.submitText}>Send to Pharmacy</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  section: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1f2937' },
  inputBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1f2937' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  itemCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemNumber: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  itemInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1f2937', marginBottom: 8 },
  itemRow: { flexDirection: 'row' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, borderStyle: 'dashed', gap: 6 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', marginHorizontal: 16, marginVertical: 20, paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
