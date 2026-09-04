
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, useNurse } from '@/lib/health/hooks/useNurse';
import { Alert, useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Alert, ClipboardList, Plus, Search, X, Clock, User, CheckCircle, AlertTriangle, FileText } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function NurseHandoverScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHandover, setNewHandover] = useState({ patient_id: '', shift: 'morning', notes: '', critical: false, tasks: '' });
  const { handovers, patients, loading, error, refresh, createHandover, acknowledgeHandover } = useNurse(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredHandovers = handovers?.filter((h: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.patient_name?.toLowerCase().includes(q) || h.notes?.toLowerCase().includes(q);
  });

  const handleCreate = useCallback(async () => {
    if (!newHandover.patient_id || !newHandover.notes.trim()) {
      Alert.alert('Error', 'Patient and notes are required'); return;
    }
    try {
      await createHandover({ ...newHandover, facility_id: selectedFacilityId });
      setShowAddModal(false);
      setNewHandover({ patient_id: '', shift: 'morning', notes: '', critical: false, tasks: '' });
      Alert.alert('Success', 'Handover note created');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to create handover'); }
  }, [newHandover, selectedFacilityId, createHandover]);

  const handleAcknowledge = useCallback(async (handoverId: string) => {
    Alert.alert('Acknowledge', 'Mark this handover as acknowledged?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Acknowledge', onPress: async () => {
        try { await acknowledgeHandover(handoverId); Alert.alert('Success', 'Handover acknowledged'); }
        catch (err: any) { Alert.alert('Error', err.message || 'Failed'); }
      }}
    ]);
  }, [acknowledgeHandover]);

  const getShiftColor = (shift: string) => {
    switch (shift) { case 'morning': return '#F59E0B'; case 'afternoon': return '#0A4DA6'; case 'night': return '#1F2937'; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading handovers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Handover Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>New Note</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search handovers..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredHandovers?.length === 0 ? (
          <View style={styles.emptyState}><ClipboardList size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No handovers match' : 'No handover notes yet'}</Text></View>
        ) : (
          filteredHandovers?.map((h: any) => (
            <View key={h.id} style={[styles.handoverCard, h.critical && styles.criticalCard]}>
              <View style={styles.handoverHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: h.critical ? COLORS.danger + '20' : COLORS.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: h.critical ? COLORS.danger : COLORS.primary }]}>{h.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{h.patient_name}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.shiftBadge, { backgroundColor: getShiftColor(h.shift) + '20' }]}>
                        <Text style={[styles.shiftText, { color: getShiftColor(h.shift) }]}>{h.shift}</Text>
                      </View>
                      <Text style={styles.timeText}>{new Date(h.created_at).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
                {h.critical && <AlertTriangle size={20} color={COLORS.danger} />}
              </View>
              <View style={styles.handoverBody}>
                <Text style={styles.notesText}>{h.notes}</Text>
                {h.tasks && (
                  <View style={styles.tasksRow}>
                    <FileText size={14} color={COLORS.primary} />
                    <Text style={styles.tasksText}>Tasks: {h.tasks}</Text>
                  </View>
                )}
              </View>
              <View style={styles.handoverFooter}>
                <Text style={styles.authorText}>By {h.created_by_name || 'Nurse'}</Text>
                {h.acknowledged ? (
                  <View style={styles.ackBadge}>
                    <CheckCircle size={14} color={COLORS.success} />
                    <Text style={styles.ackText}>Acknowledged</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.ackButton} onPress={() => handleAcknowledge(h.id)}>
                    <Text style={styles.ackButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Handover Note</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient *</Text>
              <View style={styles.patientRow}>
                {patients?.map((p: any) => (
                  <TouchableOpacity key={p.id} style={[styles.patientChip, newHandover.patient_id === p.id && styles.patientChipActive]} onPress={() => setNewHandover({ ...newHandover, patient_id: p.id })}>
                    <Text style={[styles.patientChipText, newHandover.patient_id === p.id && styles.patientChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Shift</Text>
              <View style={styles.shiftRow}>
                {['morning', 'afternoon', 'night'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.shiftChip, newHandover.shift === s && styles.shiftChipActive]} onPress={() => setNewHandover({ ...newHandover, shift: s })}>
                    <Text style={[styles.shiftChipText, newHandover.shift === s && styles.shiftChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Notes *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Patient condition, concerns, updates..." value={newHandover.notes} onChangeText={(t) => setNewHandover({ ...newHandover, notes: t })} multiline numberOfLines={4} />
              <Text style={styles.inputLabel}>Tasks for Next Shift</Text>
              <TextInput style={styles.input} placeholder="Follow-up tasks..." value={newHandover.tasks} onChangeText={(t) => setNewHandover({ ...newHandover, tasks: t })} />
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Critical / Urgent</Text>
                <TouchableOpacity style={[styles.criticalToggle, newHandover.critical && styles.criticalToggleActive]} onPress={() => setNewHandover({ ...newHandover, critical: !newHandover.critical })}>
                  <Text style={[styles.criticalText, newHandover.critical && styles.criticalTextActive]}>{newHandover.critical ? 'YES' : 'NO'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleCreate}>
                <Text style={styles.modalSubmitText}>Create Handover</Text>
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
  handoverCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  criticalCard: { borderColor: COLORS.danger, borderWidth: 2 },
  handoverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  patientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  shiftBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  shiftText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  timeText: { fontSize: 11, color: COLORS.textLight },
  handoverBody: { marginLeft: 52, marginBottom: 10 },
  notesText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  tasksRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  tasksText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  handoverFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 52, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  authorText: { fontSize: 11, color: COLORS.textLight },
  ackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ackText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  ackButton: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ackButtonText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  patientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patientChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  patientChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  patientChipText: { fontSize: 12, color: COLORS.textLight },
  patientChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  shiftRow: { flexDirection: 'row', gap: 8 },
  shiftChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  shiftChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  shiftChipText: { fontSize: 12, color: COLORS.textLight, textTransform: 'capitalize' },
  shiftChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  criticalToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  criticalToggleActive: { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger },
  criticalText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  criticalTextActive: { color: COLORS.danger },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
