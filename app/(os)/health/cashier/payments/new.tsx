// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { HealthPaymentService } from '@/lib/health/services/health-payment.service';

export default function NewPaymentScreen() {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [invoiceId, user?.id]);

  const loadData = async () => {
    try {
      const { data: inv } = await supabase.from('health_invoices').select('*').eq('id', invoiceId).single();
      setInvoice(inv);

      const { data: wallet } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).single();
      setWalletBalance(wallet?.balance || 0);

      const { data: pols } = await supabase
        .from('health_policies')
        .select('*')
        .eq('patient_id', inv?.patient_id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());
      setPolicies(pols || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method: 'wallet' | 'insurance', policyId?: string) => {
    if (!invoice) return;
    setProcessing(true);
    try {
      const result = await HealthPaymentService.processPayment({
        invoiceId: invoice.id,
        amount: invoice.balance_due || invoice.total_amount,
        method,
        policyId,
      });
      
      Alert.alert('Success', `Payment successful via ${method.toUpperCase()}!`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;
  if (!invoice) return <View style={styles.center}><Text>Invoice not found</Text></View>;

  const amountDue = invoice.balance_due || invoice.total_amount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.invoiceCard}>
        <Text style={styles.label}>Total Due</Text>
        <Text style={styles.amount}>KES {amountDue.toLocaleString()}</Text>
        <Text style={styles.sub}>Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      <TouchableOpacity 
        style={[styles.methodCard, walletBalance < amountDue && styles.disabled]} 
        onPress={() => walletBalance >= amountDue ? handlePayment('wallet') : Alert.alert('Insufficient Funds', 'Your MTAA Wallet balance is too low.')}
        disabled={processing}
      >
        <View style={styles.iconBox}><Ionicons name="wallet" size={24} color="#0ea5e9" /></View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodName}>MTAA Wallet</Text>
          <Text style={styles.methodDesc}>Balance: KES {walletBalance.toLocaleString()}</Text>
        </View>
        {walletBalance >= amountDue && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
      </TouchableOpacity>

      {policies.map((policy) => {
        const remaining = (policy.coverage_limit || 0) - (policy.used_amount || 0);
        const canCover = remaining >= amountDue;
        return (
          <TouchableOpacity 
            key={policy.id} 
            style={[styles.methodCard, !canCover && styles.disabled]}
            onPress={() => canCover ? handlePayment('insurance', policy.id) : Alert.alert('Limit Exceeded', `Policy limit remaining is KES ${remaining.toLocaleString()}`)}
            disabled={processing}
          >
            <View style={styles.iconBox}><Ionicons name="shield-checkmark" size={24} color="#10b981" /></View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{policy.provider_name} ({policy.policy_number})</Text>
              <Text style={styles.methodDesc}>Covered: KES {remaining.toLocaleString()}</Text>
            </View>
            {canCover && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
          </TouchableOpacity>
        );
      })}

      {policies.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active insurance policies found for this patient.</Text>
        </View>
      )}

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Processing Payment...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#1e293b' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  invoiceCard: { backgroundColor: '#1e293b', margin: 20, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  label: { color: '#94a3b8', fontSize: 14 },
  amount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
  sub: { color: '#64748b', fontSize: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 12 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  disabled: { opacity: 0.5 },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  methodInfo: { flex: 1 },
  methodName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  methodDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  processingText: { color: '#fff', marginTop: 16, fontSize: 16 },
});
