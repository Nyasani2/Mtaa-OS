// @ts-nocheck
// lib/transport/components/FareCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FareEstimate } from '../types';

interface Props { estimate: FareEstimate | null; driverStatus?: { available: boolean; count: number; etaMinutes?: number; message: string } | null; }

export default function FareCard({ estimate, driverStatus }: Props) {
  if (!estimate) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Estimated Fare</Text>
      <Text style={styles.amount}>{estimate.formatted}</Text>
      <Text style={styles.detail}>{estimate.distanceKm.toFixed(1)} km · {estimate.durationMinutes} min</Text>
      <View style={styles.breakdown}>
        <View style={styles.breakRow}><Text style={styles.breakLabel}>Base fare</Text><Text style={styles.breakValue}>{estimate.currency} {estimate.baseFare.toLocaleString()}</Text></View>
        <View style={styles.breakRow}><Text style={styles.breakLabel}>Distance</Text><Text style={styles.breakValue}>{estimate.currency} {estimate.distanceFare.toLocaleString()}</Text></View>
        <View style={styles.breakRow}><Text style={styles.breakLabel}>Time</Text><Text style={styles.breakValue}>{estimate.currency} {estimate.timeFare.toLocaleString()}</Text></View>
        {estimate.surgeMultiplier > 1 && <View style={styles.breakRow}><Text style={[styles.breakLabel, { color: '#ef4444' }]}>Surge ×{estimate.surgeMultiplier}</Text><Text style={[styles.breakValue, { color: '#ef4444' }]}>Applied</Text></View>}
      </View>
      {driverStatus && (
        <View style={[styles.badge, driverStatus.available ? styles.badgeAvailable : styles.badgeUnavailable]}>
          <Text style={[styles.badgeText, driverStatus.available ? styles.badgeTextAvailable : styles.badgeTextUnavailable]}>{driverStatus.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  label: { fontSize: 14, color: '#64748b', marginBottom: 4, fontWeight: '500' },
  amount: { fontSize: 36, fontWeight: '800', color: '#0f172a' },
  detail: { fontSize: 13, color: '#64748b', marginTop: 4 },
  breakdown: { width: '100%', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakLabel: { fontSize: 13, color: '#64748b' },
  breakValue: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  badge: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeAvailable: { backgroundColor: '#dcfce7' },
  badgeUnavailable: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextAvailable: { color: '#166534' },
  badgeTextUnavailable: { color: '#991b1b' },
});
