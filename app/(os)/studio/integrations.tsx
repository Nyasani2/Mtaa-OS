import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  status: 'connected' | 'pending' | 'disconnected';
  lastSync?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'wallet', name: 'MTAA Wallet', description: 'Receive payouts, tips, and subscriptions', icon: 'credit-card', color: '#10b981', route: '/(os)/wallet', status: 'connected' },
  { id: 'marketplace', name: 'MTAA Marketplace', description: 'Sell merchandise and digital products', icon: 'shopping-bag', color: '#f59e0b', route: '/(os)/marketplace', status: 'connected' },
  { id: 'music', name: 'MTAA Music', description: 'Distribute and sell your music', icon: 'music', color: '#ec4899', route: '/(os)/studio/music-studio', status: 'connected' },
  { id: 'education', name: 'MTAA Education', description: 'Publish courses and lessons', icon: 'book-open', color: '#6366f1', route: '/(os)/studio/education-studio', status: 'connected' },
  { id: 'events', name: 'MTAA Events', description: 'Host live events and sell tickets', icon: 'calendar', color: '#8b5cf6', route: '/(os)/events', status: 'pending' },
  { id: 'messaging', name: 'MTAA Messenger', description: 'Connect with fans and collaborators', icon: 'message-circle', color: '#06b6d4', route: '/(os)/messages', status: 'connected' },
  { id: 'notifications', name: 'MTAA Notifications', description: 'Push alerts for subscribers', icon: 'bell', color: '#ef4444', route: '/(os)/notifications', status: 'connected' },
  { id: 'profile', name: 'MTAA Profile', description: 'Unified creator identity', icon: 'user', color: '#6366f1', route: '/(os)/profile', status: 'connected' },
  { id: 'ads', name: 'MTAA Ads', description: 'Monetize with targeted advertising', icon: 'monitor', color: '#f97316', route: '/(os)/ads', status: 'pending' },
  { id: 'asis', name: 'ASIS AI', description: 'AI-powered content assistance', icon: 'cpu', color: '#14b8a6', route: '/(os)/asis', status: 'connected' },
];

interface SyncLog {
  id: string;
  integration: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export default function IntegrationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncLogs();
  }, []);

  const fetchSyncLogs = async () => {
    try {
      const { data } = await supabase
        .from('studio_integration_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      setSyncLogs(data || []);
    } catch (e) { console.error(e); }
  };

  const syncIntegration = async (integration: Integration) => {
    setSyncing(integration.id);
    try {
      // Simulate sync - in production, this calls each module's API
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from('studio_integration_logs').insert({
        user_id: user?.id,
        integration: integration.name,
        action: 'sync',
        status: 'success',
      });
      fetchSyncLogs();
    } catch (e) { console.error(e); }
    finally { setSyncing(null); }
  };

  const navigateToIntegration = (route: string) => {
    router.push(route as any);
  };

  const renderIntegrationCard = ({ item }: { item: Integration }) => (
    <TouchableOpacity style={styles.integrationCard} onPress={() => navigateToIntegration(item.route)}>
      <View style={[styles.integrationIcon, { backgroundColor: `${item.color}22` }]}>
        <Feather name={item.icon as any} size={24} color={item.color} />
      </View>
      <View style={styles.integrationInfo}>
        <View style={styles.integrationHeader}>
          <Text style={styles.integrationName}>{item.name}</Text>
          <View style={[styles.statusDot, item.status === 'connected' && styles.statusConnected, item.status === 'pending' && styles.statusPending]} />
        </View>
        <Text style={styles.integrationDesc}>{item.description}</Text>
        <View style={styles.integrationFooter}>
          <Text style={[styles.statusText, item.status === 'connected' && { color: '#10b981' }, item.status === 'pending' && { color: '#f59e0b' }]}>
            {item.status}
          </Text>
          {item.status === 'connected' && (
            <TouchableOpacity onPress={() => syncIntegration(item)} disabled={syncing === item.id}>
              <Text style={styles.syncText}>{syncing === item.id ? 'Syncing...' : 'Sync'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#666" />
    </TouchableOpacity>
  );

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length;
  const pendingCount = INTEGRATIONS.filter(i => i.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{connectedCount}</Text>
            <Text style={styles.summaryLabel}>Connected</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{INTEGRATIONS.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* Integration Grid */}
        <Text style={styles.sectionTitle}>Connected Services</Text>
        <FlatList
          data={INTEGRATIONS}
          keyExtractor={i => i.id}
          renderItem={renderIntegrationCard}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />

        {/* Sync Logs */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {syncLogs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <Feather name="activity" size={24} color="#333" />
            <Text style={styles.emptyLogsText}>No sync activity yet</Text>
          </View>
        ) : (
          syncLogs.map(log => (
            <View key={log.id} style={styles.logItem}>
              <View style={[styles.logDot, log.status === 'success' && styles.logSuccess, log.status === 'error' && styles.logError]} />
              <View style={styles.logInfo}>
                <Text style={styles.logAction}>{log.action} {log.integration}</Text>
                <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
              </View>
              <View style={[styles.logBadge, log.status === 'success' && styles.logBadgeSuccess]}>
                <Text style={styles.logBadgeText}>{log.status}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  summaryCard: { flexDirection: 'row', margin: 16, backgroundColor: '#141414', borderRadius: 12, padding: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#1f1f1f' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },

  integrationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141414', padding: 14, borderRadius: 12, marginBottom: 10 },
  integrationIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  integrationInfo: { flex: 1 },
  integrationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  integrationName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusConnected: { backgroundColor: '#10b981' },
  statusPending: { backgroundColor: '#f59e0b' },
  integrationDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  integrationFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  syncText: { color: '#6366f1', fontSize: 12, fontWeight: '600' },

  emptyLogs: { alignItems: 'center', padding: 20 },
  emptyLogsText: { color: '#666', fontSize: 13, marginTop: 8 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#666' },
  logSuccess: { backgroundColor: '#10b981' },
  logError: { backgroundColor: '#ef4444' },
  logInfo: { flex: 1 },
  logAction: { color: '#fff', fontSize: 13, fontWeight: '500' },
  logTime: { color: '#666', fontSize: 11, marginTop: 1 },
  logBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#1f1f1f' },
  logBadgeSuccess: { backgroundColor: 'rgba(16,185,129,0.2)' },
  logBadgeText: { color: '#9ca3af', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
});
