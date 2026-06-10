import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseAlert } from '../types';

export function AlertSection({ alerts }: { alerts: PulseAlert[] }) {
  const router = useRouter();
  const unreadAlerts = alerts.filter(a => !a.is_read);
  if (!unreadAlerts.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>🔔 Alerts</Text>
        {unreadAlerts.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadAlerts.length}</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => router.push('/(os)/pulse/alerts')} style={{ marginLeft: 'auto' }}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {unreadAlerts.slice(0, 3).map(alert => (
        <View key={alert.id} style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>{alert.alert_type.toUpperCase()}</Text>
            <Text style={[styles.severity, alert.severity === 'critical' && styles.critical]}>{alert.severity}</Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  badge: { backgroundColor: '#FF6B35', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  seeAll: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
  alertCard: { backgroundColor: 'rgba(255,107,53,0.1)', padding: 12, borderRadius: 8, marginHorizontal: 16, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#FF6B35' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertType: { fontSize: 10, color: '#FF6B35', fontWeight: '700' },
  severity: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  critical: { color: '#FF3B30' },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
