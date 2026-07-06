import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertTriangle, Search, Pill, Shield } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';

const KNOWN_INTERACTIONS: Record<string, string[]> = {
  'Warfarin': ['Aspirin', 'Ibuprofen', 'Vitamin K'],
  'Metformin': ['Contrast dye', 'Alcohol'],
  'Digoxin': ['Amiodarone', 'Quinidine'],
  'Lithium': ['ACE inhibitors', 'Diuretics'],
  'Theophylline': ['Ciprofloxacin', 'Erythromycin'],
  'Phenytoin': ['Warfarin', 'Oral contraceptives'],
  'Simvastatin': ['Clarithromycin', 'Itraconazole', 'Grapefruit'],
  'ACE inhibitors': ['Potassium supplements', 'NSAIDs'],
};

export default function PharmacyInteractionsScreen() {
  const router = useRouter();
  const [medA, setMedA] = useState('');
  const [medB, setMedB] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const checkInteraction = () => {
    if (!medA.trim() || !medB.trim()) { Alert.alert('Missing', 'Enter both medications'); return; }
    const a = medA.trim();
    const b = medB.trim();
    const interactionsA = KNOWN_INTERACTIONS[a] || [];
    const interactionsB = KNOWN_INTERACTIONS[b] || [];
    const hasInteraction = interactionsA.includes(b) || interactionsB.includes(a);
    setResult(hasInteraction ? `⚠️ INTERACTION DETECTED: ${a} and ${b} may interact. Monitor patient closely.` : `✅ No known interaction between ${a} and ${b}.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Drug Interactions</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Medication A</Text>
        <TextInput style={styles.input} placeholder="e.g. Warfarin" value={medA} onChangeText={setMedA} placeholderTextColor="#9ca3af" />
        <Text style={styles.label}>Medication B</Text>
        <TextInput style={styles.input} placeholder="e.g. Aspirin" value={medB} onChangeText={setMedB} placeholderTextColor="#9ca3af" />
        <TouchableOpacity style={styles.checkBtn} onPress={checkInteraction}>
          <Search size={18} color="#fff" /><Text style={styles.checkText}>Check Interaction</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultCard, result.includes('INTERACTION') ? styles.resultDanger : styles.resultSafe]}>
          {result.includes('INTERACTION') ? <AlertTriangle size={24} color="#dc2626" /> : <Shield size={24} color="#22c55e" />}
          <Text style={[styles.resultText, result.includes('INTERACTION') ? { color: '#dc2626' } : { color: '#22c55e' }]}>{result}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Common Interactions</Text>
      {Object.entries(KNOWN_INTERACTIONS).map(([drug, interacts]) => (
        <View key={drug} style={styles.interactionCard}>
          <Pill size={16} color="#a855f7" />
          <View style={styles.interactionInfo}>
            <Text style={styles.interactionDrug}>{drug}</Text>
            <Text style={styles.interactionList}>Interacts with: {interacts.join(', ')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1f2937' },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', marginTop: 16, paddingVertical: 14, borderRadius: 12, gap: 8 },
  checkText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 8 },
  resultDanger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  resultSafe: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  resultText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  interactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  interactionInfo: { flex: 1 },
  interactionDrug: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  interactionList: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
