import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Pill, CheckCircle2, AlertTriangle, User, Printer, QrCode } from 'lucide-react-native';

interface PrescriptionDetail {
  id: string; patient_name: string; medication_name: string; dosage: string;
  frequency: string; duration_days: number; quantity: number; instructions: string;
  prescriber_name: string; prescribed_at: string; allergies: string[];
}

export default function DispenseScreen() {
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantityDispensed, setQuantityDispensed] = useState('');
  const [counselingNotes, setCounselingNotes] = useState('');

  useEffect(() => { if (prescriptionId) loadPrescription(); }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patients(full_name, allergies), profiles:prescriber_id(full_name)')
        .eq('id', prescriptionId).single();
      if (error) throw error;
      setPrescription({
        id: data.id, patient_name: data.patients?.full_name || 'Unknown',
        medication_name: data.name, dosage: data.dosage, frequency: data.frequency,
        duration_days: data.duration_days, quantity: data.quantity,
        instructions: data.instructions || '',
        prescriber_name: data.profiles?.full_name || 'Unknown',
        prescribed_at: data.created_at,
        allergies: data.patients?.allergies || [],
      });
      setQuantityDispensed(data.quantity?.toString() || '');
    } catch (err) { Alert.alert('Error', 'Failed to load prescription'); }
  };

  const dispense = async () => {
    if (!batchNumber.trim() || !expiryDate.trim()) {
      Alert.alert('Error', 'Batch number and expiry date are required');
      return;
    }
    try {
      // Update pharmacy queue
      await supabase.from('pharmacy_queue').update({
        status: 'dispensed', dispensed_at: new Date().toISOString(),
        pharmacist_id: user?.id, batch_number: batchNumber, expiry_date: expiryDate,
      }).eq('prescription_id', prescriptionId);

      // Deduct from inventory
      await supabase.rpc('deduct_pharmacy_stock', {
        p_medication_name: prescription?.medication_name,
        p_quantity: parseInt(quantityDispensed) || prescription?.quantity || 0,
      });

      // Create dispensing record
      await supabase.from('dispensing_records').insert({
        prescription_id: prescriptionId, pharmacist_id: user?.id,
        batch_number: batchNumber, expiry_date: expiryDate,
        quantity_dispensed: parseInt(quantityDispensed) || prescription?.quantity,
        counseling_notes: counselingNotes || null,
      });

      Alert.alert('Dispensed', 'Medication dispensed successfully');
      router.back();
    } catch (err) { Alert.alert('Error', 'Failed to dispense medication'); }
  };

  if (!prescription) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispense</Text>
        <TouchableOpacity onPress={dispense} style={styles.dispenseBtn}>
          <CheckCircle2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Patient Safety Check */}
      {prescription.allergies.length > 0 && (
        <View style={styles.allergyBanner}>
          <AlertTriangle size={20} color="#ef4444" />
          <View>
            <Text style={styles.allergyTitle}>Patient Allergies</Text>
            <Text style={styles.allergyText}>{prescription.allergies.join(', ')}</Text>
          </View>
        </View>
      )}

      {/* Prescription Details */}
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <User size={16} color="#94a3b8" />
          <Text style={styles.detailLabel}>Patient</Text>
          <Text style={styles.detailValue}>{prescription.patient_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Pill size={16} color="#6366f1" />
          <Text style={styles.detailLabel}>Medication</Text>
          <Text style={styles.detailValue}>{prescription.medication_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dosage</Text>
          <Text style={styles.detailValue}>{prescription.dosage}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>{prescription.frequency}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{prescription.duration_days} days</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{prescription.quantity} units</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Prescriber</Text>
          <Text style={styles.detailValue}>{prescription.prescriber_name}</Text>
        </View>
        {prescription.instructions && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsLabel}>Instructions</Text>
            <Text style={styles.instructionsText}>{prescription.instructions}</Text>
          </View>
        )}
      </View>

      {/* Dispensing Form */}
      <Text style={styles.sectionTitle}>Dispensing Details</Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Batch Number</Text>
        <TextInput style={styles.input} placeholder="Enter batch/lot number" placeholderTextColor="#64748b"
          value={batchNumber} onChangeText={setBatchNumber} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Expiry Date</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b"
          value={expiryDate} onChangeText={setExpiryDate} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Quantity Dispensed</Text>
        <TextInput style={styles.input} keyboardType="numeric" placeholder={prescription.quantity.toString()} placeholderTextColor="#64748b"
          value={quantityDispensed} onChangeText={setQuantityDispensed} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Counseling Notes</Text>
        <TextInput style={styles.textArea} multiline placeholder="Patient counseling notes..." placeholderTextColor="#64748b"
          value={counselingNotes} onChangeText={setCounselingNotes} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dispenseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 16, backgroundColor: '#7f1d1d', borderRadius: 12, padding: 14 },
  allergyTitle: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  allergyText: { color: '#fca5a5', fontSize: 13, marginTop: 2 },
  detailCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1e293b', borderRadius: 16, padding: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  detailLabel: { color: '#94a3b8', fontSize: 13, width: 100 },
  detailValue: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  instructionsBox: { marginTop: 12, backgroundColor: '#0f172a', borderRadius: 10, padding: 12 },
  instructionsLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  instructionsText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginBottom: 12 },
  formGroup: { marginHorizontal: 16, marginBottom: 16 },
  formLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  textArea: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
});
