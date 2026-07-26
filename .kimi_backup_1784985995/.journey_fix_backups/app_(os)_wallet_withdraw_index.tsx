import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '@/lib/services/wallet-service';

export default function WithdrawScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    try {
      // Use existing wallet-service withdraw action
      const result = await walletService.execute({
        action: 'withdraw',
        amount: parseFloat(amount),
        currency: 'KES',
        method: 'mpesa',
        destination: phone,
        accountId: user.id,
      });

      if (result.success) {
        Alert.alert(
          'Withdrawal Initiated',
          `KSh ${amount} will be sent to ${phone} within minutes.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Failed', result.message || 'Withdrawal failed. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Amount (KSh)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <View style={styles.quickRow}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => setAmount(String(amt))}>
              <Text style={styles.quickText}>KSh {amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Withdraw To (M-Pesa Number)</Text>
        <TextInput
          style={styles.input}
          placeholder="2547XXXXXXXX"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
        onPress={handleWithdraw}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Withdraw KSh {amount || '0'}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Funds will be sent to your M-Pesa number. Standard M-Pesa charges apply.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  amountInput: { fontSize: 40, fontWeight: 'bold', color: '#fff', paddingVertical: 8 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: { backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  quickText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  input: { fontSize: 18, color: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#ef4444', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 16, paddingHorizontal: 32 },
});
