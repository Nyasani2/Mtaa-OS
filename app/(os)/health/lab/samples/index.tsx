// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, ChevronLeft, QrCode, Package, User, CheckCircle2, AlertTriangle } from 'lucide-react-native';

interface Sample {
  id: string; barcode: string; patient_id: string; patient_name: string;
  test_name: string; sample_type: string; collected_at: string | null;
  collector_id: string | null; status: 'pending' | 'collected' | 'rejected' | 'in_transit' | 'received';
  rejection_reason: string | null; notes: string | null;
}

export default function SampleCollectionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  useEffect(() => { loadSamples(); }, []);

  const loadSamples = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_samples')
        .select('*, patients(full_name), lab_tests(test_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const formatted = (data || []).map((s: any) => ({
        id: s.id, barcode: s.barcode, patient_id: s.patient_id,
        patient_name: s.patients?.full_name || 'Unknown',
        test_name: s.lab_tests?.test_name || 'Unknown',
        sample_type: s.sample_type, collected_at: s.collected_at,
        collector_id: s.collector_id, status: s.status,
        rejection_reason: s.rejection_reason, notes: s.notes,
      }));
      setSamples(formatted);
    } catch (err) { Alert.alert('Error', 'Failed to load samples'); }
  };

  const collectSample = async (sampleId: string) => {
    try {
      const { error } = await supabase.from('lab_samples').update({
        status: 'collected', collected_at: new Date().toISOString(), collector_id: user?.id,
      }).eq('id', sampleId);
      if (error) throw error;
      await supabase.from('lab_tests').update({ status: 'collected' }).eq('sample_id', sampleId);
      loadSamples();
    } catch (err) { Alert.alert('Error', 'Failed to collect sample'); }
  };

  const rejectSample = async (sampleId: string, reason: string) => {
    try {
      const { error } = await supabase.from('lab_samples').update({
        status: 'rejected', rejection_reason: reason,
      }).eq('id', sampleId);
      if (error) throw error;
      loadSamples();
    } catch (err) { Alert.alert('Error', 'Failed to reject sample'); }
  };

  const scanBarcode = () => {
    if (!barcodeInput.trim()) return;
    const sample = samples.find((s: any) => s.barcode === barcodeInput.trim());
    if (sample) { collectSample(sample.id); setBarcodeInput(''); }
    else { Alert.alert('Not Found', 'No pending sample found with this barcode'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sample Collection</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scannerCard}>
        <View style={styles.scannerIcon}>
          <QrCode size={32} color="#6366f1" />
        </View>
        <TextInput style={styles.barcodeInput} placeholder="Scan or enter barcode..." placeholderTextColor="#64748b"
          value={barcodeInput} onChangeText={setBarcodeInput} onSubmitEditing={scanBarcode} autoFocus />
        <TouchableOpacity style={styles.scanBtn} onPress={scanBarcode}>
          <CheckCircle2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Pending Collection ({samples.length})</Text>

      <FlatList
        data={samples}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.sampleCard}>
            <View style={styles.sampleHeader}>
              <View>
                <Text style={styles.sampleBarcode}>{item.barcode}</Text>
                <Text style={styles.sampleTest}>{item.test_name}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.sample_type}</Text>
              </View>
            </View>
            <View style={styles.patientRow}>
              <User size={14} color="#94a3b8" />
              <Text style={styles.patientText}>{item.patient_name}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.collectBtn} onPress={() => collectSample(item.id)}>
                <Package size={14} color="#fff" /><Text style={styles.collectText}>Collect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => {
                Alert.alert('Reject Sample', 'Reason:', [
                  { text: 'Hemolysis', onPress: () => rejectSample(item.id, 'Hemolysis') },
                  { text: 'Insufficient', onPress: () => rejectSample(item.id, 'Insufficient volume') },
                  { text: 'Wrong tube', onPress: () => rejectSample(item.id, 'Wrong tube type') },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}>
                <AlertTriangle size={14} color="#ef4444" /><Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No pending samples</Text>
            <Text style={styles.emptySubtitle}>All samples have been collected</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 12, gap: 12 },
  scannerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center' },
  barcodeInput: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginBottom: 8 },
  sampleCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  sampleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sampleBarcode: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  sampleTest: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  typeBadge: { backgroundColor: '#312e81', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { color: '#c7d2fe', fontSize: 10, fontWeight: '700' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  patientText: { color: '#cbd5e1', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10 },
  collectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12 },
  collectText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  rejectText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
});
