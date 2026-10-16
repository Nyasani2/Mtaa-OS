import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ApprovalsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const { data } = await supabase.from('education_approvals').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await supabase.from('education_approvals').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
      Alert.alert('Success', `Request ${status}`);
      loadRequests();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Approvals</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {requests.map((req) => (
          <View key={req.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{req.title}</Text>
              <Text style={styles.cardType}>{req.type}</Text>
            </View>
            <Text style={styles.cardDesc}>{req.description}</Text>
            <Text style={styles.cardMeta}>Requested by: {req.requester_name} • {new Date(req.created_at).toLocaleDateString()}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleAction(req.id, 'approved')}>
                <Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.actionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleAction(req.id, 'rejected')}>
                <Ionicons name="close" size={16} color="#fff" /><Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {requests.length === 0 && <Text style={styles.emptyText}>No pending approvals</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  cardType: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  cardDesc: { color: '#cbd5e1', fontSize: 13, marginTop: 6 },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, gap: 6 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
