import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Video, Phone, Calendar, Clock, User, CheckCircle2,
  XCircle, AlertTriangle, Mic, Camera, MessageSquare, FileText
} from 'lucide-react-native';

interface TeleSession {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  type: 'video' | 'audio' | 'chat';
  reason: string;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export default function TelemedicineScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [sessions, setSessions] = useState<TeleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadSessions();
  }, [patientId]);

  const loadSessions = async () => {
    try {
      let query = supabase
        .from('telemedicine_sessions')
        .select('*, patients(full_name), profiles:doctor_id(full_name)')
        .order('scheduled_at', { ascending: true });

      if (patientId) query = query.eq('patient_id', patientId);
      else if (profile?.role === 'doctor') query = query.eq('doctor_id', user?.id);

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((s: any) => ({
        ...s,
        patient_name: s.patients?.full_name || 'Unknown',
        doctor_name: s.profiles?.full_name || 'Unknown',
      }));
      setSessions(formatted);
    } catch (err) {
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const startSession = (sessionId: string, type: string) => {
    Alert.alert('Start Session', `Initiating ${type} call...`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          try {
            await supabase.from('telemedicine_sessions').update({ status: 'in_progress' }).eq('id', sessionId);
            router.push(`/health/telemedicine/call?sessionId=${sessionId}&type=${type}`);
          } catch (err) {
            Alert.alert('Error', 'Failed to start session');
          }
        },
      },
    ]);
  };

  const cancelSession = async (sessionId: string) => {
    Alert.alert('Cancel Session', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Session',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('telemedicine_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
            loadSessions();
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const upcomingSessions = sessions.filter(s => ['scheduled', 'in_progress'].includes(s.status));
  const pastSessions = sessions.filter(s => ['completed', 'cancelled', 'no_show'].includes(s.status));
  const displaySessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={18} color="#6366f1" />;
      case 'audio': return <Phone size={18} color="#22c55e" />;
      case 'chat': return <MessageSquare size={18} color="#f59e0b" />;
      default: return <Video size={18} color="#6366f1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'in_progress': return '#22c55e';
      case 'completed': return '#64748b';
      case 'cancelled': return '#ef4444';
      case 'no_show': return '#f59e0b';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Telemedicine</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingSessions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastSessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displaySessions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionType}>
                {getTypeIcon(item.type)}
                <Text style={styles.sessionTypeText}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.sessionBody}>
              <View style={styles.personRow}>
                <User size={16} color="#94a3b8" />
                <Text style={styles.personText}>
                  {profile?.role === 'doctor' ? item.patient_name : item.doctor_name}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.timeText}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
                <Clock size={14} color="#64748b" />
                <Text style={styles.timeText}>{new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            {item.status === 'scheduled' && (
              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => startSession(item.id, item.type)}
                >
                  <Camera size={16} color="#fff" />
                  <Text style={styles.startBtnText}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => cancelSession(item.id)}
                >
                  <XCircle size={16} color="#ef4444" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'in_progress' && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE SESSION</Text>
              </View>
            )}

            {item.duration_minutes && (
              <Text style={styles.durationText}>Duration: {item.duration_minutes} min</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Video size={48} color="#334155" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming' ? 'Schedule a telemedicine appointment to get started' : 'Your completed sessions will appear here'}
            </Text>
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
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  sessionCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionType: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionTypeText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  sessionBody: { gap: 8, marginBottom: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#94a3b8', fontSize: 13 },
  reasonText: { color: '#64748b', fontSize: 13, lineHeight: 20 },
  sessionActions: { flexDirection: 'row', gap: 10 },
  startBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12 },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#064e3b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  durationText: { color: '#64748b', fontSize: 12, marginTop: 8 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
