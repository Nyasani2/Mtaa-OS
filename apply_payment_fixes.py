import os

# ==========================================
# 1. New Payment Screen (MTAA Wallet + Insurance)
# ==========================================
file1_path = "app/(os)/health/cashier/payments/new.tsx"
os.makedirs(os.path.dirname(file1_path), exist_ok=True)

file1_content = """// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function NewPaymentScreen() {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (invoiceId) loadInvoice();
    loadWallet();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('health_billing')
        .select('*')
        .eq('id', invoiceId)
        .single();
      if (!error) setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice', err);
    }
  };

  const loadWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', user?.id)
        .single();
      if (!error && data) setWalletBalance(data.balance || 0);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!invoice) return;
    if (walletBalance < invoice.amount) {
      Alert.alert('Insufficient Funds', 'Your MTAA Wallet balance is too low for this payment.');
      return;
    }

    setProcessing(true);
    try {
      // 1. Deduct from wallet
      const { error: deductError } = await supabase.rpc('deduct_wallet_balance', {
        p_user_id: user.id,
        p_amount: invoice.amount
      });
      
      if (deductError) throw deductError;

      // 2. Mark invoice as paid
      const { error: updateError } = await supabase
        .from('health_billing')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          payment_method: 'wallet'
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Payment completed successfully via MTAA Wallet!');
      router.back();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'An error occurred during payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayWithInsurance = async () => {
    Alert.alert('Insurance', 'SHA/Insurance claim processing will be integrated here.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={{color: '#fff'}}>Invoice not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canCover = walletBalance >= invoice.amount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Invoice Amount</Text>
        <Text style={styles.amount}>KES {invoice.amount.toLocaleString()}</Text>
        <Text style={styles.desc}>{invoice.description || 'Medical Services'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>MTAA Wallet Balance</Text>
        <Text style={[styles.balance, !canCover && styles.lowBalance]}>
          KES {walletBalance.toLocaleString()}
        </Text>
        {!canCover && (
          <Text style={styles.warning}>
            Insufficient funds. Please top up your wallet.
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.payBtn, !canCover && styles.disabledBtn]} 
        onPress={handlePayWithWallet}
        disabled={processing || !canCover}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="wallet" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.payBtnText}>Pay with MTAA Wallet</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.altPayBtn} onPress={handlePayWithInsurance}>
        <Ionicons name="shield-checkmark" size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
        <Text style={styles.altPayBtnText}>Pay with Insurance / SHA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#1e293b', margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  amount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#cbd5e1', fontSize: 14 },
  balance: { color: '#10b981', fontSize: 24, fontWeight: 'bold' },
  lowBalance: { color: '#ef4444' },
  warning: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', marginHorizontal: 16, padding: 16, borderRadius: 12, marginTop: 8 },
  disabledBtn: { backgroundColor: '#334155', opacity: 0.7 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  altPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#0ea5e9' },
  altPayBtnText: { color: '#0ea5e9', fontSize: 16, fontWeight: 'bold' },
  backBtn: { marginTop: 20, padding: 12 },
  backBtnText: { color: '#0ea5e9', fontSize: 16 }
});
"""

with open(file1_path, 'w', encoding='utf-8') as f:
    f.write(file1_content)
print(f"✅ Successfully wrote: {file1_path}")

print("\n🚀 All files updated! You can now restart Expo: npx expo start -c")
