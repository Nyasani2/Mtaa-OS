/**
 * ASIS Layer 6 — Liquidity Status UI
 * Shows network liquidity health with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LiquidityStatusProps {
  currency: string;
  totalAgents: number;
  healthyAgents: number;
  lowLiquidityAgents: number;
  offlineAgents: number;
  avgHealth: number;
}

export const LiquidityStatus: React.FC<LiquidityStatusProps> = ({
  currency,
  totalAgents,
  healthyAgents,
  lowLiquidityAgents,
  offlineAgents,
  avgHealth,
}) => {
  const healthyPct = totalAgents > 0 ? (healthyAgents / totalAgents) * 100 : 0;
  const lowPct = totalAgents > 0 ? (lowLiquidityAgents / totalAgents) * 100 : 0;
  const offlinePct = totalAgents > 0 ? (offlineAgents / totalAgents) * 100 : 0;

  const getHealthColor = (health: number) => {
    if (health >= 0.7) return '#059669';
    if (health >= 0.4) return '#D97706';
    return '#DC2626';
  };

  const getHealthLabel = (health: number) => {
    if (health >= 0.7) return 'Healthy';
    if (health >= 0.4) return 'Stressed';
    return 'Critical';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Health</Text>
        <View style={[styles.badge, { backgroundColor: getHealthColor(avgHealth) + '20' }]}>
          <Text style={[styles.badgeText, { color: getHealthColor(avgHealth) }]}>
            {getHealthLabel(avgHealth)}
          </Text>
        </View>
      </View>

      <Text style={styles.currency}>{currency} Liquidity</Text>

      {/* Progress Bar */}
      <View style={styles.barContainer}>
        <View style={[styles.barSegment, { width: `${healthyPct}%`, backgroundColor: '#059669' }]} />
        <View style={[styles.barSegment, { width: `${lowPct}%`, backgroundColor: '#F59E0B' }]} />
        <View style={[styles.barSegment, { width: `${offlinePct}%`, backgroundColor: '#9CA3AF' }]} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>{healthyAgents} Healthy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>{lowLiquidityAgents} Low Cash</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.legendText}>{offlineAgents} Offline</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        {totalAgents} total agents · {avgHealth.toFixed(0)}% average health
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  currency: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  barContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: { height: '100%' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: { fontSize: 12, color: '#6B7280' },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
