// @ts-nocheck
// app/(commerce)/shop/[id]/wallet.tsx
// Shop wallet screen — manages shop-level wallet (business_wallet)
// Uses canonical wallet hooks + shop context

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShop } from '@/domains/shop/hooks/useShop';
import {
  useWalletBalance,
  useWalletSend,
  useWalletReceive,
  useWalletHistory,
} from '@/domains/wallet/hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';

export default function ShopWalletScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { shop } = useShop(shopId);

  // Use shop owner's wallet (business wallets are linked to user_id)
  // In future: support business_wallets table directly
  const { balance, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useWalletBalance();
  const { send, sending, error: sendError, lastTx } = useWalletSend();
  const { request, createRequest, cancelRequest, loading: receiveLoading } = useWalletReceive();
  const { transactions, loading: historyLoading, refresh: refreshHistory } = useWalletHistory({ limit: 20 });

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'history'>('overview');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshBalance(), refreshHistory()]);
    setRefreshing(false);
  }, [refreshBalance, refreshHistory]);

  const handleSend = async (recipientPhone: string, amount: number, description: string) => {
    const result = await send({
      recipient_phone: recipientPhone,
      amount,
      description,
      pin: '0000', // PIN should come from PIN input modal in production
    });
    // @ts-ignore
    if (result.success) {
      Alert.alert('Sent', `Sent ${amount} to ${recipientPhone}`);
    } else {
    // @ts-ignore
      Alert.alert('Failed', result.error || 'Transfer failed');
    }
  };

  const handleReceive = async (amount?: number) => {
    const result = await createRequest({ amount, description: `Payment to ${shop?.name || 'shop'}` });
    // @ts-ignore
    if (result.success) {
    // @ts-ignore
      Alert.alert('Request Created', `Share this request: ${result.request?.deep_link}`);
    }
  };

  const formatCurrency = (amount: number, currency = 'KES') => {
    return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {balanceLoading ? '...' : formatCurrency(balance?.available || 0, balance?.currency)}
        </Text>
        {balance?.pending ? (
          <Text style={styles.pendingText}>Pending: {formatCurrency(balance.pending, balance.currency)}</Text>
        ) : null}
        {balance?.escrow ? (
          <Text style={styles.escrowText}>Escrow: {formatCurrency(balance.escrow, balance.currency)}</Text>
        ) : null}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('send')}>
          <Ionicons name="arrow-up-circle" size={28} color="#007AFF" />
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('receive')}>
          <Ionicons name="arrow-down-circle" size={28} color="#34C759" />
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(commerce)/shop/${shopId}/analytics` as any)}>
          <Ionicons name="bar-chart" size={28} color="#FF9500" />
          <Text style={styles.actionLabel}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('history')}>
          <Ionicons name="time" size={28} color="#5856D6" />
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Shop Context */}
      {shop ? (
        <View style={styles.shopCard}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopMeta}>ID: {shop.id.slice(0, 8)}...</Text>
        </View>
      ) : null}

      {/* Error Banner */}
      {(balanceError || sendError) ? (
    // @ts-ignore
        <View style={styles.errorBanner}>
    // @ts-ignore
          <Text style={styles.errorText}>{balanceError || sendError}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderSend = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Send Money</Text>
      <Text style={styles.tabSubtitle}>From {shop?.name || 'your shop'}</Text>
      {/* Send form would go here — simplified for now */}
      <TouchableOpacity
        style={[styles.primaryBtn, sending && styles.disabledBtn]}
        onPress={() => handleSend('+254700000000', 100, 'Test payment')}
        disabled={sending}
      >
        <Text style={styles.primaryBtnText}>{sending ? 'Sending...' : 'Send Test Payment'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('overview')}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceive = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Receive Payment</Text>
      {request ? (
    // @ts-ignore
        <View style={styles.requestCard}>
    // @ts-ignore
          <Text style={styles.requestLabel}>Request ID: {request.request_id}</Text>
    // @ts-ignore
          <Text style={styles.requestAmount}>{formatCurrency(request.amount, request.currency)}</Text>
    // @ts-ignore
          <TouchableOpacity style={styles.dangerBtn} onPress={() => cancelRequest(request.request_id)}>
            <Text style={styles.dangerBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, receiveLoading && styles.disabledBtn]}
          onPress={() => handleReceive(500)}
          disabled={receiveLoading}
        >
          <Text style={styles.primaryBtnText}>{receiveLoading ? 'Creating...' : 'Create Payment Request (500)'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('overview')}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Transaction History</Text>
      {historyLoading && !transactions.length ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txIcon}>
              <Ionicons
                name={tx.type === 'credit' ? 'arrow-down' : tx.type === 'debit' ? 'arrow-up' : 'swap-horizontal'}
                size={20}
                color={tx.type === 'credit' ? '#34C759' : tx.type === 'debit' ? '#FF3B30' : '#007AFF'}
              />
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
              <Text style={styles.txMeta}>{new Date(tx.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txAmount, tx.type === 'credit' ? styles.credit : styles.debit]}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
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
        <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/settings` as any)}>
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
  pendingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  escrowText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

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

  errorBanner: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#fff', fontSize: 14, flex: 1 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 12 },

  tabContainer: { padding: 16 },
  tabTitle: { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 8 },
  tabSubtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 24 },

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
  dangerBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  requestLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },
  requestAmount: { fontSize: 28, fontWeight: '800', color: '#000' },

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
