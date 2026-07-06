import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface Shift {
  id: string;
  staff_id: string;
  user_full_name: string;
  role: string;
  facility_name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'on_call' | 'weekend';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'swapped';
  department: string;
  notes: string | null;
}

export default function HRShiftsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [filterType, setFilterType] = useState<'all' | Shift['shift_type']>('all');

  useEffect(() => {
    loadShifts();
  }, [selectedWeek, filterType]);

  async function loadShifts() {
    if (!user) return;
    setLoading(true);
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + selectedWeek * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      let query = supabase
        .from('health_shifts')
        .select('*, health_staff(role, facility_id, department, health_facilities(name)), user_profiles:staff_id(email, full_name)')
        .gte('shift_date', startOfWeek.toISOString().split('T')[0])
        .lte('shift_date', endOfWeek.toISOString().split('T')[0])
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (filterType !== 'all') {
        query = query.eq('shift_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Shift[] = (data || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        user_full_name: r.user_profiles?.full_name || 'Unknown',
        role: r.health_staff?.role || 'Unknown',
        facility_name: r.health_staff?.health_facilities?.name || 'Unknown',
        shift_date: r.shift_date,
        start_time: r.start_time,
        end_time: r.end_time,
        shift_type: r.shift_type,
        status: r.status,
        department: r.health_staff?.department || 'General',
        notes: r.notes,
      }));

      setShifts(mapped);
    } catch (err) {
      console.error('Shifts load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateShiftStatus(id: string, status: Shift['status']) {
    const { error } = await supabase.from('health_shifts').update({ status }).eq('id', id);
    if (!error) loadShifts();
  }

  const shiftTypeConfig = {
    morning: { color: '#f59e0b', icon: 'sunny', label: 'Morning' },
    afternoon: { color: '#3b82f6', icon: 'partly-sunny', label: 'Afternoon' },
    night: { color: '#8b5cf6', icon: 'moon', label: 'Night' },
    on_call: { color: '#ef4444', icon: 'call', label: 'On Call' },
    weekend: { color: '#22c55e', icon: 'calendar', label: 'Weekend' },
  };

  const statusColors: Record<string, string> = {
    scheduled: '#9ca3af',
    confirmed: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
    swapped: '#f59e0b',
  };

  const weekLabel = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + selectedWeek * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shift Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setSelectedWeek(w => w - 1)}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel()}</Text>
        <TouchableOpacity onPress={() => setSelectedWeek(w => w + 1)}>
          <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['all', 'morning', 'afternoon', 'night', 'on_call', 'weekend'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, filterType === type && styles.typeChipActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.typeText, filterType === type && styles.typeTextActive]}>
              {type === 'all' ? 'All' : shiftTypeConfig[type]?.label || type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.shiftIcon, { backgroundColor: shiftTypeConfig[item.shift_type]?.color + '20' }]}>
                    <Ionicons name={shiftTypeConfig[item.shift_type]?.icon as any} size={18} color={shiftTypeConfig[item.shift_type]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.user_full_name}</Text>
                    <Text style={styles.cardRole}>{item.role} — {item.department}</Text>
                    <Text style={styles.facilityText}>{item.facility_name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20', borderColor: statusColors[item.status] }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.dayText}>{days[new Date(item.shift_date).getDay()]}, {new Date(item.shift_date).toLocaleDateString()}</Text>
                <Text style={styles.timeText}>{item.start_time.slice(0, 5)} — {item.end_time.slice(0, 5)}</Text>
              </View>
              {item.notes && <Text style={styles.notesText}>Note: {item.notes}</Text>}
              <View style={styles.actionRow}>
                {item.status === 'scheduled' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => updateShiftStatus(item.id, 'confirmed')}>
                    <Text style={styles.actionBtnText}>Confirm</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'confirmed' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => updateShiftStatus(item.id, 'completed')}>
                    <Text style={styles.actionBtnText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'cancelled' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => updateShiftStatus(item.id, 'cancelled')}>
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No shifts scheduled for this week</Text>
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
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  weekLabel: { fontSize: 16, fontWeight: '600', color: '#e2e8f0' },
  typeScroll: { marginTop: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8 },
  typeChipActive: { backgroundColor: '#0ea5e9' },
  typeText: { fontSize: 12, color: '#94a3b8' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  shiftIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  facilityText: { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  dayText: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  timeText: { fontSize: 13, color: '#94a3b8' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
