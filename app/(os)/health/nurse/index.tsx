// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

// --- CLINICAL UTILITIES ---
const calculateNEWS = (vitals) => {
  let score = 0;
  if (!vitals) return 0;
  const hr = parseInt(vitals.hr);
  const sys = parseInt(vitals.bp_systolic);
  const temp = parseFloat(vitals.temp);
  const rr = parseInt(vitals.rr);
  const spo2 = parseInt(vitals.spo2);

  if (hr && (hr <= 40 || hr >= 131)) score += 3;
  else if (hr && (hr <= 50 || hr >= 111)) score += 1;
  if (sys && (sys <= 90 || sys >= 220)) score += 3;
  else if (sys && (sys <= 100 || sys >= 219)) score += 1;
  if (temp && (temp <= 35.0 || temp >= 39.1)) score += 3;
  else if (temp && (temp <= 36.0 || temp >= 38.1)) score += 1;
  if (rr && (rr <= 8 || rr >= 25)) score += 3;
  else if (rr && (rr <= 9 || rr >= 21)) score += 2;
  else if (rr && rr >= 12) score += 1;
  if (spo2 && spo2 <= 91) score += 3;
  else if (spo2 && spo2 <= 93) score += 2;
  else if (spo2 && spo2 <= 95) score += 1;
  return score;
};

