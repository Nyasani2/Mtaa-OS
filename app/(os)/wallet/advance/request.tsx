// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWallet } from 'app/(os)/wallet/hooks';
import { supabase } from '@/lib/supabase';

export default function AdvanceRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxAdvance = Math.min(50000, (balance || 0) * 0.5);
  const quickAmounts = [1000, 2000, 5000, 10000];

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (num > maxAdvance) { Alert.alert('Error', `Maximum advance is KES ${maxAdvance.toLocaleString()}`); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('wallet_advances').insert({
        user_id: user?.id,
        amount: num,
        reason: reason.trim() || 'General',
        status: 'pending',
      });
      if (error) throw error;
      Alert.alert('Submitted', 'Your advance request is being reviewed');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Advance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.limitCard}>
          <Text style={styles.limitLabel}>Available Advance</Text>
          <Text style={styles.limitValue}>KES {maxAdvance.toLocaleString()}</Text>
          <Text style={styles.limitSub}>Based on your wallet balance</Text>
        </View>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          {quickAmounts.map(a => (
            <TouchableOpacity key={a} style={styles.quickChip} onPress={() => setAmount(a.toString())}>
              <Text style={styles.quickText}>KES {a.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor="#8E8E93"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Why do you need this advance?"
          placeholderTextColor="#8E8E93"
          multiline
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Request Advance</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  limitCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  limitLabel: { fontSize: 13, color: '#8E8E93' },
  limitValue: { fontSize: 28, fontWeight: '700', color: '#22C55E', marginTop: 4 },
  limitSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginTop: 4 },
  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: { backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  quickText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  input: { backgroundColor: '#1C1C1E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  submitBtn: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

