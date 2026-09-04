
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Alert, usePharmacy } from '@/lib/health/hooks/usePharmacy';
import { Alert, useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Alert, AlertTriangle, Search, X, Pill, ShieldAlert, CheckCircle, Info } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function DrugInteractionsScreen() {
  const { selectedFacilityId } = useHealthRole();
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { checkInteraction, inventory } = usePharmacy(selectedFacilityId);

  const handleCheck = useCallback(async () => {
    if (!drugA.trim() || !drugB.trim()) { Alert.alert('Error', 'Enter both drug names'); return; }
    setChecking(true);
    setResult(null);
    try {
      const interaction = await checkInteraction(drugA, drugB);
      setResult(interaction);
    } catch (err: any) { Alert.alert('Error', err.message || 'Check failed'); }
    finally { setChecking(false); }
  }, [drugA, drugB, checkInteraction]);

  const quickSelect = (drug: string, setter: (s: string) => void) => {
    Alert.alert('Select Drug', 'Choose from inventory:', [
      { text: 'Cancel', style: 'cancel' },
      ...(inventory?.slice(0, 10).map((item: any) => ({
        text: item.name, onPress: () => setter(item.name)
      })) || [])
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drug Interactions</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Drug A</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Enter drug name..." value={drugA} onChangeText={setDrugA} />
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect(drugA, setDrugA)}>
              <Pill size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Drug B</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Enter drug name..." value={drugB} onChangeText={setDrugB} />
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect(drugB, setDrugB)}>
              <Pill size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.checkButton} onPress={handleCheck} disabled={checking}>
            {checking ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.checkText}>Check Interaction</Text>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={[styles.resultCard, { borderColor: result.severity === 'severe' ? COLORS.danger : result.severity === 'moderate' ? COLORS.warning : COLORS.success, borderWidth: 2 }]}>
            <View style={styles.resultHeader}>
              {result.severity === 'severe' ? <ShieldAlert size={28} color={COLORS.danger} /> :
               result.severity === 'moderate' ? <AlertTriangle size={28} color={COLORS.warning} /> :
               <CheckCircle size={28} color={COLORS.success} />}
              <Text style={[styles.resultTitle, { color: result.severity === 'severe' ? COLORS.danger : result.severity === 'moderate' ? COLORS.warning : COLORS.success }]}>
                {result.severity === 'none' ? 'No Interaction Found' : `${result.severity.toUpperCase()} INTERACTION`}
              </Text>
            </View>
            {result.description && <Text style={styles.resultDesc}>{result.description}</Text>}
            {result.recommendation && (
              <View style={styles.recommendationBox}>
                <Info size={16} color={COLORS.primary} />
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
              </View>
            )}
            {result.alternatives?.length > 0 && (
              <View style={styles.alternativesBox}>
                <Text style={styles.altLabel}>Alternatives:</Text>
                {result.alternatives.map((alt: string, idx: number) => (
                  <Text key={idx} style={styles.altText}>• {alt}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <Text style={styles.tipText}>• Always check interactions before dispensing</Text>
          <Text style={styles.tipText}>• Consult a pharmacist for severe interactions</Text>
          <Text style={styles.tipText}>• Document all warnings in patient records</Text>
          <Text style={styles.tipText}>• Monitor patients on multiple medications</Text>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1 },
  card: { backgroundColor: COLORS.white, margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  quickBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  checkButton: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  checkText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  resultCard: { backgroundColor: COLORS.white, margin: 12, padding: 16, borderRadius: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  resultDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 12 },
  recommendationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, marginBottom: 10 },
  recommendationText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  alternativesBox: { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10 },
  altLabel: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginBottom: 6 },
  altText: { fontSize: 13, color: COLORS.text, marginBottom: 3 },
  tipsCard: { backgroundColor: COLORS.white, margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  tipText: { fontSize: 13, color: COLORS.textLight, marginBottom: 6 },
  bottomPadding: { height: 40 }
});
