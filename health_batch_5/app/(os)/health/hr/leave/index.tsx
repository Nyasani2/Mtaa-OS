import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface LeaveRequest {
  id: string;
  staff_id: string;
  user_full_name: string;
  role: string;
  facility_name: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid' | 'study';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export default function HRLeaveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: 'annual' as LeaveRequest['leave_type'], start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_leave_requests')
        .select('*, health_staff(role, facility_id, health_facilities(name)), user_profiles:staff_id(email, full_name)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: LeaveRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        user_full_name: r.user_profiles?.full_name || 'Unknown',
        role: r.health_staff?.role || 'Unknown',
        facility_name: r.health_staff?.health_facilities?.name || 'Unknown',
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        days_requested: r.days_requested,
        reason: r.reason,
        status: r.status,
        approved_by: r.approved_by,
        approved_at: r.approved_at,
        created_at: r.created_at,
      }));

      setRequests(mapped);
    } catch (err) {
      console.error('Leave load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function submitLeave() {
    if (!user || !form.start_date || !form.end_date || !form.reason) return;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await supabase.from('health_leave_requests').insert({
      staff_id: user.id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_requested: days,
      reason: form.reason,
      status: 'pending',
    });

    if (!error) {
      setShowForm(false);
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      loadRequests();
    }
  }

  async function approveLeave(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from('health_leave_requests')
      .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) loadRequests();
  }

  async function rejectLeave(id: string) {
    const { error } = await supabase.from('health_leave_requests').update({ status: 'rejected' }).eq('id', id);
    if (!error) loadRequests();
  }

  const leaveTypeConfig = {
    annual: { color: '#22c55e', icon: 'sunny' },
    sick: { color: '#ef4444', icon: 'medical' },
    maternity: { color: '#ec4899', icon: 'heart' },
    paternity: { color: '#3b82f6', icon: 'man' },
    compassionate: { color: '#8b5cf6', icon: 'sad' },
    unpaid: { color: '#9ca3af', icon: 'cash' },
    study: { color: '#f59e0b', icon: 'school' },
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    cancelled: '#9ca3af',
  };

  const leaveTypes: LeaveRequest['leave_type'][] = ['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid', 'study'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Request Leave</Text>
          <View style={styles.typeRow}>
            {leaveTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, form.leave_type === type && { backgroundColor: leaveTypeConfig[type].color }]}
                onPress={() => setForm(f => ({ ...f, leave_type: type }))}
              >
                <Text style={[styles.typeBtnText, form.leave_type === type && { color: '#fff' }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={form.start_date}
                onChangeText={t => setForm(f => ({ ...f, start_date: t }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={form.end_date}
                onChangeText={t => setForm(f => ({ ...f, end_date: t }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>
          <TextInput
            style={styles.reasonInput}
            value={form.reason}
            onChangeText={t => setForm(f => ({ ...f, reason: t }))}
            placeholder="Reason for leave..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={submitLeave}>
            <Text style={styles.submitBtnText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.leaveIcon, { backgroundColor: leaveTypeConfig[item.leave_type]?.color + '20' }]}>
                    <Ionicons name={leaveTypeConfig[item.leave_type]?.icon as any} size={18} color={leaveTypeConfig[item.leave_type]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.user_full_name}</Text>
                    <Text style={styles.cardRole}>{item.role} — {item.facility_name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  {leaveTypeConfig[item.leave_type]?.label || item.leave_type}: {new Date(item.start_date).toLocaleDateString()} — {new Date(item.end_date).toLocaleDateString()}
                </Text>
                <Text style={styles.daysText}>({item.days_requested} days)</Text>
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => approveLeave(item.id)}>
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => rejectLeave(item.id)}>
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'approved' && item.approved_at && (
                <Text style={styles.approvedText}>Approved on {new Date(item.approved_at).toLocaleDateString()}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No leave requests found</Text>
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
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#334155' },
  typeBtnText: { fontSize: 11, color: '#94a3b8' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  dateInput: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155' },
  reasonInput: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 12, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  leaveIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: 13, color: '#e2e8f0' },
  daysText: { fontSize: 13, color: '#0ea5e9', fontWeight: '600' },
  reasonText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  approvedText: { fontSize: 12, color: '#22c55e', marginTop: 8, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
