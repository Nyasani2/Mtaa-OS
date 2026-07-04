import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  FileText,
  Image,
  Database,
  Save,
} from 'lucide-react-native';

const RETENTION_PRESETS = [
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '1 Year', days: 365 },
  { label: '7 Years', days: 2555 },
  { label: 'Forever', days: 0 },
];

export default function RetentionScreen() {
  const router = useRouter();
  const [recordsDays, setRecordsDays] = useState('365');
  const [imagesDays, setImagesDays] = useState('90');
  const [logsDays, setLogsDays] = useState('30');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Retention</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.desc}>Configure how long different types of health data are retained before automatic deletion.</Text>

        {/* Presets */}
        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <View style={styles.presetRow}>
          {RETENTION_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.days}
              style={[styles.presetBtn, selectedPreset === preset.days && styles.presetBtnActive]}
              onPress={() => {
                setSelectedPreset(preset.days);
                if (preset.days > 0) {
                  setRecordsDays(String(preset.days));
                  setImagesDays(String(Math.floor(preset.days / 4)));
                  setLogsDays(String(Math.floor(preset.days / 12)));
                }
              }}
            >
              <Text style={[styles.presetText, selectedPreset === preset.days && styles.presetTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Records */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <FileText size={18} color="#0066cc" />
            <Text style={styles.inputTitle}>Medical Records</Text>
          </View>
          <Text style={styles.inputDesc}>Patient consultations, diagnoses, prescriptions</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={recordsDays}
              onChangeText={setRecordsDays}
              keyboardType="numeric"
            />
            <Text style={styles.inputUnit}>days</Text>
          </View>
        </View>

        {/* Images */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Image size={18} color="#a855f7" />
            <Text style={styles.inputTitle}>Images & Scans</Text>
          </View>
          <Text style={styles.inputDesc}>X-rays, MRIs, CT scans, lab result images</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={imagesDays}
              onChangeText={setImagesDays}
              keyboardType="numeric"
            />
            <Text style={styles.inputUnit}>days</Text>
          </View>
        </View>

        {/* Logs */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Database size={18} color="#22c55e" />
            <Text style={styles.inputTitle}>Audit Logs</Text>
          </View>
          <Text style={styles.inputDesc}>System access logs and activity trails</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={logsDays}
              onChangeText={setLogsDays}
              keyboardType="numeric"
            />
            <Text style={styles.inputUnit}>days</Text>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn}>
          <Save size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Retention Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  presetBtnActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  presetText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  presetTextActive: { color: '#fff' },
  inputCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  inputTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  inputDesc: { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  inputUnit: { fontSize: 13, color: '#6b7280', width: 40 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0066cc', borderRadius: 10, paddingVertical: 14, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
