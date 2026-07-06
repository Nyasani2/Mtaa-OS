import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface ComplianceRecord {
  id: string;
  facility_id: string;
  facility_name: string;
  regulation_name: string;
  regulation_body: string;
  compliance_type: 'licensing' | 'accreditation' | 'safety' | 'privacy' | 'environmental' | 'labor' | 'financial' | 'clinical' | 'other';
  issue_date: string;
  expiry_date: string;
  renewal_reminder_date: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed' | 'suspended' | 'pending';
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

export default function AccountantComplianceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ComplianceRecord['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    regulation_name: '',
    regulation_body: '',
    compliance_type: 'licensing' as ComplianceRecord['compliance_type'],
    issue_date: '',
    expiry_date: '',
    notes: '',
  });

  const complianceTypes: ComplianceRecord['compliance_type'][] = ['licensing', 'accreditation', 'safety', 'privacy', 'environmental', 'labor', 'financial', 'clinical', 'other'];

  useEffect(() => {
    loadCompliance();
  }, [filter]);

  async function loadCompliance() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_compliance')
        .select('*, health_facilities(name)')
        .order('expiry_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: ComplianceRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.health_facilities?.name || 'Unknown',
        regulation_name: r.regulation_name,
        regulation_body: r.regulation_body,
        compliance_type: r.compliance_type,
        issue_date: r.issue_date,
        expiry_date: r.expiry_date,
        renewal_reminder_date: r.renewal_reminder_date,
        status: r.status,
        document_url: r.document_url,
        notes: r.notes,
        created_at: r.created_at,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Compliance load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createCompliance() {
    if (!user || !form.regulation_name || !form.regulation_body || !form.issue_date || !form.expiry_date) return;
    const { error } = await supabase.from('health_compliance').insert({
      regulation_name: form.regulation_name,
      regulation_body: form.regulation_body,
      compliance_type: form.compliance_type,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date,
      notes: form.notes || null,
      status: 'active',
    });
    if (!error) {
      setShowForm(false);
      setForm({ regulation_name: '', regulation_body: '', compliance_type: 'licensing', issue_date: '', expiry_date: '', notes: '' });
      loadCompliance();
    }
  }

  async function renewCompliance(id: string) {
    const { error } = await supabase.from('health_compliance').update({ status: 'renewed' }).eq('id', id);
    if (!error) loadCompliance();
  }

  const statusColors: Record<string, string> = {
    active: '#22c55e',
    expiring_soon: '#f59e0b',
    expired: '#ef4444',
    renewed: '#3b82f6',
    suspended: '#8b5cf6',
    pending: '#9ca3af',
  };

  const typeConfig: Record<string, { color: string; icon: string }> = {
    licensing: { color: '#3b82f6', icon: 'document' },
    accreditation: { color: '#22c55e', icon: 'shield-checkmark' },
    safety: { color: '#ef4444', icon: 'warning' },
    privacy: { color: '#8b5cf6', icon: 'lock-closed' },
    environmental: { color: '#14b8a6', icon: 'leaf' },
    labor: { color: '#f59e0b', icon: 'people' },
    financial: { color: '#ec4899', icon: 'cash' },
    clinical: { color: '#f97316', icon: 'medical' },
    other: { color: '#9ca3af', icon: 'ellipsis-horizontal' },
  };

  const activeCount = records.filter(r => r.status === 'active').length;
  const expiringCount = records.filter(r => r.status === 'expiring_soon').length;
  const expiredCount = records.filter(r => r.status === 'expired').length;

  function daysUntil(date: string): number {
    return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compliance Tracker</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>{activeCount}</Text>
          <Text style={styles.totalLabel}>Active</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>{expiringCount}</Text>
          <Text style={styles.totalLabel}>Expiring Soon</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#ef444420' }]}>
          <Text style={[styles.totalValue, { color: '#ef4444' }]}>{expiredCount}</Text>
          <Text style={styles.totalLabel}>Expired</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Compliance Record</Text>
          <TextInput style={styles.input} value={form.regulation_name} onChangeText={t => setForm(f => ({ ...f, regulation_name: t }))} placeholder="Regulation name" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.regulation_body} onChangeText={t => setForm(f => ({ ...f, regulation_body: t }))} placeholder="Regulation body (e.g., KMPDB)" placeholderTextColor="#64748b" />
          <View style={styles.typeRow}>
            {complianceTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.compliance_type === t && { backgroundColor: typeConfig[t]?.color }]} onPress={() => setForm(f => ({ ...f, compliance_type: t }))}>
                <Text style={[styles.typeBtnText, form.compliance_type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.issue_date} onChangeText={t => setForm(f => ({ ...f, issue_date: t }))} placeholder="Issue date" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.expiry_date} onChangeText={t => setForm(f => ({ ...f, expiry_date: t }))} placeholder="Expiry date" placeholderTextColor="#64748b" />
          </View>
          <TextInput style={[styles.input, { height: 60 }]} value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={createCompliance}>
            <Text style={styles.submitBtnText}>Add Record</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'active', 'expiring_soon', 'expired', 'renewed', 'pending'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const days = daysUntil(item.expiry_date);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: typeConfig[item.compliance_type]?.color + '20' }]}>
                      <Ionicons name={typeConfig[item.compliance_type]?.icon as any} size={16} color={typeConfig[item.compliance_type]?.color} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{item.regulation_name}</Text>
                      <Text style={styles.cardFacility}>{item.regulation_body} — {item.facility_name}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>Issued: {new Date(item.issue_date).toLocaleDateString()}</Text>
                  <Text style={[styles.dateText, { color: days < 0 ? '#ef4444' : days < 30 ? '#f59e0b' : '#22c55e' }]}>
                    Expires: {new Date(item.expiry_date).toLocaleDateString()} ({days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`})
                  </Text>
                </View>
                {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
                {(item.status === 'expiring_soon' || item.status === 'expired') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => renewCompliance(item.id)}>
                    <Text style={styles.actionBtnText}>Mark Renewed</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No compliance records</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  totalCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  totalLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  typeBtnText: { fontSize: 10, color: '#94a3b8' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 11, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardFacility: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  dateText: { fontSize: 12, color: '#64748b' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionBtn: { borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
