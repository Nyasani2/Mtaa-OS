import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SchoolFeesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'term', due_date: '' });

  const loadFees = async () => {
    try {
      const { data, error } = await supabase.from('education_fees').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFees(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadFees(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.amount) { Alert.alert('Error', 'Name and amount are required'); return; }
    try {
      const { error } = await supabase.from('education_fees').insert({
        name: form.name, amount: parseFloat(form.amount), frequency: form.frequency,
        due_date: form.due_date || null, status: 'active', institution_id: (user as any)?.institution_id
      });
      if (error) throw error;
      Alert.alert('Success', 'Fee structure created');
      setShowCreate(false); setForm({ name: '', amount: '', frequency: 'term', due_date: '' });
      loadFees();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Fee Structure</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}><Ionicons name="add-circle" size={24} color="#0ea5e9" /></TouchableOpacity>
      </View>
      <FlatList
        data={fees}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFees(); }} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.feeName}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#064e3b' : '#451a03' }]}>
                <Text style={{ color: item.status === 'active' ? '#6ee7b7' : '#fcd34d', fontSize: 10, fontWeight: '700' }}>{item.status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.feeAmount}>KES {parseFloat(item.amount).toLocaleString()}</Text>
            <Text style={styles.feeMeta}>Frequency: {item.frequency} {item.due_date ? `• Due: ${new Date(item.due_date).toLocaleDateString()}` : ''}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No fee structures found</Text>}
      />
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Fee Structure</Text>
            <TextInput style={styles.input} placeholder="Fee Name (e.g., Tuition Term 1)" placeholderTextColor="#666" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={styles.input} placeholder="Amount (KES)" placeholderTextColor="#666" keyboardType="numeric" value={form.amount} onChangeText={t => setForm({...form, amount: t})} />
            <TextInput style={styles.input} placeholder="Due Date (YYYY-MM-DD)" placeholderTextColor="#666" value={form.due_date} onChangeText={t => setForm({...form, due_date: t})} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  feeName: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  feeAmount: { color: '#0ea5e9', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  feeMeta: { color: '#94a3b8', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#0ea5e9', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
