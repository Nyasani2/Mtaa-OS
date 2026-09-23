// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function PayBusinessScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [payId, setPayId] = useState('');
  const [amount, setAmount] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleLookup = async () => {
    if (payId.length !== 6) return Alert.alert('Invalid', 'MTAA Pay ID must be exactly 6 digits.');
    setLoading(true);
    const { data, error } = await supabase
      .from('business_profiles')
      .select('id, business_name, pay_id, business_type')
      .eq('pay_id', payId)
      .single();

    if (error || !data) {
      setBusiness(null);
      Alert.alert('Not Found', 'No business found with that Pay ID.');
    } else {
      setBusiness(data);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const sendAmount = parseFloat(amount);
    if (!sendAmount || sendAmount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (!business || !user) return;

    setSending(true);
    try {
      // 1. Get Sender's Personal Wallet
      const { data: senderWallet, error: senderErr } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (senderErr || !senderWallet) throw new Error('Could not find your wallet. Please deposit funds first.');
      if (senderWallet.balance < sendAmount) throw new Error(`Insufficient funds. You have KES ${senderWallet.balance}`);

      // 2. Get Receiver's Business Wallet
      const { data: businessWallet, error: bizErr } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('business_id', business.id)
        .single();

      if (bizErr || !businessWallet) throw new Error('Business wallet not found.');

      // 3. Debit Sender
      await supabase.from('wallet_accounts').update({ balance: senderWallet.balance - sendAmount }).eq('id', senderWallet.id);
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        wallet_id: senderWallet.id,
        amount: -sendAmount,
        type: 'debit',
        status: 'completed',
        description: `Payment to ${business.business_name} (Pay ID: ${payId})`,
        reference_type: 'business_payment',
        reference_id: business.id,
        currency: 'KES'
      });

      // 4. Credit Business
      await supabase.from('wallet_accounts').update({ balance: (businessWallet.balance || 0) + sendAmount }).eq('id', businessWallet.id);
      await supabase.from('wallet_transactions').insert({
        user_id: businessWallet.user_id,
        wallet_id: businessWallet.id,
        business_id: business.id,
        amount: sendAmount,
        type: 'credit',
        status: 'completed',
        description: `Payment received via Pay ID ${payId}`,
        reference_type: 'business_payment',
        reference_id: business.id,
        currency: 'KES'
      });

      Alert.alert('Success!', `Sent KES ${sendAmount} to ${business.business_name}`);
      setAmount('');
      setBusiness(null);
      setPayId('');
      router.back();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Transaction failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Business</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter MTAA Pay ID</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.payIdInput}
            placeholder="e.g. 482910"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={6}
            value={payId}
            onChangeText={(text) => { setPayId(text.replace(/[^0-9]/g, '')); setBusiness(null); }}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.lookupText}>Lookup</Text>}
          </TouchableOpacity>
        </View>

        {business && (
          <View style={styles.bizCard}>
            <View style={styles.bizIcon}>
              <Ionicons name="storefront" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.bizInfo}>
              <Text style={styles.bizName}>{business.business_name}</Text>
              <Text style={styles.bizType}>{business.business_type} • Pay ID: {business.pay_id}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        )}

        {business && (
          <>
            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity style={[styles.sendBtn, sending && styles.disabledBtn]} onPress={handleSend} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send Money</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8, marginTop: 20 },
  inputRow: { flexDirection: 'row', gap: 12 },
  payIdInput: { flex: 1, backgroundColor: '#1e293b', color: '#fff', padding: 16, borderRadius: 12, fontSize: 18, fontWeight: '700', letterSpacing: 2, borderWidth: 1, borderColor: '#334155' },
  lookupBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center' },
  lookupText: { color: '#fff', fontWeight: '700' },
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#334155' },
  bizIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#2e1065', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bizType: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  amountInput: { backgroundColor: '#1e293b', color: '#fff', padding: 20, borderRadius: 12, fontSize: 28, fontWeight: '800', textAlign: 'center', borderWidth: 1, borderColor: '#334155' },
  sendBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
});
