import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthProfile } from '@/lib/health/hooks/useHealthProfile';
import { ChildHealthProfile } from '@/lib/health/types';

export default function ChildrenScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { children, loading, addChildProfile, transferChild, getChildAge, isTransferReady } = useHealthProfile(mtaaId);
  const [showAdd, setShowAdd] = useState(false);
  const [newChild, setNewChild] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    bloodGroup: 'unknown' as any,
    allergies: [] as string[],
    chronicConditions: [] as string[],
    organDonor: false,
  });
  const [allergyInput, setAllergyInput] = useState('');

  async function handleAdd() {
    if (!newChild.fullName || !newChild.dateOfBirth) return;
    await addChildProfile({
      ...newChild,
      emergencyContacts: [],
    });
    setShowAdd(false);
    setNewChild({ fullName: '', dateOfBirth: '', gender: 'male', bloodGroup: 'unknown', allergies: [], chronicConditions: [], organDonor: false });
  }

  function addAllergy() {
    if (allergyInput.trim()) {
      setNewChild(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim()] }));
      setAllergyInput('');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Family Health</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtn}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map(child => (
            <ChildCard key={child.id} child={child} age={getChildAge(child)} transferReady={isTransferReady(child)} onTransfer={() => {}} />
          ))
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Child</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={newChild.fullName} onChangeText={t => setNewChild(p => ({ ...p, fullName: t }))} />
            <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" placeholderTextColor="#666" value={newChild.dateOfBirth} onChangeText={t => setNewChild(p => ({ ...p, dateOfBirth: t }))} />
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map(g => (
                <TouchableOpacity key={g} style={[styles.genderChip, newChild.gender === g && styles.genderChipActive]} onPress={() => setNewChild(p => ({ ...p, gender: g }))}>
                  <Text style={[styles.genderText, newChild.gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Blood Group (e.g. O+)" placeholderTextColor="#666" value={newChild.bloodGroup === 'unknown' ? '' : newChild.bloodGroup} onChangeText={t => setNewChild(p => ({ ...p, bloodGroup: t || 'unknown' }))} />
            <View style={styles.allergyRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add allergy" placeholderTextColor="#666" value={allergyInput} onChangeText={setAllergyInput} />
              <TouchableOpacity style={styles.addAllergyBtn} onPress={addAllergy}>
                <Text style={styles.addAllergyText}>+</Text>
              </TouchableOpacity>
            </View>
            {newChild.allergies.map((a, i) => (
              <View key={i} style={styles.allergyChip}>
                <Text style={styles.allergyText}>{a}</Text>
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChildCard({ child, age, transferReady, onTransfer }: { child: ChildHealthProfile; age: number; transferReady: boolean; onTransfer: () => void }) {
  return (
    <View style={styles.childCard}>
      <View style={styles.childHeader}>
        <Text style={styles.childName}>{child.fullName}</Text>
        <Text style={styles.childAge}>{age} years old</Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childDetail}>🩸 {child.bloodGroup}</Text>
        <Text style={styles.childDetail}>📅 {child.dateOfBirth}</Text>
        {child.allergies.length > 0 && <Text style={styles.childDetail}>⚠️ {child.allergies.join(', ')}</Text>}
      </View>
      <View style={styles.childActions}>
        <TouchableOpacity style={styles.childAction}>
          <Text style={styles.childActionText}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.childAction}>
          <Text style={styles.childActionText}>Vaccinations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.childAction}>
          <Text style={styles.childActionText}>Appointments</Text>
        </TouchableOpacity>
      </View>
      {transferReady && (
        <TouchableOpacity style={styles.transferBtn} onPress={onTransfer}>
          <Text style={styles.transferText}>🔄 Ready to Transfer (Age 16+)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addBtn: { color: '#007AFF', fontSize: 28, fontWeight: '300' },
  content: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#666', fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  childCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  childName: { color: '#fff', fontSize: 17, fontWeight: '600' },
  childAge: { color: '#888', fontSize: 13 },
  childInfo: { marginBottom: 12 },
  childDetail: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  childActions: { flexDirection: 'row', gap: 8 },
  childAction: { backgroundColor: '#2a2a2a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  childActionText: { color: '#007AFF', fontSize: 12, fontWeight: '600' },
  transferBtn: { marginTop: 10, backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, alignItems: 'center' },
  transferText: { color: '#FF9500', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: '#2a2a2a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  genderChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2a2a2a' },
  genderChipActive: { backgroundColor: '#007AFF' },
  genderText: { color: '#888', fontSize: 13 },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  allergyRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  addAllergyBtn: { backgroundColor: '#007AFF', width: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addAllergyText: { color: '#fff', fontSize: 20 },
  allergyChip: { backgroundColor: '#2a2a2a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 },
  allergyText: { color: '#FF9500', fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#2a2a2a', padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
