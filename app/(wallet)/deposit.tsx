// app/(wallet)/deposit.tsx — MTAA Wallet Deposit Screen
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getUserDeposits, getUnclaimedDeposits, claimDeposit, getTillNumbers, WalletDeposit } from '@/lib/services/wallet-deposit-service';

export default function DepositScreen() {
  const { user } = useAuthStore();
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [unclaimed, setUnclaimed] = useState<WalletDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');

  const tillNumbers = getTillNumbers();

  useEffect(() => {
    if (user?.id) {
      loadDeposits();
    }
  }, [user]);

  async function loadDeposits() {
    try {
      const [history, unclaimedList] = await Promise.all([
        getUserDeposits(user!.id),
        getUnclaimedDeposits(user!.phone || ''),
      ]);
      setDeposits(history);
      setUnclaimed(unclaimedList);
    } catch (e) {
      console.error('Failed to load deposits:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(depositId: string) {
    try {
      const success = await claimDeposit(depositId, user!.id);
      if (success) {
        Alert.alert('Success', 'Deposit claimed and credited to your wallet');
        loadDeposits();
      } else {
        Alert.alert('Failed', 'Could not claim deposit. It may have been claimed already.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function copyToClipboard(text: string) {
    Clipboard.setString(text);
    Alert.alert('Copied', `Till number ${text} copied to clipboard`);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Deposit to Wallet</Text>

      {/* Till Numbers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MTAA Till Numbers</Text>
        <Text style={styles.hint}>Send money from any bank app to these till numbers:</Text>
        {tillNumbers.map((till) => (
          <TouchableOpacity key={till.number} style={styles.tillCard} onPress={() => copyToClipboard(till.number)}>
            <Text style={styles.tillNumber}>{till.number}</Text>
            <Text style={styles.tillLabel}>{till.label}</Text>
            <Text style={styles.copyHint}>Tap to copy</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Deposit</Text>
        <Text style={styles.instruction}>1. Open your bank app (KCB, Equity, Co-op, etc.)</Text>
        <Text style={styles.instruction}>2. Select "M-Pesa PayBill" or "Send to M-Pesa"</Text>
        <Text style={styles.instruction}>3. Enter till number: <Text style={styles.bold}>9767587</Text> or <Text style={styles.bold}>9172229</Text></Text>
        <Text style={styles.instruction}>4. Enter amount and confirm</Text>
        <Text style={styles.instruction}>5. Money auto-credits to your MTAA wallet</Text>
      </View>

      {/* Unclaimed Deposits */}
      {unclaimed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unclaimed Deposits</Text>
          <Text style={styles.hint}>You have deposits waiting to be claimed:</Text>
          {unclaimed.map((deposit) => (
            <View key={deposit.id} style={styles.unclaimedCard}>
              <Text style={styles.amount}>KES {deposit.amount.toLocaleString()}</Text>
              <Text style={styles.date}>{new Date(deposit.created_at).toLocaleDateString()}</Text>
              <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim(deposit.id)}>
                <Text style={styles.claimButtonText}>Claim to Wallet</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Deposit History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deposit History</Text>
        {deposits.length === 0 ? (
          <Text style={styles.empty}>No deposits yet</Text>
        ) : (
          deposits.map((deposit) => (
            <View key={deposit.id} style={styles.depositCard}>
              <View style={styles.depositHeader}>
                <Text style={styles.amount}>KES {deposit.amount.toLocaleString()}</Text>
                <Text style={[styles.status, styles[`status_${deposit.status}`]]}>
                  {deposit.status}
                </Text>
              </View>
              <Text style={styles.description}>{deposit.description}</Text>
              <Text style={styles.date}>{new Date(deposit.created_at).toLocaleString()}</Text>
              {deposit.metadata?.till_number && (
                <Text style={styles.meta}>Till: {deposit.metadata.till_number}</Text>
              )}
              {deposit.metadata?.mpesa_receipt && (
                <Text style={styles.meta}>Receipt: {deposit.metadata.mpesa_receipt}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  hint: { fontSize: 13, color: '#888', marginBottom: 12 },
  tillCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  tillNumber: { fontSize: 28, fontWeight: 'bold', color: '#00ff88', letterSpacing: 2 },
  tillLabel: { fontSize: 14, color: '#ccc', marginTop: 4 },
  copyHint: { fontSize: 12, color: '#666', marginTop: 8 },
  instruction: { fontSize: 14, color: '#ccc', marginBottom: 6, lineHeight: 20 },
  bold: { fontWeight: 'bold', color: '#fff' },
  unclaimedCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#ffaa00' },
  depositCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  depositHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  status: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, textTransform: 'capitalize' },
  status_completed: { backgroundColor: '#00ff8822', color: '#00ff88' },
  status_unclaimed: { backgroundColor: '#ffaa0022', color: '#ffaa00' },
  status_pending: { backgroundColor: '#0088ff22', color: '#0088ff' },
  status_failed: { backgroundColor: '#ff004422', color: '#ff0044' },
  description: { fontSize: 13, color: '#aaa', marginBottom: 4 },
  date: { fontSize: 12, color: '#666' },
  meta: { fontSize: 12, color: '#555', marginTop: 2 },
  empty: { fontSize: 14, color: '#555', textAlign: 'center', paddingVertical: 20 },
  claimButton: { backgroundColor: '#ffaa00', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-start' },
  claimButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});
