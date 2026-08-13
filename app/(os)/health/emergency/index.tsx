// @ts-nocheck
import React, { useState } from 'react';
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
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface EmergencyCase {
  id: string;
  patient_name: string;
  status: string;
  priority: string;
  created_at: string;
  location?: string;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'schedule' | 'patients'>('queue');
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCases = async () => {
    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('health_emergency_cases')
        .select('id, patient_name, status, priority, created_at, location')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCases(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load emergency cases');
      setCases([]);
    }
  };

  React.useEffect(() => {
    loadCases().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  };

  const filtered = activeTab === 'queue'
    ? cases.filter((c) => ['waiting', 'triaged'].includes(c.status))
    : activeTab === 'schedule'
    ? cases.filter((c) => ['scheduled', 'admitted'].includes(c.status))
    : cases;

  const renderCase = ({ item }: { item: EmergencyCase }) => (
    <TouchableOpacity style={s.caseCard} onPress={() => router.push(`/health/emergency/case/${item.id}` as any)}>
      <View style={s.caseRow}>
        <Ionicons name="warning-outline" size={20} color={item.priority === 'critical' ? '#ef4444' : '#f59e0b'} />
        <Text style={s.caseName}>{item.patient_name || 'Unknown'}</Text>
        <Text style={[s.caseBadge, item.status === 'waiting' ? s.badgeWait : s.badgeDone]}>{item.status}</Text>
      </View>
      <Text style={s.caseMeta}>{item.location || 'Location unknown'} • {new Date(item.created_at).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Emergency</Text>
      </View>

      <View style={s.tabRow}>
        {(['queue', 'schedule', 'patients'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'queue' ? 'Queue' : tab === 'schedule' ? 'Schedule' : 'Patients'}
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
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#ef4444" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCase}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.list}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#cbd5e1" />
              <Text style={s.emptyTitle}>No {activeTab} cases</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#991b1b' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#991b1b' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
  caseCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  caseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  caseName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  caseBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badgeWait: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeDone: { backgroundColor: '#d1fae5', color: '#065f46' },
  caseMeta: { fontSize: 12, color: '#94a3b8' },
  errorBox: { marginHorizontal: 12, marginVertical: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 13 },
  retry: { color: '#0ea5e9', marginTop: 6, fontWeight: '600' },
});
