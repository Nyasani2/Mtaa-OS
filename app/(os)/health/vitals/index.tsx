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
  Heart,
  Thermometer,
  Wind,
  Activity,
  Droplets,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';

const VITAL_TYPES = [
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: Heart, color: '#ef4444', normal: '120/80' },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Activity, color: '#dc2626', normal: '60-100' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, color: '#f97316', normal: '36.1-37.2' },
  { key: 'respiratory', label: 'Respiratory Rate', unit: '/min', icon: Wind, color: '#22c55e', normal: '12-20' },
  { key: 'oxygen', label: 'SpO2', unit: '%', icon: Droplets, color: '#06b6d4', normal: '95-100' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: TrendingUp, color: '#8b5cf6', normal: '--' },
];

const MOCK_HISTORY = [
  { date: 'Today, 8:30 AM', bp: '118/76', hr: '72', temp: '36.5', spo2: '98' },
  { date: 'Yesterday, 8:30 AM', bp: '122/80', hr: '75', temp: '36.7', spo2: '97' },
  { date: 'Jul 2, 8:30 AM', bp: '120/78', hr: '70', temp: '36.4', spo2: '99' },
];

export default function VitalsScreen() {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedVital, setSelectedVital] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vitals</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Vital Cards */}
        <View style={styles.vitalsGrid}>
          {VITAL_TYPES.map((vital) => (
            <TouchableOpacity
              key={vital.key}
              style={[styles.vitalCard, { borderColor: vital.color + '30' }]}
              onPress={() => setSelectedVital(selectedVital === vital.key ? null : vital.key)}
            >
              <View style={[styles.vitalIcon, { backgroundColor: vital.color + '15' }]}>
                <vital.icon size={20} color={vital.color} />
              </View>
              <Text style={styles.vitalLabel}>{vital.label}</Text>
              <Text style={[styles.vitalValue, { color: vital.color }]}>
                {vital.key === 'blood_pressure' ? '118/76' : vital.key === 'heart_rate' ? '72' : vital.key === 'temperature' ? '36.5' : vital.key === 'oxygen' ? '98%' : '68'}
              </Text>
              <Text style={styles.vitalUnit}>{vital.unit}</Text>
              <Text style={styles.vitalNormal}>Normal: {vital.normal}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Vital Form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Record New Vital</Text>
            <TextInput style={styles.input} placeholder="Blood Pressure (e.g. 120/80)" placeholderTextColor="#9ca3af" />
            <TextInput style={styles.input} placeholder="Heart Rate (bpm)" placeholderTextColor="#9ca3af" keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Temperature (°C)" placeholderTextColor="#9ca3af" keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Reading</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <Text style={styles.sectionTitle}>History</Text>
        {MOCK_HISTORY.map((entry, i) => (
          <View key={i} style={styles.historyCard}>
            <Text style={styles.historyDate}>{entry.date}</Text>
            <View style={styles.historyRow}>
              <View style={styles.historyItem}>
                <Heart size={14} color="#ef4444" />
                <Text style={styles.historyValue}>{entry.bp}</Text>
              </View>
              <View style={styles.historyItem}>
                <Activity size={14} color="#dc2626" />
                <Text style={styles.historyValue}>{entry.hr} bpm</Text>
              </View>
              <View style={styles.historyItem}>
                <Thermometer size={14} color="#f97316" />
                <Text style={styles.historyValue}>{entry.temp}°C</Text>
              </View>
              <View style={styles.historyItem}>
                <Droplets size={14} color="#06b6d4" />
                <Text style={styles.historyValue}>{entry.spo2}%</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  vitalCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 4 },
  vitalIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  vitalLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  vitalValue: { fontSize: 22, fontWeight: '700' },
  vitalUnit: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  vitalNormal: { fontSize: 10, color: '#22c55e', marginTop: 4 },
  addCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  addTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10, color: '#1f2937' },
  saveBtn: { backgroundColor: '#0066cc', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12, marginTop: 8 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  historyDate: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  historyRow: { flexDirection: 'row', gap: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyValue: { fontSize: 12, fontWeight: '600', color: '#374151' },
});
