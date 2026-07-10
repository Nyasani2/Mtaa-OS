
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useNurse } from '@/lib/health/hooks/useNurse';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Heart, Plus, Search, X, Thermometer, Activity, Droplets, Wind, TrendingUp, User } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function NurseVitalsScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVital, setNewVital] = useState({ patient_id: '', temperature: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', notes: '' });
  const { vitals, // STUB_REMOVED: "patients", loading, error, refresh, recordVitals } = useNurse(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredVitals = vitals?.filter((v: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.patient_name?.toLowerCase().includes(q);
  });

  const handleRecord = useCallback(async () => {
    if (!newVital.patient_id) { Alert.alert('Error', 'Select a patient'); return; }
    try {
      await recordVitals({ ...newVital, facility_id: selectedFacilityId });
      setShowAddModal(false);
      setNewVital({ patient_id: '', temperature: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', notes: '' });
      Alert.alert('Success', 'Vitals recorded');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to record vitals'); }
  }, [newVital, selectedFacilityId, recordVitals]);

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'temperature': return value > 37.5 ? COLORS.danger : value > 37.0 ? COLORS.warning : COLORS.success;
      case 'heart_rate': return value > 100 ? COLORS.danger : value < 60 ? COLORS.warning : COLORS.success;
      case 'oxygen_saturation': return value < 95 ? COLORS.danger : value < 98 ? COLORS.warning : COLORS.success;
      default: return COLORS.textLight;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading vitals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vitals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Record Vitals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search // STUB_REMOVED: "patients"..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredVitals?.length === 0 ? (
          <View style={styles.emptyState}><Heart size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No vitals found' : 'No vitals recorded yet'}</Text></View>
        ) : (
          filteredVitals?.map((v: any) => (
            <TouchableOpacity key={v.id} style={styles.vitalCard} onPress={() => router.push(`/(os)/health/nurse/vitals/${v.id}`)}>
              <View style={styles.vitalHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.avatarText}>{v.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{v.patient_name}</Text>
                    <Text style={styles.vitalTime}>{new Date(v.recorded_at).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.vitalsGrid}>
                {v.temperature && (
                  <View style={styles.vitalItem}>
                    <Thermometer size={16} color={getVitalStatus('temperature', parseFloat(v.temperature))} />
                    <Text style={styles.vitalValue}>{v.temperature}C</Text>
                    <Text style={styles.vitalLabel}>Temp</Text>
                  </View>
                )}
                {v.blood_pressure && (
                  <View style={styles.vitalItem}>
                    <Activity size={16} color={COLORS.primary} />
                    <Text style={styles.vitalValue}>{v.blood_pressure}</Text>
                    <Text style={styles.vitalLabel}>BP</Text>
                  </View>
                )}
                {v.heart_rate && (
                  <View style={styles.vitalItem}>
                    <Heart size={16} color={getVitalStatus('heart_rate', parseInt(v.heart_rate))} />
                    <Text style={styles.vitalValue}>{v.heart_rate}</Text>
                    <Text style={styles.vitalLabel}>HR</Text>
                  </View>
                )}
                {v.respiratory_rate && (
                  <View style={styles.vitalItem}>
                    <Wind size={16} color={COLORS.textLight} />
                    <Text style={styles.vitalValue}>{v.respiratory_rate}</Text>
                    <Text style={styles.vitalLabel}>RR</Text>
                  </View>
                )}
                {v.oxygen_saturation && (
                  <View style={styles.vitalItem}>
                    <Droplets size={16} color={getVitalStatus('oxygen_saturation', parseInt(v.oxygen_saturation))} />
                    <Text style={styles.vitalValue}>{v.oxygen_saturation}%</Text>
                    <Text style={styles.vitalLabel}>SpO2</Text>
                  </View>
                )}
                {v.weight && (
                  <View style={styles.vitalItem}>
                    <TrendingUp size={16} color={COLORS.textLight} />
                    <Text style={styles.vitalValue}>{v.weight}kg</Text>
                    <Text style={styles.vitalLabel}>Weight</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Vitals</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient *</Text>
              <View style={styles.patientRow}>
                {// STUB_REMOVED: "patients"?.map((p: any) => (
                  <TouchableOpacity key={p.id} style={[styles.patientChip, newVital.patient_id === p.id && styles.patientChipActive]} onPress={() => setNewVital({ ...newVital, patient_id: p.id })}>
                    <Text style={[styles.patientChipText, newVital.patient_id === p.id && styles.patientChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.vitalInputsRow}>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Temperature (C)</Text>
                  <TextInput style={styles.input} placeholder="36.5" value={newVital.temperature} onChangeText={(t) => setNewVital({ ...newVital, temperature: t })} keyboardType="decimal-pad" />
                </View>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Blood Pressure</Text>
                  <TextInput style={styles.input} placeholder="120/80" value={newVital.blood_pressure} onChangeText={(t) => setNewVital({ ...newVital, blood_pressure: t })} />
                </View>
              </View>
              <View style={styles.vitalInputsRow}>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Heart Rate</Text>
                  <TextInput style={styles.input} placeholder="72" value={newVital.heart_rate} onChangeText={(t) => setNewVital({ ...newVital, heart_rate: t })} keyboardType="number-pad" />
                </View>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Respiratory Rate</Text>
                  <TextInput style={styles.input} placeholder="16" value={newVital.respiratory_rate} onChangeText={(t) => setNewVital({ ...newVital, respiratory_rate: t })} keyboardType="number-pad" />
                </View>
              </View>
              <View style={styles.vitalInputsRow}>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Oxygen Sat %</Text>
                  <TextInput style={styles.input} placeholder="98" value={newVital.oxygen_saturation} onChangeText={(t) => setNewVital({ ...newVital, oxygen_saturation: t })} keyboardType="number-pad" />
                </View>
                <View style={styles.vitalInputHalf}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput style={styles.input} placeholder="70" value={newVital.weight} onChangeText={(t) => setNewVital({ ...newVital, weight: t })} keyboardType="decimal-pad" />
                </View>
              </View>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput style={styles.input} placeholder="170" value={newVital.height} onChangeText={(t) => setNewVital({ ...newVital, height: t })} keyboardType="decimal-pad" />
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional observations..." value={newVital.notes} onChangeText={(t) => setNewVital({ ...newVital, notes: t })} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleRecord}>
                <Text style={styles.modalSubmitText}>Record Vitals</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  vitalCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  vitalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  vitalTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginLeft: 52 },
  vitalItem: { alignItems: 'center', minWidth: 60 },
  vitalValue: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  vitalLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 1 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  patientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patientChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  patientChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  patientChipText: { fontSize: 12, color: COLORS.textLight },
  patientChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  vitalInputsRow: { flexDirection: 'row', gap: 10 },
  vitalInputHalf: { flex: 1 },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
