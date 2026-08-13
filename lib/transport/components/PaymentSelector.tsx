// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const METHODS = [
  { key: 'wallet', label: 'Wallet', icon: '💳' },
  { key: 'cash', label: 'Cash', icon: '💵' },
  { key: 'mpesa', label: 'M-Pesa', icon: '📱' },
];

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  balance: number;
  fare: number;
}

export default function PaymentSelector({ selected, onSelect, balance, fare }: Props) {
  const insufficient = selected === 'wallet' && balance < fare && fare > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      {METHODS.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.row, selected === m.key && styles.activeRow]}
          onPress={() => onSelect(m.key)}
        >
          <Text style={styles.icon}>{m.icon}</Text>
          <View style={styles.info}>
            <Text style={[styles.label, selected === m.key && (styles as any).activeText]}>{m.label}</Text>
            {m.key === 'wallet' && (
              <Text style={styles.sub}>Balance: KES {balance.toLocaleString()}</Text>
            )}
          </View>
          {selected === m.key && <View style={styles.dot} />}
        </TouchableOpacity>
      ))}
      {insufficient && (
        <Text style={styles.warn}>⚠️ Insufficient wallet balance. Top up or choose Cash/M-Pesa.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#1a1a2e', borderRadius: 12, marginVertical: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  icon: { fontSize: 20, marginRight: 12 },
  info: { flex: 1 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sub: { color: '#8892b0', fontSize: 12, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e94560' },
  warn: { color: '#ff6b6b', fontSize: 12, marginTop: 8 },
  activeText: { color: '#10B981', fontWeight: '700' },
});