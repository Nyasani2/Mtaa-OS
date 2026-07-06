import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'unknown' | null;
  id_number: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  blood_type: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  registered_at: string;
}

export default function ReceptionistRegisterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'unknown' as Patient['gender'],
    id_number: '',
    insurance_provider: '',
    insurance_number: '',
    blood_type: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
  });

  useEffect(() => {
    loadPatients();
  }, [search]);

  async function loadPatients() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_patients')
        .select('*')
        .order('registered_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,id_number.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPatients(data || []);
    } catch (err) {
      console.error('Patients load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function registerPatient() {
    if (!user || !form.full_name) return;
    const { error } = await supabase.from('health_patients').insert({
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      id_number: form.id_number || null,
      insurance_provider: form.insurance_provider || null,
      insurance_number: form.insurance_number || null,
      blood_type: form.blood_type || null,
      allergies: form.allergies || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      address: form.address || null,
      registered_at: new Date().toISOString(),
    });
    if (!error) {
      setShowForm(false);
      setForm({ full_name: '', phone: '', email: '', date_of_birth: '', gender: 'unknown', id_number: '', insurance_provider: '', insurance_number: '', blood_type: '', allergies: '', emergency_contact_name: '', emergency_contact_phone: '', address: '' });
      loadPatients();
    }
  }

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  const genders: Array<Patient['gender']> = ['male', 'female', 'other', 'unknown'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Registration</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {!showForm && (
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search patients by name, phone, or ID..."
            placeholderTextColor="#64748b"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showForm && (
        <ScrollView style={styles.formScroll} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.formTitle}>New Patient Registration</Text>
          <TextInput style={styles.input} value={form.full_name} onChangeText={t => setForm(f => ({ ...f, full_name: t }))} placeholder="Full name *" placeholderTextColor="#64748b" />
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} placeholder="Phone" placeholderTextColor="#64748b" keyboardType="phone-pad" />
            <TextInput style={[styles.input, styles.half]} value={form.email} onChangeText={t => setForm(f => ({ ...f, email: t }))} placeholder="Email" placeholderTextColor="#64748b" keyboardType="email-address" />
          </View>
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.date_of_birth} onChangeText={t => setForm(f => ({ ...f, date_of_birth: t }))} placeholder="DOB (YYYY-MM-DD)" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.id_number} onChangeText={t => setForm(f => ({ ...f, id_number: t }))} placeholder="ID Number" placeholderTextColor="#64748b" />
          </View>
          <View style={styles.genderRow}>
            {genders.map(g => (
              <TouchableOpacity key={g} style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]} onPress={() => setForm(f => ({ ...f, gender: g }))}>
                <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g?.charAt(0).toUpperCase()}{g?.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.insurance_provider} onChangeText={t => setForm(f => ({ ...f, insurance_provider: t }))} placeholder="Insurance Provider" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.insurance_number} onChangeText={t => setForm(f => ({ ...f, insurance_number: t }))} placeholder="Insurance Number" placeholderTextColor="#64748b" />
          </View>
          <View style={styles.bloodRow}>
            <Text style={styles.bloodLabel}>Blood Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bloodTypes.map(bt => (
                <TouchableOpacity key={bt} style={[styles.bloodBtn, form.blood_type === bt && styles.bloodBtnActive]} onPress={() => setForm(f => ({ ...f, blood_type: bt }))}>
                  <Text style={[styles.bloodText, form.blood_type === bt && styles.bloodTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <TextInput style={styles.input} value={form.allergies} onChangeText={t => setForm(f => ({ ...f, allergies: t }))} placeholder="Allergies (if any)" placeholderTextColor="#64748b" />
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.emergency_contact_name} onChangeText={t => setForm(f => ({ ...f, emergency_contact_name: t }))} placeholder="Emergency Contact Name" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.emergency_contact_phone} onChangeText={t => setForm(f => ({ ...f, emergency_contact_phone: t }))} placeholder="Emergency Contact Phone" placeholderTextColor="#64748b" keyboardType="phone-pad" />
          </View>
          <TextInput style={[styles.input, { height: 80 }]} value={form.address} onChangeText={t => setForm(f => ({ ...f, address: t }))} placeholder="Address" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={registerPatient}>
            <Text style={styles.submitBtnText}>Register Patient</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {!showForm && (
        loading ? (
          <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={patients}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/(os)/health/doctor/patient/${item.id}`)}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.full_name}</Text>
                    <Text style={styles.cardDetail}>{item.phone || 'No phone'} — {item.id_number || 'No ID'}</Text>
                    <Text style={styles.cardMeta}>{item.gender || 'Unknown'} • {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : 'No DOB'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>
                {item.insurance_provider && (
                  <View style={styles.insuranceRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
                    <Text style={styles.insuranceText}>{item.insurance_provider} — {item.insurance_number}</Text>
                  </View>
                )}
                {item.blood_type && (
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: '#ef444420' }]}>
                      <Text style={[styles.badgeText, { color: '#ef4444' }]}>{item.blood_type}</Text>
                    </View>
                    {item.allergies && (
                      <View style={[styles.badge, { backgroundColor: '#f59e0b20' }]}>
                        <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Allergies</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>{search ? 'No patients match your search' : 'No patients registered yet'}</Text>
              </View>
            }
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14, padding: 0 },
  formScroll: { flex: 1 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  genderBtnActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  genderText: { fontSize: 12, color: '#94a3b8' },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  bloodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bloodLabel: { fontSize: 13, color: '#94a3b8', width: 70 },
  bloodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1e293b', marginRight: 6, borderWidth: 1, borderColor: '#334155' },
  bloodBtnActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  bloodText: { fontSize: 12, color: '#94a3b8' },
  bloodTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 1 },
  insuranceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  insuranceText: { fontSize: 12, color: '#22c55e' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
