import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/kernel/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Heart, Thermometer, Wind, Droplets, Activity,
  AlertTriangle, Save, TrendingUp, TrendingDown
} from 'lucide-react-native';

interface VitalReading {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  respiratory_rate: string;
  temperature: string;
  oxygen_saturation: string;
  pain_score: string;
  weight: string;
  height: string;
  blood_glucose: string;
  notes: string;
}

const RANGES: Record<string, { min: number; max: number; unit: string }> = {
  heart_rate: { min: 60, max: 100, unit: 'bpm' },
  respiratory_rate: { min: 12, max: 20, unit: '/min' },
  temperature: { min: 36.1, max: 37.2, unit: 'C' },
  oxygen_saturation: { min: 95, max: 100, unit: '%' },
  pain_score: { min: 0, max: 10, unit: '/10' },
  blood_glucose: { min: 70, max: 140, unit: 'mg/dL' },
};

export default function VitalsEntryScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [patientName, setPatientName] = useState('');
  const [readings, setReadings] = useState<VitalReading>({
    blood_pressure_systolic: '', blood_pressure_diastolic: '',
    heart_rate: '', respiratory_rate: '', temperature: '',
    oxygen_saturation: '', pain_score: '', weight: '', height: '',
    blood_glucose: '', notes: '',
  });
  const [lastReadings, setLastReadings] = useState<any>(null);

  useEffect(() => {
    if (patientId) loadPatientAndHistory();
  }, [patientId]);

  const loadPatientAndHistory = async () => {
    try {
      const { data: patient } = await supabase.from('patients').select('full_name').eq('id', patientId).single();
      if (patient) setPatientName(patient.full_name);
      const { data: history } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      setLastReadings(history);
    } catch (err) {}
  };

  const getTrend = (field: string, current: string) => {
    if (!lastReadings || !current) return null;
    const prev = parseFloat(lastReadings[field]);
    const curr = parseFloat(current);
    if (isNaN(prev) || isNaN(curr)) return null;
    if (curr > prev * 1.1) return 'up';
    if (curr < prev * 0.9) return 'down';
    return 'same';
  };

  const getAlert = (field: string, value: string) => {
    const range = RANGES[field];
    if (!range || !value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < range.min * 0.8 || num > range.max * 1.2) return 'critical';
    if (num < range.min || num > range.max) return 'warning';
    return null;
  };

  const saveVitals = async () => {
    if (!patientId) { Alert.alert('Error', 'No patient selected'); return; }
    try {
      const { error } = await supabase.from('health_profiles').insert({
        patient_id: patientId,
        blood_pressure: `${readings.blood_pressure_systolic}/${readings.blood_pressure_diastolic}`,
        heart_rate: readings.heart_rate ? parseFloat(readings.heart_rate) : null,
        respiratory_rate: readings.respiratory_rate ? parseFloat(readings.respiratory_rate) : null,
        temperature: readings.temperature ? parseFloat(readings.temperature) : null,
        oxygen_saturation: readings.oxygen_saturation ? parseFloat(readings.oxygen_saturation) : null,
        pain_score: readings.pain_score ? parseFloat(readings.pain_score) : null,
        weight: readings.weight ? parseFloat(readings.weight) : null,
        height: readings.height ? parseFloat(readings.height) : null,
        bmi: readings.weight && readings.height ? parseFloat(readings.weight) / Math.pow(parseFloat(readings.height) / 100, 2) : null,
        blood_glucose: readings.blood_glucose ? parseFloat(readings.blood_glucose) : null,
        recorded_by: user?.id,
        notes: readings.notes || null,
      });
      if (error) throw error;

      const criticals = [];
      if (readings.heart_rate && parseFloat(readings.heart_rate) > 120) criticals.push('Elevated heart rate');
      if (readings.temperature && parseFloat(readings.temperature) > 38.5) criticals.push('High fever');
      if (readings.oxygen_saturation && parseFloat(readings.oxygen_saturation) < 90) criticals.push('Low oxygen saturation');
      if (criticals.length > 0) {
        await supabase.from('app_notifications').insert({
          user_id: patientId, title: 'Critical Vital Alert', body: criticals.join(', '), type: 'health_alert',
        });
      }
      Alert.alert('Saved', 'Vitals recorded successfully');
      router.back();
    } catch (err) { Alert.alert('Error', 'Failed to save vitals'); }
  };

  const updateField = (field: keyof VitalReading, value: string) => {
    setReadings(prev => ({ ...prev, [field]: value }));
  };

  const VitalInput = ({ label, field, icon, unit, half }: { label: string; field: keyof VitalReading; icon: React.ReactNode; unit: string; half?: boolean }) => {
    const alert = getAlert(field, readings[field]);
    const trend = getTrend(field, readings[field]);
    return (
      <View style={[styles.inputGroup, half && styles.inputGroupHalf]}>
        <View style={styles.inputLabelRow}>
          {icon}
          <Text style={styles.inputLabel}>{label}</Text>
          {alert === 'critical' && <AlertTriangle size={14} color="#ef4444" />}
          {alert === 'warning' && <AlertTriangle size={14} color="#f59e0b" />}
          {trend === 'up' && <TrendingUp size={14} color="#ef4444" />}
          {trend === 'down' && <TrendingDown size={14} color="#3b82f6" />}
        </View>
        <View style={[styles.inputWrapper, alert === 'critical' && styles.inputCritical, alert === 'warning' && styles.inputWarning]}>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="—" placeholderTextColor="#475569" value={readings[field]} onChangeText={(v) => updateField(field, v)} />
          <Text style={styles.inputUnit}>{unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Vitals Entry</Text>
          {patientName && <Text style={styles.patientName}>{patientName}</Text>}
        </View>
        <TouchableOpacity onPress={saveVitals} style={styles.saveBtn}>
          <Save size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <VitalInput label="Systolic" field="blood_pressure_systolic" icon={<Activity size={16} color="#ef4444" />} unit="mmHg" half />
        <VitalInput label="Diastolic" field="blood_pressure_diastolic" icon={<Activity size={16} color="#3b82f6" />} unit="mmHg" half />
      </View>
      <View style={styles.row}>
        <VitalInput label="Heart Rate" field="heart_rate" icon={<Heart size={16} color="#ef4444" />} unit="bpm" half />
        <VitalInput label="Respiratory" field="respiratory_rate" icon={<Wind size={16} color="#06b6d4" />} unit="/min" half />
      </View>
      <View style={styles.row}>
        <VitalInput label="Temperature" field="temperature" icon={<Thermometer size={16} color="#f59e0b" />} unit="C" half />
        <VitalInput label="SpO2" field="oxygen_saturation" icon={<Droplets size={16} color="#3b82f6" />} unit="%" half />
      </View>
      <View style={styles.row}>
        <VitalInput label="Pain Score" field="pain_score" icon={<AlertTriangle size={16} color="#8b5cf6" />} unit="/10" half />
        <VitalInput label="Blood Glucose" field="blood_glucose" icon={<Activity size={16} color="#22c55e" />} unit="mg/dL" half />
      </View>
      <View style={styles.row}>
        <VitalInput label="Weight" field="weight" icon={<TrendingUp size={16} color="#6366f1" />} unit="kg" half />
        <VitalInput label="Height" field="height" icon={<TrendingUp size={16} color="#6366f1" />} unit="cm" half />
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput style={styles.notesInput} multiline placeholder="Additional observations..." placeholderTextColor="#64748b" value={readings.notes} onChangeText={(v) => updateField('notes', v)} />
      </View>

      {lastReadings && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Last Reading ({new Date(lastReadings.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</Text>
          <View style={styles.historyGrid}>
            {lastReadings.heart_rate && <Text style={styles.historyItem}>HR: {lastReadings.heart_rate} bpm</Text>}
            {lastReadings.temperature && <Text style={styles.historyItem}>Temp: {lastReadings.temperature}C</Text>}
            {lastReadings.blood_pressure && <Text style={styles.historyItem}>BP: {lastReadings.blood_pressure}</Text>}
            {lastReadings.oxygen_saturation && <Text style={styles.historyItem}>SpO2: {lastReadings.oxygen_saturation}%</Text>}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  patientName: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  inputGroup: { flex: 1 },
  inputGroupHalf: { flex: 1 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#334155' },
  inputCritical: { borderColor: '#ef4444', backgroundColor: '#7f1d1d20' },
  inputWarning: { borderColor: '#f59e0b', backgroundColor: '#92400e20' },
  input: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', paddingVertical: 14 },
  inputUnit: { color: '#64748b', fontSize: 12, marginLeft: 4 },
  notesSection: { marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  notesInput: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  historyCard: { marginHorizontal: 16, marginBottom: 40, backgroundColor: '#1e293b', borderRadius: 12, padding: 14 },
  historyTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  historyItem: { color: '#cbd5e1', fontSize: 13 },
});
