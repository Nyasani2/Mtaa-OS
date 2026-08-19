import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from 'app/(os)/wallet/hooks';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface Partner {
  id: string;
  name: string;
  type: 'bank' | 'telco' | 'fintech' | 'merchant' | 'utility' | 'insurance';
  logo_url: string | null;
  description: string;
  commission_rate: number;
  is_active: boolean;
  api_endpoint: string | null;
  contact_email: string;
  contact_phone: string;
}

interface PartnerTransaction {
  id: string;
  partner_id: string;
  partner_name: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'bill_pay';
  amount: number;
  status: string;
  reference: string;
  created_at: string;
}

const PARTNER_TYPES = [
  { key: 'all', label: 'All Partners', icon: 'handshake' },
  { key: 'bank', label: 'Banks', icon: 'university' },
  { key: 'telco', label: 'Telcos', icon: 'mobile-alt' },
  { key: 'fintech', label: 'Fintech', icon: 'chart-line' },
  { key: 'merchant', label: 'Merchants', icon: 'store' },
  { key: 'utility', label: 'Utilities', icon: 'bolt' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-alt' },
];

export default function PartnerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [processing, setProcessing] = useState(false);

  const fetchPartners = useCallback(async () => {
    const { data, error } = await supabase.from('wallet_partners').select('*').eq('is_active', true).order('name');
    if (!error && data) setPartners(data);
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('partner_transactions').select('*, partner:wallet_partners(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    if (!error && data) setTransactions(data.map((d: any) => ({ ...d, partner_name: d.partner?.name || 'Partner' })));
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPartners(), fetchTransactions()]);
    setLoading(false);
  }, [fetchPartners, fetchTransactions]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  const handleTransaction = async () => {
    if (!selectedPartner || !user) return;
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter valid amount'); return; }
    if (txType === 'withdrawal' && amount > balance) { Alert.alert('Error', 'Insufficient balance'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('partner_transaction', {
      p_partner_id: selectedPartner.id,
      p_user_id: user.id,
      p_type: txType,
      p_amount: amount
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `${txType === 'deposit' ? 'Deposit' : 'Withdrawal'} to ${selectedPartner.name} initiated`);
    setPartnerModalVisible(false); setTxAmount(''); fetchTransactions();
  };

  const filteredPartners = partners.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = { bank: '#007AFF', telco: '#34C759', fintech: '#5856D6', merchant: '#FF9500', utility: '#FF3B30', insurance: '#AF52DE' };
    return map[type] || '#8E8E93';
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading partners...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Partners</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput style={styles.searchInput} placeholder="Search partners..." placeholderTextColor="#8E8E93" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {PARTNER_TYPES.map(t => (
          <TouchableOpacity key={t.key} style={[styles.filterChip, filterType === t.key && styles.filterChipActive]} onPress={() => setFilterType(t.key)}>
            <FontAwesome5 name={t.icon as any} size={12} color={filterType === t.key ? '#fff' : '#8E8E93'} />
            <Text style={[styles.filterText, filterType === t.key && styles.filterTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Partner Network ({filteredPartners.length})</Text>
        {filteredPartners.map(p => (
          <TouchableOpacity key={p.id} style={styles.partnerCard} onPress={() => { setSelectedPartner(p); setPartnerModalVisible(true); }} activeOpacity={0.85}>
            <View style={[styles.partnerIcon, { backgroundColor: getTypeColor(p.type) + '15' }]}>
              <FontAwesome5 name={PARTNER_TYPES.find(t => t.key === p.type)?.icon as any || 'handshake'} size={20} color={getTypeColor(p.type)} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.partnerHeader}>
                <Text style={styles.partnerName}>{p.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(p.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(p.type) }]}>{p.type.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.partnerDesc} numberOfLines={2}>{p.description}</Text>
              <Text style={styles.partnerRate}>Commission: {p.commission_rate}%</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.map(tx => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'deposit' ? '#34C75920' : '#FF950020' }]}>
                <Ionicons name={tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.type === 'deposit' ? '#34C759' : '#FF9500'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txPartner}>{tx.partner_name}</Text>
                <Text style={styles.txRef}>{tx.reference}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'deposit' ? '#34C759' : '#FF9500' }]}>{tx.type === 'deposit' ? '+' : '-'}KES {tx.amount.toLocaleString()}</Text>
            </View>
            <View style={[styles.txStatusBadge, { backgroundColor: tx.status === 'completed' ? '#34C75920' : '#FF950020' }]}>
              <Text style={[styles.txStatusText, { color: tx.status === 'completed' ? '#34C759' : '#FF9500' }]}>{tx.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
        {transactions.length === 0 && <Text style={styles.emptyText}>No partner transactions yet</Text>}
      </ScrollView>

      <Modal visible={partnerModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              {selectedPartner && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIcon, { backgroundColor: getTypeColor(selectedPartner.type) + '15' }]}>
                      <FontAwesome5 name={PARTNER_TYPES.find(t => t.key === selectedPartner.type)?.icon as any || 'handshake'} size={28} color={getTypeColor(selectedPartner.type)} />
                    </View>
                    <Text style={styles.modalTitle}>{selectedPartner.name}</Text>
                    <Text style={styles.modalType}>{selectedPartner.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.modalDesc}>{selectedPartner.description}</Text>
                  <View style={styles.modalMeta}>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>Commission</Text><Text style={styles.metaValue}>{selectedPartner.commission_rate}%</Text></View>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>Email</Text><Text style={styles.metaValue}>{selectedPartner.contact_email}</Text></View>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>Phone</Text><Text style={styles.metaValue}>{selectedPartner.contact_phone}</Text></View>
                  </View>

                  <Text style={styles.modalSection}>Transact</Text>
                  <TextInput style={styles.input} placeholder="Amount (KES)" keyboardType="numeric" value={txAmount} onChangeText={setTxAmount} />
                  <View style={styles.txTypeRow}>
                    <TouchableOpacity style={[styles.txTypeBtn, txType === 'deposit' && styles.txTypeBtnActive]} onPress={() => setTxType('deposit')}>
                      <Ionicons name="arrow-down" size={18} color={txType === 'deposit' ? '#fff' : '#8E8E93'} />
                      <Text style={[styles.txTypeText, txType === 'deposit' && styles.txTypeTextActive]}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.txTypeBtn, txType === 'withdrawal' && styles.txTypeBtnActive]} onPress={() => setTxType('withdrawal')}>
                      <Ionicons name="arrow-up" size={18} color={txType === 'withdrawal' ? '#fff' : '#8E8E93'} />
                      <Text style={[styles.txTypeText, txType === 'withdrawal' && styles.txTypeTextActive]}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setPartnerModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleTransaction} disabled={processing}>
                      {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Confirm</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: '#8E8E93', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', marginHorizontal: 16, marginVertical: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 8 },
  filterScroll: { maxHeight: 50, backgroundColor: '#1C1C1E' },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2C2C2E', gap: 6 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  partnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12 },
  partnerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: '800' },
  partnerDesc: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  partnerRate: { fontSize: 12, color: '#FF9500' },
  txCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txPartner: { fontSize: 14, fontWeight: '600', color: '#fff' },
  txRef: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  txStatusText: { fontSize: 10, fontWeight: '800' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalType: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  modalDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  modalMeta: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginBottom: 20 },
  metaItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 13, color: '#8E8E93' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
  modalSection: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  txTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  txTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2E' },
  txTypeBtnActive: { backgroundColor: '#007AFF' },
  txTypeText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  txTypeTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

