// app/(os)/wallet/tax.tsx — Tax Dashboard
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletTaxes } from './hooks/useWalletTaxes';

export default function TaxScreen() {
  const { taxes, loading, refresh, exportTaxCSV } = useWalletTaxes();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tax Reports</Text>
        {loading && <Text style={styles.loading}>Loading...</Text>}
        {taxes.map((tax) => (
          <View key={tax.id} style={styles.card}>
            <Text style={styles.year}>Year: {tax.year}</Text>
            <Text style={styles.amount}>Tax: {tax.tax_liability.toLocaleString()}</Text>
            <Text style={styles.status}>Status: {tax.status}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.button} onPress={exportTaxCSV}>
          <Text style={styles.buttonText}>Export CSV</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  loading: { color: '#94A3B8', fontSize: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  year: { color: '#94A3B8', fontSize: 14 },
  amount: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 4 },
  status: { color: '#60A5FA', fontSize: 14, marginTop: 4 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
