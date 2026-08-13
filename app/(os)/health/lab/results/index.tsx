// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Save, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface ResultField {
  id: string; parameter: string; value: string; unit: string;
  reference_low: number | null; reference_high: number | null;
  flag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | null;
}

interface LabTestDetail {
  id: string; test_name: string; patient_name: string;
  sample_id: string; status: string; results: ResultField[];
}

export default function LabResultsScreen() {
  const { testId } = useLocalSearchParams<{ testId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [test, setTest] = useState<LabTestDetail | null>(null);
  const [results, setResults] = useState<ResultField[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => { if (testId) loadTest(); }, [testId]);

  const loadTest = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*, patients(full_name), lab_results(*)')
        .eq('id', testId).single();
      if (error) throw error;
      const existing = (data.lab_results || []).map((r: any) => ({
        id: r.id, parameter: r.parameter, value: r.value?.toString() || '',
        unit: r.unit, reference_low: r.reference_low, reference_high: r.reference_high, flag: r.flag,
      }));
      const resultList = existing.length > 0 ? existing : getTestTemplate(data.test_name);
      setTest({ id: data.id, test_name: data.test_name, patient_name: data.patients?.full_name || 'Unknown',
        sample_id: data.sample_id, status: data.status, results: resultList });
      setResults(resultList);
    } catch (_err) { Alert.alert('Error', 'Failed to load test'); }
  };

  const getTestTemplate = (testName: string): ResultField[] => {
    const templates: Record<string, ResultField[]> = {
      'CBC': [
        { id: 't1', parameter: 'WBC', value: '', unit: 'x10^9/L', reference_low: 4.0, reference_high: 11.0, flag: null },
        { id: 't2', parameter: 'RBC', value: '', unit: 'x10^12/L', reference_low: 4.5, reference_high: 5.5, flag: null },
        { id: 't3', parameter: 'Hemoglobin', value: '', unit: 'g/dL', reference_low: 13.5, reference_high: 17.5, flag: null },
        { id: 't4', parameter: 'Platelets', value: '', unit: 'x10^9/L', reference_low: 150, reference_high: 400, flag: null },
      ],
      'BMP': [
        { id: 't5', parameter: 'Glucose', value: '', unit: 'mg/dL', reference_low: 70, reference_high: 100, flag: null },
        { id: 't6', parameter: 'BUN', value: '', unit: 'mg/dL', reference_low: 7, reference_high: 20, flag: null },
        { id: 't7', parameter: 'Creatinine', value: '', unit: 'mg/dL', reference_low: 0.7, reference_high: 1.3, flag: null },
        { id: 't8', parameter: 'Sodium', value: '', unit: 'mEq/L', reference_low: 135, reference_high: 145, flag: null },
        { id: 't9', parameter: 'Potassium', value: '', unit: 'mEq/L', reference_low: 3.5, reference_high: 5.0, flag: null },
      ],
      'Lipid Panel': [
        { id: 't10', parameter: 'Total Cholesterol', value: '', unit: 'mg/dL', reference_low: null, reference_high: 200, flag: null },
        { id: 't11', parameter: 'LDL', value: '', unit: 'mg/dL', reference_low: null, reference_high: 100, flag: null },
        { id: 't12', parameter: 'HDL', value: '', unit: 'mg/dL', reference_low: 40, reference_high: null, flag: null },
        { id: 't13', parameter: 'Triglycerides', value: '', unit: 'mg/dL', reference_low: null, reference_high: 150, flag: null },
      ],
    };
    return templates[testName] || [{ id: 'td', parameter: 'Result', value: '', unit: '', reference_low: null, reference_high: null, flag: null }];
  };

  const calculateFlag = (field: ResultField, value: string): ResultField['flag'] => {
    const num = parseFloat(value);
    if (isNaN(num) || (field.reference_low === null && field.reference_high === null)) return null;
    const low = field.reference_low, high = field.reference_high;
    if (low !== null && num < low * 0.7) return 'critical_low';
    if (high !== null && num > high * 1.3) return 'critical_high';
    if (low !== null && num < low) return 'low';
    if (high !== null && num > high) return 'high';
    return 'normal';
  };

  const updateResult = (index: number, value: string) => {
    const updated = [...results];
    updated[index] = { ...updated[index], value, flag: calculateFlag(updated[index], value) };
    setResults(updated);
  };

  const saveResults = async () => {
    if (!testId) return;
    try {
      await supabase.from('lab_results').delete().eq('test_id', testId);
      const inserts = results.filter((r: any) => r.value.trim() !== '').map((r: any) => ({
        test_id: testId, parameter: r.parameter, value: parseFloat(r.value) || r.value,
        unit: r.unit, reference_low: r.reference_low, reference_high: r.reference_high,
        flag: r.flag, recorded_by: user?.id,
      }));
      if (inserts.length > 0) {
        const { error } = await supabase.from('lab_results').insert(inserts);
        if (error) throw error;
      }
      await supabase.from('lab_tests').update({
        status: 'completed', completed_at: new Date().toISOString(), notes: notes || null,
      }).eq('id', testId);
      const criticals = results.filter((r: any) => r.flag?.includes('critical'));
      if (criticals.length > 0) {
        await supabase.from('app_notifications').insert({
          user_id: test?.patient_name ? null : null,
          title: 'Critical Lab Result', body: `${criticals.length} critical values detected`, type: 'health_alert',
        });
      }
      Alert.alert('Saved', 'Results saved and test marked complete');
      router.back();
    } catch (_err) { Alert.alert('Error', 'Failed to save results'); }
  };

  const getFlagColor = (flag: string | null) => {
    switch (flag) {
      case 'critical_low': case 'critical_high': return '#ef4444';
      case 'low': case 'high': return '#f59e0b';
      case 'normal': return '#22c55e';
      default: return '#64748b';
    }
  };

  const getFlagIcon = (flag: string | null) => {
    switch (flag) {
      case 'critical_low': return <TrendingDown size={14} color="#ef4444" />;
      case 'critical_high': return <TrendingUp size={14} color="#ef4444" />;
      case 'low': return <TrendingDown size={14} color="#f59e0b" />;
      case 'high': return <TrendingUp size={14} color="#f59e0b" />;
      case 'normal': return <CheckCircle2 size={14} color="#22c55e" />;
      default: return <Minus size={14} color="#64748b" />;
    }
  };

  if (!test) return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{test.test_name}</Text>
          <Text style={styles.patientName}>{test.patient_name}</Text>
        </View>
        <TouchableOpacity onPress={saveResults} style={styles.saveBtn}>
          <Save size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.sampleInfo}>
        <Text style={styles.sampleText}>Sample: {test.sample_id}</Text>
        <Text style={styles.sampleText}>Status: {test.status}</Text>
      </View>

      {results.map((field, idx) => (
        <View key={field.id} style={[styles.resultRow, field.flag?.includes('critical') && styles.resultRowCritical]}>
          <View style={styles.resultLabel}>
            <Text style={styles.parameterName}>{field.parameter}</Text>
            {field.reference_low !== null && field.reference_high !== null && (
              <Text style={styles.referenceText}>Ref: {field.reference_low} - {field.reference_high} {field.unit}</Text>
            )}
          </View>
          <View style={styles.resultInputWrapper}>
            <TextInput style={[styles.resultInput, { color: getFlagColor(field.flag) }]} keyboardType="numeric" placeholder="—" placeholderTextColor="#475569"
              value={field.value} onChangeText={(v) => updateResult(idx, v)} />
            <Text style={styles.unitText}>{field.unit}</Text>
            <View style={styles.flagIcon}>{getFlagIcon(field.flag)}</View>
          </View>
        </View>
      ))}

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput style={styles.notesInput} multiline placeholder="Comments on results..." placeholderTextColor="#64748b"
          value={notes} onChangeText={setNotes} />
      </View>

      {results.some((r: any) => r.flag?.includes('critical')) && (
        <View style={styles.criticalBanner}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.criticalText}>{results.filter((r: any) => r.flag?.includes('critical')).length} critical value(s) detected</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  patientName: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  sampleInfo: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 12 },
  sampleText: { color: '#94a3b8', fontSize: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1e293b', borderRadius: 12, padding: 14 },
  resultRowCritical: { borderWidth: 1, borderColor: '#ef4444' },
  resultLabel: { flex: 1 },
  parameterName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  referenceText: { color: '#64748b', fontSize: 11, marginTop: 2 },
  resultInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultInput: { width: 80, textAlign: 'right', fontSize: 18, fontWeight: '700', backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  unitText: { color: '#64748b', fontSize: 12, width: 40 },
  flagIcon: { width: 24, alignItems: 'center' },
  notesSection: { marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  notesInput: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  criticalBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 40, backgroundColor: '#7f1d1d', borderRadius: 12, padding: 14 },
  criticalText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
});