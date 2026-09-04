// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, useWalletStore } from 'app/(os)/wallet/hooks';
import { supabase } from '@/lib/supabase';
import { Alert, BlurView } from 'expo-blur';

interface DarajaConfig {
  id: string;
  consumer_key: string;
  consumer_secret: string;
  shortcode: string;
  passkey: string;
  environment: 'sandbox' | 'production';
  is_active: boolean;
  callback_url: string;
  stk_push_enabled: boolean;
  b2c_enabled: boolean;
  c2b_enabled: boolean;
  balance_check_enabled: boolean;
}

interface DarajaTransaction {
  id: string;
  type: 'stk_push' | 'b2c' | 'c2b' | 'balance_query' | 'reversal';
  amount: number;
  phone_number: string | null;
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  mpesa_receipt: string | null;
  result_desc: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function DarajaScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [config, setConfig] = useState<DarajaConfig | null>(null);
  const [transactions, setTransactions] = useState<DarajaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'config'>('overview');
  const [stkModalVisible, setStkModalVisible] = useState(false);
  const [stkPhone, setStkPhone] = useState('');
  const [stkAmount, setStkAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [configForm, setConfigForm] = useState({
    consumer_key: '', consumer_secret: '', shortcode: '', passkey: '',
    environment: 'sandbox' as const, callback_url: '',
    stk_push_enabled: true, b2c_enabled: false, c2b_enabled: false, balance_check_enabled: false
  });

  const fetchConfig = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('daraja_configs').select('*').eq('user_id', user.id).single();
    if (!error && data) { setConfig(data); setConfigForm({ ...data }); }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('daraja_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setTransactions(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchTransactions()]);
    setLoading(false);
  }, [fetchConfig, fetchTransactions]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  const handleStkPush = async () => {
    if (!user || !config) { Alert.alert('Error', 'Configure Daraja first'); return; }
    const amount = parseFloat(stkAmount);
    if (!stkPhone.trim() || isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter valid phone and amount'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('daraja_stk_push', {
      p_user_id: user.id,
      p_phone: stkPhone.trim(),
      p_amount: amount,
      p_reference: `MTAA_${Date.now()}`
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('STK Push Sent', `Request sent to ${stkPhone}. Check your phone to complete payment.`);
    setStkModalVisible(false); setStkPhone(''); setStkAmount('');
    fetchTransactions();
  };

  const handleSaveConfig = async () => {
    if (!user) return;
    setProcessing(true);
    const { error } = await supabase.from('daraja_configs').upsert({
      user_id: user.id,
      ...configForm,
      updated_at: new Date().toISOString()
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'Daraja configuration saved');
    fetchConfig();
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: '#FF9500', success: '#34C759', failed: '#FF3B30', timeout: '#8E8E93' };
    return map[status] || '#8E8E93';
  };

  const getStatusIcon = (status: string) => {
    const map: Record<string, string> = { pending: 'time', success: 'checkmark-circle', failed: 'close-circle', timeout: 'alert-circle' };
    return map[status] || 'help-circle';
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00A650" />
      <Text style={styles.loadingText}>Loading Daraja...</Text>
    </View>
  );

  const successCount = transactions.filter(t => t.status === 'success').length;
  const totalVolume = transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>M-Pesa Daraja</Text>
        <TouchableOpacity style={styles.stkBtn} onPress={() => setStkModalVisible(true)}>
          <Ionicons name="phone-portrait" size={22} color="#00A650" />
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: config?.is_active ? '#00A65020' : '#FF3B3020' }]}>
        <Ionicons name={config?.is_active ? 'checkmark-circle' : 'alert-circle'} size={20} color={config?.is_active ? '#00A650' : '#FF3B30'} />
        <Text style={[styles.statusText, { color: config?.is_active ? '#00A650' : '#FF3B30' }]}>
          {config?.is_active ? `Connected • ${config.environment.toUpperCase()}` : 'Not Configured'}
        </Text>
        {config?.is_active && (
          <View style={styles.envBadge}>
            <Text style={styles.envText}>{config.environment === 'production' ? 'LIVE' : 'TEST'}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {(['overview', 'transactions', 'config'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statValue}>{transactions.length}</Text><Text style={styles.statLabel}>Total TXNs</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{successCount}</Text><Text style={styles.statLabel}>Successful</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>KES {totalVolume.toLocaleString()}</Text><Text style={styles.statLabel}>Volume</Text></View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => setStkModalVisible(true)}>
                <View style={[styles.actionIcon, { backgroundColor: '#00A65020' }]}><Ionicons name="phone-portrait" size={24} color="#00A650" /></View>
                <Text style={styles.actionLabel}>STK Push</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('B2C', 'Business to Customer coming soon')}>
                <View style={[styles.actionIcon, { backgroundColor: '#007AFF20' }]}><Ionicons name="arrow-redo" size={24} color="#007AFF" /></View>
                <Text style={styles.actionLabel}>B2C Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('C2B', 'Customer to Business coming soon')}>
                <View style={[styles.actionIcon, { backgroundColor: '#FF950020' }]}><Ionicons name="arrow-undo" size={24} color="#FF9500" /></View>
                <Text style={styles.actionLabel}>C2B Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Balance', 'Account balance query coming soon')}>
                <View style={[styles.actionIcon, { backgroundColor: '#5856D620' }]}><Ionicons name="wallet" size={24} color="#5856D6" /></View>
                <Text style={styles.actionLabel}>Balance</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.slice(0, 5).map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: getStatusColor(tx.status) + '15' }]}>
                    <Ionicons name={tx.type === 'stk_push' ? 'phone-portrait' : tx.type === 'b2c' ? 'arrow-redo' : tx.type === 'c2b' ? 'arrow-undo' : 'wallet'} size={18} color={getStatusColor(tx.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txType}>{tx.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.txRef}>{tx.reference}</Text>
                    {tx.phone_number && <Text style={styles.txPhone}>{tx.phone_number}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmount}>KES {tx.amount.toLocaleString()}</Text>
                    <View style={[styles.txStatusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(tx.status) as any} size={10} color={getStatusColor(tx.status)} />
                      <Text style={[styles.txStatusText, { color: getStatusColor(tx.status) }]}>{tx.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                {tx.mpesa_receipt && <Text style={styles.receiptText}>Receipt: {tx.mpesa_receipt}</Text>}
              </View>
            ))}
            {transactions.length === 0 && <Text style={styles.emptyText}>No transactions yet</Text>}
          </>
        )}

        {activeTab === 'transactions' && (
          <>
            {transactions.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: getStatusColor(tx.status) + '15' }]}>
                    <Ionicons name={tx.type === 'stk_push' ? 'phone-portrait' : tx.type === 'b2c' ? 'arrow-redo' : tx.type === 'c2b' ? 'arrow-undo' : 'wallet'} size={18} color={getStatusColor(tx.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txType}>{tx.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.txRef}>{tx.reference}</Text>
                    {tx.phone_number && <Text style={styles.txPhone}>{tx.phone_number}</Text>}
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmount}>KES {tx.amount.toLocaleString()}</Text>
                    <View style={[styles.txStatusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(tx.status) as any} size={10} color={getStatusColor(tx.status)} />
                      <Text style={[styles.txStatusText, { color: getStatusColor(tx.status) }]}>{tx.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                {tx.mpesa_receipt && <Text style={styles.receiptText}>Receipt: {tx.mpesa_receipt}</Text>}
                {tx.result_desc && <Text style={styles.resultDesc}>{tx.result_desc}</Text>}
              </View>
            ))}
          </>
        )}

        {activeTab === 'config' && (
          <>
            <Text style={styles.configLabel}>Consumer Key</Text>
            <TextInput style={styles.configInput} placeholder="Enter consumer key" placeholderTextColor="#8E8E93" value={configForm.consumer_key} onChangeText={t => setConfigForm(p => ({ ...p, consumer_key: t }))} secureTextEntry />

            <Text style={styles.configLabel}>Consumer Secret</Text>
            <TextInput style={styles.configInput} placeholder="Enter consumer secret" placeholderTextColor="#8E8E93" value={configForm.consumer_secret} onChangeText={t => setConfigForm(p => ({ ...p, consumer_secret: t }))} secureTextEntry />

            <Text style={styles.configLabel}>Shortcode</Text>
            <TextInput style={styles.configInput} placeholder="e.g. 174379" placeholderTextColor="#8E8E93" value={configForm.shortcode} onChangeText={t => setConfigForm(p => ({ ...p, shortcode: t }))} keyboardType="numeric" />

            <Text style={styles.configLabel}>Passkey</Text>
            <TextInput style={styles.configInput} placeholder="Enter passkey" placeholderTextColor="#8E8E93" value={configForm.passkey} onChangeText={t => setConfigForm(p => ({ ...p, passkey: t }))} secureTextEntry />

            <Text style={styles.configLabel}>Environment</Text>
            <View style={styles.envRow}>
              {(['sandbox', 'production'] as const).map(env => (
                <TouchableOpacity key={env} style={[styles.envChip, configForm.environment === env && styles.envChipActive]} onPress={() => setConfigForm(p => ({ ...p, environment: env }))}>
                  <Text style={[styles.envChipText, configForm.environment === env && styles.envChipTextActive]}>{env.charAt(0).toUpperCase() + env.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configLabel}>Callback URL</Text>
            <TextInput style={styles.configInput} placeholder="https://your-domain.com/callback" placeholderTextColor="#8E8E93" value={configForm.callback_url} onChangeText={t => setConfigForm(p => ({ ...p, callback_url: t }))} autoCapitalize="none" />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>STK Push</Text>
              <TouchableOpacity onPress={() => setConfigForm(p => ({ ...p, stk_push_enabled: !p.stk_push_enabled }))}>
                <Ionicons name={configForm.stk_push_enabled ? "toggle" : "toggle-outline"} size={32} color={configForm.stk_push_enabled ? '#00A650' : '#8E8E93'} />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>B2C Enabled</Text>
              <TouchableOpacity onPress={() => setConfigForm(p => ({ ...p, b2c_enabled: !p.b2c_enabled }))}>
                <Ionicons name={configForm.b2c_enabled ? "toggle" : "toggle-outline"} size={32} color={configForm.b2c_enabled ? '#00A650' : '#8E8E93'} />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>C2B Enabled</Text>
              <TouchableOpacity onPress={() => setConfigForm(p => ({ ...p, c2b_enabled: !p.c2b_enabled }))}>
                <Ionicons name={configForm.c2b_enabled ? "toggle" : "toggle-outline"} size={32} color={configForm.c2b_enabled ? '#00A650' : '#8E8E93'} />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Balance Check</Text>
              <TouchableOpacity onPress={() => setConfigForm(p => ({ ...p, balance_check_enabled: !p.balance_check_enabled }))}>
                <Ionicons name={configForm.balance_check_enabled ? "toggle" : "toggle-outline"} size={32} color={configForm.balance_check_enabled ? '#00A650' : '#8E8E93'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig} disabled={processing}>
              {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Configuration</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* STK Push Modal */}
      <Modal visible={stkModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>STK Push</Text>
            <Text style={styles.modalSubtitle}>Send M-Pesa payment request to customer phone</Text>
            <TextInput style={styles.input} placeholder="Phone Number (2547XXXXXXXX)" keyboardType="phone-pad" value={stkPhone} onChangeText={setStkPhone} />
            <TextInput style={styles.input} placeholder="Amount (KES)" keyboardType="numeric" value={stkAmount} onChangeText={setStkAmount} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setStkModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnPrimary, { backgroundColor: '#00A650' }]} onPress={handleStkPush} disabled={processing}>
                {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Send STK Push</Text>}
              </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  stkBtn: { padding: 4 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12 },
  statusText: { fontSize: 14, fontWeight: '600', marginLeft: 8, flex: 1 },
  envBadge: { backgroundColor: '#fff20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  envText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingBottom: 8, marginTop: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#2C2C2E' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: { width: '47%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  txCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txType: { fontSize: 14, fontWeight: '600', color: '#fff' },
  txRef: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  txPhone: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  txDate: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#fff' },
  txStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  txStatusText: { fontSize: 9, fontWeight: '800' },
  receiptText: { fontSize: 11, color: '#00A650', marginTop: 8 },
  resultDesc: { fontSize: 11, color: '#FF3B30', marginTop: 4, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 20 },
  configLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 12 },
  configInput: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15 },
  envRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  envChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  envChipActive: { backgroundColor: '#00A650' },
  envChipText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  envChipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  toggleLabel: { fontSize: 15, color: '#fff' },
  saveBtn: { backgroundColor: '#00A650', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

