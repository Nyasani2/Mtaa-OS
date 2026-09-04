import { useState } from 'react';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/config';
import { mtaaFee, fmtKES, TX_LIMIT } from '@/lib/wallet/fees';

export default function SendScreen() {
  const router = useRouter();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const num = parseFloat(amount) || 0;
  const fee = mtaaFee(num);
  const total = num + fee;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: w } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).limit(1).maybeSingle();
      if (w) setBalance(Number(w.balance) || 0);
    })();
  }, []);

  const send = async () => {
    if (!recipient.trim()) { window.alert('Send: enter recipient phone or ID'); return; }
    if (num < 1) { window.alert('Send: minimum KSh 1'); return; }
    if (num > TX_LIMIT) { window.alert('Send: max KSh 500,000 per transaction'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('mtaa_send_money', { p_recipient: recipient.trim(), p_amount: num });
    setBusy(false);
    if (error) { window.alert('Send Failed: ' + error.message); return; }
    const r: any = data;
    if (!r?.ok) { window.alert('Send Failed: ' + String((r && r.error) || 'unknown')); return; }
    window.alert('Sent ' + fmtKES(num) + ' | Ref ' + r.ref + ' | Fee ' + fmtKES(r.fee) + ' | Balance ' + fmtKES(Number(r.balance)));
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Send Money</Text>
      <Text style={styles.sub}>Available: {fmtKES(balance)} • Free under KSh 1,000 • Max KSh 500,000</Text>
      <TextInput style={styles.input} placeholder="Recipient ID or Phone" placeholderTextColor="#8E8E93" value={recipient} onChangeText={setRecipient} />
      <TextInput style={styles.input} placeholder="Amount (KSh)" placeholderTextColor="#8E8E93" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <View style={styles.feeRow}>
        <Text style={styles.feeText}>Fee: {fmtKES(fee)}</Text>
        <Text style={styles.feeText}>Total debit: {fmtKES(total)}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={send} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { color: '#8E8E93', marginBottom: 16, fontSize: 12 },
  input: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 12, fontSize: 16 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  feeText: { color: '#8E8E93', fontSize: 13 },
  btn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  cancel: { color: '#FF3B30', textAlign: 'center', padding: 8 },
});
