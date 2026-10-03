// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/hooks/useWalletStore';
import { supabase } from '@/lib/supabase';

export default function WalletHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const wallet = useWalletStore();
  
  const [dbBalance, setDbBalance] = useState<number | null>(null);
  const [dbTx, setDbTx] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.id) return;
      
      try {
        const { data: w, error: wError } = await supabase
          .from('wallet_accounts')
          .select('balance, currency, status')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (wError) console.error('Wallet fetch error:', wError);
        
        const { data: wt } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);
        
        const { data: mt } = await supabase
          .from('mpesa_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!alive) return;
        
        if (w) {
          setDbBalance(Number(w.balance) || 0);
        } else {
          const { data: newWallet } = await supabase
            .from('wallet_accounts')
            .insert({
              user_id: user.id,
              balance: 0,
              currency: 'KES',
              is_default: true,
              status: 'active'
            })
            .select()
            .single();
          setDbBalance(0);
        }
        
        setDbTx([
          ...(wt || []).map((t: any) => ({
            id: t.id,
            type: t.type || 'credit',
            description: t.description || 'Wallet transaction',
            created_at: t.created_at,
            amount: t.amount,
            code: t.reference || String(t.id).replace(/-/g,'').slice(0, 8).toUpperCase()
          })),
          ...(mt || []).map((t: any) => ({
            id: t.id,
            type: 'deposit',
            description: 'M-Pesa Deposit',
            created_at: t.created_at,
            amount: t.amount,
            code: t.mpesa_receipt || String(t.checkout_request_id || t.id).replace(/-/g,'').slice(-8).toUpperCase()
          })),
        ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5));
        
      } catch (err) {
        console.error('Load error:', err);
      }
    };
    
    load();
    const iv = setInterval(load, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [user?.id]);

  const balance = dbBalance ?? wallet.balance ?? 0;
  const heldBalance = wallet.heldBalance ?? 0;
  const currency = wallet.currency ?? 'KES';
  const loading = wallet.loading ?? false;
  const transactions = dbTx.length ? dbTx : (wallet.transactions ?? []);
  
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await wallet.loadWallet?.(user.id);
      await wallet.loadTransactions?.(user.id, 5);
    }
    setRefreshing(false);
  }, [user, wallet]);

  useEffect(() => {
    if (user?.id) {
      wallet.loadWallet?.(user.id);
      wallet.loadTransactions?.(user.id, 5);
    }
  }, [user]);

  const quickActions = [
    { label: 'Send', icon: 'send', color: '#007AFF', route: '/(os)/wallet/send' },
    { label: 'Pay Business', icon: 'storefront', color: '#10b981', route: '/(os)/wallet/pay-business' },
    { label: 'Withdraw', icon: 'arrow-down', color: '#34C759', route: '/(os)/wallet/withdraw' },
    { label: 'Deposit', icon: 'download', color: '#5856D6', route: '/(os)/wallet/deposit' },
    { label: 'History', icon: 'time', color: '#FF9500', route: '/(os)/wallet/history' },
  ];

  const qrActions = [
    { label: 'My QR Code', icon: 'qr-code', color: '#8b5cf6', route: '/(os)/wallet/qr' },
    { label: 'Scan QR', icon: 'scan', color: '#06b6d4', route: '/(os)/wallet/qr-scan' },
  ];

  const services = [
    { label: 'Agent', icon: 'people', color: '#34C759', route: '/(os)/wallet/agent' },
    { label: 'Agent Map', icon: 'map', color: '#34C759', route: '/(os)/wallet/agent-map' },
    { label: 'Banks', icon: 'business', color: '#007AFF', route: '/(os)/wallet/banks' },
    { label: 'Regulatory', icon: 'document-text', color: '#FF9500', route: '/(os)/wallet/regulatory' },
    { label: 'Central Bank', icon: 'globe', color: '#5856D6', route: '/(os)/wallet/treasury-hub' },
    { label: 'Credit', icon: 'trending-up', color: '#AF52DE', route: '/(os)/wallet/credit' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/settings')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{currency} {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        {heldBalance > 0 && (
          <Text style={styles.heldBalance}>Held: {currency} {heldBalance.toFixed(2)}</Text>
        )}
      </View>

      {/* M-Pesa Coming Soon Banner */}
      <View style={{ marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: 'rgba(255, 152, 0, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: '#FF9800', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="construct-outline" size={28} color="#FF9800" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FF9800', fontSize: 15, fontWeight: '700' }}>M-Pesa Integration Coming Soon</Text>
          <Text style={{ color: '#FFD54F', fontSize: 12, marginTop: 4, lineHeight: 16 }}>We are currently configuring Daraja API credentials. Stay tuned for seamless mobile money deposits and withdrawals!</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.actionButton}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QR Payments</Text>
        <View style={styles.actionGrid}>
          {qrActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.actionButton}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.serviceList}>
          {services.map((service, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.serviceButton}
              onPress={() => router.push(service.route as any)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                <Ionicons name={service.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: (tx.type === 'credit' || tx.type === 'deposit') ? '#34C759' : '#FF3B30' }]}>
                  <Ionicons name={(tx.type === 'credit' || tx.type === 'deposit') ? 'arrow-down' : 'arrow-up'} size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.transactionDesc}>{tx.description}</Text>
                  <Text style={styles.transactionDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: (tx.type === 'credit' || tx.type === 'deposit') ? '#34C759' : '#FF3B30' }]}>
                {(tx.type === 'credit' || tx.type === 'deposit') ? '+' : '-'}{currency} {Number(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  balanceCard: { backgroundColor: '#1e293b', margin: 20, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  balanceLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff' },
  heldBalance: { fontSize: 12, color: '#f59e0b', marginTop: 8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: { width: '48%', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  serviceList: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  serviceButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  serviceIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  serviceLabel: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1e293b', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  transactionDesc: { color: '#fff', fontSize: 14, fontWeight: '500' },
  transactionDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', padding: 20 },
});
