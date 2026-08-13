// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface ImagingRequest {
  id: string;
  patient_name: string;
  exam_type: string;
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'reported';
  requested_at: string;
  priority: string;
}

export default function RadiologyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'urgent'>('all');
  const [requests, setRequests] = useState<ImagingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('health_imaging_requests')
        .select('id, patient_name, exam_type, status, requested_at, priority')
        .order('requested_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load imaging requests');
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  // Defensive: always default to empty array
  const radiologyRequests = requests || [];

  const filtered = activeTab === 'all'
    ? radiologyRequests
    : activeTab === 'pending'
    ? radiologyRequests.filter((r) => ['ordered', 'scheduled'].includes(r.status))
    : activeTab === 'preparing'
    ? radiologyRequests.filter((r) => r.status === 'in_progress')
    : activeTab === 'ready'
    ? radiologyRequests.filter((r) => ['completed', 'reported'].includes(r.status))
    : radiologyRequests.filter((r) => r.priority === 'urgent');

  const stats = {
    total: radiologyRequests.length,
    pending: radiologyRequests.filter((r) => ['ordered', 'scheduled'].includes(r.status)).length,
    inProgress: radiologyRequests.filter((r) => r.status === 'in_progress').length,
    completed: radiologyRequests.filter((r) => ['completed', 'reported'].includes(r.status)).length,
  };

  const renderRequest = ({ item }: { item: ImagingRequest }) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/health/radiology/request/${item.id}` as any)}>
      <View style={s.cardRow}>
        <Ionicons name="scan-outline" size={20} color="#8b5cf6" />
        <Text style={s.cardTitle}>{item.exam_type}</Text>
        <Text style={[s.badge, item.status === 'ordered' ? s.badgeOrdered : item.status === 'in_progress' ? s.badgeProgress : s.badgeDone]}>
          {item.status}
        </Text>
      </View>
      <Text style={s.cardSub}>{item.patient_name || 'Unknown'} • {new Date(item.requested_at).toLocaleDateString()}</Text>
      {item.priority === 'urgent' && <Text style={s.urgentTag}>URGENT</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Radiology</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{stats.total}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#0ea5e9' }]}>{stats.inProgress}</Text>
          <Text style={s.statLabel}>In Lab</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#ef4444' }]}>{radiologyRequests.filter((r) => r.priority === 'urgent').length}</Text>
          <Text style={s.statLabel}>Urgent</Text>
        </View>
      </View>

      <View style={s.tabRow}>
        {(['all', 'pending', 'preparing', 'ready', 'urgent'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : tab === 'preparing' ? 'Preparing' : tab === 'ready' ? 'Ready' : 'Urgent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={refresh}><Text style={s.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#8b5cf6" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.list}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="images-outline" size={48} color="#cbd5e1" />
              <Text style={s.emptyTitle}>No imaging requests</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 6 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#1e293b' },
  tabActive: { backgroundColor: '#8b5cf6' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
  cardSub: { fontSize: 12, color: '#94a3b8' },
  badge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badgeOrdered: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeProgress: { backgroundColor: '#dbeafe', color: '#1e40af' },
  badgeDone: { backgroundColor: '#d1fae5', color: '#065f46' },
  urgentTag: { fontSize: 10, fontWeight: '800', color: '#ef4444', marginTop: 6 },
  errorBox: { marginHorizontal: 12, marginVertical: 8, backgroundColor: '#450a0a', borderRadius: 10, padding: 12, alignItems: 'center' },
  errorText: { color: '#fca5a5', fontSize: 13 },
  retry: { color: '#a78bfa', marginTop: 6, fontWeight: '600' },
});
