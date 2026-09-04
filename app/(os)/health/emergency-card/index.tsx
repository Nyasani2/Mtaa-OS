import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, getEmergencyData, updateEmergencyData, validateEmergencyData, EmergencyData, EmergencyContact } from '@/lib/health/security/emergency-card';

export default function EmergencyCardEditScreen() {
  const router = useRouter();
  const [data, setData] = useState<EmergencyData>({
    fullName: '',
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    currentCriticalMedications: [],
    emergencyContacts: [],
    organDonor: false,
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medInput, setMedInput] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRel, setContactRel] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const d = await getEmergencyData();
    if (d) setData(d);
  }

  async function save() {
    const errors = validateEmergencyData(data);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }
    setSaving(true);
    await updateEmergencyData(data);
    setSaving(false);
    router.back();
  }

  function addAllergy() {
    if (allergyInput.trim()) {
      setData(p => ({ ...p, allergies: [...p.allergies, allergyInput.trim()] }));
      setAllergyInput('');
    }
  }

  function addCondition() {
    if (conditionInput.trim()) {
      setData(p => ({ ...p, chronicConditions: [...p.chronicConditions, conditionInput.trim()] }));
      setConditionInput('');
    }
  }

  function addMed() {
    if (medInput.trim()) {
      setData(p => ({ ...p, currentCriticalMedications: [...p.currentCriticalMedications, medInput.trim()] }));
      setMedInput('');
    }
  }

  function addContact() {
    if (contactName.trim() && contactPhone.trim()) {
      const contact: EmergencyContact = {
        name: contactName.trim(),
        relationship: contactRel.trim() || 'Emergency',
        phone: contactPhone.trim(),
      };
      setData(p => ({ ...p, emergencyContacts: [...p.emergencyContacts, contact] }));
      setContactName('');
      setContactRel('');
      setContactPhone('');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Info</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={styles.save}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Basic Info</Text>
      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={data.fullName} onChangeText={t => setData(p => ({ ...p, fullName: t }))} />
      <TextInput style={styles.input} placeholder="Blood Group (e.g. O+)" placeholderTextColor="#666" value={data.bloodGroup} onChangeText={t => setData(p => ({ ...p, bloodGroup: t }))} />

      <Text style={styles.section}>Allergies</Text>
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add allergy" placeholderTextColor="#666" value={allergyInput} onChangeText={setAllergyInput} />
        <TouchableOpacity style={styles.addBtn} onPress={addAllergy}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      {data.allergies.map((a, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{a}</Text>
          <TouchableOpacity onPress={() => setData(p => ({ ...p, allergies: p.allergies.filter((_, idx) => idx !== i) }))}>
            <Text style={styles.chipRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.section}>Chronic Conditions</Text>
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add condition" placeholderTextColor="#666" value={conditionInput} onChangeText={setConditionInput} />
        <TouchableOpacity style={styles.addBtn} onPress={addCondition}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      {data.chronicConditions.map((c, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{c}</Text>
          <TouchableOpacity onPress={() => setData(p => ({ ...p, chronicConditions: p.chronicConditions.filter((_, idx) => idx !== i) }))}>
            <Text style={styles.chipRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.section}>Critical Medications</Text>
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add medication" placeholderTextColor="#666" value={medInput} onChangeText={setMedInput} />
        <TouchableOpacity style={styles.addBtn} onPress={addMed}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      {data.currentCriticalMedications.map((m, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{m}</Text>
          <TouchableOpacity onPress={() => setData(p => ({ ...p, currentCriticalMedications: p.currentCriticalMedications.filter((_, idx) => idx !== i) }))}>
            <Text style={styles.chipRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.section}>Emergency Contacts</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666" value={contactName} onChangeText={setContactName} />
      <TextInput style={styles.input} placeholder="Relationship" placeholderTextColor="#666" value={contactRel} onChangeText={setContactRel} />
      <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#666" keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} />
      <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
        <Text style={styles.addContactText}>Add Contact</Text>
      </TouchableOpacity>
      {data.emergencyContacts.map((c, i) => (
        <View key={i} style={styles.contactCard}>
          <Text style={styles.contactName}>{c.name} ({c.relationship})</Text>
          <Text style={styles.contactPhone}>{c.phone}</Text>
        </View>
      ))}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Organ Donor</Text>
        <TouchableOpacity
          style={[styles.toggle, data.organDonor && styles.toggleOn]}
          onPress={() => setData(p => ({ ...p, organDonor: !p.organDonor }))}
        >
          <View style={[styles.toggleKnob, data.organDonor && styles.toggleKnobOn]} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 34, marginBottom: 16 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  save: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  section: { color: '#888', fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  addBtn: { backgroundColor: '#007AFF', width: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#fff', fontSize: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4, gap: 6 },
  chipText: { color: '#FF9500', fontSize: 13 },
  chipRemove: { color: '#666', fontSize: 12 },
  addContactBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  addContactText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 8 },
  contactName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  contactPhone: { color: '#888', fontSize: 13, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 12 },
  toggleLabel: { color: '#fff', fontSize: 15 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#333', padding: 2 },
  toggleOn: { backgroundColor: '#34C759' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobOn: { transform: [{ translateX: 22 }] },
  bottomPad: { height: 40 },
});