export default function NurseWorkstationUltimate() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // UNIT SELECTION (The core of the workstation)
  const [activeUnit, setActiveUnit] = useState('opd'); // opd, general, icu, maternity, pediatrics
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Vitals Modal
  const [vitalsModal, setVitalsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isOPD, setIsOPD] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ hr: '', sys: '', dia: '', temp: '', rr: '', spo2: '', pain: '' });

  const units = [
    { id: 'opd', label: 'OPD / Triage', icon: 'people' },
    { id: 'general', label: 'General Ward', icon: 'bed' },
    { id: 'icu', label: 'ICU', icon: 'pulse' },
    { id: 'maternity', label: 'Maternity', icon: 'woman' },
    { id: 'pediatrics', label: 'Pediatrics', icon: 'child' },
  ];

  useEffect(() => { loadRoster(); }, [activeUnit]);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let roster = [];

      if (activeUnit === 'opd') {
        // OPD MODE: Fetch today's appointments waiting for triage/doctor
        const { data: appts, error } = await supabase
          .from('health_appointments')
          .select('id, appointment_code, status, scheduled_time, reason, patient:health_patients(id, first_name, last_name, age, gender, allergies, phone)')
          .eq('scheduled_date', today)
          .in('status', ['scheduled', 'waiting', 'checked_in'])
          .order('scheduled_time', { ascending: true });
        
        if (!error && appts) {
          roster = appts.map(a => ({
            id: a.id,
            type: 'outpatient',
            appointment_code: a.appointment_code,
            status: a.status,
            scheduled_time: a.scheduled_time,
            reason: a.reason,
            patient: a.patient,
            latestVitals: null // Will be fetched if needed
          }));
        }
      } else {
        // INPATIENT MODE: Fetch admitted patients
        // Note: We fetch all admitted and filter by department/ward if the column exists
        const { data: pats, error } = await supabase
          .from('health_patients')
          .select('*')
          .eq('admission_status', 'admitted');
        
        if (!error && pats) {
          // Filter by ward if the schema has 'department' or 'ward', otherwise show all
          const filtered = pats.filter(p => {
            if (!activeUnit || activeUnit === 'general') return true;
            const dept = (p.department || p.ward || '').toLowerCase();
            return dept.includes(activeUnit);
          });

          // Enrich with latest vitals
          roster = await Promise.all(filtered.map(async (p) => {
            const { data: enc } = await supabase
              .from('health_encounters')
              .select('vitals_json, created_at')
              .eq('patient_id', p.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            return {
              id: p.id,
              type: 'inpatient',
              patient: p,
              latestVitals: enc?.vitals_json || {},
              newsScore: calculateNEWS(enc?.vitals_json),
              lastVitalsTime: enc?.created_at
            };
          }));
        }
      }
      setPatients(roster);
    } catch (err) {
      console.error('Roster error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openVitals = (item) => {
    setSelectedPatient(item);
    setIsOPD(item.type === 'outpatient');
    setVitalsForm({ hr: '', sys: '', dia: '', temp: '', rr: '', spo2: '', pain: '' });
    setVitalsModal(true);
  };

  const saveVitals = async () => {
    setSaving(true);
    try {
      const vitalsData = {
        hr: parseInt(vitalsForm.hr) || null,
        bp: vitalsForm.sys && vitalsForm.dia ? `${vitalsForm.sys}/${vitalsForm.dia}` : null,
        bp_systolic: parseInt(vitalsForm.sys) || null,
        bp_diastolic: parseInt(vitalsForm.dia) || null,
        temp: parseFloat(vitalsForm.temp) || null,
        rr: parseInt(vitalsForm.rr) || null,
        spo2: parseInt(vitalsForm.spo2) || null,
        pain: parseInt(vitalsForm.pain) || null,
      };

      if (isOPD) {
        // Save to encounters AND update appointment status to 'checked_in'
        await supabase.from('health_encounters').insert({
          patient_id: selectedPatient.patient.id,
          appointment_id: selectedPatient.id,
          encounter_type: 'triage_vitals',
          vitals_json: vitalsData,
          recorded_by: user.id,
          created_at: new Date().toISOString()
        });
        
        await supabase.from('health_appointments')
          .update({ status: 'checked_in', vitals_json: vitalsData })
          .eq('id', selectedPatient.id);
          
        Alert.alert('Triage Complete', 'Patient vitals recorded and marked ready for doctor.');
      } else {
        // Inpatient save
        await supabase.from('health_encounters').insert({
          patient_id: selectedPatient.id,
          encounter_type: 'nursing_vitals',
          vitals_json: vitalsData,
          recorded_by: user.id,
          created_at: new Date().toISOString()
        });
        Alert.alert('Success', 'Inpatient vitals recorded & NEWS updated.');
      }
      
      setVitalsModal(false);
      loadRoster();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ---
  const renderOPDItem = ({ item }) => (
    <TouchableOpacity style={styles.opdCard} onPress={() => openVitals(item)}>
      <View style={styles.opdHeader}>
        <View style={styles.timeBadge}>
          <Ionicons name="time" size={12} color="#fff" />
          <Text style={styles.timeText}>{item.scheduled_time?.substring(0,5) || 'TBD'}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'checked_in' ? styles.statusGreen : styles.statusYellow]}>
          <Text style={styles.statusText}>{item.status.toUpperCase().replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.patientName}>{item.patient?.first_name} {item.patient?.last_name}</Text>
      <Text style={styles.patientMeta}>{item.patient?.age || '?'}y • {item.patient?.gender || '?'} • {item.reason || 'Consultation'}</Text>
      <View style={styles.triageAction}>
        <Ionicons name="heart-pulse" size={16} color="#3b82f6" />
        <Text style={styles.triageText}>Record Triage Vitals</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInpatientItem = ({ item }) => (
    <TouchableOpacity style={[styles.ipCard, item.newsScore >= 5 && styles.critCard]} onPress={() => openVitals(item)}>
      <View style={styles.ipHeader}>
        <Text style={styles.bedNum}>BED {item.patient.bed_number || item.patient.room_number || '?'}</Text>
        <Text style={[styles.newsBadge, { color: item.newsScore >= 5 ? '#ef4444' : '#10b981' }]}>NEWS: {item.newsScore}</Text>
      </View>
      <Text style={styles.patientName}>{item.patient.first_name} {item.patient.last_name}</Text>
      <Text style={styles.patientMeta}>{item.patient.age || '?'}y • {item.patient.diagnosis || 'Admitted'}</Text>
      
      <View style={styles.vitalsStrip}>
        <Text style={styles.vitalText}>HR: {item.latestVitals.hr || '--'}</Text>
        <Text style={styles.vitalText}>BP: {item.latestVitals.bp || '--'}</Text>
        <Text style={styles.vitalText}>SpO2: {item.latestVitals.spo2 || '--'}</Text>
        <Text style={styles.vitalText}>Temp: {item.latestVitals.temp || '--'}</Text>
      </View>
      {item.patient.allergies && item.patient.allergies.length > 0 && (
        <View style={styles.allergyBanner}>
          <Ionicons name="warning" size={12} color="#fff" />
          <Text style={styles.allergyText}>ALLERGIES: {item.patient.allergies.join(', ')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header & Unit Selector */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nurse Workstation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
          {units.map(u => (
            <TouchableOpacity 
              key={u.id} 
              style={[styles.unitPill, activeUnit === u.id && styles.activeUnitPill]} 
              onPress={() => setActiveUnit(u.id)}
            >
              <Ionicons name={u.icon} size={16} color={activeUnit === u.id ? '#0f172a' : '#94a3b8'} />
              <Text style={[styles.unitText, activeUnit === u.id && styles.activeUnitText]}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{patients.length}</Text>
          <Text style={styles.statLabel}>{activeUnit === 'opd' ? 'Waiting' : 'Admitted'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, {color: '#ef4444'}]}>
            {activeUnit === 'opd' ? patients.filter(p=>p.status==='waiting').length : patients.filter(p=>p.newsScore>=5).length}
          </Text>
          <Text style={styles.statLabel}>{activeUnit === 'opd' ? 'Pending Triage' : 'Critical'}</Text>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => item.id}
          renderItem={activeUnit === 'opd' ? renderOPDItem : renderInpatientItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRoster(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={activeUnit === 'opd' ? 'people-outline' : 'bed-outline'} size={48} color="#475569" />
              <Text style={styles.emptyText}>No patients in {activeUnit.toUpperCase()}</Text>
            </View>
          }
        />
      )}

      {/* Vitals Modal */}
      <Modal visible={vitalsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{isOPD ? 'Triage Vitals' : 'Inpatient Vitals'}</Text>
              <Text style={styles.modalPatient}>
                {isOPD ? `${selectedPatient?.patient?.first_name} ${selectedPatient?.patient?.last_name}` : `${selectedPatient?.patient?.first_name} ${selectedPatient?.patient?.last_name}`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setVitalsModal(false)}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGrid}>
              {['hr', 'sys', 'dia', 'temp', 'rr', 'spo2', 'pain'].map(key => (
                <View key={key} style={styles.inputBox}>
                  <Text style={styles.inputLabel}>
                    {key === 'hr' ? 'Heart Rate' : key === 'sys' ? 'Systolic BP' : key === 'dia' ? 'Diastolic BP' : key === 'temp' ? 'Temp (°C)' : key === 'rr' ? 'Resp. Rate' : key === 'spo2' ? 'SpO2 (%)' : 'Pain (0-10)'}
                  </Text>
                  <TextInput 
                    style={styles.input} 
                    value={vitalsForm[key]} 
                    onChangeText={t => setVitalsForm({...vitalsForm, [key]: t})} 
                    keyboardType={key === 'temp' ? 'decimal-pad' : 'numeric'} 
                    placeholder="0"
                    placeholderTextColor="#475569"
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveVitals} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveBtnText}>Save Vitals</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  unitScroll: { maxHeight: 50 },
  unitPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 10, gap: 8 },
  activeUnitPill: { backgroundColor: '#3b82f6' },
  unitText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  activeUnitText: { color: '#0f172a', fontWeight: 'bold' },
  statsBar: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 },
  
  // OPD Styles
  opdCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  opdHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  timeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusYellow: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusGreen: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusText: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold' },
  
  patientName: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  patientMeta: { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  triageAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 8, gap: 8 },
  triageText: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },

  // Inpatient Styles
  ipCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  critCard: { borderColor: '#ef4444', borderWidth: 2 },
  ipHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bedNum: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  newsBadge: { fontSize: 14, fontWeight: 'bold' },
  vitalsStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  vitalText: { color: '#cbd5e1', fontSize: 13, fontFamily: 'monospace', width: '45%' },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', padding: 8, borderRadius: 6, marginTop: 12, gap: 6 },
  allergyText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#020617' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalPatient: { color: '#3b82f6', fontSize: 16, marginTop: 4 },
  modalContent: { padding: 20 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputBox: { width: '48%', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  inputLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  input: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
