// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function MTAAAdminCenter() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [treasury, setTreasury] = useState({ totalFloat: 0, todayRevenue: 0, pendingPayouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  const fetchTreasuryData = async () => {
    try {
      const { data: walletData } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('account_type', 'mtaa_main_treasury');
      
      const total = walletData ? walletData.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0) : 0;
      
      setTreasury({
        totalFloat: total,
        todayRevenue: 12500, 
        pendingPayouts: 3400,
      });
    } catch (err) {
      console.error('Treasury fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { id: 'transport', name: 'MTaxi / MBoda / MTruck', icon: 'car', color: '#3B82F6', route: '/(mtaxi)/driver/dashboard' },
    { id: 'finance', name: 'Wallet & Treasury', icon: 'wallet', color: '#10B981', route: '/(os)/wallet/transactions' },
    { id: 'health', name: 'Health System', icon: 'heartbeat', color: '#EF4444', route: '/(os)/health/facility-admin' },
    { id: 'education', name: 'Education Portal', icon: 'graduation-cap', color: '#F59E0B', route: '/(education)/admin-dashboard' },
    { id: 'garage', name: 'Garage Network', icon: 'tools', color: '#8B5CF6', route: '/(garage)/dashboard' },
    { id: 'users', name: 'User Management', icon: 'users', color: '#06B6D4', route: '/(os)/settings' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Connecting to MTAA Core...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 1. MTAA MAIN ACCOUNT (THE TREASURY) */}
        <View style={styles.treasuryCard}>
          <View style={styles.treasuryHeader}>
            <Text style={styles.treasuryLabel}>MTAA Main Account (Treasury)</Text>
            <Ionicons name="shield-checkmark" size={20} color="#00ff88" />
          </View>
          <Text style={styles.treasuryBalance}>KES {treasury.totalFloat.toLocaleString()}</Text>
          <View style={styles.treasuryStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>+{treasury.todayRevenue}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{treasury.pendingPayouts}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* 2. MODULE COMMAND CENTERS (WeChat Style Grid) */}
        <Text style={styles.sectionTitle}>Module Command Centers</Text>
        <View style={styles.moduleGrid}>
          {modules.map((mod) => (
            <TouchableOpacity 
              key={mod.id} 
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                <FontAwesome5 name={mod.icon} size={24} color={mod.color} />
              </View>
              <Text style={styles.moduleName}>{mod.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. KERNEL AUDIT LOG (The Event Logger) */}
        <Text style={styles.sectionTitle}>Kernel Audit Log (Live)</Text>
        <View style={styles.logContainer}>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: '#10b981' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>System: Wallet Float Reconciled</Text>
              <Text style={styles.logTime}>2 mins ago</Text>
            </View>
          </View>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: '#3b82f6' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>MTaxi: Ride #88392 Completed</Text>
              <Text style={styles.logTime}>5 mins ago</Text>
            </View>
          </View>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: '#ef4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>Security: Failed Login Attempt</Text>
              <Text style={styles.logTime}>12 mins ago</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  
  treasuryCard: { margin: 16, padding: 24, backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  treasuryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  treasuryLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  treasuryBalance: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 20 },
  treasuryStats: { flexDirection: 'row', gap: 20 },
  statBox: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 10 },
  statValue: { color: '#00ff88', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  moduleGrid: { paddingHorizontal: 16, gap: 12 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  moduleIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  moduleName: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },

  logContainer: { marginHorizontal: 16, marginBottom: 40, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155' },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  logTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  logTime: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
