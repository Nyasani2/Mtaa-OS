// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Plus, Calendar, CheckCircle2, Bell, User, AlertTriangle, Search, Filter, Phone, MessageSquare } from 'lucide-react-native';

interface FollowUp {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  scheduled_date: string;
  type: 'routine' | 'urgent' | 'post_op' | 'chronic_care';
  reason: string;
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
  outcome: string | null;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
}

const FOLLOWUP_TYPES = [
  { key: 'routine', label: 'Routine', color: '#3b82f6' },
  { key: 'urgent', label: 'Urgent', color: '#ef4444' },
  { key: 'post_op', label: 'Post-Op', color: '#f59e0b' },
  { key: 'chronic_care', label: 'Chronic', color: '#8b5cf6' },
];

const STATUS_COLORS = { scheduled: '#3b82f6', completed: '#22c55e', missed: '#ef4444', rescheduled: '#f59e0b' };

export default function FollowUpsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<FollowUp['type']>('routine');
  const [newReason, setNewReason] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadFollowUps();
  }, [patientId]);

  const loadFollowUps = async () => {
    try {
      let query = supabase
        .from('follow_ups')
        .select('*, patients(full_name)')
        .order('scheduled_date', { ascending: true });

      if (patientId) query = query.eq('patient_id', patientId);
      else if (profile?.role === 'doctor') query = query.eq('doctor_id', user?.id);

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((f: any) => ({
        ...f,
        patient_name: f.patients?.full_name || 'Unknown',
      }));
      setFollowUps(formatted);
    } catch (err) {
      Alert.alert('Error', 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const createFollowUp = async () => {
    if (!newDate.trim() || !newReason.trim()) {
      Alert.alert('Error', 'Date and reason are required');
      return;
    }

    try {
      const { error } = await supabase.from('follow_ups').insert({
        patient_id: patientId || null,
        doctor_id: user?.id,
        scheduled_date: newDate,
        type: newType,
        reason: newReason,
        status: 'scheduled',
        notes: newNotes || null,
      });

      if (error) throw error;

      setShowNew(false);
      setNewDate('');
      setNewReason('');
      setNewNotes('');
      setNewType('routine');
      loadFollowUps();
    } catch (err) {
      Alert.alert('Error', 'Failed to create follow-up');
    }
  };

  const updateStatus = async (id: string, status: FollowUp['status']) => {
    try {
      const { error } = await supabase.from('follow_ups').update({ status }).eq('id', id);
      if (error) throw error;
      loadFollowUps();
    } catch (err) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const sendReminder = async (followUp: FollowUp) => {
    try {
      // Wire to MTAA notification kernel
      await supabase.from('app_notifications').insert({
        user_id: followUp.patient_id,
        title: 'Follow-up Reminder',
        body: `Your ${followUp.type} follow-up is scheduled for ${new Date(followUp.scheduled_date).toLocaleDateString()}`,
        type: 'health_reminder',
      });

      await supabase.from('follow_ups').update({ reminder_sent: true }).eq('id', followUp.id);
      Alert.alert('Sent', 'Reminder sent to patient');
      loadFollowUps();
    } catch (err) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const filtered = followUps.filter((f: any) => {
    if (filterType && f.type !== filterType) return false;
    if (searchQuery && !f.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.reason.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (showNew) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowNew(false)} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Follow-up</Text>
          <TouchableOpacity onPress={createFollowUp} style={styles.saveBtn}>
            <CheckCircle2 size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.formLabel}>Follow-up Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          value={newDate}
          onChangeText={setNewDate}
        />

        <Text style={styles.formLabel}>Type</Text>
        <View style={styles.typeRow}>
          {FOLLOWUP_TYPES.map((t: any) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, newType === t.key && { backgroundColor: t.color + '30', borderColor: t.color }]}
              onPress={() => setNewType(t.key as FollowUp['type'])}
            >
              <Text style={[styles.typeChipText, newType === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Reason</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Reason for follow-up..."
          placeholderTextColor="#64748b"
          value={newReason}
          onChangeText={setNewReason}
        />

        <Text style={styles.formLabel}>Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Additional notes..."
          placeholderTextColor="#64748b"
          value={newNotes}
          onChangeText={setNewNotes}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-ups</Text>
        <TouchableOpacity onPress={() => setShowNew(true)} style={styles.addBtn}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search follow-ups..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity style={[styles.filterChip, !filterType && styles.filterChipActive]} onPress={() => setFilterType(null)}>
          <Filter size={14} color={!filterType ? '#fff' : '#94a3b8'} />
          <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {FOLLOWUP_TYPES.map((t: any) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterChip, filterType === t.key && { backgroundColor: t.color + '30', borderColor: t.color }]}
            onPress={() => setFilterType(filterType === t.key ? null : t.key)}
          >
            <Text style={[styles.filterText, filterType === t.key && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const typeConfig = FOLLOWUP_TYPES.find((t: any) => t.key === item.type) || FOLLOWUP_TYPES[0];
          const isOverdue = new Date(item.scheduled_date) < new Date() && item.status === 'scheduled';

          return (
            <View style={[styles.card, isOverdue && styles.cardOverdue]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardMeta}>
                  <User size={14} color="#94a3b8" />
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.typeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
                    <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                  </View>
                  {isOverdue && (
                    <View style={styles.overdueBadge}>
                      <AlertTriangle size={12} color="#ef4444" />
                      <Text style={styles.overdueText}>Overdue</Text>
                    </View>
                  )}
                </View>

                <View style={styles.dateRow}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.dateText}>{new Date(item.scheduled_date).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.reasonText}>{item.reason}</Text>
              </View>

              {item.status === 'scheduled' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => updateStatus(item.id, 'completed')} style={styles.completeBtn}>
                    <CheckCircle2 size={14} color="#22c55e" />
                    <Text style={styles.completeText}>Complete</Text>
                  </TouchableOpacity>
                  {!item.reminder_sent && (
                    <TouchableOpacity onPress={() => sendReminder(item)} style={styles.remindBtn}>
                      <Bell size={14} color="#f59e0b" />
                      <Text style={styles.remindText}>Remind</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => updateStatus(item.id, 'missed')} style={styles.missBtn}>
                    <Text style={styles.missText}>Mark Missed</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No follow-ups</Text>
            <Text style={styles.emptySubtitle}>Tap + to schedule a follow-up</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8, fontSize: 14 },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155', marginRight: 8 },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  formLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  input: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  typeRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, flexWrap: 'wrap' },
  typeChip: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#334155' },
  typeChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  textArea: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  cardOverdue: { borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  patientName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { gap: 8, marginBottom: 12 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 11, fontWeight: '700' },
  overdueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7f1d1d', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  overdueText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: '#94a3b8', fontSize: 13 },
  reasonText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: 8 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064e3b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  completeText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#451a03', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  remindText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  missBtn: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  missText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
});