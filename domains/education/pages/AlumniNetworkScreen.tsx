import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAlumni } from '../hooks/useAlumni';

export default function AlumniNetworkScreen({ institutionId }: { institutionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { alumni, stats, loading, error, refresh, addAlumni } = useAlumni(institutionId);
  
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ graduation_year: '', final_level: '', current_occupation: '', current_employer: '', is_mentor: false });
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    if (!form.graduation_year || !form.final_level) { Alert.alert('Error', 'Year and Level are required'); return; }
    setRegistering(true);
    try {
      await addAlumni({
        user_id: user?.id,
        institution_id: institutionId,
        graduation_year: parseInt(form.graduation_year),
        final_level: form.final_level,
        current_occupation: form.current_occupation || null,
        current_employer: form.current_employer || null,
        is_mentor: form.is_mentor,
        is_donor: false,
        total_donated: 0,
        is_active: true,
      });
      setShowRegister(false);
      setForm({ graduation_year: '', final_level: '', current_occupation: '', current_employer: '', is_mentor: false });
      Alert.alert('Success', 'Welcome to the Alumni Network!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setRegistering(false); }
  };

  if (loading && !alumni.length) {
    return <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alumni Network</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{stats?.total || 0} Graduates</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />} contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="people" size={24} color="#3b82f6" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Alumni</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="school" size={24} color="#10b981" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.mentors}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mentors</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="heart" size={24} color="#ef4444" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.donors}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Donors</Text>
            </View>
          </View>
        )}

        {/* Register Button */}
        <TouchableOpacity style={[styles.registerBtn, { backgroundColor: colors.primary }]} onPress={() => setShowRegister(true)}>
          <Ionicons name="graduation-cap" size={20} color="#fff" />
          <Text style={styles.registerBtnText}>Join Alumni Network</Text>
        </TouchableOpacity>

        {/* Alumni List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Graduates</Text>
        {alumni.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No alumni registered yet.</Text>
          </View>
        ) : (
          alumni.map((a: any) => (
            <View key={a.id} style={[styles.alumniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{a.user?.full_name?.charAt(0) || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alumniName, { color: colors.text }]}>{a.user?.full_name || 'Alumni'}</Text>
                <Text style={[styles.alumniMeta, { color: colors.textSecondary }]}>Class of {a.graduation_year} · {a.final_level}</Text>
                {a.current_occupation && <Text style={[styles.alumniJob, { color: colors.textSecondary }]}>💼 {a.current_occupation} {a.current_employer ? `@ ${a.current_employer}` : ''}</Text>}
              </View>
              {a.is_mentor && (
                <View style={[styles.mentorBadge, { backgroundColor: '#10b98120' }]}>
                  <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700' }}>MENTOR</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Register Modal */}
      <Modal visible={showRegister} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Join Alumni Network</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Graduation Year *" placeholderTextColor={colors.textSecondary} value={form.graduation_year} onChangeText={t => setForm(p => ({...p, graduation_year: t}))} keyboardType="numeric" />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Final Level (e.g., Form 4) *" placeholderTextColor={colors.textSecondary} value={form.final_level} onChangeText={t => setForm(p => ({...p, final_level: t}))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Current Occupation" placeholderTextColor={colors.textSecondary} value={form.current_occupation} onChangeText={t => setForm(p => ({...p, current_occupation: t}))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Current Employer" placeholderTextColor={colors.textSecondary} value={form.current_employer} onChangeText={t => setForm(p => ({...p, current_employer: t}))} />
            
            <TouchableOpacity style={[styles.mentorToggle, form.is_mentor && { backgroundColor: '#10b98120', borderColor: '#10b981' }]} onPress={() => setForm(p => ({...p, is_mentor: !p.is_mentor}))}>
              <Ionicons name="school" size={20} color={form.is_mentor ? '#10b981' : colors.textSecondary} />
              <Text style={[styles.mentorToggleText, { color: form.is_mentor ? '#10b981' : colors.text }]}>I want to be a Mentor</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowRegister(false)}><Text style={{ color: colors.text }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={registering}>
                {registering ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Join Network</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 11, marginTop: 2 },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 20 },
  registerBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  alumniCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  alumniName: { fontSize: 15, fontWeight: '700' },
  alumniMeta: { fontSize: 12, marginTop: 2 },
  alumniJob: { fontSize: 12, marginTop: 4 },
  mentorBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1 },
  emptyText: { marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  mentorToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  mentorToggleText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
