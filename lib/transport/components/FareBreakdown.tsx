import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FareBreakdown } from '../types';

interface Props {
  fare: FareBreakdown;
}

export default function FareBreakdownView({ fare }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fare Breakdown</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Base fare</Text>
        <Text style={styles.value}>KES {fare.base.toLocaleString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Distance ({fare.distanceFare > 0 ? 'calculated' : '—'})</Text>
        <Text style={styles.value}>KES {fare.distanceFare.toLocaleString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Time estimate</Text>
        <Text style={styles.value}>KES {fare.timeFare.toLocaleString()}</Text>
      </View>
      {fare.surge > 1 && (
        <View style={styles.row}>
          <Text style={styles.label}>Surge ({fare.surge}x)</Text>
          <Text style={styles.surgeValue}>+KES {Math.round((fare.base + fare.distanceFare + fare.timeFare) * (fare.surge - 1)).toLocaleString()}</Text>
        </View>
      )}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>KES {fare.total.toLocaleString()}</Text>
      </View>
      <Text style={styles.disclaimer}>Includes 3% MTAA fee + 17.5% gov tax (VAT + DST)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#1a1a2e', borderRadius: 12, marginVertical: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: '#8892b0', fontSize: 13 },
  value: { color: '#fff', fontSize: 13, fontWeight: '500' },
  surgeValue: { color: '#f39c12', fontSize: 13, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#333', marginTop: 8, paddingTop: 10 },
  totalLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  totalValue: { color: '#e94560', fontSize: 18, fontWeight: '800' },
  disclaimer: { color: '#555', fontSize: 10, marginTop: 10, textAlign: 'center' },
});
