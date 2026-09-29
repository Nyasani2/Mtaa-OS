// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');

export default function LiveLedgerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    totalVolume1h: 0,
    activeRails: { mpesa: '🟢', wallet: '🟢', binance: '', escrow: '🟢' },
    failedCount: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load initial transactions
    loadTransactions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('live-ledger')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions' }, (payload) => {
        setTransactions(prev => [payload.new, ...prev].slice(0, 50));
        addLog('TRANSACTION', `New ${payload.new.type} of ${payload.new.currency} ${payload.new.amount}`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mpesa_transactions' }, (payload) => {
        addLog('M-PESA', `STK Push ${payload.new.status} for ${payload.new.amount}`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'binance_conversions' }, (payload) => {
        addLog('BINANCE', `Conversion ${payload.new.from_currency} → ${payload.new.to_currency}`);
      })
      .subscribe();

    // Update system health every 30s
    const healthInterval = setInterval(updateSystemHealth, 30000);
    updateSystemHealth();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(healthInterval);
    };
  }, []);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setTransactions(data);
  };

  const updateSystemHealth = async () => {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data: recentTx } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .gte('created_at', oneHourAgo)
      .eq('status', 'completed');
    
    const volume = recentTx?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    const { count: failedCount } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)
      .eq('status', 'failed');

    setSystemHealth(prev => ({
      ...prev,
      totalVolume1h: volume,
      failedCount: failedCount || 0,
    }));
  };

  const addLog = (source: string, message: string) => {
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      source,
      message,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.txItem}>
      <View style={styles.txLeft}>
        <View style={[styles.txIcon, { backgroundColor: item.type === 'credit' ? '#10b981' : '#ef4444' }]}>
          <Ionicons name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={16} color="#fff" />
        </View>
        <View>
          <Text style={styles.txDesc}>{item.description || item.type}</Text>
          <Text style={styles.txMeta}>
            {new Date(item.created_at).toLocaleTimeString()} • {item.currency}
          </Text>
        </View>
      </View>
      <Text style={[styles.txAmount, { color: item.type === 'credit' ? '#10b981' : '#ef4444' }]}>
        {item.type === 'credit' ? '+' : '-'}{item.amount?.toFixed(2)}
      </Text>
    </View>
  );

  const renderLog = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>{item.time}</Text>
      <Text style={styles.logSource}>[{item.source}]</Text>
      <Text style={styles.logMessage}>{item.message}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Ledger</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* System Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Volume (1h)</Text>
            <Text style={styles.healthValue}>KES {systemHealth.totalVolume1h.toLocaleString()}</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Failed Tx</Text>
            <Text style={[styles.healthValue, { color: systemHealth.failedCount > 0 ? '#ef4444' : '#10b981' }]}>
              {systemHealth.failedCount}
            </Text>
          </View>
        </View>
        <View style={styles.railsRow}>
          {Object.entries(systemHealth.activeRails).map(([rail, status]) => (
            <View key={rail} style={styles.railItem}>
              <Text style={styles.railStatus}>{status}</Text>
              <Text style={styles.railName}>{rail}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Live Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Transactions</Text>
        <FlatList
          ref={scrollRef}
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet</Text>}
        />
      </View>

      {/* Data Logger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ASIS Data Logger</Text>
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No events logged</Text>}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  healthGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  healthCard: { flex: 1, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12 },
  healthLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  healthValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  railsRow: { flexDirection: 'row', gap: 16 },
  railItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  railStatus: { fontSize: 16 },
  railName: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 8 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txDesc: { color: '#fff', fontSize: 14, fontWeight: '600' },
  txMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  logItem: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: '#1a1a1a', borderRadius: 6, marginBottom: 4 },
  logTime: { color: '#666', fontSize: 11, fontFamily: 'monospace' },
  logSource: { color: '#00ff88', fontSize: 11, fontWeight: '700' },
  logMessage: { color: '#fff', fontSize: 11, flex: 1 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', padding: 20 },
});
