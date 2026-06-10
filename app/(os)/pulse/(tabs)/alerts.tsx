import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { usePulseAlerts } from '@/domains/pulse/hooks/usePulseHome';

export default function AlertsScreen() {
  const { alerts, unreadCount, isLoading, loadAlerts, markRead, dismiss } = usePulseAlerts();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadAlerts()} tintColor="#FF6B35" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>🔔 Alerts</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {alerts.map(alert => (
        <View key={alert.id} style={[styles.alertCard, alert.is_read && styles.readAlert]}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>{alert.alert_type.toUpperCase()}</Text>
            <Text style={[styles.severity, alert.severity === 'critical' && styles.criticalSeverity]}>
              {alert.severity}
            </Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertDesc}>{alert.description}</Text>
          <View style={styles.alertActions}>
            {!alert.is_read && (
              <TouchableOpacity onPress={() => markRead(alert.id)}>
                <Text style={styles.actionText}>Mark read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => dismiss(alert.id)}>
              <Text style={styles.actionText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {!alerts.length && !isLoading && (
        <Text style={styles.empty}>No alerts</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#fff' },
  badge: { backgroundColor: '#FF6B35', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  alertCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#FF6B35' },
  readAlert: { borderLeftColor: 'rgba(255,255,255,0.2)', opacity: 0.7 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  alertType: { fontSize: 11, color: '#FF6B35', fontWeight: '700', letterSpacing: 1 },
  severity: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  criticalSeverity: { color: '#FF3B30' },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  alertDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  alertActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionText: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
});
