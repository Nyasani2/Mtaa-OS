import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Pill, Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Search
} from 'lucide-react-native';

interface MedAdmin {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduled_time: string;
  given: boolean;
  given_at: string | null;
  given_by: string | null;
  patient_name: string;
  patient_id: string;
  prn: boolean;
  notes: string | null;
}

const TIME_SLOTS = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

export default function MedAdminScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [meds, setMeds] = useState<MedAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPRN, setShowPRN] = useState(false);

  useEffect(() => { loadMeds(); }, [patientId]);

  const loadMeds = async () => {
    try {
      let query = supabase
        .from('medication_administrations')
        .select('*, prescriptions(name, dosage, route, frequency, prn), patients(full_name)')
        .eq('date', new Date().toISOString().split('T')[0])
        .order('scheduled_time', { ascending: true });
      if (patientId) query = query.eq('patient_id', patientId);
      const { data, error } = await query;
      if (error) throw error;
      const formatted = (data || []).map((m: any) => ({
        id: m.id, prescription_id: m.prescription_id,
        medication_name: m.prescriptions?.name || 'Unknown',
        dosage: m.prescriptions?.dosage || '', route: m.prescriptions?.route || 'PO',
        frequency: m.prescriptions?.frequency || '', scheduled_time: m.scheduled_time,
        given: m.given, given_at: m.given_at, given_by: m.given_by,
        patient_name: m.patients?.full_name || 'Unknown', patient_id: m.patient_id,
        prn: m.prescriptions?.prn || false, notes: m.notes,
      }));
      setMeds(formatted);
    } catch (err) { Alert.alert('Error', 'Failed to load medications'); }
    finally { setLoading(false); }
  };

  const administer = async (medId: string, notes?: string) => {
    try {
      const { error } = await supabase.from('medication_administrations').update({
        given: true, given_at: new Date().toISOString(), given_by: user?.id, notes: notes || null,
      }).eq('id', medId);
      if (error) throw error;
      loadMeds();
    } catch (err) { Alert.alert('Error', 'Failed to record administration'); }
  };

  const skipDose = async (medId: string, reason: string) => {
    try {
      const { error } = await supabase.from('medication_administrations').update({
        given: false, skipped: true, skip_reason: reason, notes: reason,
      }).eq('id', medId);
      if (error) throw error;
      loadMeds();
    } catch (err) { Alert.alert('Error', 'Failed to skip dose'); }
  };

  const filteredMeds = meds.filter(m => {
    if (selectedTime && m.scheduled_time !== selectedTime) return false;
    if (showPRN && !m.prn) return false;
    if (!showPRN && m.prn) return false;
    if (searchQuery && !m.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = meds.filter(m => !m.given && !m.prn).length;
  const givenCount = meds.filter(m => m.given).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Medication Round</Text>
          <Text style={styles.headerSubtitle}>{pendingCount} pending · {givenCount} given</Text>
        </View>
        <TouchableOpacity onPress={() => setShowPRN(!showPRN)} style={[styles.prnToggle, showPRN && styles.prnToggleActive]}>
          <Text style={[styles.prnText, showPRN && styles.prnTextActive]}>PRN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput style={styles.searchInput} placeholder="Search medication or patient..." placeholderTextColor="#64748b" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <FlatList
        data={filteredMeds}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[styles.medCard, item.given && styles.medCardGiven]}>
            <View style={styles.medHeader}>
              <View style={styles.medIdentity}>
                <Pill size={18} color={item.given ? '#22c55e' : '#6366f1'} />
                <View>
                  <Text style={styles.medName}>{item.medication_name}</Text>
                  <Text style={styles.medDose}>{item.dosage} · {item.route} · {item.frequency}</Text>
                </View>
              </View>
              {item.prn && <View style={styles.prnBadge}><Text style={styles.prnBadgeText}>PRN</Text></View>}
            </View>
            <View style={styles.patientRow}>
              <User size={14} color="#94a3b8" />
              <Text style={styles.patientText}>{item.patient_name}</Text>
              <Clock size={14} color="#64748b" />
              <Text style={styles.timeLabel}>{item.scheduled_time}</Text>
            </View>
            {!item.given ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.giveBtn} onPress={() => {
                  if (item.prn) { Alert.alert('PRN Dose', 'Enter reason:', [{ text: 'Cancel', style: 'cancel' }, { text: 'Give', onPress: () => administer(item.id, 'PRN - as needed') }]); }
                  else { administer(item.id); }
                }}>
                  <CheckCircle2 size={16} color="#fff" /><Text style={styles.giveBtnText}>Give</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={() => {
                  Alert.alert('Skip Dose', 'Reason:', [
                    { text: 'Patient refused', onPress: () => skipDose(item.id, 'Patient refused') },
                    { text: 'NPO', onPress: () => skipDose(item.id, 'NPO') },
                    { text: 'Other', onPress: () => skipDose(item.id, 'Other') },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}>
                  <XCircle size={16} color="#ef4444" /><Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.givenRow}>
                <CheckCircle2 size={14} color="#22c55e" />
                <Text style={styles.givenText}>Given {item.given_at ? new Date(item.given_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Pill size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No medications</Text>
            <Text style={styles.emptySubtitle}>All doses for this round are complete</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  prnToggle: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  prnToggleActive: { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' },
  prnText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  prnTextActive: { color: '#f59e0b' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8, fontSize: 14 },
  medCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  medCardGiven: { opacity: 0.7 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  medIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  medDose: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  prnBadge: { backgroundColor: '#f59e0b20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  prnBadgeText: { color: '#f59e0b', fontSize: 10, fontWeight: '700' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  patientText: { color: '#cbd5e1', fontSize: 13 },
  timeLabel: { color: '#64748b', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  giveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12 },
  giveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  skipBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  givenRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  givenText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
});
