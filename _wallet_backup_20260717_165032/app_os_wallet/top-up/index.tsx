import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { mpesaService } from '@/lib/services/mpesa-service';

export default function TopUpScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'mpesa' | 'card' | 'bank'>('mpesa');

  const handleTopUp = async () => {
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
      // Use existing mpesa-service for M-Pesa STK push
      if (method === 'mpesa') {
        const result = await mpesaService.initiateSTKPush({
          amount: parseFloat(amount),
          phoneNumber: phone,
          userId: user.id,
          description: 'Wallet Top Up',
        });

        if (result.success) {
          Alert.alert(
            'STK Push Sent',
            `Check your phone (${phone}) and enter M-Pesa PIN to complete the top-up of KSh ${amount}.`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Failed', result.message || 'STK push failed. Please try again.');
        }
      } else {
        // Card / Bank methods — placeholder for now
        Alert.alert('Coming Soon', `${method} top-up will be available soon.`);
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
        <Text style={styles.title}>Top Up</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Method Selector */}
      <View style={styles.methodRow}>
        {(['mpesa', 'card', 'bank'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodBtn, method === m && styles.methodBtnActive]}
            onPress={() => setMethod(m)}
          >
            <Ionicons
              name={m === 'mpesa' ? 'phone-portrait' : m === 'card' ? 'card' : 'business'}
              size={20}
              color={method === m ? '#fff' : '#9ca3af'}
            />
            <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
              {m === 'mpesa' ? 'M-Pesa' : m === 'card' ? 'Card' : 'Bank'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount Input */}
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

      {/* Phone Input */}
      <View style={styles.card}>
        <Text style={styles.label}>M-Pesa Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="2547XXXXXXXX"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
        onPress={handleTopUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Top Up KSh {amount || '0'}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>You will receive an STK push on your phone to complete payment.</Text>
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
  methodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  methodText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  amountInput: { fontSize: 40, fontWeight: 'bold', color: '#fff', paddingVertical: 8 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  quickText: { color: '#6366f1', fontSize: 12, fontWeight: '600' },
  input: { fontSize: 18, color: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#6366f1', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 16, paddingHorizontal: 32 },
});
