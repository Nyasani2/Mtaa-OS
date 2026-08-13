/**
 * MTAA OS — System Panels (React Native)
 * Recent activity, civic alerts, transaction activity, realtime alerts.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useCivicAlerts } from '@/hooks/useCivicAlerts';
import { useTransactionActivity } from '@/hooks/useTransactionActivity';

export function SystemPanels() {
  return (
    <View style={styles.container}>
      <RecentActivityPanel />
      <CivicAlertsPanel />
      <TransactionPanel />
      <RealtimeAlertsPanel />
    </View>
  );
}

function RecentActivityPanel() {
  const router = useRouter();
  const { activities, isLoading } = useRecentActivity();

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/activity' as any)}>
          <Text style={styles.panelLink}>View All</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <View key={i} style={styles.skeletonRow} />)
      ) : activities.length === 0 ? (
        <Text style={styles.empty}>No recent activity</Text>
      ) : (
        activities.slice(0, 4).map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={styles.rowIcon}><Text>{a.icon}</Text></View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowMeta}>{a.time}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function CivicAlertsPanel() {
  const router = useRouter();
  const { alerts, isLoading } = useCivicAlerts();

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Civic Alerts</Text>
        <TouchableOpacity onPress={() => router.push('/civic/alerts' as any)}>
          <Text style={styles.panelLink}>View All</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => <View key={i} style={styles.skeletonRow} />)
      ) : alerts.length === 0 ? (
        <Text style={styles.empty}>No active alerts</Text>
      ) : (
        alerts.slice(0, 3).map((alert) => (
          <View key={alert.id} style={[styles.row, alert.severity === 'critical' && styles.criticalRow]}>
            <Text style={styles.alertIcon}>{alert.severity === 'critical' ? '⚠' : 'ℹ'}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{alert.message}</Text>
              <Text style={styles.rowMeta}>{alert.source}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function TransactionPanel() {
  const router = useRouter();
  const { transactions, isLoading } = useTransactionActivity();

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/wallet/transactions' as any)}>
          <Text style={styles.panelLink}>View All</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <View key={i} style={styles.skeletonRow} />)
      ) : transactions.length === 0 ? (
        <Text style={styles.empty}>No recent transactions</Text>
      ) : (
        transactions.slice(0, 4).map((tx) => (
          <View key={tx.id} style={styles.row}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'in' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)' }]}>
              <Text style={{ color: tx.type === 'in' ? '#34d399' : '#f87171' }}>{tx.type === 'in' ? '↓' : '↑'}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{tx.description}</Text>
              <Text style={styles.rowMeta}>{tx.time}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'in' ? '#34d399' : '#f87171' }]}>
              {tx.type === 'in' ? '+' : '-'}{tx.amount}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function RealtimeAlertsPanel() {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>System Status</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: 'rgba(52,211,153,0.1)' }]}>
          <Text style={{ color: '#34d399' }}>✓</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>All systems operational</Text>
          <Text style={styles.rowMeta}>Kernel, registry, and realtime connected</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  panel: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  panelLink: { fontSize: 12, color: '#60a5fa' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  criticalRow: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, paddingHorizontal: 8, marginVertical: 2 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, color: '#fff' },
  rowMeta: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  alertIcon: { fontSize: 16 },
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txAmount: { fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 12, color: '#64748b', textAlign: 'center', paddingVertical: 16 },
  skeletonRow: { height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginVertical: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
  liveText: { fontSize: 11, color: '#34d399' },
});
