// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '@/lib/services/wallet-service';

export default function TransferScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientType, setRecipientType] = useState<'wallet' | 'phone' | 'till'>('wallet');

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!recipient) {
      Alert.alert('Error', 'Please enter recipient details');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const result = await walletService.execute({
        action: 'transfer',
        amount: parseFloat(amount),
        currency: 'KES',
        recipientId: recipient,
        recipientType: recipientType,
        description: note || 'Wallet transfer',
        senderAccountId: user.id,
      });

      if (result.success) {
        Alert.alert(
          'Transfer Sent',
          `KSh ${amount} sent to ${recipient}.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Failed', result.message || 'Transfer failed. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Transfer</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Recipient Type */}
      <View style={styles.methodRow}>
        {(['wallet', 'phone', 'till'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.methodBtn, recipientType === t && styles.methodBtnActive]}
            onPress={() => setRecipientType(t)}
          >
            <Ionicons
              name={t === 'wallet' ? 'wallet' : t === 'phone' ? 'call' : 'cash'}
              size={20}
              color={recipientType === t ? '#fff' : '#9ca3af'}
            />
            <Text style={[styles.methodText, recipientType === t && styles.methodTextActive]}>
              {t === 'wallet' ? 'Wallet ID' : t === 'phone' ? 'Phone' : 'Till'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Recipient {recipientType === 'wallet' ? 'Wallet ID' : recipientType === 'phone' ? 'Phone Number' : 'Till Number'}</Text>
        <TextInput
          style={styles.input}
          placeholder={recipientType === 'wallet' ? 'Enter wallet ID' : recipientType === 'phone' ? '2547XXXXXXXX' : 'Enter till number'}
          placeholderTextColor="#6b7280"
          value={recipient}
          onChangeText={setRecipient}
        />
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this for?"
          placeholderTextColor="#6b7280"
          value={note}
          onChangeText={setNote}
        />
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
        onPress={handleTransfer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Send KSh {amount || '0'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  methodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  methodBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  methodText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  amountInput: { fontSize: 40, fontWeight: 'bold', color: '#fff', paddingVertical: 8 },
  input: { fontSize: 18, color: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#10b981', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

