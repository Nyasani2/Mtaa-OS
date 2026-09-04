// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert,
  User, Heart, Activity, Pill, AlertTriangle, FileText,
  ChevronLeft, Phone, Mail, MapPin, Calendar, Stethoscope,
  Thermometer, Droplets, Wind, TrendingUp, Shield
} from 'lucide-react-native';

interface PatientDetail {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: { name: string; phone: string } | null;
  address: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  last_visit: string | null;
  vitals: {
    blood_pressure: string;
    heart_rate: number;
    temperature: number;
    oxygen_saturation: number;
    weight: number;
    height: number;
    bmi: number;
    recorded_at: string;
  } | null;
  current_medications: { name: string; dosage: string; frequency: string }[];
  flags: { type: string; message: string }[];
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'history' | 'notes'>('overview');

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('health_patients')
        .select(`
          id, full_name, phone, email, date_of_birth, gender, blood_type,
          allergies, chronic_conditions, emergency_contact, address,
          insurance_provider, insurance_number, last_visit,
          health_profiles (blood_pressure, heart_rate, temperature, oxygen_saturation, weight, height, bmi, recorded_at),
          prescriptions:prescriptions(name, dosage, frequency, status)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const vitals = data.health_profiles?.[0] || null;
      const meds = (data.prescriptions || [])
        .filter((p: any) => p.status === 'active')
        .map((p: any) => ({ name: p.name, dosage: p.dosage, frequency: p.frequency }));

      const flags = [];
      if (data.allergies?.length) flags.push({ type: 'allergy', message: `Allergies: ${data.allergies.join(', ')}` });
      if (vitals?.heart_rate > 100) flags.push({ type: 'critical', message: 'Elevated heart rate detected' });
      if (vitals?.temperature > 38) flags.push({ type: 'warning', message: 'Fever: ' + vitals.temperature + 'C' });

      setPatient({
        ...data,
        vitals: vitals ? {
          blood_pressure: vitals.blood_pressure,
          heart_rate: vitals.heart_rate,
          temperature: vitals.temperature,
          oxygen_saturation: vitals.oxygen_saturation,
          weight: vitals.weight,
          height: vitals.height,
          bmi: vitals.bmi,
          recorded_at: vitals.recorded_at,
        } : null,
        current_medications: meds,
        flags,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'admit':
        router.push(`/health/doctor/admit?patientId=${id}` as any);
        break;
      case 'order':
        router.push(`/health/doctor/orders?patientId=${id}` as any);
        break;
      case 'note':
        router.push(`/health/doctor/notes?patientId=${id}` as any);
        break;
      case 'call':
        if (patient?.phone) {
          router.push(`/health/telemedicine?patientId=${id}` as any);
        }
        break;
    }
  };

  if (loading || !patient) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading patient...</Text>
      </View>
    );
  }

  const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.patientCard}>
        <View style={styles.avatar}>
          <User size={40} color="#6366f1" />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <Text style={styles.patientMeta}>{age} yrs · {patient.gender} · {patient.blood_type || 'Blood type unknown'}</Text>
          <View style={styles.contactRow}>
            <Phone size={14} color="#6b7280" />
            <Text style={styles.contactText}>{patient.phone}</Text>
          </View>
          {patient.email && (
            <View style={styles.contactRow}>
              <Mail size={14} color="#6b7280" />
              <Text style={styles.contactText}>{patient.email}</Text>
            </View>
          )}
        </View>
      </View>

      {patient.flags.length > 0 && (
        <View style={styles.flagsContainer}>
          {patient.flags.map((flag, idx) => (
            <View key={idx} style={[styles.flagBadge, flag.type === 'critical' ? styles.flagCritical : flag.type === 'warning' ? styles.flagWarning : styles.flagAllergy]}>
              <AlertTriangle size={14} color="#fff" />
              <Text style={styles.flagText}>{flag.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('admit')}>
          <Shield size={20} color="#6366f1" />
          <Text style={styles.actionText}>Admit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('order')}>
          <FileText size={20} color="#6366f1" />
          <Text style={styles.actionText}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('note')}>
          <Stethoscope size={20} color="#6366f1" />
          <Text style={styles.actionText}>Note</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('call')}>
          <Phone size={20} color="#6366f1" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(['overview', 'vitals', 'history', 'notes'] as const).map((tab: any) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demographics</Text>
            <View style={styles.infoGrid}>
              <InfoItem icon={<Calendar size={16} color="#6366f1" />} label="DOB" value={new Date(patient.date_of_birth).toLocaleDateString()} />
              <InfoItem icon={<MapPin size={16} color="#6366f1" />} label="Address" value={patient.address || 'Not recorded'} />
              <InfoItem icon={<Shield size={16} color="#6366f1" />} label="Insurance" value={patient.insurance_provider || 'None'} />
              <InfoItem icon={<Phone size={16} color="#6366f1" />} label="Emergency" value={patient.emergency_contact?.phone || 'None'} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Medications ({patient.current_medications.length})</Text>
            {patient.current_medications.length === 0 ? (
              <Text style={styles.emptyText}>No active medications</Text>
            ) : (
              patient.current_medications.map((med, idx) => (
                <View key={idx} style={styles.medicationCard}>
                  <Pill size={18} color="#6366f1" />
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDose}>{med.dosage} · {med.frequency}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chronic Conditions</Text>
            {patient.chronic_conditions?.length === 0 ? (
              <Text style={styles.emptyText}>No chronic conditions recorded</Text>
            ) : (
              <View style={styles.tagContainer}>
                {patient.chronic_conditions.map((cond, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{cond}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {activeTab === 'vitals' && patient.vitals && (
        <View style={styles.tabContent}>
          <View style={styles.vitalsGrid}>
            <VitalCard icon={<Heart size={20} color="#ef4444" />} label="Heart Rate" value={`${patient.vitals.heart_rate}`} unit="bpm" />
            <VitalCard icon={<Activity size={20} color="#22c55e" />} label="Blood Pressure" value={patient.vitals.blood_pressure} unit="mmHg" />
            <VitalCard icon={<Thermometer size={20} color="#f59e0b" />} label="Temperature" value={`${patient.vitals.temperature}`} unit="C" />
            <VitalCard icon={<Droplets size={20} color="#3b82f6" />} label="SpO2" value={`${patient.vitals.oxygen_saturation}`} unit="%" />
            <VitalCard icon={<TrendingUp size={20} color="#8b5cf6" />} label="BMI" value={`${patient.vitals.bmi?.toFixed(1) || 'N/A'}`} unit="kg/m2" />
            <VitalCard icon={<Wind size={20} color="#06b6d4" />} label="Weight" value={`${patient.vitals.weight}`} unit="kg" />
          </View>
          <Text style={styles.vitalsTimestamp}>
            Last recorded: {new Date(patient.vitals.recorded_at).toLocaleString()}
          </Text>
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          <Text style={styles.emptyText}>Visit history will load from appointments table</Text>
          <TouchableOpacity style={styles.loadMoreBtn} onPress={() => router.push(`/health/records?patientId=${id}` as any)}>
            <Text style={styles.loadMoreText}>View Full Medical Record</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'notes' && (
        <View style={styles.tabContent}>
          <Text style={styles.emptyText}>Clinical notes will appear here</Text>
          <TouchableOpacity style={styles.loadMoreBtn} onPress={() => router.push(`/health/doctor/notes?patientId=${id}` as any)}>
            <Text style={styles.loadMoreText}>Open Notes Editor</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      {icon}
      <View style={styles.infoItemText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function VitalCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <View style={styles.vitalCard}>
      <View style={styles.vitalIcon}>{icon}</View>
      <Text style={styles.vitalValue}>{value}</Text>
      <Text style={styles.vitalUnit}>{unit}</Text>
      <Text style={styles.vitalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 100, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  patientCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1e293b', borderRadius: 16, padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  patientInfo: { flex: 1 },
  patientName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  patientMeta: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  contactText: { color: '#cbd5e1', fontSize: 13, marginLeft: 6 },
  flagsContainer: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  flagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 8 },
  flagCritical: { backgroundColor: '#7f1d1d' },
  flagWarning: { backgroundColor: '#92400e' },
  flagAllergy: { backgroundColor: '#1e3a5f' },
  flagText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 16 },
  actionBtn: { alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, minWidth: 72 },
  actionText: { color: '#cbd5e1', fontSize: 12, marginTop: 6, fontWeight: '600' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoItemText: { marginLeft: 12 },
  infoLabel: { color: '#94a3b8', fontSize: 12 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  medicationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 8 },
  medicationInfo: { marginLeft: 12, flex: 1 },
  medicationName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  medicationDose: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#312e81', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: '#c7d2fe', fontSize: 12, fontWeight: '600' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vitalCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center' },
  vitalIcon: { marginBottom: 8 },
  vitalValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  vitalUnit: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  vitalLabel: { color: '#64748b', fontSize: 12, marginTop: 6 },
  vitalsTimestamp: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  loadMoreBtn: { backgroundColor: '#312e81', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  loadMoreText: { color: '#c7d2fe', fontSize: 14, fontWeight: '600' },
});
