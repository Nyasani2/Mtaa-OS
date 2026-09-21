// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { treasuryService } from '@/lib/services/treasury-service';
import { marketDataService } from '@/lib/services/market-data-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function DepositWithdrawScreen() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marketDataService.getExchangeRates().then(setRates);
  }, []);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    
    setLoading(true);
    const result = await treasuryService.processDeposit({
      userId: user!.id,
      mtaaAmount: numAmount,
      targetCurrency: 'USD'
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', `Deposited $${result.usdCredited.toFixed(2)} USD. Fee: ${result.treasuryFee.toFixed(2)} KES`);
      setAmount('');
    } else {
      Alert.alert('Failed', result.error || 'Transaction failed');
    }
  };

  const estimatedUSD = amount && rates ? (parseFloat(amount) * (1 - 0.02)) / rates.USD_KES : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fund Trading Account</Text>
      
      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Live Exchange Rate</Text>
        {rates ? (
          <Text style={styles.rateValue}>1 USD = {rates.USD_KES.toFixed(2)} KES</Text>
        ) : (
          <ActivityIndicator color="#2563eb" />
        )}
        <Text style={styles.feeText}>* 2% MTAA Treasury fee applies</Text>
      </View>

      <Text style={styles.label}>Amount to Deposit (KES)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g., 10000" 
        keyboardType="numeric" 
        value={amount} 
        onChangeText={setAmount} 
      />

      {amount && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>You will receive: ~${estimatedUSD.toFixed(2)} USD</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleDeposit} disabled={loading || !amount}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Deposit</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  rateCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 24 },
  rateLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 4 },
  rateValue: { fontSize: 20, fontWeight: '700', color: '#00ff88' },
  feeText: { fontSize: 12, color: '#f59e0b', marginTop: 8 },
  label: { fontSize: 14, color: '#cbd5e1', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 16, color: '#fff', fontSize: 18, marginBottom: 16 },
  summary: { backgroundColor: '#064e3b', padding: 12, borderRadius: 8, marginBottom: 24 },
  summaryText: { color: '#00ff88', fontWeight: '600', textAlign: 'center' },
  btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
