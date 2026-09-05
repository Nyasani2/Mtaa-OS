// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const STATUS_COLORS = { submitted: '#f59e0b', under_review: '#3b82f6', approved: '#10b981', rejected: '#ef4444' };

export default function PolicyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [policy, setPolicy] = useState(null);
  const [holder, setHolder] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: p } = await supabase.from('health_insurance_policies').select('*').eq('id', id).single();
      setPolicy(p);
      if (p?.holder_id) {
        const { data: h } = await supabase.from('user_profiles').select('*').eq('user_id', p.holder_id).single();
        setHolder(h);
      }
      const { data: cl } = await supabase.from('health_insurance_claims')
        .select('*, invoice:health_invoices(total_amount, payment_method)')
        .eq('policy_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      setClaims(cl || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  if (!policy) return <View style={[s.container, s.center]}><Text>Policy not found</Text></View>;

  const limit = Number(policy.coverage_limit || 0);
  const used = Number(policy.used_amount || 0);
  const remaining = Math.max(limit - used, 0);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  const totalClaimed = claims.reduce((s, c) => s + Number(c.claimed_amount || 0), 0);
  const approved = claims.filter((c) => c.status === 'approved').reduce((s, c) => s + Number(c.claimed_amount || 0), 0);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Ionicons name="shield-checkmark" size={40} color="#8b5cf6" />
        <View>
          <Text style={s.providerName}>{policy.provider_name || 'Insurance Policy'}</Text>
          <Text style={s.policyNum}>{policy.policy_number || 'No policy number'}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Coverage</Text>
        <View style={s.bigRow}>
          <View>
            <Text style={s.bigLabel}>Remaining</Text>
            <Text style={[s.bigValue, { color: '#10b981' }]}>KES {remaining.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.bigLabel}>Limit</Text>
            <Text style={s.bigValue}>KES {limit.toLocaleString()}</Text>
          </View>
        </View>
        <View style={s.progressWrap}>
          <View style={[s.progressBar, { width: `${pct}%`, backgroundColor: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#8b5cf6' }]} />
        </View>
        <Text style={s.progressLabel}>{pct.toFixed(1)}% used</Text>
        <View style={s.row}><Text style={s.rowLabel}>Co-pay</Text><Text style={s.rowValue}>{policy.co_pay_percent || 0}%</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Status</Text><Text style={[s.rowValue, { color: policy.status === 'active' ? '#10b981' : '#ef4444' }]}>{(policy.status || 'unknown').toUpperCase()}</Text></View>
        {policy.expires_at && <View style={s.row}><Text style={s.rowLabel}>Expires</Text><Text style={s.rowValue}>{new Date(policy.expires_at).toLocaleDateString()}</Text></View>}
      </View>

      {holder && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Policy Holder</Text>
          <View style={s.row}><Text style={s.rowLabel}>Name</Text><Text style={s.rowValue}>{holder.first_name} {holder.last_name}</Text></View>
          {holder.phone && <View style={s.row}><Text style={s.rowLabel}>Phone</Text><Text style={s.rowValue}>{holder.phone}</Text></View>}
          {holder.email && <View style={s.row}><Text style={s.rowLabel}>Email</Text><Text style={s.rowValue}>{holder.email}</Text></View>}
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTitle}>Claim Summary</Text>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Claims</Text>
            <Text style={s.statValue}>{claims.length}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Claimed</Text>
            <Text style={s.statValue}>KES {totalClaimed.toLocaleString()}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Approved</Text>
            <Text style={[s.statValue, { color: '#10b981' }]}>KES {approved.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Recent Claims</Text>
      {claims.length === 0 ? (
        <View style={s.empty}><Ionicons name="document-text-outline" size={48} color="#cbd5e1" /><Text style={s.emptyText}>No claims yet</Text></View>
      ) : (
        claims.map((c) => (
          <TouchableOpacity key={c.id} style={s.claimCard} onPress={() => router.push(`/health/insurance/claim-detail?id=${c.id}` as any)}>
            <View style={s.claimTop}>
              <Text style={s.claimAmount}>KES {Number(c.claimed_amount || 0).toLocaleString()}</Text>
              <View style={[s.statusChip, { backgroundColor: STATUS_COLORS[c.status] || '#94a3b8' }]}>
                <Text style={s.statusChipText}>{c.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={s.claimDate}>{new Date(c.created_at).toLocaleDateString()} · Invoice KES {Number(c.invoice?.total_amount || 0).toLocaleString()}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ position: 'absolute', right: 16, top: '50%', marginTop: -9 }} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  providerName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  policyNum: { fontSize: 13, color: '#64748b', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  bigRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bigLabel: { fontSize: 12, color: '#64748b' },
  bigValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  progressWrap: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%' },
  progressLabel: { fontSize: 12, color: '#64748b', marginTop: 6, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: '#64748b' },
  rowValue: { color: '#0f172a', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#64748b' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginVertical: 10 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 8 },
  claimCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, paddingRight: 44 },
  claimTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimAmount: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  claimDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
});
