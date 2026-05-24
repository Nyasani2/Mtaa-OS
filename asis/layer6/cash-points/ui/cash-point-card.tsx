/**
 * ASIS Layer 6 — Cash Point Card UI
 * Compact, informative, touch-friendly card for individual cash points
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CashPoint, OperationalState } from '../types';
import { DiscoveryResult } from '../geo-discovery';

interface CashPointCardProps {
  result: DiscoveryResult;
  onPress?: () => void;
  onNavigate?: () => void;
  compact?: boolean;
}

export const CashPointCard: React.FC<CashPointCardProps> = ({
  result,
  onPress,
  onNavigate,
  compact = false,
}) => {
  const { cashPoint, distanceKm, isOpenNow, closesInMinutes, estimatedWalkMinutes } = result;

  const getStatusConfig = (status: OperationalState) => {
    switch (status) {
      case 'online': return { color: '#059669', label: 'Available', bg: '#ECFDF5' };
      case 'low_liquidity': return { color: '#D97706', label: 'Low Cash', bg: '#FFFBEB' };
      case 'offline': return { color: '#6B7280', label: 'Offline', bg: '#F3F4F6' };
      case 'suspended': return { color: '#DC2626', label: 'Suspended', bg: '#FEF2F2' };
      default: return { color: '#6B7280', label: 'Unknown', bg: '#F3F4F6' };
    }
  };

  const status = getStatusConfig(cashPoint.status);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={[styles.compactStatus, { backgroundColor: status.bg }]}>
          <View style={[styles.compactDot, { backgroundColor: status.color }]} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{cashPoint.name}</Text>
          <Text style={styles.compactMeta}>{distanceKm.toFixed(1)} km · {estimatedWalkMinutes} min walk</Text>
        </View>
        <Text style={[styles.compactStatusText, { color: status.color }]}>{status.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.distance}>{distanceKm.toFixed(1)} km away</Text>
      </View>

      {/* Name & Operator */}
      <Text style={styles.name}>{cashPoint.name}</Text>
      <Text style={styles.operator}>Operated by {cashPoint.operatorName}</Text>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Address</Text>
          <Text style={styles.detailValue}>{cashPoint.location.address}, {cashPoint.location.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏰ Hours</Text>
          <Text style={styles.detailValue}>
            {isOpenNow ? 'Open now' : 'Closed'} 
            {closesInMinutes ? ` · Closes in ${closesInMinutes} min` : ''}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Fee</Text>
          <Text style={styles.detailValue}>
            {cashPoint.fees.withdrawal || 0} {cashPoint.currencies[0]} withdrawal
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⭐ Rating</Text>
          <Text style={styles.detailValue}>{cashPoint.rating} ({cashPoint.reviewCount} reviews)</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💵 Currencies</Text>
          <Text style={styles.detailValue}>{cashPoint.currencies.join(', ')}</Text>
        </View>
      </View>

      {/* Liquidity Warning */}
      {cashPoint.status === 'low_liquidity' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ This agent has limited cash. Call ahead to confirm availability.
          </Text>
        </View>
      )}

      {/* Actions */}
      {onNavigate && (
        <TouchableOpacity style={styles.actionButton} onPress={onNavigate}>
          <Text style={styles.actionText}>Navigate Here</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  compactStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactDot: { width: 8, height: 8, borderRadius: 4 },
  compactInfo: { flex: 1 },
  compactName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  compactMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  compactStatusText: { fontSize: 12, fontWeight: '500', marginLeft: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 13, color: '#6B7280' },
  name: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  operator: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  details: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 90,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningText: { fontSize: 13, color: '#D97706', lineHeight: 18 },
  actionButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
