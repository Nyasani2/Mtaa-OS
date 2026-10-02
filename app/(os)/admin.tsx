// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real Data State
  const [stats, setStats] = useState({ users: 0, posts: 0, walletFloat: 0, transactions: 0 });
  const [logs, setLogs] = useState([]);
  const [layerStatus, setLayerStatus] = useState([]);

  const fetchRealData = async () => {
    try {
      // 1. Overview Stats
      const [usersRes, postsRes, walletRes, txRes] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('streets_posts').select('*', { count: 'exact', head: true }),
        supabase.from('wallet_accounts').select('balance'),
        supabase.from('wallet_transactions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString())
      ]);

      const totalFloat = walletRes.data ? walletRes.data.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0) : 0;

      setStats({
        users: usersRes.count || 0,
        posts: postsRes.count || 0,
        walletFloat: totalFloat,
        transactions: txRes.count || 0
      });

      // 2. Moderation Logs
      const { data: logsData } = await supabase.from('system_audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
      setLogs(logsData || []);

      // 3. Diagnostics (Real Layer Checks)
      const layers = [
        { num: 1, name: 'KERNEL', status: 'PASS', msg: `Platform: ${__DEV__ ? 'Dev' : 'Prod'}` },
        { num: 2, name: 'AUTH & IDENTITY', status: user ? 'PASS' : 'FAIL', msg: user ? `User: ${user.email}` : 'No Session' },
        { num: 7, name: 'WALLET', status: walletRes.error ? 'FAIL' : 'PASS', msg: walletRes.error ? walletRes.error.message : `Float: KES ${totalFloat.toLocaleString()}` },
        { num: 14, name: 'MTAA STREETS', status: postsRes.error ? 'FAIL' : 'PASS', msg: postsRes.error ? postsRes.error.message : `${postsRes.count} Posts Indexed` },
      ];
      setLayerStatus(layers);

    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRealData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchRealData(); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /><Text style={styles.loadingText}>Connecting to OS Core...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OS Command Center</Text>
        <Text style={styles.headerSub}>Live System Telemetry</Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {['Overview', 'Financials', 'Moderation', 'Diagnostics'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <View style={styles.grid}>
            <View style={styles.card}><Ionicons name="people" size={24} color="#60a5fa" /><Text style={styles.cardValue}>{stats.users.toLocaleString()}</Text><Text style={styles.cardLabel}>Total Users</Text></View>
            <View style={styles.card}><Ionicons name="document-text" size={24} color="#34d399" /><Text style={styles.cardValue}>{stats.posts.toLocaleString()}</Text><Text style={styles.cardLabel}>Streets Posts</Text></View>
            <View style={styles.card}><Ionicons name="wallet" size={24} color="#fbbf24" /><Text style={styles.cardValue}>KES {stats.walletFloat.toLocaleString()}</Text><Text style={styles.cardLabel}>System Float</Text></View>
            <View style={styles.card}><Ionicons name="swap-horizontal" size={24} color="#f87171" /><Text style={styles.cardValue}>{stats.transactions}</Text><Text style={styles.cardLabel}>24h Transactions</Text></View>
          </View>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'Financials' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liquidity & Volume</Text>
            <View style={styles.bigStat}><Text style={styles.bigValue}>KES {stats.walletFloat.toLocaleString()}</Text><Text style={styles.bigLabel}>Total Wallet Float</Text></View>
            <View style={styles.bigStat}><Text style={styles.bigValue}>{stats.transactions}</Text><Text style={styles.bigLabel}>Transactions (Last 24h)</Text></View>
            <Text style={styles.note}>* Data pulled live from wallet_accounts & wallet_transactions tables.</Text>
          </View>
        )}

        {/* MODERATION TAB */}
        {activeTab === 'Moderation' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent System Audit Logs</Text>
            {logs.length === 0 ? <Text style={styles.empty}>No recent events.</Text> : logs.map((log, i) => (
              <View key={i} style={styles.logItem}>
                <Ionicons name={log.event_type?.includes('error') ? 'warning' : 'checkmark-circle'} size={16} color={log.event_type?.includes('error') ? '#ef4444' : '#00ff88'} />
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.logType}>{log.event_type || 'System Event'}</Text>
                  <Text style={styles.logDetails} numberOfLines={2}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'Diagnostics' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Layer Health</Text>
            {layerStatus.map((layer, i) => (
              <View key={i} style={styles.layerItem}>
                <Text style={styles.layerNum}>{layer.num.toString().padStart(2, '0')}</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.layerName}>{layer.name}</Text>
                  <Text style={styles.layerMsg}>{layer.msg}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: layer.status === 'PASS' ? '#064e3b' : '#7f1d1d' }]}>
                  <Text style={styles.statusText}>{layer.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: '#60a5fa', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 8, backgroundColor: '#0f172a' },
  activeTab: { backgroundColor: '#8b5cf6' },
  tabText: { color: '#94a3b8', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  section: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  bigStat: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  bigValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bigLabel: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  note: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  logItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logType: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  logDetails: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  layerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  layerNum: { fontSize: 14, fontWeight: '700', color: '#64748b', width: 30 },
  layerName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  layerMsg: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  empty: { color: '#64748b', textAlign: 'center', padding: 20 }
});
