import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAmbulanceDispatch } from '@/lib/health/hooks/useAmbulanceDispatch';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Phone, MapPin, AlertTriangle, Clock, Navigation, Send, Activity, Heart } from 'lucide-react-native';

export default function AmbulanceDispatchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { units, activeDispatches, createDispatch, updateDispatch, loading } = useAmbulanceDispatch();
  const [form, setForm] = useState({ patient_name: '', phone: '', location: '', chief_complaint: '', priority: 'medium', notes: '', conscious: true, breathing: true, bleeding: false });
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const handleDispatch = async () => {
    if (!form.patient_name || !form.location || !form.chief_complaint) { Alert.alert('Error', 'Patient name, location, and complaint required'); return; }
    const result = await createDispatch({ ...form, unit_id: selectedUnit });
    if (result.success) { Alert.alert('Dispatch Created', 'Unit assigned. ETA will be updated shortly.'); setForm({ patient_name: '', phone: '', location: '', chief_complaint: '', priority: 'medium', notes: '', conscious: true, breathing: true, bleeding: false }); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ambulance Dispatch</Text>
        <View style={styles.statusBadge}>
          <Activity size={14} color="#10B981" />
          <Text style={styles.statusText}>{units?.filter((u: any) => u.status === 'available').length || 0} Available</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Emergency Call</Text>
        <TextInput style={styles.input} placeholder="Patient Name" value={form.patient_name} onChangeText={t => setForm({...form, patient_name: t})} />
        <View style={styles.inputRow}><Phone size={18} color="#6B7280" /><TextInput style={styles.inputFlex} placeholder="Phone Number" value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" /></View>
        <View style={styles.inputRow}><MapPin size={18} color="#6B7280" /><TextInput style={styles.inputFlex} placeholder="Location / Address" value={form.location} onChangeText={t => setForm({...form, location: t})} /></View>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Chief Complaint / Symptoms" value={form.chief_complaint} onChangeText={t => setForm({...form, chief_complaint: t})} multiline numberOfLines={3} />
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low','medium','high','critical'].map(p => (
            <TouchableOpacity key={p} style={[styles.priorityChip, form.priority === p && styles[`priority${p}` as keyof typeof styles]]} onPress={() => setForm({...form, priority: p})}>
              <Text style={[styles.priorityText, form.priority === p && styles.priorityTextActive]}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.vitalsRow}>
          <TouchableOpacity style={[styles.vitalChip, form.conscious && styles.vitalActive]} onPress={() => setForm({...form, conscious: !form.conscious})}>
            <Heart size={14} color={form.conscious ? '#10B981' : '#6B7280'} /><Text style={styles.vitalText}>Conscious</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.vitalChip, form.breathing && styles.vitalActive]} onPress={() => setForm({...form, breathing: !form.breathing})}>
            <Activity size={14} color={form.breathing ? '#10B981' : '#6B7280'} /><Text style={styles.vitalText}>Breathing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.vitalChip, form.bleeding && styles.vitalActive]} onPress={() => setForm({...form, bleeding: !form.bleeding})}>
            <AlertTriangle size={14} color={form.bleeding ? '#EF4444' : '#6B7280'} /><Text style={styles.vitalText}>Bleeding</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Additional Notes" value={form.notes} onChangeText={t => setForm({...form, notes: t})} multiline numberOfLines={2} />
        <Text style={styles.label}>Assign Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
          {units?.map((unit: any) => (
            <TouchableOpacity key={unit.id} style={[styles.unitCard, selectedUnit === unit.id && styles.unitCardActive]} onPress={() => setSelectedUnit(unit.id)}>
              <Navigation size={20} color={selectedUnit === unit.id ? '#0A4DA6' : '#6B7280'} />
              <Text style={[styles.unitName, selectedUnit === unit.id && styles.unitNameActive]}>{unit.unit_number}</Text>
              <Text style={styles.unitType}>{unit.vehicle_type}</Text>
              <View style={[styles.unitStatus, { backgroundColor: unit.status === 'available' ? '#ECFDF5' : '#FEF3C7' }]}>
                <Text style={[styles.unitStatusText, { color: unit.status === 'available' ? '#10B981' : '#F59E0B' }]}>{unit.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.dispatchBtn} onPress={handleDispatch} disabled={loading}>
          <Send size={18} color="#fff" /><Text style={styles.dispatchText}>{loading ? 'Dispatching...' : 'Dispatch Ambulance'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Dispatches</Text>
        {activeDispatches?.length === 0 ? <Text style={styles.emptyText}>No active dispatches</Text>
         : activeDispatches?.map((d: any) => (
          <View key={d.id} style={styles.dispatchCard}>
            <View style={styles.dispatchHeader}>
              <View style={styles.dispatchLeft}>
                <Text style={styles.dispatchPatient}>{d.patient_name}</Text>
                <Text style={styles.dispatchLocation}><MapPin size={12} color="#6B7280" /> {d.location}</Text>
              </View>
              <View style={[styles.priorityBadge, styles[`badge${d.priority}` as keyof typeof styles]]}>
                <Text style={styles.priorityBadgeText}>{d.priority}</Text>
              </View>
            </View>
            <Text style={styles.dispatchComplaint}>{d.chief_complaint}</Text>
            <View style={styles.dispatchFooter}>
              <View style={styles.dispatchMeta}><Clock size={12} color="#9CA3AF" /><Text style={styles.metaText}>ETA: {d.eta_minutes || '--'} min</Text></View>
              <View style={styles.dispatchMeta}><Activity size={12} color="#9CA3AF" /><Text style={styles.metaText}>{d.status}</Text></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#EF4444', paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  inputFlex: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  prioritylow: { backgroundColor: '#ECFDF5' },
  prioritymedium: { backgroundColor: '#DBEAFE' },
  priorityhigh: { backgroundColor: '#FEF3C7' },
  prioritycritical: { backgroundColor: '#FEE2E2' },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  priorityTextActive: { color: '#1F2937' },
  vitalsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  vitalChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  vitalActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  vitalText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  unitScroll: { maxHeight: 120, marginBottom: 12 },
  unitCard: { width: 120, alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginRight: 10 },
  unitCardActive: { borderColor: '#0A4DA6', backgroundColor: '#EFF6FF' },
  unitName: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 6 },
  unitNameActive: { color: '#0A4DA6' },
  unitType: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  unitStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  unitStatusText: { fontSize: 10, fontWeight: '600' },
  dispatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 10, gap: 8 },
  dispatchText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dispatchCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  dispatchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dispatchLeft: { flex: 1 },
  dispatchPatient: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  dispatchLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgelow: { backgroundColor: '#ECFDF5' },
  badgemedium: { backgroundColor: '#DBEAFE' },
  badgehigh: { backgroundColor: '#FEF3C7' },
  badgecritical: { backgroundColor: '#FEE2E2' },
  priorityBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dispatchComplaint: { fontSize: 13, color: '#374151', marginTop: 8, lineHeight: 18 },
  dispatchFooter: { flexDirection: 'row', gap: 16, marginTop: 10 },
  dispatchMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 16 },
});
