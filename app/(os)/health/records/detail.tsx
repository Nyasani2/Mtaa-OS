// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  Heart,
  Pill,
  FlaskConical,
  Scan,
  Activity,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
} from 'lucide-react-native';

const RECORD_TYPES: Record<string, { icon: any; color: string; label: string }> = {
  consultation: { icon: FileText, color: '#0066cc', label: 'Consultation' },
  diagnosis: { icon: Heart, color: '#ef4444', label: 'Diagnosis' },
  prescription: { icon: Pill, color: '#a855f7', label: 'Prescription' },
  lab: { icon: FlaskConical, color: '#06b6d4', label: 'Lab Test' },
  imaging: { icon: Scan, color: '#f97316', label: 'Imaging' },
  vitals: { icon: Activity, color: '#22c55e', label: 'Vitals' },
};

const FALLBACK_RECORDS: Record<string, any> = {
  '1': {
    type: 'consultation',
    title: 'Outpatient Consultation',
    date: 'June 10, 2025 · 12:30 PM',
    doctor: 'Dr. Sarah Kimani',
    facility: 'Nairobi West Hospital',
    description: 'General checkup, routine follow-up. Patient reports mild fatigue. Recommended rest and follow-up blood work.',
    status: 'completed',
  },
  '2': {
    type: 'diagnosis',
    title: 'Type 2 Diabetes Mellitus',
    date: 'June 10, 2025 · 12:45 PM',
    doctor: 'Dr. Sarah Kimani',
    facility: 'Nairobi West Hospital',
    description: 'ICD-10: E11.9 | Primary diagnosis. HbA1c: 7.2%. FBG: 126 mg/dL. Started on Metformin 500mg BID. Dietary counseling provided.',
    status: 'active',
  },
  '3': {
    type: 'prescription',
    title: 'Metformin 500mg',
    date: 'June 10, 2025 · 1:00 PM',
    doctor: 'Dr. Sarah Kimani',
    facility: 'Nairobi West Hospital',
    description: '1 tablet twice daily for 30 days. Take with meals to reduce stomach upset. Refill: 2 remaining.',
    status: 'active',
  },
  '4': {
    type: 'vitals',
    title: 'Vitals Recorded',
    date: 'June 10, 2025 · 12:35 PM',
    doctor: 'Nurse: Grace Muthoni',
    facility: 'Nairobi West Hospital',
    description: 'BP: 120/90 | HR: 78 | Temp: 36.5°C | SpO2: 98% | RR: 16 | Weight: 68kg',
    status: 'completed',
  },
};

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [record, setRecord] = useState<any>(null);
  useEffect(() => {
    supabase.from('health_records').select('*').eq('id', id).single().then(({ data }) => {
      setRecord(data || FALLBACK_RECORDS[id as string] || FALLBACK_RECORDS['1']);
    });
  }, [id]);
  if (!record) return <View style={styles.container}><Text>Loading...</Text></View>;
  const typeInfo = RECORD_TYPES[record.type] || RECORD_TYPES.consultation;
  const Icon = typeInfo.icon;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '15' }]}>
          <Icon size={18} color={typeInfo.color} />
          <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
        </View>

        {/* Title & Status */}
        <Text style={styles.title}>{record.title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: record.status === 'active' ? '#22c55e15' : '#6b728015' }]}>
            <CheckCircle2 size={12} color={record.status === 'active' ? '#22c55e' : '#6b7280'} />
            <Text style={[styles.statusText, { color: record.status === 'active' ? '#22c55e' : '#6b7280' }]}>
              {record.status === 'active' ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.metaText}>{record.date}</Text>
          </View>
          <View style={styles.metaRow}>
            <User size={16} color="#6b7280" />
            <Text style={styles.metaText}>{record.doctor}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.metaText}>{record.facility}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Details</Text>
          <Text style={styles.detailText}>{record.description}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0066cc' }]}>
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1e3a5f' }]}>
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 12 },
  typeText: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  statusRow: { flexDirection: 'row', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  metaText: { fontSize: 13, color: '#4b5563' },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  detailTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
