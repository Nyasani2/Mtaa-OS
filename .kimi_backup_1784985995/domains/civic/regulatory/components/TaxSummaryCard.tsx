import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Wallet, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  jurisdiction: string;
  totalWithheld: number;
  pendingTax: number;
  taxRate: number;
  currency: string;
  loading: boolean;
}

export function TaxSummaryCard({ totalWithheld, pendingTax, taxRate, currency, loading }: Props) {
  if (loading) {
    return (
      <View style={[styles.card, styles.skeleton]}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
            <TrendingUp size={18} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{currency} {totalWithheld.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Withheld</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={[styles.iconBox, { backgroundColor: Colors.warning + '15' }]}>
            <Clock size={18} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{currency} {pendingTax.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending Remittance</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={[styles.iconBox, { backgroundColor: Colors.success + '15' }]}>
            <Wallet size={18} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{taxRate}%</Text>
          <Text style={styles.statLabel}>Withholding Rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.gray[400], textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: Colors.gray[200] },
  skeleton: { gap: 8 },
  skeletonLine: { height: 16, backgroundColor: Colors.gray[200], borderRadius: 4 },
});
