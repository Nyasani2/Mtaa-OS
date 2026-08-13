// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FlaskConical, Plus, Trash2, Send, User, CheckSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose',
  'Liver Function Test',
  'Kidney Function Test',
  'Thyroid Panel',
  'Urinalysis',
  'Stool Analysis',
  'HIV Test',
  'Malaria Parasite',
  'COVID-19 PCR',
  'X-Ray',
  'Ultrasound',
  'CT Scan',
  'MRI',
  'ECG',
  'Echocardiogram',
];

interface TestItem {
  test_name: string;
  urgency: 'routine' | 'urgent' | 'stat';
  notes: string;
}

export default function DoctorLabOrdersScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [items, setItems] = useState<TestItem[]>([{ test_name: '', urgency: 'routine', notes: '' }]);
  const [saving, setSaving] = useState(false);
  const [showCommon, setShowCommon] = useState(false);

  const addItem = () => setItems([...items, { test_name: '', urgency: 'routine', notes: '' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof TestItem, value: string) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };
  const addCommonTest = (name: string) => {
    setItems([...items, { test_name: name, urgency: 'routine', notes: '' }]);
    setShowCommon(false);
  };

  const handleSubmit = async () => {
    if (!patientId.trim() || items.some((i) => !i.test_name.trim())) {
      Alert.alert('Missing Info', 'Please fill patient ID and at least one test.');
      return;
    }
    setSaving(true);
    try {
      const { data: order, error: orderError } = await supabase.from('health_lab_orders').insert({
        patient_id: patientId,
        doctor_id: staffRecord?.id,
        facility_id: staffRecord?.facility_id,
        status: 'pending',
      }).select('id').single();

      if (orderError) throw orderError;

      const itemsToInsert = items.map((i) => ({
        order_id: order.id,
        test_name: i.test_name,
        urgency: i.urgency,
        notes: i.notes,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase.from('health_lab_order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      Alert.alert('Success', 'Lab order sent to laboratory.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create lab order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Orders</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Patient ID</Text>
        <View style={styles.inputRow}>
          <User size={18} color="#9ca3af" />
          <TextInput style={styles.input} placeholder="Enter patient ID" value={patientId} onChangeText={setPatientId} placeholderTextColor="#9ca3af" />
        </View>
        <Text style={styles.label}>Patient Name (optional)</Text>
        <TextInput style={styles.inputBox} placeholder="Patient name" value={patientName} onChangeText={setPatientName} placeholderTextColor="#9ca3af" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FlaskConical size={20} color="#06b6d4" />
          <Text style={styles.sectionTitle}>Tests</Text>
        </View>

        <TouchableOpacity style={styles.commonBtn} onPress={() => setShowCommon(!showCommon)}>
          <CheckSquare size={16} color="#2563eb" />
          <Text style={styles.commonBtnText}>{showCommon ? 'Hide Common Tests' : 'Browse Common Tests'}</Text>
        </TouchableOpacity>

        {showCommon && (
          <View style={styles.commonList}>
            {COMMON_TESTS.map((t) => (
              <TouchableOpacity key={t} style={styles.commonItem} onPress={() => addCommonTest(t)}>
                <Text style={styles.commonItemText}>{t}</Text>
                <Plus size={14} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {items.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>#{idx + 1}</Text>
              {items.length > 1 && <TouchableOpacity onPress={() => removeItem(idx)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>}
            </View>
            <TextInput style={styles.itemInput} placeholder="Test name" value={item.test_name} onChangeText={(v) => updateItem(idx, 'test_name', v)} placeholderTextColor="#9ca3af" />
            <View style={styles.urgencyRow}>
              {(['routine', 'urgent', 'stat'] as const).map((u) => (
                <TouchableOpacity key={u} style={[styles.urgencyChip, item.urgency === u && styles.urgencyChipActive]} onPress={() => updateItem(idx, 'urgency', u)}>
                  <Text style={[styles.urgencyText, item.urgency === u && styles.urgencyTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.itemInput, { minHeight: 50 }]} placeholder="Clinical notes" value={item.notes} onChangeText={(v) => updateItem(idx, 'notes', v)} multiline placeholderTextColor="#9ca3af" />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Plus size={18} color="#2563eb" />
          <Text style={styles.addBtnText}>Add Test</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.submitText}>Send to Lab</Text></>}
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
  commonBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  commonBtnText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  commonList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  commonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  commonItemText: { fontSize: 13, color: '#374151' },
  itemCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemNumber: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  itemInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1f2937', marginBottom: 8 },
  urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  urgencyChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f3f4f6' },
  urgencyChipActive: { backgroundColor: '#dc2626' },
  urgencyText: { fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'capitalize' },
  urgencyTextActive: { color: '#fff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, borderStyle: 'dashed', gap: 6 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', marginHorizontal: 16, marginVertical: 20, paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
