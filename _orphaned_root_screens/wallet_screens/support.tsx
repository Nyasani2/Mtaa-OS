import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  last_reply_at: string | null;
}

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['general', 'wallet', 'transaction', 'merchant', 'account'];

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTickets(data || []);
    } catch (err) {
      console.error('Support fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in subject and description');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id,
        subject: subject.trim(),
        category,
        description: description.trim(),
        status: 'open',
        priority: 'medium',
      });
      if (error) throw error;
      Alert.alert('Success', 'Ticket submitted');
      setShowNewTicket(false);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return '#22C55E';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#8B5CF6';
      case 'closed': return '#6B7280';
      default: return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNewTicket(!showNewTicket)}>
          <Ionicons name={showNewTicket ? 'close' : 'add'} size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {showNewTicket && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Ticket</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor="#8E8E93"
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Describe your issue..."
              placeholderTextColor="#8E8E93"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitTicket} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Tickets ({tickets.length})</Text>
            {tickets.map(ticket => (
              <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticket.status) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                    <Text style={styles.ticketMeta}>{ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {tickets.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="chatbubbles-outline" size={48} color="#8E8E93" />
                <Text style={styles.emptyText}>No tickets yet</Text>
                <Text style={styles.emptySub}>Tap + to create a new support ticket</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  newBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2C2C2E' },
  categoryChipActive: { backgroundColor: '#22C55E' },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  categoryTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  ticketCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#fff' },
  ticketMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
