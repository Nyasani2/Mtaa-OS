// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Alert, useDoctorNotes } from '@/lib/health/hooks/useDoctor';
import { Feather } from '@expo/vector-icons';

export default function DoctorNotesScreen() {
  const router = useRouter();
  const { notes, patients, loading, createNote, signNote, isCreating, isSigning } = useDoctorNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [form, setForm] = useState({
    patient_id: '',
    title: '',
    content: '',
    type: 'progress',
  });

  const filteredNotes = notes.filter((n: any) => {
    if (filter === 'signed') return n.is_signed;
    if (filter === 'unsigned') return !n.is_signed;
    return true;
  });

  const handleCreate = async () => {
    if (!form.patient_id || !form.title || !form.content) {
      Alert.alert('Error', 'Patient, title, and content are required');
      return;
    }
    await createNote(form);
    setModalVisible(false);
    setForm({ patient_id: '', title: '', content: '', type: 'progress' });
  };

  const handleSign = async () => {
    if (!selectedNote) return;
    await signNote(selectedNote.id);
    setSignModalVisible(false);
    setSelectedNote(null);
  };

  const renderNote = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => { setSelectedNote(item); setSignModalVisible(true); }}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        {item.is_signed ? (
          <View style={styles.signedBadge}>
            <Feather name="check-circle" size={12} color="#10b981" />
            <Text style={styles.signedText}>Signed</Text>
          </View>
        ) : (
          <View style={styles.unsignedBadge}>
            <Feather name="alert-circle" size={12} color="#f59e0b" />
            <Text style={styles.unsignedText}>Unsigned</Text>
          </View>
        )}
      </View>
      <Text style={styles.notePatient}>{item.patient_name}</Text>
      <Text style={styles.noteType}>{item.type}</Text>
      <Text style={styles.noteContent} numberOfLines={3}>{item.content}</Text>
      <Text style={styles.noteDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      {!item.is_signed && (
        <TouchableOpacity
          style={styles.signBtn}
          onPress={() => { setSelectedNote(item); setSignModalVisible(true); }}
        >
          <Text style={styles.signBtnText}>Sign Note</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Doctor Notes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'signed', 'unsigned'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading notes...</Text>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No notes found.</Text>}
        />
      )}

      {/* Create Note Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Clinical Note</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Patient</Text>
              <View style={styles.pickerRow}>
                {patients.map((p: any) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.patientChip, form.patient_id === p.id && styles.patientChipActive]}
                    onPress={() => setForm({ ...form, patient_id: p.id })}
                  >
                    <Text style={[styles.patientChipText, form.patient_id === p.id && styles.patientChipTextActive]}>
                      {p.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
                placeholder="Note title"
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerRow}>
                {['progress', 'admission', 'discharge', 'consultation', 'procedure'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                    onPress={() => setForm({ ...form, type })}
                  >
                    <Text style={[styles.typeChipText, form.type === type && styles.typeChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.content}
                onChangeText={(t) => setForm({ ...form, content: t })}
                placeholder="Clinical note content..."
                multiline
                numberOfLines={6}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={isCreating}>
                <Text style={styles.saveBtnText}>{isCreating ? 'Saving...' : 'Save Note'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Modal */}
      <Modal visible={signModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.signModalContent}>
            <Feather name="file-text" size={40} color="#2563eb" />
            <Text style={styles.signModalTitle}>Sign Clinical Note</Text>
            <Text style={styles.signModalSub}>
              {selectedNote?.title} — {selectedNote?.patient_name}
            </Text>
            <Text style={styles.signModalWarn}>
              Once signed, this note cannot be edited. This action is permanent and auditable.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSignModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSign} disabled={isSigning}>
                <Text style={styles.saveBtnText}>{isSigning ? 'Signing...' : 'Confirm Sign'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#6b7280' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  loading: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  noteCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  signedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  signedText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  unsignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  unsignedText: { fontSize: 11, color: '#d97706', fontWeight: '600' },
  notePatient: { fontSize: 14, color: '#4b5563', marginBottom: 4 },
  noteType: { fontSize: 12, color: '#2563eb', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  noteContent: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  noteDate: { fontSize: 12, color: '#9ca3af' },
  signBtn: { marginTop: 10, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  signBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f9fafb' },
  textArea: { height: 120, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  patientChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  patientChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  patientChipText: { fontSize: 13, color: '#4b5563' },
  patientChipTextActive: { color: '#fff', fontWeight: '600' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  typeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeChipText: { fontSize: 12, color: '#4b5563' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: '#6b7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  signModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center' },
  signModalTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  signModalSub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  signModalWarn: { fontSize: 13, color: '#dc2626', textAlign: 'center', marginTop: 12, lineHeight: 18 },
});
