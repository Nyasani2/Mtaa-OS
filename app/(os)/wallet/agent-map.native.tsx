// app/(os)/wallet/agent-map.web.tsx — Web fallback for Agent Map
// Shows agent list and transaction history. No map (requires native).

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/hooks/useWalletStore';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface Agent {
  id: string;
  name: string;
  phone: string;
  type: 'deposit' | 'withdrawal' | 'both';
  lat: number;
  lng: number;
  is_online: boolean;
  rating: number;
  total_transactions: number;
  working_hours: string;
  commission_rate: number;
  avatar_url: string | null;
}

interface AgentTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
  agent_name: string;
}

const AGENT_TYPES = [
  { key: 'all', label: 'All', icon: 'map-marker' },
  { key: 'deposit', label: 'Deposit', icon: 'arrow-down-circle' },
  { key: 'withdrawal', label: 'Withdraw', icon: 'arrow-up-circle' },
];

export default function AgentMapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<AgentTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase.from('wallet_agents').select('*').eq('is_verified', true).eq('is_active', true);
    if (!error && data) { setAgents(data); setFilteredAgents(data); }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('wallet_agent_transactions').select('*, agent:wallet_agents(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (!error && data) setHistory(data.map((d: any) => ({ ...d, agent_name: d.agent?.name || 'Agent' })));
  }, [user]);

  useEffect(() => {
    (async () => {
      await fetchAgents(); await fetchHistory(); setLoading(false);
    })();
  }, [fetchAgents, fetchHistory]);

  useEffect(() => {
    if (filterType === 'all') setFilteredAgents(agents);
    else setFilteredAgents(agents.filter(a => a.type === filterType || a.type === 'both'));
  }, [filterType, agents]);

  const handleTransaction = async () => {
    if (!selectedAgent || !user) return;
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (transactionType === 'withdrawal' && amount > balance) { Alert.alert('Error', 'Insufficient balance'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('agent_transaction', {
      p_agent_id: selectedAgent.id, p_user_id: user.id, p_type: transactionType, p_amount: amount
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} request sent to ${selectedAgent.name}`);
    setTransactionModalVisible(false); setTransactionAmount(''); fetchHistory();
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading agents...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Find an Agent</Text>
        <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(!showHistory)}>
          <Ionicons name={showHistory ? "map" : "time"} size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Web notice */}
      <View style={styles.webNotice}>
        <Ionicons name="phone-portrait" size={20} color="#FF9500" />
        <Text style={styles.webNoticeText}>Agent map is mobile-only. Use the MTAA app to see agent locations on a map.</Text>
      </View>

      {!showHistory ? (
        <>
          <View style={styles.filterBar}>
            {AGENT_TYPES.map(t => (
              <TouchableOpacity key={t.key} style={[styles.filterChip, filterType === t.key && styles.filterChipActive]} onPress={() => setFilterType(t.key as any)}>
                <MaterialCommunityIcons name={t.icon as any} size={16} color={filterType === t.key ? '#fff' : '#8E8E93'} />
                <Text style={[styles.filterText, filterType === t.key && styles.filterTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.agentList} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {filteredAgents.length === 0 ? (
              <View style={styles.empty}><Ionicons name="map-outline" size={48} color="#C7C7CC" /><Text style={styles.emptyText}>No agents found</Text></View>
            ) : (
              filteredAgents.map(agent => (
                <TouchableOpacity key={agent.id} style={styles.agentCard} onPress={() => setSelectedAgent(agent)}>
                  <View style={styles.agentRow}>
                    <View style={[styles.agentIcon, { backgroundColor: agent.type === 'deposit' ? '#34C75920' : agent.type === 'withdrawal' ? '#FF950020' : '#007AFF20' }]}>
                      <MaterialCommunityIcons name={agent.type === 'deposit' ? 'arrow-down' : agent.type === 'withdrawal' ? 'arrow-up' : 'swap-horizontal'} size={20} color={agent.type === 'deposit' ? '#34C759' : agent.type === 'withdrawal' ? '#FF9500' : '#007AFF'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      <Text style={styles.agentMeta}>{agent.type.toUpperCase()} • {agent.working_hours}</Text>
                      <Text style={styles.agentRating}>Rating: {agent.rating.toFixed(1)} ({agent.total_transactions} txns)</Text>
                    </View>
                    <View style={styles.ratingBox}>
                      <Text style={styles.ratingValue}>{agent.rating.toFixed(1)}</Text>
                      <Text style={styles.ratingLabel}>{agent.total_transactions} txns</Text>
                    </View>
                  </View>
                  <View style={styles.agentActions}>
                    <TouchableOpacity style={[styles.agentBtn, { backgroundColor: '#34C759' }]} onPress={() => { setSelectedAgent(agent); setTransactionType('deposit'); setTransactionModalVisible(true); }}>
                      <Ionicons name="arrow-down" size={16} color="#fff" /><Text style={styles.agentBtnText}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.agentBtn, { backgroundColor: '#FF9500' }]} onPress={() => { setSelectedAgent(agent); setTransactionType('withdrawal'); setTransactionModalVisible(true); }}>
                      <Ionicons name="arrow-up" size={16} color="#fff" /><Text style={styles.agentBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.agentBtn, { backgroundColor: '#2C2C2E' }]} onPress={() => Alert.alert('Call', `Call ${agent.phone}?`)}>
                      <Ionicons name="call" size={16} color="#fff" /><Text style={styles.agentBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {selectedAgent && (
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetName}>{selectedAgent.name}</Text>
                    <View style={styles.sheetMeta}>
                      <Text style={styles.sheetType}>{selectedAgent.type.toUpperCase()}</Text>
                      {selectedAgent.is_online && <View style={styles.onlineDot}><Text style={styles.onlineText}>ONLINE</Text></View>}
                    </View>
                  </View>
                  <View style={styles.ratingBox}>
                    <Text style={styles.ratingValue}>{selectedAgent.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingLabel}>{selectedAgent.total_transactions} txns</Text>
                  </View>
                </View>
                <Text style={styles.sheetHours}>Working Hours: {selectedAgent.working_hours}</Text>
                <Text style={styles.sheetCommission}>Commission: {selectedAgent.commission_rate}%</Text>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#34C759' }]} onPress={() => { setTransactionType('deposit'); setTransactionModalVisible(true); }}>
                    <Ionicons name="arrow-down" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Deposit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#FF9500' }]} onPress={() => { setTransactionType('withdrawal'); setTransactionModalVisible(true); }}>
                    <Ionicons name="arrow-up" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Withdraw</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#2C2C2E' }]} onPress={() => Alert.alert('Call', `Call ${selectedAgent.phone}?`)}>
                    <Ionicons name="call" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </>
      ) : (
        <ScrollView style={styles.historyContainer} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          {history.length === 0 ? (
            <View style={styles.empty}><Ionicons name="map-outline" size={48} color="#C7C7CC" /><Text style={styles.emptyText}>No agent transactions yet</Text></View>
          ) : (
            history.map(tx => (
              <View key={tx.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: tx.type === 'deposit' ? '#34C75920' : '#FF950020' }]}>
                    <Ionicons name={tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'deposit' ? '#34C759' : '#FF9500'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyType}>{tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} with {tx.agent_name}</Text>
                    <Text style={styles.historyDate}>{new Date(tx.created_at).toLocaleString()}</Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: tx.type === 'deposit' ? '#34C759' : '#FF9500' }]}>{tx.type === 'deposit' ? '+' : '-'}KES {tx.amount.toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? '#34C75920' : tx.status === 'pending' ? '#FF950020' : '#FF3B3020' }]}>
                  <Text style={[styles.statusText, { color: tx.status === 'completed' ? '#34C759' : tx.status === 'pending' ? '#FF9500' : '#FF3B30' }]}>{tx.status.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={transactionModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{transactionType === 'deposit' ? 'Deposit' : 'Withdraw'} with {selectedAgent?.name}</Text>
            <Text style={styles.modalSubtitle}>Wallet Balance: KES {balance.toLocaleString()}</Text>
            <TextInput style={styles.input} placeholder={`Amount to ${transactionType} (KES)`} keyboardType="numeric" value={transactionAmount} onChangeText={setTransactionAmount} />
            {selectedAgent && <Text style={styles.commissionNote}>Agent commission ({selectedAgent.commission_rate}%): KES {((parseFloat(transactionAmount) || 0) * selectedAgent.commission_rate / 100).toFixed(2)}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setTransactionModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleTransaction} disabled={processing}>{processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Confirm</Text>}</TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: '#8E8E93', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  historyBtn: { padding: 4 },
  webNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF950020', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  webNoticeText: { flex: 1, fontSize: 12, color: '#FF9500', fontWeight: '600' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1C1C1E', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2C2C2E', gap: 6 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  agentList: { flex: 1 },
  agentCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12 },
  agentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  agentIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  agentName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  agentMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  agentRating: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  agentActions: { flexDirection: 'row', gap: 10 },
  agentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  agentBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  ratingBox: { alignItems: 'center' },
  ratingValue: { fontSize: 20, fontWeight: '700', color: '#FF9500' },
  ratingLabel: { fontSize: 11, color: '#8E8E93' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sheetName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sheetType: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  onlineDot: { backgroundColor: '#34C759', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  onlineText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  sheetHours: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  sheetCommission: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  sheetBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  historyContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },
  historyCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  historyIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyType: { fontSize: 14, fontWeight: '600', color: '#fff' },
  historyDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  commissionNote: { fontSize: 12, color: '#8E8E93', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
