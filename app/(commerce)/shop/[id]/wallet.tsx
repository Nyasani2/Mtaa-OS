// @ts-nocheck
// app/(commerce)/shop/[id]/wallet.tsx
// Shop wallet screen — manages shop-level wallet (business_wallet)
// Uses canonical wallet hooks + shop context

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShop } from '@/domains/shop/hooks/useShop';
import { useWallet } from '@/hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';

export default function ShopWalletScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { shop } = useShop(shopId);
  const { balance, transactions, fetchTransactions, sendMoney, loading: walletLoading } = useWallet();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'history'>('overview');
  const [sendAmount, setSendAmount] = useState('');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions?.();
    setRefreshing(false);
  }, [fetchTransactions]);

  const handleSend = async () => {
    const amount = Number(sendAmount);
    if (!sendRecipient.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Enter valid recipient and amount'); return;
    }
    if (amount > balance) { Alert.alert('Error', 'Insufficient balance'); return; }
    setSendLoading(true);
    try {
      await sendMoney?.({ recipient: sendRecipient.trim(), amount, description: `Payment from ${shop?.name || 'shop'}` });
      Alert.alert('Sent', `Sent KSh ${amount} to ${sendRecipient}`);
      setSendAmount(''); setSendRecipient(''); setActiveTab('overview');
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Transfer failed');
    } finally {
      setSendLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'KES') => {
    return `${currency} ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {walletLoading ? '...' : formatCurrency(balance || 0)}
        </Text>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('send')}>
          <Ionicons name="arrow-up-circle" size={28} color="#007AFF" />
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('receive')}>
          <Ionicons name="arrow-down-circle" size={28} color="#34C759" />
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(commerce)/shop/${shopId}/analytics`)}>
          <Ionicons name="bar-chart" size={28} color="#FF9500" />
          <Text style={styles.actionLabel}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('history')}>
          <Ionicons name="time" size={28} color="#5856D6" />
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {shop ? (
        <View style={styles.shopCard}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopMeta}>ID: {shop.id?.slice(0, 8)}...</Text>
        </View>
      ) : null}
    </View>
  );

  const renderSend = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Send Money</Text>
      <Text style={styles.tabSubtitle}>From {shop?.name || 'your shop'}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Recipient Phone</Text>
        <TextInput
          style={styles.textInput}
          placeholder="2547XXXXXXXX"
          placeholderTextColor="#8E8E93"
          value={sendRecipient}
          onChangeText={setSendRecipient}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Amount (KSh)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="0.00"
          placeholderTextColor="#8E8E93"
          value={sendAmount}
          onChangeText={setSendAmount}
          keyboardType="decimal-pad"
        />
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, sendLoading && styles.disabledBtn]}
        onPress={handleSend}
        disabled={sendLoading}
      >
        <Text style={styles.primaryBtnText}>{sendLoading ? 'Sending...' : 'Send Payment'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('overview')}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceive = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Receive Payment</Text>
      <Text style={styles.tabSubtitle}>Share your shop wallet details</Text>
      <View style={styles.receiveCard}>
        <Ionicons name="qr-code" size={64} color="#007AFF" />
        <Text style={styles.receiveHint}>QR code generation coming soon</Text>
      </View>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('overview')}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Transaction History</Text>
      {walletLoading && !transactions?.length ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : !transactions?.length ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((tx: any) => (
          <View key={tx.id || tx.transaction_id || Math.random()} style={styles.txRow}>
            <View style={styles.txIcon}>
              <Ionicons
                name={tx.type === 'credit' || tx.direction === 'in' ? 'arrow-down' : tx.type === 'debit' || tx.direction === 'out' ? 'arrow-up' : 'swap-horizontal'}
                size={20}
                color={tx.type === 'credit' || tx.direction === 'in' ? '#34C759' : tx.type === 'debit' || tx.direction === 'out' ? '#FF3B30' : '#007AFF'}
              />
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txDesc}>{tx.description || tx.type || 'Transaction'}</Text>
              <Text style={styles.txMeta}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}</Text>
            </View>
            <Text style={[styles.txAmount, (tx.type === 'credit' || tx.direction === 'in') ? styles.credit : styles.debit]}>
              {(tx.type === 'credit' || tx.direction === 'in') ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
            </Text>
          </View>
        ))
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('overview')}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Wallet</Text>
        <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/settings`)}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'send' && renderSend()}
      {activeTab === 'receive' && renderReceive()}
      {activeTab === 'history' && renderHistory()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },

  overviewContainer: { padding: 16 },
  balanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800' },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionBtn: {
    width: '23%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, color: '#333', marginTop: 6, fontWeight: '500' },

  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shopName: { fontSize: 16, fontWeight: '700', color: '#000' },
  shopMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },

  tabContainer: { padding: 16 },
  tabTitle: { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 8 },
  tabSubtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 24 },

  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  primaryBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#C7C7CC' },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  secondaryBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },

  receiveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  receiveHint: { fontSize: 14, color: '#8E8E93', marginTop: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: '600', color: '#000' },
  txMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  credit: { color: '#34C759' },
  debit: { color: '#FF3B30' },
});
